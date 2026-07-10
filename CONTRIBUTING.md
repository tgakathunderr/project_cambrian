## Cambrian — Dev Notes

### Running locally
```bash
# 1. Install BIB (neural framework dependency)
pip install -e ../bib

# 2. Install backend deps
pip install -r backend/requirements.txt

# 3. Install frontend deps
cd frontend && npm install && cd ..

# 4. Start backend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000

# 5. Start frontend (new terminal)
cd frontend && npm run dev
```

Open http://localhost:5173

---

### Simulation tuning cheatsheet

| Variable | Location | Default | Effect |
|---|---|---|---|
| `PREDATOR_ENABLED` | `main.py` | `False` | Enable wolves at Gen 6+ |
| `mutation_rate` | `main.py` | `0.15` | Base genome mutation probability |
| `world = World(width, height)` | `main.py` | `1000×800` | Simulation grid size |
| Organism seed count | `main.py` line ~130 | `8` | Starting ancestor population |
| `max_age` | `organism.py` | `103680000` | 80 years at 1296000 ticks/year |

### Adding a new sensory modality
1. Extend `_build_sensors()` in `organism.py` — add a named numpy array
2. BIB automatically sizes its input layer to the total sensor dimension
3. No model changes needed — BIB is adaptive

### Adding a new God Mode tool
1. Add entry to `GOD_TOOLS` array in `App.tsx`
2. Handle the new type in `/api/spawn` endpoint in `main.py`

### WebSocket payload shape
```json
{
  "ticks": 0,
  "years": 0.0,
  "season": "SPRING",
  "catastrophe": null,
  "max_generation": 1,
  "phase": 1,
  "food": [{"x": 100, "y": 200, "amount": 60, "radius": 12}],
  "water": [],
  "obstacles": [],
  "organisms": [{"id": "...", "name": "Zephyr", "x": 500, ...}],
  "predators": [],
  "selected": null
}
```
