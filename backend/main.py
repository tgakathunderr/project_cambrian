import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
import asyncio
import json
import logging
import math
import random
import threading
import time
from typing import List, Optional, Dict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.genetics import DNA, LineageTracker
from backend.organism import Organism, generate_organic_name
from backend.predator import Predator
from backend.world import World

# Initialize FastAPI App
app = FastAPI(title="Cambrian Desktop Simulator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Feature Flags ───────────────────────────────────────────────────
PREDATOR_ENABLED = False  # Off by default — requires tuning before shipping

# ─── Global Simulation State ──────────────────────────────────────────
ticks = 0
max_generation = 1
simulation_speed = 1.0
simulation_running = True
mutation_rate = 0.15

world = World(width=1000, height=800)
organisms: List[Organism] = []
predators: List[Predator] = []
lineage_tracker = LineageTracker()
active_specimen_id: Optional[str] = None

# Biography archive — persists after organism death, keyed by organism id
biographies: Dict[str, dict] = {}

# Discovery Logs
discovery_logs = []

# Catastrophe scorecard tracking
_cat_scorecard: Optional[dict] = None

# Locks
sim_lock = threading.Lock()

# Logging config
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CambrianBackend")


# ─── Pydantic Schemas ────────────────────────────────────────────────
class SpawnRequest(BaseModel):
    x: float
    y: float
    type: str  # 'PREY', 'WOLF', 'FOOD', 'WATER', 'OBSTACLE'
    name: Optional[str] = None
    sex: Optional[str] = None
    age_years: Optional[float] = None

class RenameRequest(BaseModel):
    id: str
    name: str

class SettingsRequest(BaseModel):
    speed: float
    running: bool
    mutation_rate: Optional[float] = 0.15

class CatastropheRequest(BaseModel):
    type: str  # 'DROUGHT', 'FAMINE', or 'NONE'

class PaintTerrainRequest(BaseModel):
    x: float
    y: float
    radius: float
    type: str  # 'GRASS', 'SAND', 'WATER_SHALLOW', 'WATER_DEEP', 'ROCK'


# ─── Discovery Log Utility ───────────────────────────────────────────
def add_log(category: str, message: str, organism_id: Optional[str] = None):
    """Utility to log simulation events for the frontend's Discovery Log."""
    years = ticks / 1296000.0
    entry = {
        "timestamp": time.time(),
        "years": round(years, 2),
        "category": category,
        "message": message,
        "organism_id": organism_id
    }
    discovery_logs.append(entry)
    if len(discovery_logs) > 200:
        discovery_logs.pop(0)


# ─── Biography Generation ────────────────────────────────────────────
def generate_biography(org: Organism, death_reason: str, death_age_years: float, season: str, traits: dict, mutations: list) -> dict:
    """Auto-generates a human-readable biography from an organism's real life data."""
    # Cause of death label
    cause_map = {
        'STARVATION': 'starvation — the world offered little nourishment',
        'DEHYDRATION': 'dehydration — water eluded it until the end',
        'OLD_AGE': 'natural causes — a life fully lived',
        'PREDATION': 'predation — taken by a wolf',
        'ZAPPED': 'Director intervention',
        'DROWNED': 'drowning — unable to escape deep waters',
    }
    cause_text = cause_map.get(death_reason, death_reason.lower().replace('_', ' '))

    # Parent lineage string
    parent_str = "unknown ancestors"
    if org.parent1_name and org.parent2_name:
        parent_str = f"{org.parent1_name} and {org.parent2_name}"
    elif org.parent1_name:
        parent_str = org.parent1_name

    # Life stage reached
    stage_text = "remained a juvenile" if death_age_years < 12 else (
        "reached maturity" if death_age_years < 60 else "lived to elder age"
    )

    # Build a narrative summary
    birth_context = f"born in Generation {org.generation} during a {SEASONS_LABELS.get(org.birth_season, org.birth_season)} season"
    if org.generation == 1:
        birth_context = "an ancestor — one of the original founders placed into the world"

    summary = f"{org.name} was {birth_context}"
    if org.parent1_name:
        summary += f", offspring of {parent_str}"
    summary += f". {org.name} {stage_text}, living for {death_age_years:.1f} years before succumbing to {cause_text}."

    if org.offspring_count > 0:
        summary += f" {org.name} raised {org.offspring_count} offspring, leaving a lasting mark on the lineage."
    else:
        summary += f" {org.name} left no offspring — its genetic thread ends here."

    # Notable mutations summary
    mutation_labels = []
    if traits:
        if traits.get('speed', 5.0) > 7.5:
            mutation_labels.append("Exceptional Speed")
        elif traits.get('speed', 5.0) < 3.0:
            mutation_labels.append("Slow but Efficient")
        if traits.get('vision_range', 150.0) > 220.0:
            mutation_labels.append("Wide-Angle Vision")
        if traits.get('size', 10.0) > 18.0:
            mutation_labels.append("Large Body Mass")
        elif traits.get('size', 10.0) < 7.0:
            mutation_labels.append("Tiny and Agile")
        if traits.get('metabolism', 1.0) < 0.7:
            mutation_labels.append("Efficient Metabolism")
        elif traits.get('metabolism', 1.0) > 1.5:
            mutation_labels.append("High-Burn Metabolism")

    return {
        "id": org.id,
        "name": org.name,
        "generation": org.generation,
        "sex": org.sex,
        "birth_season": org.birth_season,
        "parent1_name": org.parent1_name,
        "parent2_name": org.parent2_name,
        "death_reason": death_reason,
        "death_age_years": round(death_age_years, 1),
        "offspring_count": org.offspring_count,
        "summary": summary,
        "life_events": org.life_events,
        "notable_traits": mutation_labels,
        "raw_mutations": mutations,
        "traits": traits
    }

SEASONS_LABELS = {
    'SPRING': 'Spring', 'SUMMER': 'Summer', 'AUTUMN': 'Autumn', 'WINTER': 'Winter'
}

# ─── Spawn Helpers ────────────────────────────────────────────────────
def spawn_ancestor(x=None, y=None, name=None, sex=None, age_years=None):
    """Spawns a generation 1 founder organism."""
    if x is None:
        x = random.uniform(50, world.width - 50)
    if y is None:
        y = random.uniform(50, world.height - 50)

    dna = DNA.create_random()
    if sex is None:
        sex = random.choice(['MALE', 'FEMALE'])
    season = world.get_current_season()
    org = Organism(x, y, dna, sex=sex, generation=1, name=name, birth_season=season)
    if age_years is not None:
        org.age = int(age_years * 1296000.0)
    organisms.append(org)

    lineage_tracker.register_birth(
        organism_id=org.id,
        name=org.name,
        parent1_id=None,
        parent1_name=None,
        parent2_id=None,
        parent2_name=None,
        generation=1,
        dna=dna,
        mutations=[]
    )
    add_log("SYSTEM", f"{org.name} emerged as an ancestor into the world.", organism_id=org.id)
    return org


# Seed Initial Organisms: Set to 0 so users spawn them manually
# for _ in range(8):
#     spawn_ancestor()


def handle_mating(org_list: List[Organism]):
    """Iterates through organisms with mating intent and executes crossover."""
    newborns = []

    for i, o1 in enumerate(org_list):
        if not o1.has_mating_intent:
            continue
        for j in range(i + 1, len(org_list)):
            o2 = org_list[j]
            if not o2.has_mating_intent:
                continue

            if o1.sex != o2.sex:
                dist = math.hypot(o1.x - o2.x, o1.y - o2.y)
                if dist < (o1.dna.size + o2.dna.size + 18.0):
                    if (o1.get_lifecycle_stage() == 1 and o2.get_lifecycle_stage() == 1 and
                        o1.mating_cooldown == 0 and o2.mating_cooldown == 0 and
                        o1.energy > o1.max_energy * 0.4 and o2.energy > o2.max_energy * 0.4 and
                        o1.hydration > o1.max_hydration * 0.4 and o2.hydration > o2.max_hydration * 0.4):

                        o1.energy -= o1.max_energy * 0.2
                        o1.hydration -= o1.max_hydration * 0.2
                        o1.mating_cooldown = 1296000

                        o2.energy -= o2.max_energy * 0.2
                        o2.hydration -= o2.max_hydration * 0.2
                        o2.mating_cooldown = 1296000

                        child_dna = o1.dna.crossover(o2.dna)
                        child_dna, mutations = child_dna.mutate(mutation_rate=mutation_rate, mutation_step=0.12)

                        child_gen = max(o1.generation, o2.generation) + 1
                        cx = o1.x + random.uniform(-15, 15)
                        cy = o1.y + random.uniform(-15, 15)
                        child_sex = random.choice(['MALE', 'FEMALE'])
                        season = world.get_current_season()

                        child = Organism(
                            x=cx, y=cy, dna=child_dna, sex=child_sex,
                            parent1_id=o1.id, parent1_name=o1.name,
                            parent2_id=o2.id, parent2_name=o2.name,
                            generation=child_gen,
                            birth_season=season
                        )
                        child.energy = child.max_energy * 0.9
                        child.hydration = child.max_hydration * 0.9

                        organisms.append(child)

                        # Record offspring for parents
                        o1.record_offspring(child.name)
                        o2.record_offspring(child.name)

                        lineage_tracker.register_birth(
                            organism_id=child.id,
                            name=child.name,
                            parent1_id=o1.id,
                            parent1_name=o1.name,
                            parent2_id=o2.id,
                            parent2_name=o2.name,
                            generation=child_gen,
                            dna=child_dna,
                            mutations=mutations
                        )

                        # Varied birth log messages
                        birth_phrases = [
                            f"{child.name} was born (Gen {child_gen}) from {o1.name} & {o2.name}.",
                            f"New life: {child.name} (Gen {child_gen}) entered the world.",
                            f"{o1.name} and {o2.name} gave rise to {child.name}, a Gen {child_gen} offspring.",
                            f"A child was born — {child.name}, carrying genes from both parents.",
                        ]
                        if mutations:
                            birth_phrases[0] += f" Mutations: {', '.join(mutations[:2])}"
                        add_log("EVOLUTION", random.choice(birth_phrases), organism_id=child.id)

                        o1._pending_reward += 1.5
                        o2._pending_reward += 1.5


def run_simulation_loop():
    """Background loop ticking the simulation in a standalone OS thread."""
    global ticks, max_generation, _cat_scorecard

    while True:
        if not simulation_running:
            time.sleep(0.05)
            continue

        tick_interval = 1.0 / (60.0 * simulation_speed)
        time.sleep(tick_interval)

        with sim_lock:
            ticks += 1

            living_gens = [o.generation for o in organisms if not o.is_dead]
            if living_gens:
                max_generation = max(living_gens)

            world.update(ticks, max_generation)

            # Predator Curriculum Gating (Phase 3: Gen 6+ AND flag enabled)
            if PREDATOR_ENABLED:
                predator_limit = 2 if max_generation >= 6 else 0
                active_preds = [p for p in predators if not p.is_dead]
                if len(active_preds) < predator_limit and random.random() < 0.003:
                    px = random.choice([20.0, world.width - 20.0])
                    py = random.uniform(20, world.height - 20)
                    pred = Predator(px, py)
                    predators.append(pred)
                    add_log("SYSTEM", f"Predator {pred.name} entered the ecosystem.")

            # Tick Organisms
            living_orgs = []
            for o in organisms:
                if not o.is_dead:
                    if o.age == 97200000:  # 75 Years old
                        add_log("BEHAVIOR", f"{o.name} reached 75 years — an extraordinary elder!", organism_id=o.id)

                    o.tick(world, organisms, predators)
                    world.handle_obstacle_collision(o)

                    if o.is_dead:
                        age_years = round(o.age / 1296000.0, 1)
                        # Generate biography before removing
                        lineage_node = lineage_tracker.history.get(o.id)
                        traits = lineage_node.traits if lineage_node else {}
                        raw_mutations = lineage_node.mutations if lineage_node else []
                        bio = generate_biography(o, o.death_reason, age_years, world.get_current_season(), traits, raw_mutations)
                        biographies[o.id] = bio

                        # Varied death messages
                        death_templates = {
                            'STARVATION': [
                                f"{o.name} perished from starvation at age {age_years}.",
                                f"Hunger claimed {o.name} after {age_years} years.",
                                f"{o.name} could not find food — gone at {age_years}.",
                            ],
                            'DEHYDRATION': [
                                f"{o.name} succumbed to dehydration at {age_years}.",
                                f"Thirst ended {o.name}'s journey at age {age_years}.",
                            ],
                            'OLD_AGE': [
                                f"{o.name} passed peacefully at {age_years} — a full life.",
                                f"Elder {o.name} lived {age_years} years before resting eternally.",
                            ],
                            'PREDATION': [
                                f"{o.name} was hunted and consumed at age {age_years}.",
                            ],
                            'ZAPPED': [
                                f"{o.name} was removed by the Director at age {age_years}.",
                            ]
                        }
                        templates = death_templates.get(o.death_reason, [f"{o.name} died at {age_years}."])
                        add_log("DEATH", random.choice(templates), organism_id=o.id)

                        if active_specimen_id == o.id:
                            pass  # Let WebSocket handle deselection
                    else:
                        living_orgs.append(o)

            organisms[:] = living_orgs + [o for o in organisms if o.is_dead]

            # Tick Predators
            living_preds = []
            for p in predators:
                if not p.is_dead:
                    p.tick(world, organisms)
                    world.handle_obstacle_collision(p)
                    if p.is_dead:
                        add_log("DEATH", f"Predator {p.name} died of hunger.")
                    else:
                        living_preds.append(p)
            predators[:] = living_preds

            # Handle Mating Crossovers
            living = [o for o in organisms if not o.is_dead]
            handle_mating(living)

            # Catastrophe scorecard tracking
            if world.catastrophe_type and _cat_scorecard is None:
                living_count = len([o for o in organisms if not o.is_dead])
                _cat_scorecard = {
                    "type": world.catastrophe_type,
                    "started_at_years": round(ticks / 1296000.0, 2),
                    "pop_before": living_count,
                    "pop_during": living_count,
                    "pop_after": None
                }
            elif world.catastrophe_type and _cat_scorecard:
                _cat_scorecard["pop_during"] = len([o for o in organisms if not o.is_dead])
            elif not world.catastrophe_type and _cat_scorecard and _cat_scorecard.get("pop_after") is None:
                _cat_scorecard["pop_after"] = len([o for o in organisms if not o.is_dead])

            # Population milestone logs
            if ticks % 12960 == 0:  # Every 10 sim-days
                living_count = len([o for o in organisms if not o.is_dead])
                if living_count == 0:
                    add_log("SYSTEM", "The biosphere has gone silent — all organisms are gone.")
                elif living_count > 30:
                    add_log("SYSTEM", f"The biosphere thrives with {living_count} living organisms.")


sim_thread = threading.Thread(target=run_simulation_loop, daemon=True)
sim_thread.start()


# ─── HTTP Endpoints ───────────────────────────────────────────────────

@app.post("/api/spawn")
def spawn_element(req: SpawnRequest):
    """Creates an organism, predator, or world element from God Mode."""
    with sim_lock:
        if req.type == 'PREY':
            org = spawn_ancestor(x=req.x, y=req.y, name=req.name, sex=req.sex, age_years=req.age_years)
            return {"status": "SUCCESS", "id": org.id, "name": org.name}

        elif req.type == 'WOLF':
            pred = Predator(req.x, req.y)
            predators.append(pred)
            add_log("SYSTEM", f"Predator {pred.name} was placed by the Director.")
            return {"status": "SUCCESS", "id": pred.id}

        elif req.type == 'FOOD':
            if world.get_tile_type_at(req.x, req.y) in ['GRASS', 'SAND']:
                world.food.append({'x': req.x, 'y': req.y, 'amount': 60.0, 'radius': 12.0})
                return {"status": "SUCCESS"}
            return {"status": "ERROR", "message": "Trees can only grow on Grass or Sand!"}

        elif req.type == 'WATER':
            # Water tiles paint instead
            world.paint_terrain(req.x, req.y, 45.0, 'WATER_SHALLOW')
            return {"status": "SUCCESS"}

        elif req.type == 'OBSTACLE':
            # Rock tiles paint instead
            world.paint_terrain(req.x, req.y, 45.0, 'ROCK')
            return {"status": "SUCCESS"}

    return {"status": "ERROR", "message": "Unknown type"}


@app.post("/api/rename")
def rename_specimen(req: RenameRequest):
    """Renames an active organism."""
    with sim_lock:
        for o in organisms:
            if o.id == req.id:
                old_name = o.name
                o.name = req.name
                if o.id in lineage_tracker.history:
                    lineage_tracker.history[o.id].name = req.name
                # Update biography if exists
                if o.id in biographies:
                    biographies[o.id]["name"] = req.name
                add_log("SYSTEM", f"{old_name} was renamed to {o.name}.", organism_id=o.id)
                return {"status": "SUCCESS"}
    return {"status": "ERROR", "message": "Organism not found"}


@app.post("/api/zap")
def zap_specimen(req: RenameRequest):
    """God Mode Zap: immediately kills/deletes an organism."""
    with sim_lock:
        for o in organisms:
            if o.id == req.id:
                o.is_dead = True
                o.death_reason = 'ZAPPED'
                add_log("DEATH", f"{o.name} was removed by the Director.", organism_id=o.id)
                return {"status": "SUCCESS"}
    return {"status": "ERROR", "message": "Organism not found"}


@app.post("/api/settings")
def update_settings(req: SettingsRequest):
    """Adjusts global simulation constants."""
    global simulation_speed, simulation_running, mutation_rate
    simulation_speed = req.speed
    simulation_running = req.running
    if req.mutation_rate is not None:
        mutation_rate = req.mutation_rate
    return {"status": "SUCCESS"}


@app.post("/api/catastrophe")
def trigger_catastrophe(req: CatastropheRequest):
    """Manually triggers or clears a global environmental catastrophe."""
    global _cat_scorecard
    with sim_lock:
        if req.type == 'NONE':
            world.catastrophe_type = None
            world.catastrophe_timer = 0
            add_log("SYSTEM", "The environmental catastrophe has passed.")
        else:
            world.catastrophe_type = req.type
            world.catastrophe_timer = 600
            living_count = len([o for o in organisms if not o.is_dead])
            _cat_scorecard = {
                "type": req.type,
                "started_at_years": round(ticks / 1296000.0, 2),
                "pop_before": living_count,
                "pop_during": living_count,
                "pop_after": None
            }
            add_log("SYSTEM", f"The Director unleashed a global {req.type.lower()} upon the world!")
    return {"status": "SUCCESS"}


@app.get("/api/biography/{organism_id}")
def get_biography(organism_id: str):
    """Returns the full biography of a (possibly dead) organism."""
    if organism_id in biographies:
        return biographies[organism_id]
    # If organism is still alive, return a partial biography
    with sim_lock:
        org = next((o for o in organisms if o.id == organism_id), None)
        if org:
            lineage_node = lineage_tracker.history.get(org.id)
            traits = lineage_node.traits if lineage_node else {}
            raw_mutations = lineage_node.mutations if lineage_node else []
            return generate_biography(org, "ALIVE", round(org.age / 1296000.0, 1),
                                      world.get_current_season(), traits, raw_mutations)
    return {"error": "Biography not found"}


@app.get("/api/catastrophe/scorecard")
def get_catastrophe_scorecard():
    """Returns current or last catastrophe scorecard."""
    return _cat_scorecard or {"type": None}


@app.get("/api/lineage")
def get_lineage_tree():
    """Returns the serialized history tree of all specimens."""
    with sim_lock:
        return lineage_tracker.serialize()


@app.get("/api/logs")
def get_logs():
    """Returns active discovery alerts."""
    return discovery_logs


@app.get("/api/terrain")
def get_terrain():
    """Returns the 2D grid tilemap."""
    with sim_lock:
        return {"terrain": world.terrain, "cols": world.cols, "rows": world.rows, "tile_size": world.tile_size}


@app.post("/api/terrain/paint")
def paint_terrain(req: PaintTerrainRequest):
    """Paints terrain tiles around coordinates."""
    with sim_lock:
        world.paint_terrain(req.x, req.y, req.radius, req.type)
        add_log("SYSTEM", f"Director painted {req.type.lower()} terrain.")
    return {"status": "SUCCESS"}


# ─── WebSocket State Streamer ─────────────────────────────────────────

@app.websocket("/api/ws/state")
async def websocket_endpoint(websocket: WebSocket):
    global active_specimen_id
    await websocket.accept()
    logger.info("WebSocket connection established.")

    try:
        while True:
            # Check for incoming client messages
            try:
                data_str = await asyncio.wait_for(websocket.receive_text(), timeout=0.01)
                data = json.loads(data_str)
                if data.get("action") == "select":
                    active_specimen_id = data.get("id")
                elif data.get("action") == "deselect":
                    active_specimen_id = None
            except asyncio.TimeoutError:
                pass

            with sim_lock:
                phase = 3
                if max_generation <= 2:
                    phase = 1
                elif max_generation <= 5:
                    phase = 2

                orgs_data = []
                for o in organisms:
                    if not o.is_dead:
                        orgs_data.append({
                            "id": o.id,
                            "name": o.name,
                            "x": round(o.x, 1),
                            "y": round(o.y, 1),
                            "angle": round(o.angle, 2),
                            "energy": round(o.energy, 1),
                            "max_energy": round(o.max_energy, 1),
                            "hydration": round(o.hydration, 1),
                            "max_hydration": round(o.max_hydration, 1),
                            "age": o.age,
                            "generation": o.generation,
                            "size": round(o.dna.size, 1),
                            "speed": round(o.dna.speed, 1),
                            "metabolism": round(o.dna.metabolism, 2),
                            "sex": o.sex,
                            "dopamine": round(o.dopamine_level, 2),
                            "serotonin": round(o.serotonin_level, 2),
                            "acetylcholine": round(o.acetylcholine_level, 2),
                            "cortisol": round(o.cortisol_level, 2),
                            "dominant_drive": o.calculate_dominant_drive(world.width, world.height, predators),
                            "lifecycle": o.get_lifecycle_label()
                        })

                preds_data = []
                for p in predators:
                    if not p.is_dead:
                        preds_data.append({
                            "id": p.id,
                            "name": p.name,
                            "x": round(p.x, 1),
                            "y": round(p.y, 1),
                            "angle": round(p.angle, 2),
                            "energy": round(p.energy, 1),
                            "max_energy": round(p.max_energy, 1),
                            "age": p.age,
                            "size": round(p.size, 1)
                        })

                selected_telemetry = None
                if active_specimen_id:
                    selected_org = next((o for o in organisms if o.id == active_specimen_id and not o.is_dead), None)
                    if selected_org:
                        selected_telemetry = {
                            "id": selected_org.id,
                            "name": selected_org.name,
                            "age": selected_org.age,
                            "generation": selected_org.generation,
                            "sex": selected_org.sex,
                            "lifecycle": selected_org.get_lifecycle_label(),
                            "energy": round(selected_org.energy, 1),
                            "max_energy": round(selected_org.max_energy, 1),
                            "hydration": round(selected_org.hydration, 1),
                            "max_hydration": round(selected_org.max_hydration, 1),
                            "dopamine": round(selected_org.dopamine_level, 2),
                            "serotonin": round(selected_org.serotonin_level, 2),
                            "acetylcholine": round(selected_org.acetylcholine_level, 2),
                            "cortisol": round(selected_org.cortisol_level, 2),
                            "dominant_drive": selected_org.calculate_dominant_drive(world.width, world.height, predators),
                            "last_action": selected_org.last_action_idx,
                            "parent1_name": selected_org.parent1_name,
                            "parent2_name": selected_org.parent2_name,
                            "offspring_count": selected_org.offspring_count,
                            "speed_trait": round(selected_org.dna.speed, 1),
                            "vision_trait": round(selected_org.dna.vision_range, 0),
                            "size_trait": round(selected_org.dna.size, 1),
                            "metabolism_trait": round(selected_org.dna.metabolism, 2),
                        }
                    else:
                        active_specimen_id = None

                state_payload = {
                    "ticks": ticks,
                    "years": round(ticks / 1296000.0, 2),
                    "season": world.get_current_season(),
                    "catastrophe": world.catastrophe_type,
                    "max_generation": max_generation,
                    "phase": phase,
                    "food": world.food,
                    "water": world.water,
                    "obstacles": world.obstacles,
                    "organisms": orgs_data,
                    "predators": preds_data,
                    "selected": selected_telemetry,
                    "terrain": world.terrain
                }

            await websocket.send_text(json.dumps(state_payload))
            await asyncio.sleep(0.033)  # 30Hz

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected.")
