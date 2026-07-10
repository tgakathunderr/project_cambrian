import random
import math

class World:
    """
    Continuous 2D environment containing Food (plants), Water (puddles), and Obstacles.
    Handles dynamic seasons, catastrophe events, and difficulty phase limits.
    """
    def __init__(self, width=1000, height=800):
        self.width = width
        self.height = height
        
        # Resources & Obstacles lists: {'x': float, 'y': float, 'amount': float, 'radius': float}
        self.food = []
        self.water = []
        self.obstacles = []  # Static obstacles spawned by user
        
        # Seasons config: (food_spawn_rate, water_spawn_rate)
        self.seasons = {
            'SPRING': (0.4, 0.4),
            'SUMMER': (0.5, 0.1),
            'AUTUMN': (0.3, 0.3),
            'WINTER': (0.1, 0.5)
        }
        self.season_order = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER']
        self.ticks_per_season = 324000  # 3 days per season at 108000 ticks/day
        self.current_season_idx = 0
        
        # Catastrophes
        self.catastrophe_type = None  # 'DROUGHT', 'FAMINE', None
        self.catastrophe_timer = 0
        
        # Initial spawning
        for _ in range(25):
            self.spawn_food()
        for _ in range(12):
            self.spawn_water()

    def get_current_season(self):
        return self.season_order[self.current_season_idx]

    def spawn_food(self):
        x = random.uniform(30, self.width - 30)
        y = random.uniform(30, self.height - 30)
        amount = random.uniform(30, 80)
        radius = math.sqrt(amount) * 1.6
        self.food.append({'x': x, 'y': y, 'amount': amount, 'radius': radius})

    def spawn_water(self):
        x = random.uniform(30, self.width - 30)
        y = random.uniform(30, self.height - 30)
        amount = random.uniform(50, 120)
        radius = math.sqrt(amount) * 2.1
        self.water.append({'x': x, 'y': y, 'amount': amount, 'radius': radius})

    def update(self, ticks, max_generation):
        """Progresses world state, seasons, and filters depleted resources."""
        # Active seasons progression starting immediately from Gen 1
        season_ticks = ticks % (self.ticks_per_season * 4)
        self.current_season_idx = (season_ticks // self.ticks_per_season) % 4
        current_season = self.get_current_season()
        food_rate, water_rate = self.seasons[current_season]
        
        # Scarcity resource caps
        food_cap, water_cap = 30, 15

        # Catastrophe Logic
        if self.catastrophe_type:
            self.catastrophe_timer -= 1
            if self.catastrophe_timer <= 0:
                self.catastrophe_type = None
        else:
            # 0.05% chance per tick to trigger catastrophe (Project Big Bang rate)
            if random.random() < 0.0005:
                self.catastrophe_type = random.choice(['DROUGHT', 'FAMINE'])
                self.catastrophe_timer = random.randint(300, 600)
        
        # Apply Catastrophe modifier rates
        if self.catastrophe_type == 'DROUGHT':
            water_rate = 0.0
            for w in self.water:
                w['amount'] -= 0.12
                w['radius'] = math.sqrt(max(1.0, w['amount'])) * 2.1
        elif self.catastrophe_type == 'FAMINE':
            food_rate = 0.0
            for f in self.food:
                f['amount'] -= 0.12
                f['radius'] = math.sqrt(max(1.0, f['amount'])) * 1.6
            
        # Filter depleted resources
        self.food = [f for f in self.food if f['amount'] > 5.0]
        self.water = [w for w in self.water if w['amount'] > 5.0]
        
        # Replenish resource nodes based on caps
        if random.random() < food_rate and len(self.food) < food_cap:
            self.spawn_food()
        if random.random() < water_rate and len(self.water) < water_cap:
            self.spawn_water()

    def consume_food(self, x, y, max_eat, reach_dist):
        """Attempts to eat food near (x,y). Returns energy gained."""
        for f in self.food:
            dist = math.hypot(f['x'] - x, f['y'] - y)
            if dist < f['radius'] + reach_dist:
                eaten = min(f['amount'], max_eat)
                f['amount'] -= eaten
                f['radius'] = math.sqrt(max(1.0, f['amount'])) * 1.6
                return eaten
        return 0.0

    def consume_water(self, x, y, max_drink, reach_dist):
        """Attempts to drink water near (x,y). Returns hydration gained."""
        for w in self.water:
            dist = math.hypot(w['x'] - x, w['y'] - y)
            if dist < w['radius'] + reach_dist:
                drunk = min(w['amount'], max_drink)
                w['amount'] -= drunk
                w['radius'] = math.sqrt(max(1.0, w['amount'])) * 2.1
                return drunk
        return 0.0

    def handle_obstacle_collision(self, agent):
        """Checks and handles collisions of an agent with static obstacles."""
        for obs in self.obstacles:
            dist = math.hypot(agent.x - obs['x'], agent.y - obs['y'])
            agent_size = agent.dna.size if hasattr(agent, 'dna') else getattr(agent, 'size', 10.0)
            min_dist = obs['radius'] + agent_size
            if dist < min_dist:
                # Bounce agent back
                dx = (agent.x - obs['x']) / (dist if dist > 0.1 else 1.0)
                dy = (agent.y - obs['y']) / (dist if dist > 0.1 else 1.0)
                agent.x = obs['x'] + dx * min_dist
                # Reverse and damp velocity
                agent.vx = -agent.vx * 0.4 + dx * 0.8
                agent.vy = -agent.vy * 0.4 + dy * 0.8
                return True
        return False
