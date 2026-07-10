import React, { useEffect, useState } from 'react';

interface BiographyData {
  id: string;
  name: string;
  generation: number;
  sex: string;
  birth_season: string;
  parent1_name?: string;
  parent2_name?: string;
  death_reason: string;
  death_age_years: number;
  offspring_count: number;
  summary: string;
  life_events: Array<{ age_years: number; event: string }>;
  notable_traits: string[];
  raw_mutations: string[];
  traits: Record<string, number>;
}

interface BiographyCardProps {
  organismId: string | null;
  onClose: () => void;
}

const SEASON_ICONS: Record<string, string> = {
  SPRING: '🌱',
  SUMMER: '☀️',
  AUTUMN: '🍂',
  WINTER: '❄️'
};

const DEATH_COLORS: Record<string, string> = {
  STARVATION: 'text-amber-400',
  DEHYDRATION: 'text-blue-300',
  OLD_AGE: 'text-[#dec2a0]',
  PREDATION: 'text-[#ffb4ab]',
  ZAPPED: 'text-purple-300',
  ALIVE: 'text-[#8da89b]'
};

const DEATH_LABELS: Record<string, string> = {
  STARVATION: 'Starvation',
  DEHYDRATION: 'Dehydration',
  OLD_AGE: 'Natural Causes',
  PREDATION: 'Predation',
  ZAPPED: 'Director Intervention',
  ALIVE: 'Still Alive'
};

export const BiographyCard: React.FC<BiographyCardProps> = ({ organismId, onClose }) => {
  const [bio, setBio] = useState<BiographyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organismId) {
      setBio(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`http://127.0.0.1:8000/api/biography/${organismId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setBio(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load biography.');
        setLoading(false);
      });
  }, [organismId]);

  if (!organismId) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0, 12, 6, 0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      {/* Card */}
      <div
        className="glass-overlay rounded-3xl w-[520px] max-h-[82vh] flex flex-col overflow-hidden animate-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* Top gold band */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#dec2a0]/40 to-transparent" />

        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-6 pb-4">
          <div>
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-[#dec2a0]/30 border-t-[#dec2a0] rounded-full animate-spin" />
                <span className="text-white/40 font-body text-sm">Loading biography...</span>
              </div>
            ) : bio ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-headline uppercase tracking-[0.2em] text-[#dec2a0]/60">
                    Specimen Biography
                  </span>
                </div>
                <h2 className="font-headline text-2xl font-bold text-[#dec2a0] tracking-tight leading-none">
                  {bio.name}
                </h2>
                <p className="font-body text-[11px] text-white/40 mt-1 uppercase tracking-wider">
                  {bio.sex} · Gen {bio.generation} · {SEASON_ICONS[bio.birth_season] || ''} Born in {bio.birth_season?.toLowerCase() || 'unknown'}
                </p>
              </>
            ) : (
              <h2 className="font-headline text-xl text-white/50">No Biography Found</h2>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {bio && !loading && (
          <div className="flex-1 overflow-y-auto px-7 pb-7 space-y-5">
            {/* Cause of death / status */}
            <div className="flex items-center gap-3 py-2.5 px-4 rounded-xl bg-white/3 border border-white/5">
              <span className="material-symbols-outlined text-sm text-white/30">
                {bio.death_reason === 'ALIVE' ? 'favorite' : 'skull'}
              </span>
              <div>
                <span className="text-[9px] text-white/30 font-body uppercase tracking-wider block">Fate</span>
                <span className={`text-sm font-headline font-semibold ${DEATH_COLORS[bio.death_reason] || 'text-white/60'}`}>
                  {DEATH_LABELS[bio.death_reason] || bio.death_reason}
                </span>
              </div>
              <div className="ml-auto text-right">
                <span className="text-[9px] text-white/30 font-body uppercase tracking-wider block">Age</span>
                <span className="text-sm font-headline font-semibold text-white/70">{bio.death_age_years} yr</span>
              </div>
              <div className="text-right pl-4 border-l border-white/8">
                <span className="text-[9px] text-white/30 font-body uppercase tracking-wider block">Offspring</span>
                <span className="text-sm font-headline font-semibold text-white/70">{bio.offspring_count}</span>
              </div>
            </div>

            {/* Life narrative */}
            <div>
              <h3 className="font-headline text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 mb-2">
                Life Story
              </h3>
              <p className="font-body text-sm text-white/60 leading-relaxed">
                {bio.summary}
              </p>
            </div>

            {/* Lineage */}
            {(bio.parent1_name || bio.parent2_name) && (
              <div>
                <h3 className="font-headline text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 mb-2">
                  Lineage
                </h3>
                <div className="flex items-center gap-2 text-sm font-body text-white/50">
                  {bio.parent1_name && (
                    <span className="px-2.5 py-1 bg-white/5 border border-white/8 rounded-lg">{bio.parent1_name}</span>
                  )}
                  {bio.parent1_name && bio.parent2_name && (
                    <span className="text-white/25">×</span>
                  )}
                  {bio.parent2_name && (
                    <span className="px-2.5 py-1 bg-white/5 border border-white/8 rounded-lg">{bio.parent2_name}</span>
                  )}
                  {!bio.parent1_name && !bio.parent2_name && (
                    <span className="text-white/30 italic">Primordial ancestor — no known parents</span>
                  )}
                </div>
              </div>
            )}

            {/* Notable traits */}
            {bio.notable_traits && bio.notable_traits.length > 0 && (
              <div>
                <h3 className="font-headline text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 mb-2">
                  Notable Traits
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {bio.notable_traits.map((trait, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 border border-[#dec2a0]/20 bg-[#dec2a0]/5 text-[#dec2a0]/70 rounded-full text-[10px] font-headline"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mutations */}
            {bio.raw_mutations && bio.raw_mutations.length > 0 && (
              <div>
                <h3 className="font-headline text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 mb-2">
                  Genetic Mutations
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {bio.raw_mutations.map((m, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 border border-[#8da89b]/20 bg-[#8da89b]/5 text-[#8da89b]/70 rounded-full text-[10px] font-body"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Life events timeline */}
            {bio.life_events && bio.life_events.length > 0 && (
              <div>
                <h3 className="font-headline text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 mb-3">
                  Life Events
                </h3>
                <div className="relative pl-5">
                  {/* Timeline line */}
                  <div className="absolute left-1.5 top-0 bottom-0 w-px bg-white/8" />
                  <div className="space-y-3">
                    {bio.life_events.map((ev, i) => (
                      <div key={i} className="relative flex items-start gap-3">
                        <div className="absolute left-[-14px] top-1.5 w-1.5 h-1.5 rounded-full bg-[#dec2a0]/40 border border-[#dec2a0]/20" />
                        <div>
                          <span className="text-[9px] text-[#dec2a0]/40 font-headline uppercase tracking-wider block">
                            Age {ev.age_years}y
                          </span>
                          <p className="font-body text-[11px] text-white/50 leading-relaxed">{ev.event}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Genetic fingerprint */}
            {bio.traits && Object.keys(bio.traits).length > 0 && (
              <div>
                <h3 className="font-headline text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 mb-3">
                  Genetic Fingerprint
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'speed', label: 'Speed', max: 12, unit: '' },
                    { key: 'vision_range', label: 'Vision', max: 300, unit: 'px' },
                    { key: 'size', label: 'Body Size', max: 25, unit: '' },
                    { key: 'metabolism', label: 'Metabolism', max: 2, unit: 'x' },
                  ].map(({ key, label, max, unit }) => {
                    const val = bio.traits[key] || 0;
                    const pct = Math.min(100, (val / max) * 100);
                    return (
                      <div key={key} className="bg-white/3 border border-white/5 rounded-xl p-2.5">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[9px] text-white/35 font-body uppercase tracking-wider">{label}</span>
                          <span className="text-[10px] font-headline font-semibold text-white/55">{val.toFixed(1)}{unit}</span>
                        </div>
                        <div className="h-1 w-full bg-white/8 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#dec2a0]/50 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="px-7 py-6 text-center">
            <p className="text-sm text-white/40 font-body">{error}</p>
          </div>
        )}

        {/* Bottom gold band */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#dec2a0]/20 to-transparent" />
      </div>
    </div>
  );
};
