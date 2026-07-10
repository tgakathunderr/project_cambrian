import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AmbientShader } from './components/AmbientShader';
import { BiosphereCanvas } from './components/BiosphereCanvas';
import { GlassBrainSidebar } from './components/GlassBrainSidebar';
import { LineageTree } from './components/LineageTree';
import { DiscoveryLog } from './components/DiscoveryLog';
import { BiographyCard } from './components/BiographyCard';
import { SpawnNameModal } from './components/SpawnNameModal';
import { ZapConfirmModal } from './components/ZapConfirmModal';

// ─── Type Definitions ─────────────────────────────────────────────────
interface OrganismData {
  id: string; name: string; x: number; y: number; angle: number;
  energy: number; max_energy: number; hydration: number; max_hydration: number;
  age: number; generation: number; size: number; speed: number; sex: string;
  dopamine: number; serotonin: number; acetylcholine: number; cortisol: number;
  dominant_drive: number; lifecycle: string;
}

interface PredatorData {
  id: string; name: string; x: number; y: number; angle: number;
  energy: number; max_energy: number; size: number;
}

interface ResourceData { x: number; y: number; amount: number; radius: number; }
interface ObstacleData { x: number; y: number; radius: number; }

interface LogEntry {
  timestamp: number; years: number; category: string; message: string; organism_id?: string;
}

interface SelectedTelemetry {
  id: string; name: string; age: number; generation: number; sex: string; lifecycle: string;
  energy: number; max_energy: number; hydration: number; max_hydration: number;
  dopamine: number; serotonin: number; acetylcholine: number; cortisol: number;
  dominant_drive: number; last_action: number;
  parent1_name?: string; parent2_name?: string; offspring_count: number;
  speed_trait: number; vision_trait: number; size_trait: number; metabolism_trait: number;
}

interface StatePayload {
  ticks: number; years: number; season: string; catastrophe: string | null;
  max_generation: number; phase: number;
  food: ResourceData[]; water: ResourceData[]; obstacles: ObstacleData[];
  organisms: OrganismData[]; predators: PredatorData[];
  selected: SelectedTelemetry | null;
  terrain?: string[][];
}

// ─── Static lookup maps ────────────────────────────────────────────────
const SEASON_ICONS: Record<string, string> = {
  SPRING: '🌱', SUMMER: '☀️', AUTUMN: '🍂', WINTER: '❄️'
};

const CATASTROPHE_BANNERS: Record<string, { label: string; icon: string; color: string }> = {
  DROUGHT: { label: 'Global Drought', icon: 'local_fire_department', color: 'text-amber-400 border-amber-400/25 bg-amber-400/8' },
  FAMINE:  { label: 'Famine Event',   icon: 'crisis_alert',           color: 'text-[#ffb4ab] border-[#ffb4ab]/25 bg-[#ffb4ab]/8' },
};

const PHASE_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Genesis', color: 'text-[#8da89b]' },
  2: { label: 'Adaptation', color: 'text-[#c0c6de]' },
  3: { label: 'Competition', color: 'text-[#ffb4ab]' },
};

const GOD_TOOLS: { type: string; icon: string; label: string; color: string; category: 'SPAWN' | 'TERRAIN' }[] = [
  { type: 'PREY',              icon: 'add_circle',  label: 'Organism', color: '#dec2a0', category: 'SPAWN' },
  { type: 'WOLF',              icon: 'pets',        label: 'Wolf',     color: '#ffb4ab', category: 'SPAWN' },
  { type: 'FOOD',              icon: 'park',        label: 'Tree',     color: '#8da89b', category: 'SPAWN' },
  { type: 'PAINT_GRASS',       icon: 'forest',      label: 'Grass',    color: '#8da89b', category: 'TERRAIN' },
  { type: 'PAINT_SAND',        icon: 'waves',       label: 'Sand',     color: '#dec2a0', category: 'TERRAIN' },
  { type: 'PAINT_WATER_SHALLOW', icon: 'water',       label: 'Shallow',  color: '#93c5fd', category: 'TERRAIN' },
  { type: 'PAINT_WATER_DEEP',  icon: 'sailing',     label: 'Deep Sea', color: '#60a5fa', category: 'TERRAIN' },
  { type: 'PAINT_ROCK',        icon: 'terrain',     label: 'Rock',     color: '#ffffff', category: 'TERRAIN' },
];

// ─── Main App ─────────────────────────────────────────────────────────
export const App: React.FC = () => {
  // Navigation
  const [currentTab, setCurrentTab] = useState<'BIOSPHERE' | 'LINEAGE' | 'SYSTEM'>('BIOSPHERE');

  // Simulation state
  const [years, setYears] = useState(0.0);
  const [season, setSeason] = useState('SPRING');
  const [catastrophe, setCatastrophe] = useState<string | null>(null);
  const [maxGeneration, setMaxGeneration] = useState(1);
  const [phase, setPhase] = useState(1);
  const [organisms, setOrganisms] = useState<OrganismData[]>([]);
  const [predators, setPredators] = useState<PredatorData[]>([]);
  const [food, setFood] = useState<ResourceData[]>([]);
  const [water, setWater] = useState<ResourceData[]>([]);
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const [terrain, setTerrain] = useState<string[][]>([]);
  const [selectedTelemetry, setSelectedTelemetry] = useState<SelectedTelemetry | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Settings
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [isRunning, setIsRunning] = useState(true);
  const [simMutationRate, setSimMutationRate] = useState(0.15);

  // God Mode
  const [activeGodModeType, setActiveGodModeType] = useState<string | null>(null);
  const [showSandbox, setShowSandbox] = useState(true);

  // Discovery Log
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Modals
  const [biographyOrgId, setBiographyOrgId] = useState<string | null>(null);
  const [spawnPending, setSpawnPending] = useState<{ x: number; y: number } | null>(null);
  const [zapPending, setZapPending] = useState<{ id: string; name: string } | null>(null);

  // WebSocket
  const wsRef = useRef<WebSocket | null>(null);

  // ── WebSocket Connection ──────────────────────────────────────────
  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket('ws://127.0.0.1:8000/api/ws/state');
      wsRef.current = ws;

      ws.onopen = () => setIsConnected(true);

      ws.onmessage = (event) => {
        const payload: StatePayload = JSON.parse(event.data);
        setYears(payload.years);
        setSeason(payload.season);
        setCatastrophe(payload.catastrophe);
        setMaxGeneration(payload.max_generation);
        setPhase(payload.phase);
        setOrganisms(payload.organisms);
        setPredators(payload.predators);
        setFood(payload.food);
        setWater(payload.water);
        setObstacles(payload.obstacles);
        setTerrain(payload.terrain || []);
        setSelectedTelemetry(payload.selected);
        if (!payload.selected) setSelectedId(null);
      };

      ws.onerror = () => setIsConnected(false);
      ws.onclose = () => {
        setIsConnected(false);
        setTimeout(connect, 2500);
      };
    };
    connect();
    return () => wsRef.current?.close();
  }, []);

  // ── Log polling ───────────────────────────────────────────────────
  useEffect(() => {
    const poll = () => {
      fetch('http://127.0.0.1:8000/api/logs')
        .then(r => r.json())
        .then(data => setLogs(data))
        .catch(() => {});
    };
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

  // ── Callbacks ─────────────────────────────────────────────────────
  const handleSelectOrganism = useCallback((id: string | null) => {
    setSelectedId(id);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: id ? 'select' : 'deselect', id }));
    }
  }, []);

  const handleRename = useCallback((id: string, name: string) => {
    fetch('http://127.0.0.1:8000/api/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name })
    }).catch(() => {});
  }, []);

  const handleZapRequest = useCallback((id: string) => {
    const org = organisms.find(o => o.id === id);
    setZapPending({ id, name: org?.name || 'Unknown' });
  }, [organisms]);

  const handleZapConfirm = useCallback(() => {
    if (!zapPending) return;
    fetch('http://127.0.0.1:8000/api/zap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: zapPending.id, name: '' })
    }).catch(() => {});
    setZapPending(null);
    setSelectedId(null);
  }, [zapPending]);

  const handleSpawnElement = useCallback((x: number, y: number, type: string, name?: string, sex?: string, ageYears?: number) => {
    fetch('http://127.0.0.1:8000/api/spawn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x, y, type, name: name || null, sex: sex || null, age_years: ageYears || null })
    }).catch(() => {});
  }, []);

  const handlePaintTerrain = useCallback((x: number, y: number, type: string) => {
    fetch('http://127.0.0.1:8000/api/terrain/paint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x, y, radius: 45.0, type })
    }).catch(() => {});
  }, []);

  const handleNeedNameForSpawn = useCallback((x: number, y: number) => {
    setSpawnPending({ x, y });
  }, []);

  const handleSpawnNameConfirm = useCallback((name: string, sex: 'MALE' | 'FEMALE', ageYears: number) => {
    if (!spawnPending) return;
    handleSpawnElement(spawnPending.x, spawnPending.y, 'PREY', name, sex, ageYears);
    setSpawnPending(null);
  }, [spawnPending, handleSpawnElement]);

  const handleCatastrophe = useCallback((type: string) => {
    fetch('http://127.0.0.1:8000/api/catastrophe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    }).catch(() => {});
  }, []);

  const handleSettings = useCallback((speed: number, running: boolean, mutation: number) => {
    fetch('http://127.0.0.1:8000/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed, running, mutation_rate: mutation })
    }).catch(() => {});
  }, []);



  const cortisol = selectedTelemetry?.cortisol || 0.0;
  const dopamine = selectedTelemetry?.dopamine || 0.0;
  const phaseInfo = PHASE_LABELS[phase] || PHASE_LABELS[1];
  const livingCount = organisms.length;

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col" style={{ background: '#00170f' }}>
      {/* Ambient WebGL Shader */}
      <AmbientShader cortisol={cortisol} dopamine={dopamine} />

      {/* ── TOP HEADER ─────────────────────────────────────────────── */}
      <header className="relative z-30 flex items-center justify-between px-5 py-0 shrink-0" style={{ height: '52px' }}>
        {/* Left — wordmark */}
        <div className="flex items-center gap-3">
          <h1 className="font-headline text-[18px] font-bold tracking-tight" style={{ color: '#dec2a0' }}>
            Cambrian
          </h1>
          <span className="hidden sm:block text-[10px] font-body text-white/20 uppercase tracking-[0.2em] mt-0.5">
            Biosphere Simulator
          </span>
        </div>

        {/* Center — stats capsule */}
        <div className="flex items-center gap-px glass-panel rounded-full px-1 py-1 border border-white/6">
          {[
            { icon: 'group', value: `${livingCount}`, label: 'alive' },
            { icon: 'timeline', value: `Gen ${maxGeneration}`, label: '' },
            { icon: 'schedule', value: `${years.toFixed(1)}yr`, label: '' },
            { icon: SEASON_ICONS[season] || '🌱', value: season.charAt(0) + season.slice(1).toLowerCase(), label: '', emoji: true },
          ].map(({ icon, value, label, emoji }) => (
            <div key={value} className="flex items-center gap-1.5 px-3 py-1">
              {emoji ? (
                <span className="text-sm">{icon}</span>
              ) : (
                <span className="material-symbols-outlined text-sm text-white/30">{icon}</span>
              )}
              <span className="font-headline text-[11px] text-white/60">
                {value}{label ? <span className="text-white/25 ml-0.5">{label}</span> : ''}
              </span>
            </div>
          ))}

          {/* Phase badge */}
          <div className={`px-3 py-1 rounded-full text-[10px] font-headline font-bold uppercase tracking-wider ${phaseInfo.color}`}>
            {phaseInfo.label}
          </div>
        </div>

        {/* Right — connection + nav tabs */}
        <div className="flex items-center gap-3">
          {/* Connection indicator */}
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#8da89b] animate-pulse' : 'bg-[#ffb4ab]'}`} />

          {/* Tab nav */}
          <nav className="flex glass-panel rounded-xl p-0.5 gap-0.5 border border-white/6">
            {(['BIOSPHERE', 'LINEAGE', 'SYSTEM'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-headline font-bold uppercase tracking-[0.1em] transition-all ${
                  currentTab === tab
                    ? 'nav-tab-active'
                    : 'text-white/30 hover:text-white/55'
                }`}
              >
                {tab === 'BIOSPHERE' ? 'Biosphere' : tab === 'LINEAGE' ? 'Lineage' : 'System'}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Catastrophe Banner ──────────────────────────────────────── */}
      {catastrophe && CATASTROPHE_BANNERS[catastrophe] && (
        <div className={`relative z-30 mx-4 mb-0 flex items-center justify-between px-4 py-2 rounded-xl border text-[11px] font-headline font-bold uppercase tracking-wider animate-slide-in-up ${CATASTROPHE_BANNERS[catastrophe].color}`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">{CATASTROPHE_BANNERS[catastrophe].icon}</span>
            {CATASTROPHE_BANNERS[catastrophe].label} — ecosystem under stress
          </div>
          <button
            onClick={() => handleCatastrophe('NONE')}
            className="opacity-50 hover:opacity-100 transition-opacity text-[9px] uppercase tracking-wider font-body"
          >
            Lift
          </button>
        </div>
      )}

      {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
      <main className="relative z-20 flex-1 flex overflow-hidden p-3 gap-3 min-h-0">

        {/* ─── BIOSPHERE TAB ─────────────────────────────── */}
        {currentTab === 'BIOSPHERE' && (
          <>
            {/* Canvas area + log stacked */}
            <div className="flex-1 flex flex-col gap-3 min-w-0 min-h-0">
              {/* Canvas */}
              <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/5 min-h-0">
                <BiosphereCanvas
                  organisms={organisms}
                  predators={predators}
                  food={food}
                  water={water}
                  obstacles={obstacles}
                  selectedId={selectedId}
                  onSelectOrganism={handleSelectOrganism}
                  activeGodModeType={activeGodModeType}
                  onSpawnElement={handleSpawnElement}
                  onNeedNameForSpawn={handleNeedNameForSpawn}
                  terrain={terrain}
                  onPaintTerrain={handlePaintTerrain}
                />

                {/* Worldbox-style God Mode Toolbar (floating at top of canvas) */}
                {showSandbox ? (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 glass-overlay rounded-2xl p-3 border border-white/8 max-w-[90%]">
                    {/* Category labels and controls */}
                    <div className="flex items-center gap-3 w-full justify-between pb-1.5 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-body text-white/25 uppercase tracking-[0.2em] font-bold">
                          Director Sandbox
                        </span>
                        <button
                          onClick={() => { setShowSandbox(false); setActiveGodModeType(null); }}
                          className="text-white/20 hover:text-white/60 p-0.5 rounded transition-colors flex items-center justify-center"
                          title="Hide Sandbox Panel"
                        >
                          <span className="material-symbols-outlined text-[10px]">visibility_off</span>
                        </button>
                      </div>
                      {activeGodModeType && (
                        <button
                          onClick={() => setActiveGodModeType(null)}
                          className="text-[8px] font-headline text-[#ffb4ab] border border-[#ffb4ab]/20 hover:bg-[#ffb4ab]/10 px-2 py-0.5 rounded-lg transition-colors uppercase tracking-wider font-bold"
                        >
                          Deselect Tool
                        </button>
                      )}
                    </div>

                    {/* Tools grid */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Spawns category */}
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-headline text-white/20 uppercase tracking-widest mr-1">Spawns:</span>
                        {GOD_TOOLS.filter(t => t.category === 'SPAWN').map(tool => (
                          <button
                            key={tool.type}
                            onClick={() => setActiveGodModeType(prev => prev === tool.type ? null : tool.type)}
                            title={`Spawn ${tool.label}`}
                            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[9px] font-headline font-semibold transition-all ${
                              activeGodModeType === tool.type ? 'ring-1 ring-white/20' : 'hover:bg-white/5'
                            }`}
                            style={activeGodModeType === tool.type ? {
                              background: tool.color + '15',
                              color: tool.color,
                              boxShadow: `0 0 8px ${tool.color}15`
                            } : { color: 'rgba(255,255,255,0.3)' }}
                          >
                            <span className="material-symbols-outlined text-xs">{tool.icon}</span>
                            {tool.label}
                          </button>
                        ))}
                      </div>

                      {/* Divider */}
                      <div className="h-4 w-px bg-white/10" />

                      {/* Terrain category */}
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-headline text-white/20 uppercase tracking-widest mr-1">Terrain:</span>
                        {GOD_TOOLS.filter(t => t.category === 'TERRAIN').map(tool => (
                          <button
                            key={tool.type}
                            onClick={() => setActiveGodModeType(prev => prev === tool.type ? null : tool.type)}
                            title={`Paint ${tool.label}`}
                            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[9px] font-headline font-semibold transition-all ${
                              activeGodModeType === tool.type ? 'ring-1 ring-white/20' : 'hover:bg-white/5'
                            }`}
                            style={activeGodModeType === tool.type ? {
                              background: tool.color + '15',
                              color: tool.color,
                              boxShadow: `0 0 8px ${tool.color}15`
                            } : { color: 'rgba(255,255,255,0.3)' }}
                          >
                            <span className="material-symbols-outlined text-xs">{tool.icon}</span>
                            {tool.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSandbox(true)}
                    className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl glass-overlay border border-white/8 hover:border-white/15 text-[#dec2a0]/85 hover:text-[#dec2a0] transition-all text-[9px] font-headline font-bold uppercase tracking-wider shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
                  >
                    <span className="material-symbols-outlined text-xs">construction</span>
                    Show Director Sandbox
                  </button>
                )}
              </div>

              {/* Discovery Log */}
              <DiscoveryLog logs={logs} onDeathClick={(id) => setBiographyOrgId(id)} />
            </div>

            {/* Right sidebar — Glass Brain */}
            <div className="glass-panel rounded-2xl border border-white/5 shrink-0 overflow-hidden" style={{ width: '280px' }}>
              <GlassBrainSidebar
                selected={selectedTelemetry}
                onRename={handleRename}
                onZap={handleZapRequest}
                onBiography={(id) => setBiographyOrgId(id)}
              />
            </div>
          </>
        )}

        {/* ─── LINEAGE TAB ───────────────────────────────── */}
        {currentTab === 'LINEAGE' && (
          <div className="flex-1 glass-panel rounded-2xl border border-white/5 overflow-hidden">
            <LineageTree onNodeClick={(id) => setBiographyOrgId(id)} />
          </div>
        )}

        {/* ─── SYSTEM TAB ────────────────────────────────── */}
        {currentTab === 'SYSTEM' && (
          <div className="flex-1 overflow-y-auto">
            <SystemPanel
              simSpeed={simSpeed}
              isRunning={isRunning}
              simMutationRate={simMutationRate}
              organisms={organisms}
              maxGeneration={maxGeneration}
              phase={phase}
              catastrophe={catastrophe}
              onSpeedChange={(v) => { setSimSpeed(v); handleSettings(v, isRunning, simMutationRate); }}
              onRunningToggle={() => { const r = !isRunning; setIsRunning(r); handleSettings(simSpeed, r, simMutationRate); }}
              onMutationChange={(v) => { setSimMutationRate(v); handleSettings(simSpeed, isRunning, v); }}
              onCatastrophe={handleCatastrophe}
            />
          </div>
        )}
      </main>

      {/* ── MODALS ─────────────────────────────────────────────────── */}
      {biographyOrgId && (
        <BiographyCard
          organismId={biographyOrgId}
          onClose={() => setBiographyOrgId(null)}
        />
      )}

      {spawnPending && (
        <SpawnNameModal
          position={spawnPending}
          onConfirm={handleSpawnNameConfirm}
          onCancel={() => setSpawnPending(null)}
        />
      )}

      {zapPending && (
        <ZapConfirmModal
          name={zapPending.name}
          onConfirm={handleZapConfirm}
          onCancel={() => setZapPending(null)}
        />
      )}
    </div>
  );
};

// ─── System Panel ─────────────────────────────────────────────────────
interface SystemPanelProps {
  simSpeed: number; isRunning: boolean; simMutationRate: number;
  organisms: OrganismData[]; maxGeneration: number;
  phase: number; catastrophe: string | null;
  onSpeedChange: (v: number) => void;
  onRunningToggle: () => void;
  onMutationChange: (v: number) => void;
  onCatastrophe: (type: string) => void;
}

const SystemPanel: React.FC<SystemPanelProps> = ({
  simSpeed, isRunning, simMutationRate,
  organisms, maxGeneration, phase, catastrophe,
  onSpeedChange, onRunningToggle, onMutationChange, onCatastrophe
}) => {
  const livingCount = organisms.length;
  const malePct = livingCount > 0 ? Math.round(organisms.filter(o => o.sex === 'MALE').length / livingCount * 100) : 50;
  const avgSpeed = livingCount > 0 ? (organisms.reduce((s, o) => s + o.speed, 0) / livingCount).toFixed(1) : '—';
  const avgGen = livingCount > 0 ? (organisms.reduce((s, o) => s + o.generation, 0) / livingCount).toFixed(1) : '—';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
      {/* Simulation Controls */}
      <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-5">
        <h2 className="font-headline text-sm font-bold text-[#dec2a0] uppercase tracking-[0.12em]">
          Simulation Controls
        </h2>

        {/* Play/Pause */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-[11px] text-white/40 uppercase tracking-wider mb-0.5">Simulation</p>
            <p className="font-headline text-sm font-semibold text-white/70">{isRunning ? 'Running' : 'Paused'}</p>
          </div>
          <button
            onClick={onRunningToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-headline text-sm font-semibold transition-all ${
              isRunning
                ? 'bg-[#ffb4ab]/12 text-[#ffb4ab] hover:bg-[#ffb4ab]/20'
                : 'bg-[#8da89b]/12 text-[#8da89b] hover:bg-[#8da89b]/20'
            }`}
          >
            <span className="material-symbols-outlined text-base">{isRunning ? 'pause' : 'play_arrow'}</span>
            {isRunning ? 'Pause' : 'Resume'}
          </button>
        </div>

        {/* Time Scale */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="font-body text-[11px] text-white/40 uppercase tracking-wider">Time Scale</label>
            <span className="font-headline text-sm font-bold text-[#dec2a0]">{simSpeed.toFixed(1)}×</span>
          </div>
          <input
            type="range" min={0.1} max={10} step={0.1} value={simSpeed}
            onChange={e => onSpeedChange(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[9px] text-white/20 font-body mt-1">
            <span>0.1×</span><span>5×</span><span>10×</span>
          </div>
        </div>

        {/* Mutation Rate */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="font-body text-[11px] text-white/40 uppercase tracking-wider">Mutation Rate</label>
            <span className="font-headline text-sm font-bold text-[#c0c6de]">{Math.round(simMutationRate * 100)}%</span>
          </div>
          <input
            type="range" min={0} max={1} step={0.01} value={simMutationRate}
            onChange={e => onMutationChange(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[9px] text-white/20 font-body mt-1">
            <span>0% stable</span><span>50%</span><span>100% chaos</span>
          </div>
        </div>
      </div>

      {/* Population Stats */}
      <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
        <h2 className="font-headline text-sm font-bold text-[#dec2a0] uppercase tracking-[0.12em]">
          Population Analytics
        </h2>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Living', value: `${livingCount}`, sub: 'organisms' },
            { label: 'Generation', value: `${maxGeneration}`, sub: 'max achieved' },
            { label: 'Avg Gen', value: avgGen, sub: 'population mean' },
            { label: 'Avg Speed', value: avgSpeed, sub: 'DNA trait' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-white/3 border border-white/5 rounded-xl p-3">
              <span className="text-[9px] text-white/25 font-body uppercase tracking-wider block">{label}</span>
              <span className="font-headline text-xl font-bold text-white/70 leading-tight block">{value}</span>
              <span className="text-[9px] text-white/20 font-body">{sub}</span>
            </div>
          ))}
        </div>

        {/* Sex ratio */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] text-white/30 font-body uppercase tracking-wider">Sex Ratio</span>
            <span className="text-[10px] font-headline text-white/40">♂ {malePct}% / ♀ {100 - malePct}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/6 rounded-full overflow-hidden flex">
            <div className="h-full bg-[#93c5fd]/50 transition-all" style={{ width: `${malePct}%` }} />
            <div className="h-full bg-[#f9a8d4]/50 transition-all" style={{ width: `${100 - malePct}%` }} />
          </div>
        </div>

        {/* Epoch */}
        <div className="bg-white/3 border border-white/5 rounded-xl p-3">
          <span className="text-[9px] text-white/25 font-body uppercase tracking-wider block mb-1">
            Epoch / Phase
          </span>
          <span className={`font-headline text-sm font-semibold ${PHASE_LABELS[phase]?.color || 'text-white/50'}`}>
            Phase {phase} — {PHASE_LABELS[phase]?.label}
          </span>
          <p className="text-[9px] text-white/25 font-body mt-0.5">
            {phase === 1 ? 'Abundant resources, no predation.' :
             phase === 2 ? 'Normal decay, resources deplete on use.' :
             'Scarce resources, seasonal hazards active.'}
          </p>
        </div>
      </div>

      {/* Director Controls */}
      <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4 md:col-span-2">
        <h2 className="font-headline text-sm font-bold text-[#dec2a0] uppercase tracking-[0.12em]">
          Director Interventions
        </h2>
        <p className="font-body text-[11px] text-white/30 leading-relaxed">
          Trigger global environmental events. Use sparingly — the ecosystem is a complex system.
        </p>

        <div className="flex flex-wrap gap-2">
          {[
            { type: 'DROUGHT', label: 'Trigger Drought', icon: 'local_fire_department', color: 'text-amber-400 border-amber-400/20 hover:bg-amber-400/10' },
            { type: 'FAMINE',  label: 'Trigger Famine',  icon: 'crisis_alert',          color: 'text-[#ffb4ab] border-[#ffb4ab]/20 hover:bg-[#ffb4ab]/10' },
            { type: 'NONE',    label: 'Clear Event',     icon: 'check_circle',          color: 'text-[#8da89b] border-[#8da89b]/20 hover:bg-[#8da89b]/10' },
          ].map(({ type, label, icon, color }) => (
            <button
              key={type}
              onClick={() => onCatastrophe(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-headline text-[11px] font-semibold transition-all ${color}`}
            >
              <span className="material-symbols-outlined text-base">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {catastrophe && (
          <div className="text-[11px] font-body text-[#ffb4ab]/70 flex items-center gap-1.5 pt-1">
            <span className="material-symbols-outlined text-sm">warning</span>
            Active event: <span className="font-headline font-semibold">{catastrophe}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
