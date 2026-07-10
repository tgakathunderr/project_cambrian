import React, { useEffect, useState } from 'react';

interface SaveFile {
  id: string;
  name: string;
  timestamp: number;
  population: number;
  predators: number;
  years: number;
}

interface MainMenuProps {
  onStartSimulation: () => void;
}

const TEMPLATES = [
  { id: 'NURSERY', name: 'Primordial Nursery', desc: 'Lush grass terrain. Perfect for balanced biological development.', icon: 'grass' },
  { id: 'SEA', name: 'Cambrian Shallow Sea', desc: 'Slow, deep water channels. Drives high-metabolism aquatic adaptation.', icon: 'water' },
  { id: 'DESERT', name: 'Desert Oasis', desc: 'Arid sandy dunes separated by solid rock walls. Resources are sparse.', icon: 'terrain' }
];

export const MainMenu: React.FC<MainMenuProps> = ({ onStartSimulation }) => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'SAVES' | 'CODEX'>('NEW');
  
  // New simulation state
  const [worldName, setWorldName] = useState('My Terrarium');
  const [selectedTemplate, setSelectedTemplate] = useState('NURSERY');
  const [mutationRate, setMutationRate] = useState(15);
  const [initializing, setInitializing] = useState(false);

  // Saved worlds state
  const [saves, setSaves] = useState<SaveFile[]>([]);
  const [loadingSaves, setLoadingSaves] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch saves
  const fetchSaves = () => {
    setLoadingSaves(true);
    setSaveError(null);
    fetch('http://127.0.0.1:8000/api/saves')
      .then(res => res.json())
      .then(data => {
        setSaves(data);
        setLoadingSaves(false);
      })
      .catch(() => {
        setSaveError('Could not load saved simulations.');
        setLoadingSaves(false);
      });
  };

  useEffect(() => {
    if (activeTab === 'SAVES') {
      fetchSaves();
    }
  }, [activeTab]);

  // Handle New World
  const handleCreateNewWorld = async () => {
    setInitializing(true);
    try {
      // 1. Reset simulation
      const res = await fetch('http://127.0.0.1:8000/api/saves/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: worldName.trim() })
      });
      const data = await res.json();
      if (data.status !== 'SUCCESS') throw new Error('Reset failed');

      // 2. Set mutation rate
      await fetch('http://127.0.0.1:8000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed: 1.0, running: true, mutation_rate: mutationRate / 100 })
      });

      // 3. Paint template terrain if not default nursery
      if (selectedTemplate === 'SEA') {
        // Paint deep channels
        for (let x = 100; x < 900; x += 100) {
          await fetch('http://127.0.0.1:8000/api/terrain/paint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ x, y: 400, radius: 180, type: 'WATER_DEEP' })
          });
        }
      } else if (selectedTemplate === 'DESERT') {
        // Paint sand dune boundaries and rocks
        for (let x = 0; x < 1000; x += 200) {
          await fetch('http://127.0.0.1:8000/api/terrain/paint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ x, y: 300, radius: 90, type: 'ROCK' })
          });
          await fetch('http://127.0.0.1:8000/api/terrain/paint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ x: x + 100, y: 550, radius: 120, type: 'SAND' })
          });
        }
      }

      onStartSimulation();
    } catch {
      alert('Failed to initialize new world.');
    } finally {
      setInitializing(false);
    }
  };

  // Handle Load
  const handleLoadSave = (saveId: string) => {
    fetch('http://127.0.0.1:8000/api/saves/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: saveId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'SUCCESS') {
          onStartSimulation();
        } else {
          alert(`Failed to load world: ${data.message}`);
        }
      })
      .catch(() => alert('Failed to connect to backend server.'));
  };

  // Handle Delete
  const handleDeleteSave = (saveId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this saved world?')) return;
    
    fetch('http://127.0.0.1:8000/api/saves/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: saveId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'SUCCESS') {
          fetchSaves();
        }
      });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-center items-center px-4" style={{ background: '#000c06' }}>
      
      {/* Animated Glowing Background Rings */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[#0d3b24]/20 blur-[100px] -top-20 -left-20 animate-pulse pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#082a3e]/15 blur-[120px] -bottom-20 -right-20 pointer-events-none" />

      {/* Header Container */}
      <header className="text-center mb-8 z-10">
        <h1 className="font-headline text-5xl font-extrabold uppercase tracking-[0.25em] text-white/95 leading-tight flex items-center justify-center gap-1.5">
          <span className="text-[#dec2a0] text-6xl">C</span>ambrian
        </h1>
        <p className="font-body text-xs text-white/30 uppercase tracking-[0.3em] mt-1.5">
          Biologically Inspired Brain Evolution Simulator
        </p>
      </header>

      {/* Tabs Layout */}
      <main className="glass-overlay rounded-3xl w-[720px] h-[480px] border border-white/8 flex flex-col z-10 shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Navigation tabs */}
        <nav className="flex border-b border-white/5 bg-white/1.5 shrink-0">
          {[
            { id: 'NEW', label: 'Initialize World', icon: 'construction' },
            { id: 'SAVES', label: 'Saved Simulations', icon: 'sd_card' },
            { id: 'CODEX', label: 'Ecosystem Codex', icon: 'menu_book' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'NEW' | 'SAVES' | 'CODEX')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 font-headline text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#dec2a0] text-[#dec2a0] bg-white/2'
                  : 'border-transparent text-white/35 hover:text-white/60 hover:bg-white/1'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab content panel */}
        <div className="flex-1 overflow-y-auto p-6 bg-white/0.5">
          
          {/* Tab 1: New Simulation */}
          {activeTab === 'NEW' && (
            <div className="h-full flex flex-col justify-between">
              <div className="space-y-5">
                {/* World name input */}
                <div>
                  <label className="text-[9px] text-white/35 uppercase tracking-widest font-body block mb-1.5">Simulation Name</label>
                  <input
                    type="text"
                    value={worldName}
                    onChange={e => setWorldName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-headline text-sm focus:outline-none focus:border-[#dec2a0]/40 focus:bg-white/8 transition-colors"
                  />
                </div>

                {/* Templates selector */}
                <div>
                  <label className="text-[9px] text-white/35 uppercase tracking-widest font-body block mb-2">Select Terrarium Template</label>
                  <div className="grid grid-cols-3 gap-3">
                    {TEMPLATES.map(tmpl => (
                      <button
                        key={tmpl.id}
                        onClick={() => setSelectedTemplate(tmpl.id)}
                        className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all ${
                          selectedTemplate === tmpl.id
                            ? 'bg-[#dec2a0]/8 border-[#dec2a0]/30 text-white'
                            : 'bg-white/3 border-white/6 text-white/50 hover:bg-white/5 hover:border-white/10'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl mb-2 text-[#dec2a0]">{tmpl.icon}</span>
                        <span className="text-xs font-headline font-bold mb-1 block">{tmpl.name}</span>
                        <span className="text-[9px] font-body text-white/30 leading-normal block">{tmpl.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mutation Rate slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] text-white/35 uppercase tracking-widest font-body">Initial DNA Mutation Rate</label>
                    <span className="text-[10px] font-headline font-bold text-[#dec2a0]">{mutationRate}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    value={mutationRate}
                    onChange={e => setMutationRate(parseInt(e.target.value))}
                    className="w-full cursor-pointer accent-[#dec2a0]"
                  />
                </div>
              </div>

              {/* Initialize Button */}
              <button
                onClick={handleCreateNewWorld}
                disabled={initializing}
                className="w-full py-3.5 rounded-2xl bg-[#dec2a0]/15 text-[#dec2a0] font-headline text-xs font-bold hover:bg-[#dec2a0]/25 transition-all flex items-center justify-center gap-2 tracking-wider mt-4"
              >
                {initializing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#dec2a0]/30 border-t-[#dec2a0] rounded-full animate-spin" />
                    Priming Neuro-Evolutionary Engines...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                    Initialize Simulation
                  </>
                )}
              </button>
            </div>
          )}

          {/* Tab 2: Saved Worlds */}
          {activeTab === 'SAVES' && (
            <div className="h-full flex flex-col">
              {loadingSaves ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center">
                  <div className="w-8 h-8 border-2 border-[#dec2a0]/30 border-t-[#dec2a0] rounded-full animate-spin mb-3" />
                  <span className="text-xs text-white/40 font-body">Reading sector database...</span>
                </div>
              ) : saveError ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center text-white/45">
                  <span className="material-symbols-outlined text-2xl mb-2 text-[#ffb4ab]">error</span>
                  <p className="text-xs font-body">{saveError}</p>
                </div>
              ) : saves.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center px-8">
                  <div className="w-12 h-12 rounded-full bg-white/3 border border-white/5 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-white/20 text-xl">folder_zip</span>
                  </div>
                  <h3 className="font-headline text-xs font-bold text-white/40 mb-1.5 uppercase tracking-wide">No Saved Worlds</h3>
                  <p className="font-body text-[10px] text-white/20 leading-relaxed max-w-[240px]">
                    Go to the 'Initialize World' tab to create a new simulation. You can save your progress at any time inside the terrarium!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {saves.map(save => (
                    <div
                      key={save.id}
                      onClick={() => handleLoadSave(save.id)}
                      className="group relative flex flex-col justify-between p-4 rounded-2xl bg-white/3 border border-white/5 hover:border-[#dec2a0]/30 hover:bg-white/5 transition-all cursor-pointer shadow-md hover:shadow-lg"
                    >
                      <div>
                        {/* Title row */}
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-headline font-bold text-sm text-[#dec2a0] truncate max-w-[200px]">
                            {save.name}
                          </h4>
                          <button
                            onClick={(e) => handleDeleteSave(save.id, e)}
                            title="Delete Save"
                            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded bg-white/5 border border-white/8 hover:bg-[#ffb4ab]/12 hover:border-[#ffb4ab]/30 text-white/40 hover:text-[#ffb4ab] flex items-center justify-center transition-all"
                          >
                            <span className="material-symbols-outlined text-xs">delete</span>
                          </button>
                        </div>
                        {/* Meta row */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-body text-white/45">
                          <div>
                            <span className="text-white/20 block text-[8px] uppercase tracking-wider">Simulated Age</span>
                            <span className="font-bold text-white/70">{save.years} yr</span>
                          </div>
                          <div>
                            <span className="text-white/20 block text-[8px] uppercase tracking-wider">Population</span>
                            <span className="font-bold text-white/70">{save.population} prey / {save.predators} wolf</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Timestamp */}
                      <span className="text-[8px] font-body text-white/20 uppercase tracking-widest mt-3 block">
                        Saved: {new Date(save.timestamp * 1000).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Ecosystem Codex */}
          {activeTab === 'CODEX' && (
            <div className="space-y-6 font-body text-xs text-white/50 leading-relaxed pr-2">
              
              {/* Introduction */}
              <div>
                <h3 className="font-headline text-sm font-bold text-[#dec2a0] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">dna</span>
                  Project Cambrian
                </h3>
                <p>
                  Project Cambrian is an evolutionary terrarium simulating a self-sustaining eco-system. 
                  Unlike traditional cellular automata or rule-based models, each organism and predator is governed by an active neural architecture that learns and adapts in real-time, matching the constraints of natural selection: eat or be eaten.
                </p>
              </div>

              {/* The BIB Neural Architecture */}
              <div>
                <h3 className="font-headline text-sm font-bold text-[#dec2a0] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">psychology</span>
                  The BIB Architecture (Biologically Inspired Brain)
                </h3>
                <p className="mb-2">
                  At the core of every creature is a <strong>BIB Neural Brain</strong>. Rather than employing abstract mathematical reinforcement learning agents, BIB mimics real biological subsystems:
                </p>
                <ul className="space-y-2 pl-4 list-disc">
                  <li>
                    <strong className="text-white/75">Brainstem (Homeostasis):</strong> Monitors internal homeostatic drives (hunger, thirst, pain) and regulates chemical triggers.
                  </li>
                  <li>
                    <strong className="text-white/75">Cortex (Perception):</strong> Interprets raw sensory input grids (256-dimensional cone vision, touch, proprioception) into activations.
                  </li>
                  <li>
                    <strong className="text-white/75">Thalamus (Gating):</strong> Routes relevant stimulus categories depending on which internal drive is dominant (e.g. focusing solely on water when thirsty).
                  </li>
                  <li>
                    <strong className="text-white/75">Hippocampus (Memory):</strong> Stores episodic mappings to correlate past actions with success rewards, allowing specimens to "learn" how to forage, run away, or search for mates.
                  </li>
                </ul>
              </div>

              {/* Genome */}
              <div>
                <h3 className="font-headline text-sm font-bold text-[#dec2a0] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">neurology</span>
                  The Genome & Natural Selection
                </h3>
                <p>
                  Every organism carries a digital genome (DNA) defining physical parameters:
                </p>
                <ul className="space-y-1.5 pl-4 list-disc mt-1.5">
                  <li><strong>Speed:</strong> High speed allows fast hunting or escaping, but burns energy at an increased rate.</li>
                  <li><strong>Size:</strong> Large organisms have high energy/water capacity but slower speed.</li>
                  <li><strong>Vision Range:</strong> Long vision range increases resource locating but has a slight metabolic tax.</li>
                  <li><strong>Metabolism:</strong> Multiplies passive decay rates. Lower values facilitate survival during famines.</li>
                </ul>
              </div>

              {/* Sandbox Terrain */}
              <div>
                <h3 className="font-headline text-sm font-bold text-[#dec2a0] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">grid_view</span>
                  Worldbox Physics & Sandbox
                </h3>
                <p>
                  The sandbox utilizes different tile materials that interact directly with creature kinetics:
                </p>
                <ul className="space-y-1.5 pl-4 list-disc mt-1.5">
                  <li><strong>Grass & Sand:</strong> Standard walking terrain. Trees grow exclusively here.</li>
                  <li><strong>Shallow Water:</strong> Organisms can drink water directly. Speeds are dampened by 40%.</li>
                  <li><strong>Deep Sea:</strong> Speeds are heavily dampened (75%). Critically low-energy organisms will suffer a metabolic <em>drowning drain</em> penalty and die if they swim here too long.</li>
                  <li><strong>Rock:</strong> Impassable mountains. Creatures bounce off painted Rock boundaries.</li>
                </ul>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};
