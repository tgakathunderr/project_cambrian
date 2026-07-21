import React, { useRef, useState } from 'react';

interface SpawnNameModalProps {
  position: { x: number; y: number } | null;
  onConfirm: (name: string, sex: 'MALE' | 'FEMALE', ageYears: number, mindMode: 'INNATE' | 'RAW') => void;
  onCancel: () => void;
}

const SUGGESTIONS = [
  "Aura", "Zephyr", "Calyx", "Vesper", "Nova", "Lyra",
  "Spora", "Onyx", "Mira", "Soleil", "Comet", "Lumen"
];

export const SpawnNameModal: React.FC<SpawnNameModalProps> = ({ position, onConfirm, onCancel }) => {
  const [name, setName] = useState(() => SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)]);
  const [sex, setSex] = useState<'MALE' | 'FEMALE'>('MALE');
  const [mindMode, setMindMode] = useState<'INNATE' | 'RAW'>('INNATE');
  const [ageYears, setAgeYears] = useState<number>(12); // default to 12 years (just reached maturity)
  
  const inputRef = useRef<HTMLInputElement>(null);

  if (!position) return null;

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (trimmed.length > 0) {
      onConfirm(trimmed, sex, ageYears, mindMode);
    }
  };

  // Determine label based on age
  const getAgeLabel = (age: number) => {
    if (age < 12) return `Age: ${age}yr · Juvenile`;
    if (age < 60) return `Age: ${age}yr · Mature Adult`;
    return `Age: ${age}yr · Elder`;
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0,12,6,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}
    >
      <div
        className="glass-overlay rounded-3xl w-96 p-7 animate-modal border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#dec2a0] text-xl">add_circle</span>
          <h3 className="font-headline text-base font-bold text-[#dec2a0] uppercase tracking-wider">Spawn Organism</h3>
        </div>

        <p className="font-body text-[11px] text-white/35 mb-4 leading-relaxed">
          Configure genetic identity, mind architecture, and age before placing this specimen.
        </p>

        {/* 1. Name input */}
        <div className="mb-4">
          <label className="text-[9px] text-white/30 uppercase tracking-widest font-body block mb-1.5">Specimen Name</label>
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={name}
            maxLength={18}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') onCancel(); }}
            className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-[#dec2a0]/20 text-[#dec2a0] font-headline text-sm placeholder-white/20 focus:outline-none focus:border-[#dec2a0]/50 transition-colors mb-2.5"
            placeholder="Enter name..."
          />
          {/* Quick pick suggestions */}
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.slice(0, 6).map(s => (
              <button
                key={s}
                onClick={() => setName(s)}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-headline transition-all ${
                  name === s
                    ? 'bg-[#dec2a0]/20 text-[#dec2a0] border border-[#dec2a0]/30'
                    : 'bg-white/4 text-white/30 border border-white/8 hover:border-[#dec2a0]/20 hover:text-[#dec2a0]/60'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Mind Mode Selection */}
        <div className="mb-4">
          <label className="text-[9px] text-white/30 uppercase tracking-widest font-body block mb-1.5">Mind Architecture</label>
          <div className="grid grid-cols-2 gap-2 mb-1">
            <button
              type="button"
              onClick={() => setMindMode('INNATE')}
              className={`py-2 px-2.5 border rounded-xl font-headline text-left transition-all ${
                mindMode === 'INNATE'
                  ? 'bg-[#05f094]/15 border-[#05f094]/40 text-[#05f094]'
                  : 'bg-white/3 border-white/6 text-white/40 hover:border-white/12 hover:text-white/60'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1">
                <span>🌱 Innate</span>
              </div>
              <div className="text-[9px] text-white/35 font-body mt-0.5">Pre-tuned biological instincts</div>
            </button>

            <button
              type="button"
              onClick={() => setMindMode('RAW')}
              className={`py-2 px-2.5 border rounded-xl font-headline text-left transition-all ${
                mindMode === 'RAW'
                  ? 'bg-[#dec2a0]/15 border-[#dec2a0]/40 text-[#dec2a0]'
                  : 'bg-white/3 border-white/6 text-white/40 hover:border-white/12 hover:text-white/60'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1">
                <span>⚡ Raw</span>
              </div>
              <div className="text-[9px] text-white/35 font-body mt-0.5">Un-trained blank brain</div>
            </button>
          </div>
        </div>

        {/* 3. Gender Selection */}
        <div className="mb-4">
          <label className="text-[9px] text-white/30 uppercase tracking-widest font-body block mb-1.5">Biological Sex</label>
          <div className="flex gap-2">
            {[
              { type: 'MALE', label: 'Male ♂', activeColor: 'bg-[#93c5fd]/15 text-[#93c5fd] border-[#93c5fd]/30' },
              { type: 'FEMALE', label: 'Female ♀', activeColor: 'bg-[#f9a8d4]/15 text-[#f9a8d4] border-[#f9a8d4]/30' }
            ].map(g => (
              <button
                key={g.type}
                onClick={() => setSex(g.type as 'MALE' | 'FEMALE')}
                className={`flex-1 py-2 border rounded-xl font-headline text-xs font-semibold transition-all ${
                  sex === g.type 
                    ? g.activeColor 
                    : 'bg-white/3 border-white/6 text-white/40 hover:border-white/12 hover:text-white/60'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Age Selection */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[9px] text-white/30 uppercase tracking-widest font-body">Spawn Age</label>
            <span className="text-[10px] font-headline font-bold text-[#dec2a0]">{getAgeLabel(ageYears)}</span>
          </div>
          <input
            type="range"
            min={1}
            max={80}
            step={1}
            value={ageYears}
            onChange={e => setAgeYears(parseInt(e.target.value))}
            className="w-full cursor-pointer accent-[#dec2a0]"
          />
          <div className="flex justify-between text-[8px] text-white/20 font-body mt-1">
            <span>1yr (Child)</span>
            <span>40yr (Adult)</span>
            <span>80yr (Elder)</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-white/4 text-white/40 font-headline text-xs font-semibold hover:bg-white/8 hover:text-white/60 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-[#dec2a0]/15 text-[#dec2a0] font-headline text-xs font-bold hover:bg-[#dec2a0]/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Spawn Specimen
          </button>
        </div>
      </div>
    </div>
  );
};
