import React, { useState, useEffect } from 'react';

interface SelectedTelemetry {
  id: string;
  name: string;
  age: number;
  generation: number;
  sex: string;
  lifecycle: string;
  energy: number;
  max_energy: number;
  hydration: number;
  max_hydration: number;
  dopamine: number;
  serotonin: number;
  acetylcholine: number;
  cortisol: number;
  dominant_drive: number;
  last_action: number;
  parent1_name?: string;
  parent2_name?: string;
  offspring_count: number;
  speed_trait: number;
  vision_trait: number;
  size_trait: number;
  metabolism_trait: number;
}

interface GlassBrainSidebarProps {
  selected: SelectedTelemetry | null;
  onRename: (id: string, name: string) => void;
  onZap: (id: string) => void;
  onBiography: (id: string) => void;
}

const DRIVE_LABELS: Record<number, { label: string; icon: string; color: string }> = {
  0: { label: 'Content', icon: 'sentiment_satisfied', color: 'text-[#8da89b]' },
  1: { label: 'Foraging Food', icon: 'nutrition', color: 'text-amber-400' },
  2: { label: 'Seeking Water', icon: 'water_drop', color: 'text-blue-300' },
  3: { label: 'Seeking Mate', icon: 'favorite', color: 'text-pink-300' },
  4: { label: 'Fleeing Danger', icon: 'emergency', color: 'text-[#ffb4ab]' },
  5: { label: 'Exploring', icon: 'explore', color: 'text-[#c0c6de]' }
};

const ACTION_LABELS: Record<number, string> = {
  0: 'Moving Forward',
  1: 'Calling Mates',
  2: 'Turning',
  3: 'Growing',
  4: 'Excreting',
  5: 'Consuming',
  6: 'Resting',
  7: 'Sleeping'
};

interface ChemCylinderProps {
  label: string;
  value: number;  // 0–1
  fillColor: string;
  borderColor: string;
  glowClass: string;
  duration: string;
  bubbleDelays: string[];
}

const ChemCylinder: React.FC<ChemCylinderProps> = ({
  label, value, fillColor, borderColor, glowClass, duration, bubbleDelays
}) => {
  const pct = Math.round(value * 100);
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Numeric label above */}
      <span className="text-[10px] font-headline font-bold tabular-nums" style={{ color: fillColor }}>
        {pct}%
      </span>
      {/* Cylinder */}
      <div
        className={`w-10 h-24 rounded-2xl border overflow-hidden relative ${glowClass}`}
        style={{ borderColor, background: 'rgba(255,255,255,0.02)' }}
      >
        {/* Fill */}
        <div
          className="absolute bottom-0 w-full fluid-fill transition-all duration-700"
          style={{
            height: `${pct}%`,
            background: `linear-gradient(to top, ${fillColor}55, ${fillColor}22)`,
            borderTop: `1px solid ${fillColor}88`,
            animationDuration: duration
          }}
        >
          {bubbleDelays.map((delay, i) => (
            <div
              key={i}
              className="fluid-bubble"
              style={{
                left: `${20 + i * 30}%`,
                width: i === 0 ? '4px' : '5px',
                height: i === 0 ? '4px' : '5px',
                animationDelay: delay
              }}
            />
          ))}
        </div>
        {/* Cylinder shine */}
        <div className="absolute inset-0 rounded-2xl" style={{
          background: 'linear-gradient(130deg, rgba(255,255,255,0.06) 0%, transparent 60%)'
        }} />
      </div>
      {/* Label below */}
      <span className="text-[9px] font-body uppercase tracking-wider" style={{ color: fillColor + 'aa' }}>
        {label}
      </span>
    </div>
  );
};

export const GlassBrainSidebar: React.FC<GlassBrainSidebarProps> = ({
  selected, onRename, onZap, onBiography
}) => {
  const [renameInput, setRenameInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (selected) {
      setRenameInput(selected.name);
      setIsEditing(false);
    }
  }, [selected?.id]);

  if (!selected) {
    return (
      <aside className="h-full flex flex-col items-center justify-center text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-2xl text-white/20">biotech</span>
        </div>
        <h3 className="font-headline text-sm font-semibold text-white/40 mb-2">No Specimen Selected</h3>
        <p className="font-body text-[11px] text-white/20 leading-relaxed max-w-[180px]">
          Click any creature in the biosphere to inspect its brain chemistry.
        </p>
      </aside>
    );
  }

  const ageInYears = (selected.age / 1296000.0).toFixed(1);
  const energyPct = Math.round((selected.energy / selected.max_energy) * 100);
  const hydrationPct = Math.round((selected.hydration / selected.max_hydration) * 100);
  const drive = DRIVE_LABELS[selected.dominant_drive] || DRIVE_LABELS[0];

  const handleSave = () => {
    if (renameInput.trim()) {
      onRename(selected.id, renameInput.trim());
      setIsEditing(false);
    }
  };

  return (
    <aside className="h-full flex flex-col gap-0 overflow-hidden">
      {/* ── Specimen Header ── */}
      <div className="px-5 pt-5 pb-4 border-b border-white/5">
        {/* Name row */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 mr-2">
            {isEditing ? (
              <div className="flex gap-2 items-center">
                <input
                  autoFocus
                  type="text"
                  value={renameInput}
                  maxLength={18}
                  onChange={e => setRenameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setIsEditing(false); }}
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-white/5 border border-[#dec2a0]/25 text-[#dec2a0] font-headline text-sm focus:outline-none focus:border-[#dec2a0]/50 transition-colors"
                />
                <button
                  onClick={handleSave}
                  className="px-2.5 py-1.5 bg-[#dec2a0]/15 text-[#dec2a0] rounded-lg text-xs font-headline font-semibold hover:bg-[#dec2a0]/25 transition-all"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group">
                <h2 className="font-headline text-lg font-bold text-[#dec2a0] truncate leading-tight">
                  {selected.name}
                </h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-white/20 hover:text-[#dec2a0]/60 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                </button>
              </div>
            )}
            <p className="font-body text-[10px] text-white/30 uppercase tracking-wider mt-0.5">
              {selected.sex} · Gen {selected.generation} · {selected.lifecycle}
            </p>
          </div>

          {/* Controls */}
          <div className="flex gap-1.5 shrink-0">
            {selected.sex !== 'PREDATOR' && (
              <button
                onClick={() => onBiography(selected.id)}
                title="View Biography"
                className="w-7 h-7 rounded-lg bg-white/4 border border-white/6 flex items-center justify-center text-white/30 hover:text-[#dec2a0] hover:border-[#dec2a0]/20 transition-all"
              >
                <span className="material-symbols-outlined text-sm">menu_book</span>
              </button>
            )}
            <button
              onClick={() => onZap(selected.id)}
              title="Remove specimen"
              className="w-7 h-7 rounded-lg bg-white/4 border border-[#ffb4ab]/12 flex items-center justify-center text-[#ffb4ab]/40 hover:text-[#ffb4ab] hover:border-[#ffb4ab]/30 hover:bg-[#ffb4ab]/8 transition-all"
            >
              <span className="material-symbols-outlined text-sm">bolt</span>
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: 'Age', value: `${ageInYears}yr` },
            { label: 'Offspring', value: `${selected.offspring_count}` },
            { label: 'Action', value: ACTION_LABELS[selected.last_action] || 'Idle', small: true }
          ].map(({ label, value, small }) => (
            <div key={label} className="bg-white/3 border border-white/5 rounded-lg px-2 py-1.5 text-center">
              <span className="text-[8px] text-white/25 font-body uppercase tracking-wider block mb-0.5">{label}</span>
              <span className={`font-headline font-semibold text-white/60 leading-tight block ${small ? 'text-[9px]' : 'text-xs'}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* ── Active Drive ── */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/3 border border-white/5">
          <span className={`material-symbols-outlined text-lg ${drive.color}`}>{drive.icon}</span>
          <div>
            <span className="text-[9px] text-white/25 font-body uppercase tracking-wider block">Current Drive</span>
            <span className={`text-xs font-headline font-semibold ${drive.color}`}>{drive.label}</span>
          </div>
        </div>

        {/* ── Physical Needs ── */}
        <div>
          <h3 className="text-[9px] text-white/25 font-body uppercase tracking-[0.15em] mb-2.5">Physical Needs</h3>
          <div className="space-y-2.5">
            {/* Energy */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-body text-white/40">Energy</span>
                <span className={`text-[10px] font-headline font-bold tabular-nums ${
                  energyPct < 25 ? 'text-[#ffb4ab]' : energyPct < 50 ? 'text-amber-400' : 'text-[#8da89b]'
                }`}>
                  {energyPct}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/6 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    energyPct < 25 ? 'bg-[#ffb4ab]/70' : energyPct < 50 ? 'bg-amber-400/70' : 'bg-[#8da89b]/70'
                  }`}
                  style={{ width: `${energyPct}%` }}
                />
              </div>
            </div>
            {/* Hydration */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-body text-white/40">Hydration</span>
                <span className={`text-[10px] font-headline font-bold tabular-nums ${
                  hydrationPct < 25 ? 'text-[#ffb4ab]' : hydrationPct < 50 ? 'text-blue-300' : 'text-[#c0c6de]'
                }`}>
                  {hydrationPct}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/6 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    hydrationPct < 25 ? 'bg-[#ffb4ab]/70' : hydrationPct < 50 ? 'bg-blue-300/70' : 'bg-[#c0c6de]/70'
                  }`}
                  style={{ width: `${hydrationPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Chemical Dials ── */}
        <div>
          <h3 className="text-[9px] text-white/25 font-body uppercase tracking-[0.15em] mb-3">Brain Chemistry</h3>
          <div className="grid grid-cols-4 gap-1">
            <ChemCylinder
              label="DA"
              value={selected.dopamine}
              fillColor="#dec2a0"
              borderColor="rgba(222,194,160,0.2)"
              glowClass="glow-gold"
              duration="3.2s"
              bubbleDelays={['0s', '1.1s']}
            />
            <ChemCylinder
              label="5-HT"
              value={selected.serotonin}
              fillColor="#c0c6de"
              borderColor="rgba(192,198,222,0.2)"
              glowClass="glow-lavender"
              duration="4.1s"
              bubbleDelays={['0.4s', '1.9s']}
            />
            <ChemCylinder
              label="ACh"
              value={selected.acetylcholine}
              fillColor="#8da89b"
              borderColor="rgba(141,168,155,0.2)"
              glowClass="glow-sage"
              duration="2.7s"
              bubbleDelays={['0.8s', '2.3s']}
            />
            <ChemCylinder
              label="CRT"
              value={selected.cortisol}
              fillColor="#ffb4ab"
              borderColor="rgba(255,180,171,0.2)"
              glowClass="glow-terracotta"
              duration="3.8s"
              bubbleDelays={['0.2s', '1.6s']}
            />
          </div>
          {/* Legend */}
          <div className="flex justify-between mt-1.5 px-1">
            {['Dopamine', 'Serotonin', 'A-Choline', 'Cortisol'].map(l => (
              <span key={l} className="text-[7px] text-white/18 font-body uppercase tracking-[0.05em] text-center" style={{ width: '25%' }}>{l}</span>
            ))}
          </div>
        </div>

        {/* ── Genetic Traits ── */}
        <div>
          <h3 className="text-[9px] text-white/25 font-body uppercase tracking-[0.15em] mb-2.5">Genetic Traits</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: 'Speed', value: selected.speed_trait, max: 12, unit: '' },
              { label: 'Vision', value: selected.vision_trait, max: 300, unit: 'px' },
              { label: 'Size', value: selected.size_trait, max: 25, unit: '' },
              { label: 'Metabolism', value: selected.metabolism_trait, max: 2, unit: 'x' },
            ].map(({ label, value, max, unit }) => {
              const pct = Math.min(100, (value / max) * 100);
              return (
                <div key={label} className="bg-white/3 border border-white/5 rounded-lg p-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-[8px] text-white/25 font-body uppercase tracking-wider">{label}</span>
                    <span className="text-[9px] font-headline font-semibold text-white/50">{value.toFixed(1)}{unit}</span>
                  </div>
                  <div className="h-0.5 w-full bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#dec2a0]/40 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Lineage ── */}
        {(selected.parent1_name || selected.parent2_name) && (
          <div>
            <h3 className="text-[9px] text-white/25 font-body uppercase tracking-[0.15em] mb-2">Lineage</h3>
            <div className="flex flex-wrap gap-1.5 items-center text-[10px] font-body">
              {selected.parent1_name && (
                <span className="px-2 py-0.5 bg-white/4 border border-white/6 rounded-lg text-white/40">{selected.parent1_name}</span>
              )}
              {selected.parent1_name && selected.parent2_name && (
                <span className="text-white/15">×</span>
              )}
              {selected.parent2_name && (
                <span className="px-2 py-0.5 bg-white/4 border border-white/6 rounded-lg text-white/40">{selected.parent2_name}</span>
              )}
            </div>
          </div>
        )}

        {/* ── Connectome ── */}
        <div>
          <h3 className="text-[9px] text-white/25 font-body uppercase tracking-[0.15em] mb-2">Neural Connectome</h3>
          <div className="rounded-xl bg-white/2 border border-white/5 overflow-hidden p-2">
            <svg className="w-full" viewBox="0 0 200 80">
              <defs>
                <filter id="cxglow">
                  <feGaussianBlur stdDeviation="1.2" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              {/* Links */}
              <path d="M 28,40 C 65,15 65,65 100,40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
              <path d="M 100,40 C 135,15 135,65 172,40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
              {/* Active sparks */}
              {selected.last_action !== 6 && (
                <>
                  <circle r="2.5" fill="#dec2a0" filter="url(#cxglow)">
                    <animateMotion dur="1.0s" repeatCount="indefinite" path="M 28,40 C 65,15 65,65 100,40" />
                  </circle>
                  <circle r="1.8" fill="#8da89b" filter="url(#cxglow)">
                    <animateMotion dur="1.6s" begin="0.3s" repeatCount="indefinite" path="M 100,40 C 135,15 135,65 172,40" />
                  </circle>
                </>
              )}
              {/* Nodes */}
              <circle cx="28" cy="40" r="5" fill="#8da89b" opacity="0.7" />
              <circle cx="100" cy="40" r="6.5" fill="#c0c6de" opacity="0.7" />
              <circle cx="172" cy="40" r="5" fill="#dec2a0" opacity="0.7" className={selected.last_action !== 6 ? 'animate-pulse' : ''} />
              <text x="28" y="56" fill="rgba(255,255,255,0.25)" fontSize="6.5" textAnchor="middle" fontFamily="Syne">Sense</text>
              <text x="100" y="56" fill="rgba(255,255,255,0.25)" fontSize="6.5" textAnchor="middle" fontFamily="Syne">BIB Core</text>
              <text x="172" y="56" fill="rgba(255,255,255,0.25)" fontSize="6.5" textAnchor="middle" fontFamily="Syne">Motor</text>
            </svg>
            <div className="text-center mt-1">
              <span className="text-[9px] font-body text-white/20">
                {ACTION_LABELS[selected.last_action] || 'Idle'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
