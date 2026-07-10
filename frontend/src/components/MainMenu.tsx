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
  // Saved worlds state
  const [saves, setSaves] = useState<SaveFile[]>([]);
  const [loadingSaves, setLoadingSaves] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // New simulation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [worldName, setWorldName] = useState('My Terrarium');
  const [selectedTemplate, setSelectedTemplate] = useState('NURSERY');
  const [mutationRate, setMutationRate] = useState(15);
  const [initializing, setInitializing] = useState(false);

  // Document modal state
  const [selectedDoc, setSelectedDoc] = useState<'README' | 'PRIVACY' | 'TERMS' | null>(null);

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
    fetchSaves();
  }, []);

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

      setShowCreateModal(false);
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
      <header className="text-center mb-8 z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="w-16 h-16 mb-4 relative group">
          <div className="absolute inset-0 bg-[#10b981]/20 rounded-full blur-md group-hover:bg-[#10b981]/30 transition-all duration-500" />
          <svg className="w-full h-full relative z-10 drop-shadow-[0_4px_12px_rgba(16,185,129,0.25)] group-hover:scale-105 transition-transform duration-500" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="logoBgGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#000e07" />
                <stop offset="100%" stop-color="#002111" />
              </linearGradient>
              <linearGradient id="logoBorderGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#dec2a0" stop-opacity="0.8" />
                <stop offset="50%" stop-color="#10b981" stop-opacity="0.4" />
                <stop offset="100%" stop-color="#34d399" stop-opacity="0.8" />
              </linearGradient>
              <linearGradient id="logoTriloGrad" x1="0" y1="20" x2="100" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#dec2a0" />
                <stop offset="35%" stop-color="#f0d3b0" />
                <stop offset="70%" stop-color="#10b981" />
                <stop offset="100%" stop-color="#34d399" />
              </linearGradient>
              <linearGradient id="logoSpineGrad" x1="50" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#dec2a0" />
                <stop offset="100%" stop-color="#10b981" />
              </linearGradient>
              <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <circle cx="50" cy="50" r="46" fill="url(#logoBgGrad)" stroke="url(#logoBorderGrad)" stroke-width="2" />
            
            <circle cx="50" cy="50" r="41" stroke="#10b981" stroke-width="0.5" stroke-dasharray="3 6" opacity="0.3" />

            <rect x="48.5" y="24" width="3" height="54" rx="1.5" fill="url(#logoSpineGrad)" opacity="0.9" />

            <path d="M 23 35 C 23 18, 77 18, 77 35" stroke="url(#logoTriloGrad)" stroke-width="6.5" stroke-linecap="round" />

            <path d="M 21 44 Q 50 30 79 44" stroke="url(#logoTriloGrad)" stroke-width="4.5" stroke-linecap="round" />
            <path d="M 23 53 Q 50 39 77 53" stroke="url(#logoTriloGrad)" stroke-width="4.5" stroke-linecap="round" />
            <path d="M 27 62 Q 50 49 73 62" stroke="url(#logoTriloGrad)" stroke-width="4.5" stroke-linecap="round" />
            <path d="M 33 71 Q 50 59 67 71" stroke="url(#logoTriloGrad)" stroke-width="4.5" stroke-linecap="round" />

            <path d="M 41 79 Q 50 70 59 79" stroke="url(#logoTriloGrad)" stroke-width="4.5" stroke-linecap="round" />

            <circle cx="39" cy="27" r="1.75" fill="#ffffff" filter="url(#logoGlow)" />
            <circle cx="39" cy="27" r="0.75" fill="#dec2a0" />
            <circle cx="61" cy="27" r="1.75" fill="#ffffff" filter="url(#logoGlow)" />
            <circle cx="61" cy="27" r="0.75" fill="#dec2a0" />
          </svg>
        </div>
        <h1 className="font-headline text-5xl font-extrabold uppercase tracking-[0.25em] text-white/95 leading-tight flex items-center justify-center gap-1.5">
          <span className="text-[#dec2a0] text-6xl">C</span>ambrian
        </h1>
        <p className="font-body text-xs text-white/30 uppercase tracking-[0.3em] mt-1.5">
          UnikAI Lab &bull; Biologically Inspired Brain Evolution Simulator
        </p>
      </header>

      {/* Unified Worlds Portal Container */}
      <main className="glass-overlay rounded-3xl w-[860px] h-[480px] border border-white/8 flex flex-col z-10 shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Title / Section Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-white/1.5 shrink-0">
          <h2 className="font-headline text-xs font-bold uppercase tracking-wider text-white/40 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#dec2a0]">explore</span>
            Evolutionary Worlds Hub
          </h2>
          <span className="text-[10px] font-body text-white/20 uppercase tracking-widest">
            {saves.length} active {saves.length === 1 ? 'simulation' : 'simulations'}
          </span>
        </div>

        {/* Worlds Grid Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-white/0.5">
          {loadingSaves ? (
            <div className="h-full flex flex-col justify-center items-center text-center">
              <div className="w-8 h-8 border-2 border-[#dec2a0]/30 border-t-[#dec2a0] rounded-full animate-spin mb-3" />
              <span className="text-xs text-white/40 font-body">Scanning saved worlds...</span>
            </div>
          ) : saveError ? (
            <div className="h-full flex flex-col justify-center items-center text-center text-white/45">
              <span className="material-symbols-outlined text-2xl mb-2 text-[#ffb4ab]">error</span>
              <p className="text-xs font-body">{saveError}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              
              {/* Existing Saves */}
              {saves.map(save => (
                <div
                  key={save.id}
                  onClick={() => handleLoadSave(save.id)}
                  className="group relative flex flex-col justify-between p-4 h-[140px] rounded-2xl bg-white/3 border border-white/5 hover:border-[#dec2a0]/30 hover:bg-white/5 transition-all cursor-pointer shadow-md hover:shadow-lg"
                >
                  <div>
                    {/* Title row */}
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-headline font-bold text-sm text-[#dec2a0] truncate max-w-[170px]">
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
                    <div className="grid grid-cols-2 gap-2 text-[9px] font-body text-white/45">
                      <div>
                        <span className="text-white/20 block text-[7px] uppercase tracking-wider">Simulated Age</span>
                        <span className="font-bold text-white/70">{save.years} yr</span>
                      </div>
                      <div>
                        <span className="text-white/20 block text-[7px] uppercase tracking-wider">Population</span>
                        <span className="font-bold text-white/70">{save.population} / {save.predators}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Timestamp */}
                  <span className="text-[8px] font-body text-white/20 uppercase tracking-widest mt-2 block">
                    Saved: {new Date(save.timestamp * 1000).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              ))}

              {/* "+" Creator Card that shifts dynamically to the right */}
              <div
                onClick={() => {
                  setWorldName(`Terrarium ${saves.length + 1}`);
                  setShowCreateModal(true);
                }}
                className="group flex flex-col justify-center items-center h-[140px] rounded-2xl bg-dashed border-2 border-white/10 hover:border-[#dec2a0]/50 hover:bg-[#dec2a0]/3 transition-all cursor-pointer text-center p-4"
                style={{ borderStyle: 'dashed' }}
              >
                <div className="w-10 h-10 rounded-full bg-white/3 group-hover:bg-[#dec2a0]/15 flex items-center justify-center transition-all mb-2">
                  <span className="material-symbols-outlined text-white/30 group-hover:text-[#dec2a0] text-xl">add</span>
                </div>
                <h4 className="font-headline font-bold text-xs text-white/35 group-hover:text-[#dec2a0] uppercase tracking-wider transition-all">
                  Initialize Biosphere
                </h4>
              </div>

            </div>
          )}
        </div>
      </main>

      {/* Initialize New World Overlay Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-[460px] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-left animate-slide-in-up">
            
            <div className="flex justify-between items-center">
              <h3 className="font-headline text-sm font-bold uppercase tracking-wider text-[#dec2a0] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">construction</span>
                Configure Biosphere
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/30 hover:text-white/60 flex items-center justify-center w-7 h-7 rounded-full bg-white/3 hover:bg-white/6 transition-all"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* World name input */}
            <div>
              <label className="text-[9px] text-white/35 uppercase tracking-widest font-body block mb-1.5">Simulation Name</label>
              <input
                type="text"
                value={worldName}
                onChange={e => setWorldName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-headline text-xs focus:outline-none focus:border-[#dec2a0]/40 focus:bg-white/8 transition-colors"
              />
            </div>

            {/* Templates selector */}
            <div>
              <label className="text-[9px] text-white/35 uppercase tracking-widest font-body block mb-2">Select Terrarium Template</label>
              <div className="grid grid-cols-3 gap-2">
                {TEMPLATES.map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                      selectedTemplate === tmpl.id
                        ? 'bg-[#dec2a0]/8 border-[#dec2a0]/30 text-white'
                        : 'bg-white/3 border-white/6 text-white/50 hover:bg-white/5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base mb-1.5 text-[#dec2a0]">{tmpl.icon}</span>
                    <span className="text-[10px] font-headline font-bold mb-0.5 block">{tmpl.name}</span>
                    <span className="text-[8px] font-body text-white/25 leading-normal block">{tmpl.desc}</span>
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

            {/* Actions */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/3 border border-white/6 text-white/50 font-headline text-xs font-bold hover:bg-white/6 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewWorld}
                disabled={initializing}
                className="flex-1 py-3 rounded-xl bg-[#dec2a0]/15 text-[#dec2a0] border border-[#dec2a0]/30 font-headline text-xs font-bold hover:bg-[#dec2a0]/25 transition-all flex items-center justify-center gap-1.5"
              >
                {initializing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#dec2a0]/30 border-t-[#dec2a0] rounded-full animate-spin" />
                    Generating Biosphere...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">eco</span>
                    Create World
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Document Reader Overlay Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-[640px] h-[520px] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col animate-slide-in-up">
            
            {/* Doc Title bar */}
            <div className="flex justify-between items-center pb-4 border-b border-white/5 shrink-0">
              <h3 className="font-headline text-sm font-bold uppercase tracking-wider text-[#dec2a0] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">
                  {selectedDoc === 'README' ? 'menu_book' : selectedDoc === 'PRIVACY' ? 'lock' : 'verified_user'}
                </span>
                {selectedDoc === 'README' ? 'Ecosystem Guide' : selectedDoc === 'PRIVACY' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-white/30 hover:text-white/60 flex items-center justify-center w-7 h-7 rounded-full bg-white/3 hover:bg-white/6 transition-all"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Doc Body content */}
            <div className="flex-1 overflow-y-auto py-5 text-left font-body text-xs text-white/50 leading-relaxed space-y-4 pr-1">
              
              {selectedDoc === 'README' && (
                <>
                  <h4 className="font-headline text-xs font-bold text-white/80 uppercase">Project Cambrian Overview</h4>
                  <p>
                    Project Cambrian is a biologically-inspired evolutionary terrarium built by UnikAI Lab. 
                    Unlike simple rule-based state machines, every organism and predator inside Cambrian runs an autonomous neural architecture that adapts, survives, mates, and learns in real-time.
                  </p>
                  
                  <h5 className="font-headline text-[10px] font-bold text-white/70 uppercase mt-3">The BIB Neural Network</h5>
                  <p>
                    Biologically Inspired Brain (BIB) simulates essential neurological organs:
                  </p>
                  <ul className="list-disc pl-4 space-y-1.5">
                    <li><strong>Brainstem (Homeostasis):</strong> Oversees metabolisms, energy levels, dehydration markers, and drive chemical releases.</li>
                    <li><strong>Cortex (Perception):</strong> Encodes sensory visuals, cone vectors, and local coordinate touches.</li>
                    <li><strong>Thalamus (Gating):</strong> Selects and passes sensory triggers depending on critical homeostatic needs.</li>
                    <li><strong>Hippocampus (Memory):</strong> Associates past decisions with environmental survival rates.</li>
                  </ul>

                  <h5 className="font-headline text-[10px] font-bold text-white/70 uppercase mt-3">Curriculum Stages</h5>
                  <p>
                    The simulator runs across co-evolutionary learning phases. At Generation 6, the threat parameters are heightened, and apex predator wolves are introduced to drive predatory escape learning.
                  </p>

                  <h5 className="font-headline text-[10px] font-bold text-white/70 uppercase mt-3">External Library</h5>
                  <p>
                    The underlying Biologically Inspired Brain library is fully open source. You can view, download, or contribute to it at the official repository: <a href="https://github.com/tgakathunderr/bib" target="_blank" rel="noopener noreferrer" className="text-[#dec2a0] hover:underline">github.com/tgakathunderr/bib</a>.
                  </p>
                </>
              )}

              {selectedDoc === 'PRIVACY' && (
                <>
                  <h4 className="font-headline text-xs font-bold text-white/80 uppercase">Offline Privacy Policy</h4>
                  <p className="text-[10px] text-white/30">Last Updated: July 2026</p>
                  <p>
                    UnikAI Lab respects your privacy constraints. Project Cambrian is a locally hosted application designed to run entirely on your own desktop computing machine.
                  </p>
                  <h5 className="font-headline text-[10px] font-bold text-white/70 uppercase mt-3">Data Collection</h5>
                  <p>
                    This application does not collect, log, compile, or transmit any user information to external servers. All operations, coordinates, and brain telemetry matrices run fully in-memory offline.
                  </p>
                  <h5 className="font-headline text-[10px] font-bold text-white/70 uppercase mt-3">Local Serialization</h5>
                  <p>
                    Any saved simulations (including name tags, genetics, and pickled brain weights) are stored exclusively in binary `.pkl` files inside your local project directory folder under `backend/saves/`.
                  </p>
                </>
              )}

              {selectedDoc === 'TERMS' && (
                <>
                  <h4 className="font-headline text-xs font-bold text-white/80 uppercase">Terms of Service</h4>
                  <p className="text-[10px] text-white/30">Last Updated: July 2026</p>
                  <p>
                    Welcome to Project Cambrian, an artificial life simulator created by UnikAI Lab. By accessing or running this software code, you agree to comply with the terms below.
                  </p>
                  <h5 className="font-headline text-[10px] font-bold text-white/70 uppercase mt-3">Software Licensing</h5>
                  <p>
                    This software is proprietary and source-available. You are permitted to execute, run, modify, and study the simulation code for personal, educational, research, and evaluation purposes.
                  </p>
                  <h5 className="font-headline text-[10px] font-bold text-white/70 uppercase mt-3">Commercial Gating</h5>
                  <p>
                    Redistribution, reselling, sublicensing, or packaging Cambrian or the BIB neural weights inside commercial products is strictly prohibited without explicit, written authorization from UnikAI Lab.
                  </p>
                </>
              )}

            </div>

            {/* Doc Footer */}
            <div className="pt-4 border-t border-white/5 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 font-headline text-xs font-bold hover:bg-white/10 transition-all"
              >
                Close Reader
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Docs Footer Links */}
      <footer className="absolute bottom-6 flex items-center justify-center gap-5 font-body text-[9px] text-white/20 tracking-widest z-10">
        <span>&copy; 2026 UnikAI Lab</span>
        <span>&bull;</span>
        <button onClick={() => setSelectedDoc('README')} className="hover:text-white/60 hover:underline transition-all">Ecosystem Guide</button>
        <span>&bull;</span>
        <button onClick={() => setSelectedDoc('PRIVACY')} className="hover:text-white/60 hover:underline transition-all">Privacy Policy</button>
        <span>&bull;</span>
        <button onClick={() => setSelectedDoc('TERMS')} className="hover:text-white/60 hover:underline transition-all">Terms of Service</button>
      </footer>

    </div>
  );
};
