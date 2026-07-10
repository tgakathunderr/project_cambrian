import React, { useRef, useState } from 'react';

interface SpawnNameModalProps {
  position: { x: number; y: number } | null;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

const SUGGESTIONS = [
  "Aura", "Zephyr", "Calyx", "Vesper", "Nova", "Lyra",
  "Spora", "Onyx", "Mira", "Soleil", "Comet", "Lumen"
];

export const SpawnNameModal: React.FC<SpawnNameModalProps> = ({ position, onConfirm, onCancel }) => {
  const [name, setName] = useState(() => SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)]);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!position) return null;

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (trimmed.length > 0) onConfirm(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0,12,6,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}
    >
      <div
        className="glass-overlay rounded-2xl w-80 p-6 animate-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#dec2a0] text-xl">add_circle</span>
          <h3 className="font-headline text-base font-semibold text-[#dec2a0]">Spawn Organism</h3>
        </div>

        <p className="font-body text-[11px] text-white/35 mb-4 leading-relaxed">
          Name this creature before it enters the world. You can rename it later.
        </p>

        {/* Name input */}
        <input
          ref={inputRef}
          autoFocus
          type="text"
          value={name}
          maxLength={18}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') onCancel(); }}
          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-[#dec2a0]/20 text-[#dec2a0] font-headline text-sm placeholder-white/20 focus:outline-none focus:border-[#dec2a0]/50 transition-colors mb-3"
          placeholder="Enter a name..."
        />

        {/* Quick pick suggestions */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {SUGGESTIONS.slice(0, 6).map(s => (
            <button
              key={s}
              onClick={() => setName(s)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-headline transition-all ${
                name === s
                  ? 'bg-[#dec2a0]/20 text-[#dec2a0] border border-[#dec2a0]/30'
                  : 'bg-white/4 text-white/30 border border-white/8 hover:border-[#dec2a0]/20 hover:text-[#dec2a0]/60'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl bg-white/4 text-white/40 font-headline text-sm hover:bg-white/8 hover:text-white/60 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!name.trim()}
            className="flex-1 py-2 rounded-xl bg-[#dec2a0]/15 text-[#dec2a0] font-headline text-sm font-semibold hover:bg-[#dec2a0]/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Spawn
          </button>
        </div>
      </div>
    </div>
  );
};
