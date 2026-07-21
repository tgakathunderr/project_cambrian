# Project Cambrian

> **A digital terrarium simulation.** Virtual organisms that eat, sleep, mate, evolve, and die — governed by an 8-organ neuro-architecture and genetic inheritance.

---

## What Is Project Cambrian?

Project Cambrian is a desktop evolutionary biology application. Organisms inhabit a simulated terrarium environment governed by real-time spatial physics, metabolic constraints, and environmental hazards.

Instead of pre-scripted behavior trees or external API calls, each organism runs a custom 8-organ brain model (powered by the BIB library) that evaluates sensory inputs and selects actions in real-time. Organisms balance internal state variables (energy, hydration, waste, fatigue, and fear) to survive, reproduce, and pass DNA to future generations.

As the **Director**, users can observe the ecosystem, select mind architectures, spawn resources, paint terrain, trigger environmental catastrophes, and view multi-generational lineage trees.

---

## Technical Architecture & Design

### 1. The 8-Organ Neuro-Architecture (BIB Engine)
Each organism runs a modular neural processing pipeline implemented in Python with Numba JIT acceleration:
* **Thalamus**: Encodes 528-dimensional sensory vectors into 2048-bit Sparse Distributed Representations (SDRs) using Winner-Take-All competition.
* **Neocortex**: Modal cortical layers processing vision, touch, proprioception, and interoception.
* **Association Cortex**: Combines cortical layer outputs into a unified world-state SDR.
* **Amygdala**: Evaluates threat salience and fear signals.
* **Hippocampus**: Formulates episodic memory representations and conducts memory consolidation during sleep.
* **Hypothalamus**: Calculates real-time homeostatic deficits (hunger, thirst, pain, energy).
* **Brainstem**: Modulates 5 neurochemical levels (Dopamine, Serotonin, Acetylcholine, Cortisol, Norepinephrine).
* **Basal Ganglia**: Selects motor actions using a Go/NoGo actor-critic model with eligibility traces.

### 2. Metabolic Mechanics & Physics
* **Sensory Inputs**: 60-degree vision cone detecting food, water, mates, predators, and boundary walls.
* **Metabolism**: Energy and hydration decay continuously based on body size, movement speed, and metabolic rate.
* **Action Execution**: Motor outputs (movement, rotation, feeding, drinking, mating, sleeping, idling).
* **Mortality**: Organisms die upon reaching zero energy, zero hydration, maximum age, or through predator encounters.

### 3. Mind Architectures (`Innate` vs `Raw`)
* **`Innate` Mode**: Initializes the Basal Ganglia actor weights with pre-calibrated priors, providing basic foraging, drinking, and survival tendencies upon spawning.
* **`Raw` Mode**: Initializes weights to zero, relying entirely on motor babbling and reinforcement feedback to develop action preferences.

### 4. Genetic Inheritance & Mutation
* **DNA Structure**: Encodes base physical and metabolic traits (speed, size, vision range, metabolism).
* **Reproduction**: Crossover of parental DNA combined with random mutation probabilities upon offspring creation.
* **Lineage Tracking**: Maintains ancestral graphs tracking family trees and individual life histories.

---

## Core Technical Differences

| Dimension | Standard Scripted / Wrapper AI | Project Cambrian Engine |
|---|---|---|
| **Architecture** | Large Language Model APIs or hardcoded state machines | Custom C/Python JIT spiking-inspired 8-organ brain |
| **Action Selection** | Static prompt completion or IF/ELSE trees | Basal Ganglia Go/NoGo actor-critic competition |
| **Internal State** | Stateless or text context windows | Real-time homeostatic drives & 5-chemical neuromodulation |
| **Learning Mechanism** | Offline pre-training on human text datasets | Online Hebbian plasticity, eligibility traces & genetic selection |
| **Execution Environment** | External cloud GPUs | Local CPU execution at 60 FPS |

---

## Key Features

| Feature | Description |
|---|---|
| 🧠 **8-Organ Neural Brain** | Complete neuro-architecture with live Dopamine, Serotonin, ACh, Cortisol, and NE telemetry |
| 🌱/⚡ **Mind Architecture Selector** | `Innate` (pre-calibrated priors) vs `Raw` (un-trained weights) |
| 🏆 **20-Tiered Trophies System** | Achievements across 4 tiers tracking civilizational, genetic, and survival milestones |
| 🚀 **Director's Orientation** | 30-second onboarding walkthrough guiding users through biosphere mechanics |
| 🧬 **Genetic Inheritance** | Multi-generational crossover & mutation across speed, size, vision, and metabolism |
| 📜 **Life Biography System** | Detailed life stories generated upon death tracking meals, offspring, and cause of death |
| 🌳 **Interactive Lineage Tree** | Full ancestral family tree of every specimen born in the simulation |
| ⚡ **Director Interventions** | Paint terrain, spawn specimens, and trigger global catastrophes (Drought, Famine) |

---

## License

Copyright (c) 2026 UnikAI Lab. All rights reserved. Proprietary software — see [LICENSE](LICENSE).

---

<div align="center">
  <sub>Designed & Developed by UnikAI Lab</sub>
</div>
