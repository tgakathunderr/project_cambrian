import random

class DNA:
    """
    Genetic traits of a Project Cambrian organism.
    """
    def __init__(self, speed=5.0, metabolism=1.0, vision_range=150.0, size=10.0):
        # Physical and physiological genes
        self.speed = speed                  # Max force/velocity multiplier
        self.metabolism = metabolism        # Base energy drain multiplier (0.5 to 2.0)
        self.vision_range = vision_range    # Sensory circle radius
        self.size = size                    # Physical radius (scales capacities)

    @staticmethod
    def create_random():
        """Creates a randomized DNA structure for the ancestor population."""
        return DNA(
            speed=random.uniform(3.0, 6.0),
            metabolism=random.uniform(0.8, 1.2),
            vision_range=random.uniform(100.0, 200.0),
            size=random.uniform(8.0, 15.0)
        )

    def crossover(self, partner_dna):
        """Uniform crossover of genes between two parents."""
        child_genes = {}
        for gene in ['speed', 'metabolism', 'vision_range', 'size']:
            if random.random() < 0.5:
                child_genes[gene] = getattr(self, gene)
            else:
                child_genes[gene] = getattr(partner_dna, gene)
        return DNA(**child_genes)

    def mutate(self, mutation_rate=0.1, mutation_step=0.1):
        """Mutates genes slightly based on a mutation rate."""
        mutated_genes = {}
        mutations_occurred = []
        
        for gene in ['speed', 'metabolism', 'vision_range', 'size']:
            val = getattr(self, gene)
            if random.random() < mutation_rate:
                change = random.uniform(-mutation_step, mutation_step)
                val = val * (1.0 + change)
                mutations_occurred.append(f"{gene}: {change*100:+.1f}%")
            
            # Constrain genes to realistic physical bounds
            if gene == 'speed': val = max(1.0, min(12.0, val))
            elif gene == 'metabolism': val = max(0.5, min(2.0, val))
            elif gene == 'vision_range': val = max(50.0, min(300.0, val))
            elif gene == 'size': val = max(5.0, min(25.0, val))
                
            mutated_genes[gene] = val
            
        return DNA(**mutated_genes), mutations_occurred


class GenealogyNode:
    """
    Node in the genealogy tree. Supports names for human readability.
    """
    def __init__(self, organism_id, name, parent1_id, parent1_name, parent2_id, parent2_name, generation, dna, mutations):
        self.id = organism_id
        self.name = name
        self.parent1_id = parent1_id
        self.parent1_name = parent1_name
        self.parent2_id = parent2_id
        self.parent2_name = parent2_name
        self.generation = generation
        self.traits = {
            'speed': dna.speed,
            'metabolism': dna.metabolism,
            'vision_range': dna.vision_range,
            'size': dna.size
        }
        self.mutations = mutations


class LineageTracker:
    """
    Global lineage history logger tracking names and structural relationships.
    """
    def __init__(self):
        self.history = {} # ID -> GenealogyNode

    def register_birth(self, organism_id, name, parent1_id, parent1_name, parent2_id, parent2_name, generation, dna, mutations):
        node = GenealogyNode(
            organism_id=organism_id,
            name=name,
            parent1_id=parent1_id,
            parent1_name=parent1_name,
            parent2_id=parent2_id,
            parent2_name=parent2_name,
            generation=generation,
            dna=dna,
            mutations=mutations
        )
        self.history[organism_id] = node

    def get_lineage(self, organism_id):
        """Traces ancestors of a specific organism."""
        ancestors = []
        queue = [organism_id]
        visited = set()
        
        while queue:
            curr = queue.pop(0)
            if curr in visited or curr not in self.history:
                continue
            visited.add(curr)
            node = self.history[curr]
            ancestors.append(node)
            if node.parent1_id: queue.append(node.parent1_id)
            if node.parent2_id: queue.append(node.parent2_id)
            
        return ancestors

    def serialize(self):
        """Serializes the entire family tree nodes for the frontend graph."""
        serialized = []
        for node in self.history.values():
            serialized.append({
                "id": node.id,
                "name": node.name,
                "parent1_id": node.parent1_id,
                "parent1_name": node.parent1_name,
                "parent2_id": node.parent2_id,
                "parent2_name": node.parent2_name,
                "generation": node.generation,
                "traits": node.traits,
                "mutations": node.mutations
            })
        return serialized
