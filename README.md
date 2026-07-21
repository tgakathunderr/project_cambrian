# Project Cambrian

<div align="center">
  <img src="https://img.shields.io/badge/status-production--ready-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square" />
  <img src="https://img.shields.io/badge/electron-31-47848F?style=flat-square&logo=electron" />
  <img src="https://img.shields.io/badge/python-3.10%2B-blue?style=flat-square&logo=python" />
  <img src="https://img.shields.io/badge/react-18-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/license-Proprietary-red?style=flat-square" />
</div>

<br/>

> **A living digital terrarium.** Watch virtual organisms evolve, compete, mate, and die — governed by a genuine neural brain architecture and true genetic inheritance.

---

## What Is Project Cambrian?

Project Cambrian is a cross-platform evolutionary biology desktop application (Windows, macOS, Linux). Every organism runs an 8-organ neural brain, metabolizes energy, seeks mates, fears predators, and dies of natural causes. Their children inherit and mutate genetic traits across generations.

As the **Director**, you can name specimens, choose mind architectures, spawn resources, paint terrain, trigger environmental catastrophes, and track multi-generational lineage trees.

---

## Features

| Feature | Description |
|---|---|
| 🧠 **Real Neural Brains** | Powered by an 8-organ spiking-inspired architecture with Dopamine, Serotonin, Cortisol, Acetylcholine, and Norepinephrine |
| 🌱/⚡ **Mind Architecture Selector** | Choose `Innate` mode (pre-calibrated biological instinct priors) or `Raw` mode (tabula rasa learning from scratch) |
| 🏆 **20-Tiered Trophies System** | Complete 20 achievements across 4 tiers (Tier 1 Basic → Tier 4 Theoretical Miracles) with persistent progress tracking |
| 🚀 **Director's Orientation** | Interactive 30-second onboarding walkthrough guiding users through the biosphere, telemetry, metabolism, and lineage |
| 🧬 **Genetic Inheritance** | DNA crossover + mutation across unlimited generations. Mutatable traits: speed, size, vision range, metabolism |
| 🌍 **Living World Engine** | Spores, water pools, terrain painting, seasons, and director catastrophes (Drought, Famine) |
| 📜 **Life Biography System** | Every death generates an empirical life story — first meal, offspring names, survived catastrophes, cause of death |
| 🌳 **Interactive Lineage Tree** | Ancestral family tree of every creature born with clickable biography nodes |
| ⚡ **God Mode Controls** | Name & place specimens, drop food/water, paint terrain, trigger catastrophes, and zap specimens |
| 🔬 **Brain Chemistry Telemetry** | Live fluid cylinders for DA, 5-HT, ACh, and Cortisol with real-time numeric readouts |
| 🎨 **Obsidian Terrarium UI** | Ambient WebGL fluid shader reacting to stress/reward, 60fps breathing organisms, and directional motion trails |

---

## Tech Stack

```
project_cambrian/
├── backend/               # Python — FastAPI simulation server
│   ├── main.py            # HTTP + WebSocket API (30Hz state stream)
│   ├── organism.py        # Brain-driven organism with Innate/Raw mind modes
│   ├── predator.py        # Predator with hunting reinforcement learning
│   ├── world.py           # Resources, seasons, catastrophe engine
│   └── genetics.py        # DNA, crossover, mutation, lineage tracker
├── frontend/              # React + Vite + Tailwind v4
│   └── src/
│       ├── App.tsx                  # Main layout, achievement tracking, state
│       ├── components/
│       │   ├── BiosphereCanvas.tsx  # HTML5 Canvas — 60fps RAF render loop
│       │   ├── GlassBrainSidebar.tsx# Live fluid chemistry cylinders
│       │   ├── AchievementsModal.tsx# 20-achievement trophy showcase
│       │   ├── AchievementToast.tsx# Bottom-right unlock notification
│       │   ├── WalkthroughOverlay.tsx# 4-step glassmorphism onboarding
│       │   ├── LineageTree.tsx      # Multi-generational ancestral tree
│       │   ├── DiscoveryLog.tsx     # Timestamped event feed
│       │   ├── AmbientShader.tsx    # WebGL fluid background
│       │   ├── BiographyCard.tsx    # Empirical life story modal
│       │   └── SpawnNameModal.tsx   # Name & Mind Mode selector
│       └── index.css                # Design system tokens + animations
├── cambrian_backend.spec  # PyInstaller frozen backend configuration
├── main.js                # Electron shell & silent backend process spawner
└── package.json           # Packaging & build dependencies
```

---

## Installation & Setup

### Desktop App Installers

Download the standalone package for your operating system from Releases:

- **Windows**: `Cambrian Setup 1.0.0.exe`
- **macOS**: `Cambrian-1.0.0.dmg`
- **Linux**: `Cambrian-1.0.0.AppImage` / `.deb`

The desktop app automatically handles starting the backend process silently on port 8000.

### Building From Source

#### Prerequisites
- Python 3.10+
- Node.js 18+

```bash
# 1. Install backend dependencies
cd project_cambrian
pip install fastapi uvicorn numpy numba pyinstaller

# 2. Install frontend dependencies
cd frontend
npm install

# 3. Build production static bundle & frozen backend
npm run build              # Inside frontend directory
pyinstaller cambrian_backend.spec --noconfirm

# 4. Package desktop installer
cd ..
npm run dist
```

---

## License

Copyright (c) 2026 UnikAI Lab. All rights reserved. Proprietary software — see [LICENSE](LICENSE).

---

<div align="center">
  <sub>Designed & Developed by UnikAI Lab</sub>
</div>
