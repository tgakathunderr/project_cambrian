import sys
import os
import math
import random
import uuid
import numpy as np
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from bib.brain import BIB
from backend.genetics import DNA

PREDATOR_NAMES = ["Grim", "Varg", "Fenrir", "Nyx", "Obsidian", "Tracker", "Shadow", "Saber", "Razor", "Stalker"]

class Predator:
    """
    BIB-governed predator (Wolf) in Cambrian's 2D world.
    Learns to track, hunt, and consume organisms using reinforcement learning.
    """
    def __init__(self, x, y):
        self.id = uuid.uuid4().hex
        self.name = f"Wolf {random.choice(PREDATOR_NAMES)}"
        
        # Position & Velocity
        self.x = x
        self.y = y
        self.angle = random.uniform(0, 2 * math.pi)
        self.vx = 0.0
        self.vy = 0.0
        self.speed = 4.2  # Fixed predator hunting speed
        self.size = 14.0  # Slightly larger than baseline prey
        
        # Core Biology
        self.age = 0
        self.max_age = 150000000  # Longer lifespan than prey
        self.max_energy = 150.0
        self.energy = self.max_energy * 0.8
        
        # Co-evolutionary BIB Brain
        self.brain = BIB()
        self._pending_reward = 0.0
        
        self.is_dead = False
        self.death_reason = None
        self.last_action_idx = 6  # Start IDLE
        
        # Chemistry for telemetry diagnostics
        self.dopamine_level = 0.0
        self.serotonin_level = 0.5
        self.acetylcholine_level = 0.1
        self.cortisol_level = 0.0

    def get_vision_byte(self, world, organisms):
        """
        Cone of vision check (60 degrees wide).
        For predators: 0=Empty, 1=Organism (Prey), 2=Wall.
        """
        fov = math.pi / 3.0
        vision_range = 220.0  # High predator vision range
        
        closest_dist = vision_range
        closest_type = 0
        
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
            closest_type = 2  # Wall

        # Check Organisms (Prey)
        for o in organisms:
            if o.is_dead:
                continue
            in_cone, dist = is_in_cone(o.x, o.y)
            if in_cone and dist < closest_dist:
                closest_dist = dist
                closest_type = 1  # Prey

        return closest_type

    def _build_sensors(self, world, organisms):
        """Constructs 528-dimensional sensory vectors for predator's BIB."""
        sensors = {}
        
        # Vision (256-dim)
        # 1 = Organism (Prey), 2 = Wall
        vision = np.zeros(256, dtype=np.float32)
        closest_type = self.get_vision_byte(world, organisms)
        if closest_type > 0:
            # Map object slices
            vision[(closest_type - 1) * 40 : closest_type * 40] = 1.0
        sensors["vision"] = vision
        
        # Touch (64-dim)
        touch = np.zeros(64, dtype=np.float32)
        dist_to_wall = min(self.x, world.width - self.x, self.y, world.height - self.y)
        if dist_to_wall < 8.0:
            touch[:] = 1.0
        sensors["touch"] = touch
        
        # Proprioception (32-dim)
        prop = np.zeros(32, dtype=np.float32)
        speed = math.hypot(self.vx, self.vy)
        prop[0:16] = min(1.0, speed / 5.0)
        sensors["proprioception"] = prop
        
        # Unused bands
        sensors["chemoreception"] = np.zeros(32, dtype=np.float32)
        sensors["auditory"] = np.zeros(128, dtype=np.float32)
        
        # Interoception (16-dim)
        intero = np.zeros(16, dtype=np.float32)
        intero[0] = (self.max_energy - self.energy) / self.max_energy
        sensors["interoception"] = intero
        
        return sensors

    def tick(self, world, organisms):
        """Runs one simulation step for the predator."""
        if self.is_dead:
            return
            
        self.age += 1
        
        # 1. Physics update
        self.x += self.vx
        self.y += self.vy
        self.vx *= 0.88
        self.vy *= 0.88
        
        # Boundary bounce & pain penalty
        boundary_hit = False
        if self.x < self.size:
            self.x = self.size
            self.vx = -self.vx * 0.5
            boundary_hit = True
        elif self.x > world.width - self.size:
            self.x = world.width - self.size
            self.vx = -self.vx * 0.5
            boundary_hit = True
            
        if self.y < self.size:
            self.y = self.size
            self.vy = -self.vy * 0.5
            boundary_hit = True
        elif self.y > world.height - self.size:
            self.y = world.height - self.size
            self.vy = -self.vy * 0.5
            boundary_hit = True
            
        # 2. Metabolic decay (slower decay so predators stay alive longer to test prey)
        self.energy_decay = 0.000085
        self.energy -= self.energy_decay
        
        if self.energy <= 0:
            self.is_dead = True
            self.death_reason = 'STARVATION'
            return
        if self.age >= self.max_age:
            self.is_dead = True
            self.death_reason = 'OLD_AGE'
            return

        # 3. Neural Processing (BIB Tick)
        sensors = self._build_sensors(world, organisms)
        reward = self._pending_reward
        self._pending_reward = 0.0
        
        pain = 0.0
        if boundary_hit:
            reward -= 0.4
            pain = 0.8
            
        homeostatic_state = {
            'hunger': (self.max_energy - self.energy) / self.max_energy,
            'pain': pain,
            'energy': self.energy / self.max_energy
        }
        
        action_idx = self.brain.tick(sensors, reward=reward, homeostatic_state=homeostatic_state)
        self.last_action_idx = action_idx
        
        # Extract chemical states
        chem = self.brain.get_chemistry()
        self.dopamine_level = chem['DA']
        self.acetylcholine_level = chem['ACh']
        self.serotonin_level = chem['5-HT']
        self.cortisol_level = chem['Cortisol']
        
        if self.brain.needs_sleep():
            self.brain.sleep()
            
        # 4. Action Execution
        if action_idx == 0:  # MOVEMENT (chase forward)
            self.vx += math.cos(self.angle) * self.speed * 0.22
            self.vy += math.sin(self.angle) * self.speed * 0.22
            self.energy -= 0.000008
            
        elif action_idx == 2:  # SENSITIVITY (rotate/scan)
            turn_dir = 1.0 if random.random() > 0.5 else -1.0
            self.angle = (self.angle + 0.4 * turn_dir) % (2 * math.pi)
            self.energy -= 0.000002
            
        elif action_idx == 5:  # NUTRITION (bite prey)
            # Find closest prey in range and consume it
            success_bite = False
            for o in organisms:
                if not o.is_dead:
                    dist = math.hypot(o.x - self.x, o.y - self.y)
                    # Bite reach: sum of sizes + reach threshold
                    if dist < (self.size + o.dna.size + 8.0):
                        # Bite success! Inflict damage on prey, gain energy
                        o.energy -= 35.0  # Inflict massive energy damage
                        o._pending_reward -= 0.8  # Pain to prey
                        self.energy = min(self.max_energy, self.energy + 50.0)
                        self._pending_reward += 1.0  # Reward to predator
                        success_bite = True
                        break
            
            if not success_bite:
                self._pending_reward -= 0.15  # Penalty for missed bite
