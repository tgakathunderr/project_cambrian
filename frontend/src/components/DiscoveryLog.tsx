import React, { useEffect, useRef } from 'react';

interface LogEntry {
  timestamp: number;
  years: number;
  category: string;
  message: string;
  organism_id?: string;
}

interface DiscoveryLogProps {
  logs: LogEntry[];
  onDeathClick?: (orgId: string) => void;
}

const CATEGORY_STYLES: Record<string, { badge: string; dot: string }> = {
  EVOLUTION: {
    badge: 'bg-[#dec2a0]/15 text-[#dec2a0] border-[#dec2a0]/25',
    dot: 'bg-[#dec2a0]'
  },
  DEATH: {
    badge: 'bg-[#ffb4ab]/15 text-[#ffb4ab] border-[#ffb4ab]/25',
    dot: 'bg-[#ffb4ab]'
  },
  BEHAVIOR: {
    badge: 'bg-[#8da89b]/15 text-[#8da89b] border-[#8da89b]/25',
    dot: 'bg-[#8da89b]'
  },
  SYSTEM: {
    badge: 'bg-white/8 text-white/50 border-white/10',
    dot: 'bg-white/30'
  }
};

export const DiscoveryLog: React.FC<DiscoveryLogProps> = ({ logs, onDeathClick }) => {
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div className="glass-panel rounded-2xl flex flex-col overflow-hidden" style={{ maxHeight: '160px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#dec2a0] animate-ping" />
          <span className="font-headline text-[10px] font-bold text-[#dec2a0] uppercase tracking-[0.15em]">
            Discovery Log
          </span>
        </div>
        <span className="text-[9px] text-white/25 font-body uppercase tracking-wider">
          {logs.length} events
        </span>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full py-4">
            <span className="text-[11px] text-white/20 font-body">Watching the biosphere...</span>
          </div>
        ) : (
          logs.map((log, idx) => {
            const styles = CATEGORY_STYLES[log.category] || CATEGORY_STYLES.SYSTEM;
            const isClickable = log.category === 'DEATH' && log.organism_id && onDeathClick;

            return (
              <div
                key={idx}
                className={`flex items-start gap-2.5 px-2 py-1.5 rounded-lg text-[11px] font-body transition-all animate-log-appear ${
                  isClickable
                    ? 'cursor-pointer hover:bg-white/5 hover:ring-1 hover:ring-[#ffb4ab]/20'
                    : 'hover:bg-white/3'
                }`}
                style={{ animationDelay: `${Math.min(idx * 0.02, 0.3)}s` }}
                onClick={() => isClickable && onDeathClick!(log.organism_id!)}
              >
                {/* Year stamp */}
                <span className="text-[9px] text-white/30 font-headline font-semibold shrink-0 mt-0.5 w-8">
                  {log.years.toFixed(1)}y
                </span>

                {/* Category badge */}
                <span className={`px-1.5 py-0.5 border rounded-full text-[8px] font-headline font-bold uppercase tracking-wider shrink-0 ${styles.badge}`}>
                  {log.category}
                </span>

                {/* Message */}
                <p className="text-white/65 flex-1 leading-relaxed">
                  {log.message}
                </p>

                {/* Clickable indicator */}
                {isClickable && (
                  <span className="material-symbols-outlined text-[#ffb4ab]/50 text-sm shrink-0 mt-0.5">
                    chevron_right
                  </span>
                )}
              </div>
            );
          })
        )}
        <div ref={feedEndRef} />
      </div>
    </div>
  );
};
