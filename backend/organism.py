import sys
import os
import math
import random
import uuid
import numpy as np
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from bib.brain import BIB
from backend.genetics import DNA

# Microscopic name generator for Cambrian organisms
NAMES_FIRST = [
    "Aura", "Zephyr", "Calyx", "Vesper", "Aether", "Spora", "Nova", "Onyx",
    "Stella", "Helios", "Lyra", "Caelum", "Iris", "Mira", "Soleil", "Rune",
    "Ozz", "Solen", "Comet", "Lumen", "Cipher", "Echo", "Drift", "Flare",
    "Nebula", "Pulse", "Quark", "Vela", "Axiom", "Celeste"
]

SEASONS_LABELS = {
    'SPRING': 'Spring', 'SUMMER': 'Summer', 'AUTUMN': 'Autumn', 'WINTER': 'Winter'
}

def generate_organic_name():
    return random.choice(NAMES_FIRST)


class Organism:
    """
    Physical embodiment of a BIB-governed synthetic organism in Cambrian's 2D world.
    Tracks physics, metabolic decay, custom naming, and brain chemistry.
    """
    def __init__(self, x, y, dna, sex='MALE', parent1_id=None, parent1_name=None,
                 parent2_id=None, parent2_name=None, generation=1, name=None,
                 birth_season='SPRING', mind_mode='INNATE'):
        self.id = uuid.uuid4().hex
        self.name = name if name else generate_organic_name()

        self.parent1_id = parent1_id
        self.parent1_name = parent1_name
        self.parent2_id = parent2_id
        self.parent2_name = parent2_name
        self.generation = generation
        self.dna = dna
        self.sex = sex  # 'MALE' or 'FEMALE'
        self.mind_mode = mind_mode  # 'INNATE' or 'RAW'

        # Birth context
        self.birth_season = birth_season

        # Position & Velocity
        self.x = x
        self.y = y
        self.angle = random.uniform(0, 2 * math.pi)
        self.vx = 0.0
        self.vy = 0.0

        # Life Cycle
        self.age = 0
        self.max_age = 103680000  # 80 years at 1296000 ticks/year

        # Capacities scaled by DNA Size
        self.size_ratio = self.dna.size / 10.0
        self.max_energy = 100.0 * self.size_ratio
        self.max_hydration = 100.0 * self.size_ratio

        self.energy = self.max_energy * 0.8
        self.hydration = self.max_hydration * 0.8
        self.waste_level = 0.0

        # Brain Integration
        self.brain = BIB()
        self._pending_reward = 0.0

        # Pre-calibrate innate biological priors if mind_mode == 'INNATE'
        if self.mind_mode == 'INNATE':
            # Tune Basal Ganglia actor_weights (N_ACTIONS x SDR_SIZE)
            # Action 0: MOVEMENT, Action 1: REPRODUCTION, Action 2: SENSITIVITY (Rotate), Action 5: NUTRITION
            bg_actor = self.brain.bg.actor_weights
            # Base forward movement bias
            bg_actor[0, :] += 0.2
            # Vision bits: 0..36 Food -> NUTRITION (Action 5) & MOVEMENT (Action 0)
            bg_actor[5, 0:36] += 2.5
            bg_actor[0, 0:36] += 1.2
            # Vision bits: 36..72 Water -> NUTRITION (Action 5) & MOVEMENT (Action 0)
            bg_actor[5, 36:72] += 2.5
            bg_actor[0, 36:72] += 1.2
            # Vision bits: 72..108 Opposite Sex -> REPRODUCTION (Action 1) & MOVEMENT (Action 0)
            bg_actor[1, 72:108] += 2.5
            bg_actor[0, 72:108] += 1.2
            # Vision bits: 108..144 Wall -> SENSITIVITY (Action 2, Rotate)
            bg_actor[2, 108:144] += 2.0

        # State tracking
        self.is_dead = False
        self.death_reason = None
        self.mating_cooldown = 0
        self.has_mating_intent = False
        self.ticks_since_last_move = 0
        self.explore_timer = 0.0
        self.last_x, self.last_y = x, y

        # Diagnostic outputs
        self.last_action_idx = 6  # Start IDLE
        self.is_babbling = False
        self.dopamine_level = 0.0
        self.serotonin_level = 0.5
        self.acetylcholine_level = 0.1
        self.cortisol_level = 0.0

        # === Biography / Life Events tracking ===
        self.life_events = []        # list of str describing notable events
        self.offspring_count = 0     # how many children this organism sired
        self._first_meal_logged = False
        self._first_reproduction_logged = False
        self._catastrophe_survived = []  # names of survived catastrophes
        self._near_starvation_alert = False
        self._near_dehydration_alert = False

    def log_life_event(self, event: str):
        """Records a notable life event for the biography system."""
        years = round(self.age / 1296000.0, 1)
        self.life_events.append({"age_years": years, "event": event})

    def record_survived_catastrophe(self, catastrophe_type: str):
        if catastrophe_type not in self._catastrophe_survived:
            self._catastrophe_survived.append(catastrophe_type)
            self.log_life_event(f"Survived a global {catastrophe_type.lower()}")

    def record_offspring(self, child_name: str):
        self.offspring_count += 1
        if not self._first_reproduction_logged:
            self._first_reproduction_logged = True
            self.log_life_event(f"First offspring — {child_name} — brought into the world")
        elif self.offspring_count == 5:
            self.log_life_event(f"Raised 5 offspring — a prolific lineage")

    def get_lifecycle_stage(self):
        """Juvenile (0), Mature (1), Elder (2)."""
        # 1 Year = 1,296,000 ticks.
        # Juvenile: 0-12 Years (0 to 15.55M ticks)
        # Mature: 12-60 Years (15.55M to 77.76M ticks)
        # Elder: 60-80 Years (77.76M to 103.68M ticks)
        if self.age < 15552000:
            return 0
        elif self.age < 77760000:
            return 1
        else:
            return 2

    def get_lifecycle_label(self):
        stages = {0: "Juvenile", 1: "Mature", 2: "Elder"}
        return stages[self.get_lifecycle_stage()]

    def calculate_dominant_drive(self, world_width, world_height, predators):
        """
        Determines the current active internal drive of the organism.
        (0=None, 1=Hungry, 2=Thirsty, 3=Mating, 4=Fear, 5=Explore)
        """
        # 1. Fear check: Near walls or near predators
        dist_to_wall = min(self.x, world_width - self.x, self.y, world_height - self.y)
        if dist_to_wall < 40.0:
            return 4

        for pred in predators:
            if not pred.is_dead:
                dist_to_pred = math.hypot(pred.x - self.x, pred.y - self.y)
                if dist_to_pred < 120.0:
                    return 4  # Fear drive

        # 2. Drive intensities
        hunger = (self.max_energy - self.energy) / self.max_energy
        thirst = (self.max_hydration - self.hydration) / self.max_hydration

        # Mating urge: mature, no cooldown, and well-sustained
        mating_urge = 0.0
        if self.get_lifecycle_stage() == 1 and self.mating_cooldown == 0:
            if self.energy > self.max_energy * 0.6 and self.hydration > self.max_hydration * 0.6:
                mating_urge = 1.0

        # Exploration urge: accumulates when stationary
        exploration_urge = self.explore_timer

        drives = [
            (0.0, 0), # None
            (hunger, 1),
            (thirst, 2),
            (mating_urge, 3),
            (exploration_urge, 5)
        ]

        drives.sort(reverse=True, key=lambda x: x[0])
        if drives[0][0] > 0.4:
            return drives[0][1]

        return 0

    def get_vision_byte(self, world, organisms, predators):
        """
        Cone of vision check (60 degrees wide).
        Detects closest object: 0=Empty, 1=Food, 2=Water, 3=Opposite Sex Mate, 4=Wall, 5=Same Sex, 6=Predator.
        """
        fov = math.pi / 3.0  # 60 degrees cone
        vision_range = self.dna.vision_range

        closest_dist = vision_range
        closest_type = 0  # Empty

        def is_in_cone(tx, ty):
            dx = tx - self.x
            dy = ty - self.y
            dist = math.hypot(dx, dy)
            if dist > vision_range or dist < 0.1:
                return False, dist

            ang = math.atan2(dy, dx)
            diff = (ang - self.angle + math.pi) % (2 * math.pi) - math.pi
            if abs(diff) < fov / 2.0:
                return True, dist
            return False, dist

        # Check walls
        wall_dists = []
        cos_a = math.cos(self.angle)
        sin_a = math.sin(self.angle)

        if cos_a > 0:
            d = (world.width - self.x) / cos_a
            if 0 < d < vision_range: wall_dists.append(d)
        elif cos_a < 0:
            d = -self.x / cos_a
            if 0 < d < vision_range: wall_dists.append(d)

        if sin_a > 0:
            d = (world.height - self.y) / sin_a
            if 0 < d < vision_range: wall_dists.append(d)
        elif sin_a < 0:
            d = -self.y / sin_a
            if 0 < d < vision_range: wall_dists.append(d)

        if wall_dists:
            closest_dist = min(wall_dists)
            closest_type = 4

        # Check Food
        for f in world.food:
            in_cone, dist = is_in_cone(f['x'], f['y'])
            if in_cone and dist < closest_dist:
                closest_dist = dist
                closest_type = 1

        # Check Water
        for w in world.water:
            in_cone, dist = is_in_cone(w['x'], w['y'])
            if in_cone and dist < closest_dist:
                closest_dist = dist
                closest_type = 2

        # Check Organisms
        for o in organisms:
            if o.id == self.id or o.is_dead:
                continue
            in_cone, dist = is_in_cone(o.x, o.y)
            if in_cone and dist < closest_dist:
                closest_dist = dist
                if o.sex != self.sex:
                    closest_type = 3  # Opposite Sex (Mate)
                else:
                    closest_type = 5  # Same Sex

        # Check Predators
        for p in predators:
            if p.is_dead:
                continue
            in_cone, dist = is_in_cone(p.x, p.y)
            if in_cone and dist < closest_dist:
                closest_dist = dist
                closest_type = 6  # Predator

        return closest_type

    def _build_sensors(self, world, organisms, predators):
        """Constructs 528-dimensional sensory vectors for BIB."""
        sensors = {}

        # Vision (256-dim)
        vision = np.zeros(256, dtype=np.float32)
        closest_type = self.get_vision_byte(world, organisms, predators)
        if closest_type > 0:
            vision[(closest_type - 1) * 36 : closest_type * 36] = 1.0
        sensors["vision"] = vision

        # Touch (64-dim)
        touch = np.zeros(64, dtype=np.float32)
        dist_to_wall = min(self.x, world.width - self.x, self.y, world.height - self.y)
        if dist_to_wall < 5.0:
            touch[:] = 1.0
        sensors["touch"] = touch

        # Proprioception (32-dim)
        prop = np.zeros(32, dtype=np.float32)
        speed = math.hypot(self.vx, self.vy)
        prop[0:16] = min(1.0, speed / 5.0)
        sensors["proprioception"] = prop

        # Unused sensory bands (chemoreception & auditory)
        sensors["chemoreception"] = np.zeros(32, dtype=np.float32)
        sensors["auditory"] = np.zeros(128, dtype=np.float32)

        # Interoception (16-dim)
        intero = np.zeros(16, dtype=np.float32)
        intero[0] = (self.max_energy - self.energy) / self.max_energy
        intero[1] = (self.max_hydration - self.hydration) / self.max_hydration
        intero[2] = self.waste_level
        sensors["interoception"] = intero

        return sensors

    def tick(self, world, organisms, predators):
        """Runs one simulation step for the organism."""
        if self.is_dead:
            return

        self.age += 1

        # 1. Cooldowns & resets
        if self.mating_cooldown > 0:
            self.mating_cooldown -= 1
        self.has_mating_intent = False

        # 2. Physics update with Terrain Friction
        tile_type = world.get_tile_type_at(self.x, self.y)
        speed_multiplier = 1.0
        drowning_drain = 0.0

        if tile_type == 'WATER_SHALLOW':
            speed_multiplier = 0.6  # 40% speed reduction in shallow water
        elif tile_type == 'WATER_DEEP':
            speed_multiplier = 0.25 # 75% speed reduction in deep water
            # Drowning penalty: if creature is small or low on energy, deep water drains energy fast
            drowning_drain = 0.003 * self.size_ratio

        self.x += self.vx * speed_multiplier
        self.y += self.vy * speed_multiplier
        self.vx *= 0.90
        self.vy *= 0.90

        # Boundary bounce & pain penalty
        boundary_hit = False
        if self.x < self.dna.size:
            self.x = self.dna.size
            self.vx = -self.vx * 0.5
            boundary_hit = True
        elif self.x > world.width - self.dna.size:
            self.x = world.width - self.dna.size
            self.vx = -self.vx * 0.5
            boundary_hit = True

        if self.y < self.dna.size:
            self.y = self.dna.size
            self.vy = -self.vy * 0.5
            boundary_hit = True
        elif self.y > world.height - self.dna.size:
            self.y = world.height - self.dna.size
            self.vy = -self.vy * 0.5
            boundary_hit = True

        # 3. Explore tracking (builds up exploration drive)
        dist_moved = math.hypot(self.x - self.last_x, self.y - self.last_y)
        if dist_moved < 2.0:
            self.ticks_since_last_move += 1
            self.explore_timer = min(1.0, self.explore_timer + 0.005)
        else:
            self.ticks_since_last_move = 0
            self.explore_timer = max(0.0, self.explore_timer - 0.05)
        self.last_x, self.last_y = self.x, self.y

        # Dynamic Age Milestones
        if self.age == 15552000:
            self.log_life_event("Reached biological maturity — entered adulthood")
        elif self.age == 77760000:
            self.log_life_event("Entered elder age — genetic metabolic efficiency began to decline")

        # Near-Death & Recovery Tracking
        if self.energy < self.max_energy * 0.15:
            self._near_starvation_alert = True
        elif self.energy > self.max_energy * 0.50 and self._near_starvation_alert:
            self._near_starvation_alert = False
            self.log_life_event("Narrowly survived a period of critical starvation")

        if self.hydration < self.max_hydration * 0.15:
            self._near_dehydration_alert = True
        elif self.hydration > self.max_hydration * 0.50 and self._near_dehydration_alert:
            self._near_dehydration_alert = False
            self.log_life_event("Found water source just in time to escape fatal dehydration")

        # Track catastrophe survival
        if world.catastrophe_type:
            self.record_survived_catastrophe(world.catastrophe_type)

        # 4. Metabolic decay
        efficiency_mult = 1.5 if self.get_lifecycle_stage() == 2 else 1.0

        # Satiation rates: Starvation limit 10 days, Dehydration limit 3 days
        self.energy_decay = 0.00009259 * self.dna.metabolism * self.size_ratio * efficiency_mult + drowning_drain
        self.hydration_decay = 0.0003086 * self.dna.metabolism * self.size_ratio * efficiency_mult

        self.energy -= self.energy_decay
        self.hydration -= self.hydration_decay

        # Death checks
        if self.energy <= 0:
            self.is_dead = True
            self.death_reason = 'DROWNED' if drowning_drain > 0 else 'STARVATION'
            return
        if self.hydration <= 0:
            self.is_dead = True
            self.death_reason = 'DEHYDRATION'
            return
        if self.age >= self.max_age:
            self.is_dead = True
            self.death_reason = 'OLD_AGE'
            return

        # 5. Core Neural Processing (BIB Tick)
        sensors = self._build_sensors(world, organisms, predators)
        reward = self._pending_reward
        self._pending_reward = 0.0

        pain = 0.0
        if boundary_hit:
            reward -= 0.5  # Pain for wall hits
            pain = 0.8

        # Check proximity to predators to trigger fear (increases cortisol)
        near_predator = False
        for p in predators:
            if not p.is_dead and math.hypot(p.x - self.x, p.y - self.y) < 100.0:
                near_predator = True
                reward -= 0.2  # Pain for predator proximity

        homeostatic_state = {
            'hunger': (self.max_energy - self.energy) / self.max_energy,
            'thirst': (self.max_hydration - self.hydration) / self.max_hydration,
            'pain': pain,
            'energy': self.energy / self.max_energy,
            'fear': 1.0 if near_predator else 0.0
        }

        action_idx = self.brain.tick(sensors, reward=reward, homeostatic_state=homeostatic_state)
        self.last_action_idx = action_idx

        # Extract chemical states for the frontend dials
        chem = self.brain.get_chemistry()
        self.dopamine_level = chem['DA']
        self.acetylcholine_level = chem['ACh']
        self.serotonin_level = chem['5-HT']
        self.cortisol_level = chem['Cortisol']

        # Sleep handling
        if self.brain.needs_sleep():
            self.brain.sleep()

        # 6. Motor action execution (MRS GREN actions)
        energy_action_cost = 0.0
        hydration_action_cost = 0.0

        if action_idx == 0:  # MOVEMENT
            self.vx += math.cos(self.angle) * self.dna.speed * 0.18
            self.vy += math.sin(self.angle) * self.dna.speed * 0.18
            energy_action_cost = 0.0000296 * self.size_ratio
            hydration_action_cost = 0.0000555 * self.size_ratio

        elif action_idx == 1:  # REPRODUCTION
            if self.get_lifecycle_stage() == 1 and self.mating_cooldown == 0:
                self.has_mating_intent = True
                energy_action_cost = 0.0000370 * self.size_ratio

        elif action_idx == 2:  # SENSITIVITY (Rotate)
            turn_dir = 1.0 if random.random() > 0.5 else -1.0
            self.angle = (self.angle + 0.3 * turn_dir) % (2 * math.pi)
            energy_action_cost = 0.0000074 * self.size_ratio

        elif action_idx == 3:  # GROWTH
            if self.energy > self.max_energy * 0.5:
                self.dna.size = min(30.0, self.dna.size + 0.05)
                self.size_ratio = self.dna.size / 10.0
                self.max_energy = 100.0 * self.size_ratio
                self.max_hydration = 100.0 * self.size_ratio
                energy_action_cost = 1.0

        elif action_idx == 4:  # EXCRETION
            self.waste_level = 0.0
            energy_action_cost = 0.5

        elif action_idx == 5:  # NUTRITION
            eaten = world.consume_food(self.x, self.y, max_eat=35.0, reach_dist=self.dna.size + 5.0)
            if eaten > 0:
                self.energy = min(self.max_energy, self.energy + eaten)
                self._pending_reward += 1.0
                # Log first meal
                if not self._first_meal_logged:
                    self._first_meal_logged = True
                    self.log_life_event("Consumed first meal — learned to forage")
            else:
                drunk = world.consume_water(self.x, self.y, max_drink=50.0, reach_dist=self.dna.size + 5.0)
                if drunk > 0:
                    self.hydration = min(self.max_hydration, self.hydration + drunk)
                    self._pending_reward += 1.0
                else:
                    self._pending_reward -= 0.1

        elif action_idx == 6:  # IDLE
            energy_action_cost = -self.energy_decay * 0.5
            hydration_action_cost = -self.hydration_decay * 0.5

        elif action_idx == 7:  # COMMUNICATE
            energy_action_cost = 0.00001 * self.size_ratio

        # Waste accumulation
        self.waste_level = min(1.0, self.waste_level + 0.0001)
        if self.waste_level > 0.8:
            energy_action_cost += 0.0001

        # Apply metabolic cost of actions
        self.energy -= energy_action_cost
        self.hydration -= hydration_action_cost
