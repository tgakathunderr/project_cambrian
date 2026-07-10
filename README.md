# Project Cambrian

<div align="center">
  <img src="https://img.shields.io/badge/status-active-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/badge/python-3.10%2B-blue?style=flat-square&logo=python" />
  <img src="https://img.shields.io/badge/react-18-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/fastapi-0.110-009688?style=flat-square&logo=fastapi" />
  <img src="https://img.shields.io/badge/license-MIT-yellow?style=flat-square" />
</div>

<br/>

> **A living digital terrarium.** Watch real AI organisms evolve, compete, mate, and die — governed by a genuine neural architecture (BIB) and true genetic inheritance.

---

## What Is This?

Project Cambrian is a **real-time evolutionary biology simulator** built as a desktop application. It is not a toy — every organism runs a full neural brain (the [BIB](../bib) framework), metabolises energy, seeks mates, fears predators, and dies of genuine causes. Their children inherit and mutate genetic traits across generations.

You are the **Director** — you can name creatures, spawn resources, trigger environmental catastrophes, and read post-mortem biographies of every specimen that ever lived.

---

## Features

| Feature | Description |
|---|---|
| 🧠 **Real Neural Brains** | Every organism runs BIB — a biologically-plausible spiking-inspired architecture with dopamine, serotonin, cortisol, and acetylcholine |
| 🧬 **Genetic Inheritance** | DNA crossover + mutation across unlimited generations. Traits: speed, size, vision, metabolism |
| 🌍 **Living World** | Food spores, water pools, seasons, environmental catastrophes (Drought, Famine) |
| 📜 **Biography System** | Every death generates a life story with real events — first meal, offspring names, survived catastrophes, cause of death |
| 🌳 **Lineage Tree** | Interactive ancestral tree of every creature ever born, with clickable biography nodes |
| ⚡ **God Mode** | Name and place organisms, drop food/water, trigger catastrophes, zap specimens |
| 🔬 **Brain Chemistry Dials** | Live fluid cylinders for dopamine, serotonin, acetylcholine, cortisol with numeric readouts |
| 🗓️ **Discovery Log** | Timestamped event feed — click any death entry to open the full biography |
| 🎨 **World-Class UI** | Glass panels, WebGL ambient shader, 60fps breathing organisms, drive-colored motion trails |

---

## Tech Stack

```
project_cambrian/
├── backend/               # Python — FastAPI simulation server
│   ├── main.py            # HTTP + WebSocket API (30Hz state stream)
│   ├── organism.py        # BIB-brained organism with full biography tracking
│   ├── predator.py        # Predator with hunting reinforcement learning
│   ├── world.py           # Resources, seasons, catastrophe engine
│   └── genetics.py        # DNA, crossover, mutation, lineage tracker
└── frontend/              # React + Vite + Tailwind v4
    └── src/
        ├── App.tsx                  # Main layout, all modal state, WebSocket
        ├── components/
        │   ├── BiosphereCanvas.tsx  # HTML5 Canvas — 60fps RAF render loop
        │   ├── GlassBrainSidebar.tsx
        │   ├── LineageTree.tsx
        │   ├── DiscoveryLog.tsx
        │   ├── AmbientShader.tsx    # WebGL fluid background
        │   ├── BiographyCard.tsx    # Life story modal
        │   ├── SpawnNameModal.tsx
        │   └── ZapConfirmModal.tsx
        └── index.css                # Design system tokens + animations
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- The [BIB](../bib) neural framework installed as an editable package

### 1 — Install the BIB brain

```bash
pip install -e path/to/bib
```

### 2 — Install backend dependencies

```bash
cd project_cambrian
pip install fastapi uvicorn numpy
```

### 3 — Install frontend dependencies

```bash
cd frontend
npm install
```

### 4 — Run (development)

Open two terminals:

```bash
# Terminal 1 — Backend
cd project_cambrian
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000

# Terminal 2 — Frontend
cd project_cambrian/frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## How to Use

### Biosphere View
- **Click** any glowing organism to open its brain chemistry panel on the right
- **Scroll** to zoom, **drag** to pan the simulation world
- Use **God Mode** toolbar (top of canvas) to place organisms, food, water, or obstacles
- When placing an organism, you'll be prompted to name it

### God Mode Tools
| Tool | Effect |
|---|---|
| Organism | Spawns a new named creature at click position |
| Food | Drops a food cluster (sage green glow) |
| Water | Drops a water pool (lavender ripples) |
| Obstacle | Places a solid rock |

### Discovery Log
- Watch events scroll in real time
- **Click any DEATH entry** to open the organism's full biography

### Lineage Tree
- Click the **Lineage** tab to see the full ancestral tree
- **Click any node** → quick panel → **"View Full Biography"** button

### System Tab
- Adjust simulation speed (0.1× to 10×)
- Change mutation rate live
- Trigger / lift global catastrophes

---

## Configuration

All simulation tuning is done via the **System tab** in the UI or directly in `backend/main.py`:

```python
PREDATOR_ENABLED = False  # Set True to enable wolf predators at Gen 6+
```

---

## Architecture Notes

- **WebSocket at 30Hz** streams full world state: organisms, resources, selected telemetry
- **Biography data** is stored in-memory in `biographies{}` dict — survives the session, not persisted to disk
- **Simulation loop** runs in a background `threading.Thread` — the FastAPI event loop stays non-blocking
- **Canvas** uses `requestAnimationFrame` — entirely decoupled from React's render cycle for 60fps

---

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">
  <sub>Built with BIB · FastAPI · React · Vite · Tailwind</sub>
</div>
