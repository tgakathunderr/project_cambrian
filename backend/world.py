import random
import math

class World:
    """
    Grid-based environment containing a tilemap (Grass, Sand, Shallow Water, Deep Water, Rock).
    Manages dynamic seasonal growth of trees/plants and handles tile physics collisions.
    """
    def __init__(self, width=1000, height=800):
        self.width = width
        self.height = height
        
        # Grid parameters: 20 columns x 16 rows. Each cell is 50x50 pixels.
        self.cols = 20
        self.rows = 16
        self.tile_size = 50

        # Initialize base tilemap: Default to 'GRASS' everywhere
        self.terrain = [['GRASS' for _ in range(self.rows)] for _ in range(self.cols)]

        # Procedural natural layout at startup:
        # Create a small central lake
        for cx in range(8, 12):
            for cy in range(6, 10):
                self.terrain[cx][cy] = 'WATER_SHALLOW'
        for cx in range(9, 11):
            for cy in range(7, 9):
                self.terrain[cx][cy] = 'WATER_DEEP'

        # Create some sandy beaches around the lake
        for cx in range(7, 13):
            for cy in range(5, 11):
                if self.terrain[cx][cy] == 'GRASS':
                    self.terrain[cx][cy] = 'SAND'

        # Natural rock mountains at corners
        self.terrain[0][0] = 'ROCK'
        self.terrain[0][1] = 'ROCK'
        self.terrain[1][0] = 'ROCK'
        self.terrain[19][0] = 'ROCK'
        self.terrain[19][1] = 'ROCK'
        self.terrain[18][0] = 'ROCK'
        self.terrain[0][15] = 'ROCK'
        self.terrain[19][15] = 'ROCK'

        # Food (Trees) and Water resources
        self.food = []  # dicts: {'x': float, 'y': float, 'amount': float, 'radius': float}
        self.water = [] # Deprecated: Water is now handled directly by Water Tiles! We keep list empty for backwards compatibility.
        self.obstacles = [] # Deprecated: Rocks are now handled directly by Rock Tiles!
        
        # Seasons config: (food_spawn_rate, water_spawn_rate)
        self.seasons = {
            'SPRING': (0.35, 0.35),
            'SUMMER': (0.5, 0.1),
            'AUTUMN': (0.25, 0.25),
            'WINTER': (0.08, 0.5)
        }
        self.season_order = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER']
        self.ticks_per_season = 324000  # 3 days per season at 108000 ticks/day
        self.current_season_idx = 0
        
        # Catastrophes
        self.catastrophe_type = None  # 'DROUGHT', 'FAMINE', None
        self.catastrophe_timer = 0
        
        # Initial tree spawns (only on Grass)
        for _ in range(12):
            self.spawn_food()

    def get_current_season(self):
        return self.season_order[self.current_season_idx]

    def paint_terrain(self, x: float, y: float, radius: float, tile_type: str):
        """Paints terrain tiles within a radius around a pixel coordinate."""
        # Convert radius to cell count
        cell_radius = max(1, int(radius / self.tile_size))
        center_col = int(x / self.tile_size)
        center_row = int(y / self.tile_size)

        for col in range(max(0, center_col - cell_radius), min(self.cols, center_col + cell_radius + 1)):
            for row in range(max(0, center_row - cell_radius), min(self.rows, center_row + cell_radius + 1)):
                # Circle distance check
                dx = (col + 0.5) * self.tile_size - x
                dy = (row + 0.5) * self.tile_size - y
                if math.hypot(dx, dy) <= radius:
                    self.terrain[col][row] = tile_type

        # Clear trees on rock or water
        self.food = [
            f for f in self.food 
            if self.get_tile_type_at(f['x'], f['y']) in ['GRASS', 'SAND']
        ]

    def get_tile_type_at(self, x: float, y: float) -> str:
        """Returns the tile type at pixel coordinates (x, y)."""
        col = int(max(0, min(self.width - 1, x)) / self.tile_size)
        row = int(max(0, min(self.height - 1, y)) / self.tile_size)
        return self.terrain[col][row]

    def spawn_food(self):
        """Spawns a Tree on a random Grass tile."""
        # Try to find a Grass tile
        valid_tiles = []
        for c in range(self.cols):
            for r in range(self.rows):
                if self.terrain[c][r] == 'GRASS':
                    valid_tiles.append((c, r))
        
        if not valid_tiles:
            return

        c, r = random.choice(valid_tiles)
        # Spawn randomly within the tile bounds
        x = (c + random.uniform(0.2, 0.8)) * self.tile_size
        y = (r + random.uniform(0.2, 0.8)) * self.tile_size
        amount = random.uniform(40, 80)
        radius = math.sqrt(amount) * 1.5
        self.food.append({'x': x, 'y': y, 'amount': amount, 'radius': radius})

    def update(self, ticks, max_generation):
        """Progresses world state, seasons, resource growth, and filters depleted nodes."""
        # Active seasons progression starting immediately from Gen 1
        season_ticks = ticks % (self.ticks_per_season * 4)
        self.current_season_idx = (season_ticks // self.ticks_per_season) % 4
        current_season = self.get_current_season()
        food_rate, water_rate = self.seasons[current_season]
        
        # Scarcity resource caps
        food_cap = 25

        # Catastrophe Logic
        if self.catastrophe_type:
            self.catastrophe_timer -= 1
            if self.catastrophe_timer <= 0:
                self.catastrophe_type = None
        else:
            if random.random() < 0.0005:
                self.catastrophe_type = random.choice(['DROUGHT', 'FAMINE'])
                self.catastrophe_timer = random.randint(300, 600)
        
        # Apply Catastrophe modifier rates
        if self.catastrophe_type == 'DROUGHT':
            # Evaporate water: Turn some shallow water tiles to sand!
            if random.random() < 0.01:
                water_tiles = []
                for c in range(self.cols):
                    for r in range(self.rows):
                        if self.terrain[c][r] == 'WATER_SHALLOW':
                            water_tiles.append((c, r))
                if water_tiles:
                    tc, tr = random.choice(water_tiles)
                    self.terrain[tc][tr] = 'SAND'
        elif self.catastrophe_type == 'FAMINE':
            food_rate = 0.0
            # Slowly decay trees
            for f in self.food:
                f['amount'] -= 0.15
                f['radius'] = math.sqrt(max(1.0, f['amount'])) * 1.5
            
        # Filter depleted resources
        self.food = [f for f in self.food if f['amount'] > 5.0]
        
        # Replenish trees based on grass caps
        if random.random() < food_rate and len(self.food) < food_cap:
            self.spawn_food()

    def consume_food(self, x, y, max_eat, reach_dist):
        """Attempts to eat a tree's foliage near (x,y). Returns energy gained."""
        for f in self.food:
            dist = math.hypot(f['x'] - x, f['y'] - y)
            if dist < f['radius'] + reach_dist:
                eaten = min(f['amount'], max_eat)
                f['amount'] -= eaten
                f['radius'] = math.sqrt(max(1.0, f['amount'])) * 1.5
                return eaten
        return 0.0

    def consume_water(self, x, y, max_drink, reach_dist):
        """Attempts to drink water directly from any adjacent water tile."""
        tile_type = self.get_tile_type_at(x, y)
        # If organism is on or very close to a water tile, it drinks!
        if tile_type in ['WATER_SHALLOW', 'WATER_DEEP']:
            return max_drink
        
        # Check neighboring tiles within reach distance
        for dx in [-25, 25, 0]:
            for dy in [-25, 25, 0]:
                if self.get_tile_type_at(x + dx, y + dy) in ['WATER_SHALLOW', 'WATER_DEEP']:
                    return max_drink
        return 0.0

    def handle_obstacle_collision(self, agent):
        """Checks and handles agent collisions with impassable ROCK tiles."""
        col = int(max(0, min(self.width - 1, agent.x)) / self.tile_size)
        row = int(max(0, min(self.height - 1, agent.y)) / self.tile_size)

        # Check current tile type
        if self.terrain[col][row] == 'ROCK':
            # Find nearest passabe tile direction to bounce agent back
            # Try to push agent away from the rock center
            tile_center_x = (col + 0.5) * self.tile_size
            tile_center_y = (row + 0.5) * self.tile_size
            
            dx = agent.x - tile_center_x
            dy = agent.y - tile_center_y
            dist = math.hypot(dx, dy)
            
            push_x = dx / (dist if dist > 0.1 else 1.0)
            push_y = dy / (dist if dist > 0.1 else 1.0)
            
            # Reposition to tile edge
            agent.x = tile_center_x + push_x * (self.tile_size * 0.5 + 4)
            agent.y = tile_center_y + push_y * (self.tile_size * 0.5 + 4)
            
            # Reverse and damp velocity
            agent.vx = -agent.vx * 0.4 + push_x * 0.8
            agent.vy = -agent.vy * 0.4 + push_y * 0.8
            return True
        return False
