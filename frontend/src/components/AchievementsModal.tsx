import React, { useState } from 'react';

export interface Achievement {
  id: string;
  tier: 1 | 2 | 3 | 4;
  title: string;
  icon: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export const ACHIEVEMENTS_DEF: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  // Tier 1: Basic Instincts (Easy — First 5 Mins)
  { id: 'day_zero', tier: 1, title: 'Day Zero', icon: 'egg_alt', description: 'Spawn your first founder organism in God Mode.' },
  { id: 'first_forage', tier: 1, title: 'First Instinct', icon: 'restaurant', description: 'An organism eats its first food cluster via BIB action selection.' },
  { id: 'first_sip', tier: 1, title: 'First Sip', icon: 'water_drop', description: 'An organism drinks from a water pool.' },
  { id: 'firstborn', tier: 1, title: 'Firstborn', icon: 'child_care', description: 'Witness the natural birth of a Generation 2 child.' },
  { id: 'the_record', tier: 1, title: 'The Record', icon: 'menu_book', description: 'Open and inspect an organism’s auto-generated biography.' },

  // Tier 2: Natural Hard (Happens naturally over time)
  { id: 'centenarian', tier: 2, title: 'The Centenarian', icon: 'elderly', description: 'An organism reaches 80 biological years old and dies of natural causes.' },
  { id: 'gen_v_dynasty', tier: 2, title: 'Gen V Dynasty', icon: 'military_tech', description: 'Reach Generation 5 purely through natural ecosystem progression.' },
  { id: 'catastrophe_survivor', tier: 2, title: 'Catastrophe Survivor', icon: 'cyclone', description: 'An organism survives a full global Drought or Famine cycle without user help.' },
  { id: 'memory_consolidation', tier: 2, title: 'Memory Consolidation', icon: 'bedtime', description: 'Witness Hippocampal sleep replay trigger 10 times in a single lineage.' },
  { id: 'forest_lineage', tier: 2, title: 'Forest of Lineage', icon: 'nature_people', description: 'Reach 30 total historical specimens in the lineage tree.' },

  // Tier 3: Engineering Hard (Requires deliberate Director setup)
  { id: 'speedster_lineage', tier: 3, title: 'The Speedster Lineage', icon: 'speed', description: 'Selectively breed or engineer an organism lineage with Speed DNA > 9.5.' },
  { id: 'the_labyrinth', tier: 3, title: 'The Labyrinth', icon: 'grid_view', description: 'Build an obstacle maze and have an organism navigate to food without touching walls.' },
  { id: 'gladiator_arena', tier: 3, title: 'Gladiator Arena', icon: 'shield', description: 'Isolate 1 predator and 3 organisms in a walled arena where all 3 survive 1,000 ticks.' },
  { id: 'synchronized_coupling', tier: 3, title: 'Synchronized Coupling', icon: 'favorite', description: 'Carefully engineer conditions so 2 separate pairs mate within 2 seconds of each other.' },
  { id: 'bottleneck_survival', tier: 3, title: 'Bottleneck Survival', icon: 'hourglass_empty', description: 'Force an extreme population bottleneck (down to 2 creatures) and rebuild back to 10+.' },

  // Tier 4: Theoretical Miracles (Master Tier)
  { id: 'miracle_birth', tier: 4, title: 'The Miracle Birth', icon: 'auto_awesome', description: 'World population drops to 0, but a pregnant female dies a split second after birth, reviving the species.' },
  { id: 'flawless_flow', tier: 4, title: 'Flawless Flow State', icon: 'bolt', description: 'Maintain >0.95 Dopamine, >0.80 Acetylcholine, and <0.05 Cortisol while surrounded by hazards.' },
  { id: 'true_speciation', tier: 4, title: 'True Speciation', icon: 'hub', description: 'Evolve two sub-lineages in the same world whose average speeds or sizes differ by >200%.' },
  { id: 'super_matriarch', tier: 4, title: 'The Super-Matriarch', icon: 'workspace_premium', description: 'A single organism successfully sires and raises 15+ direct children in one lifetime.' },
  { id: 'millennium_civ', tier: 4, title: 'Millennium Civilization', icon: 'groups', description: 'Reach Generation 25 with 50+ living organisms active simultaneously on screen.' }
];

const TIER_COLORS = {
  1: { badge: 'bg-[#05f094]/15 border-[#05f094]/30 text-[#05f094]', glow: '#05f094' },
  2: { badge: 'bg-[#dec2a0]/15 border-[#dec2a0]/30 text-[#dec2a0]', glow: '#dec2a0' },
  3: { badge: 'bg-[#ffb4ab]/15 border-[#ffb4ab]/30 text-[#ffb4ab]', glow: '#ffb4ab' },
  4: { badge: 'bg-[#c0c6de]/15 border-[#c0c6de]/30 text-[#c0c6de]', glow: '#c0c6de' }
};

interface AchievementsModalProps {
  unlockedState: Record<string, string>; // achievement_id -> unlocked_timestamp
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ unlockedState, onClose }) => {
  const [selectedTier, setSelectedTier] = useState<number | 'ALL'>('ALL');

  const totalCount = ACHIEVEMENTS_DEF.length;
  const unlockedCount = Object.keys(unlockedState).length;
  const percent = Math.round((unlockedCount / totalCount) * 100);

  const filtered = ACHIEVEMENTS_DEF.filter(a => selectedTier === 'ALL' || a.tier === selectedTier);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0,12,6,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="glass-overlay rounded-3xl max-w-3xl w-full p-7 max-h-[85vh] flex flex-col border border-white/10 shadow-2xl animate-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#dec2a0]/15 border border-[#dec2a0]/30 flex items-center justify-center text-[#dec2a0]">
              <span className="material-symbols-outlined text-xl">emoji_events</span>
            </div>
            <div>
              <h2 className="font-headline text-lg font-bold text-[#dec2a0] uppercase tracking-wider">Director Trophies</h2>
              <p className="font-body text-[11px] text-white/40">Master 20 biological & neural milestones of Project Cambrian</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Overall Progress Bar */}
        <div className="p-4 rounded-2xl bg-white/4 border border-white/8 mb-5">
          <div className="flex justify-between items-center text-xs font-headline mb-2">
            <span className="text-white/60">Global Milestone Progress</span>
            <span className="font-bold text-[#dec2a0]">{unlockedCount} / {totalCount} ({percent}%)</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${percent}%`,
                background: 'linear-gradient(90deg, #05f094, #dec2a0)'
              }}
            />
          </div>
        </div>

        {/* Tier Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: 'All Trophies (20)' },
            { id: 1, label: 'Tier 1 · Basic' },
            { id: 2, label: 'Tier 2 · Natural Hard' },
            { id: 3, label: 'Tier 3 · Engineering' },
            { id: 4, label: 'Tier 4 · Miracles' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTier(t.id as any)}
              className={`px-3 py-1.5 rounded-xl font-headline text-[10px] font-semibold tracking-wider whitespace-nowrap transition-all ${
                selectedTier === t.id
                  ? 'bg-[#dec2a0]/20 border border-[#dec2a0]/40 text-[#dec2a0]'
                  : 'bg-white/3 border border-white/6 text-white/40 hover:border-white/12 hover:text-white/70'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(ach => {
            const isUnlocked = Boolean(unlockedState[ach.id]);
            const colors = TIER_COLORS[ach.tier];

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  isUnlocked
                    ? 'bg-white/6 border-white/15 shadow-lg'
                    : 'bg-white/2 border-white/5 opacity-50 grayscale'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 transition-colors ${
                    isUnlocked ? colors.badge : 'bg-white/4 border-white/8 text-white/20'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{ach.icon}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className={`font-headline text-xs font-bold ${isUnlocked ? 'text-white' : 'text-white/40'}`}>
                      {ach.title}
                    </h4>
                    <span className={`text-[8px] font-headline font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${colors.badge}`}>
                      T{ach.tier}
                    </span>
                  </div>

                  <p className="font-body text-[10px] text-white/45 leading-relaxed mb-1.5">
                    {ach.description}
                  </p>

                  <div className="text-[8px] font-headline text-white/25">
                    {isUnlocked ? `Unlocked ${unlockedState[ach.id]}` : 'Locked'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
