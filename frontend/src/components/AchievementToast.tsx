import React, { useEffect } from 'react';
import type { Achievement } from './AchievementsModal';

interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onDismiss }) => {
  useEffect(() => {
    if (!achievement) return;
    const timer = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timer);
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[130] animate-bounce-in">
      <div
        className="glass-overlay rounded-2xl p-4 border border-[#dec2a0]/40 shadow-2xl flex items-center gap-3.5 max-w-sm"
        style={{
          background: 'rgba(0, 12, 6, 0.92)',
          boxShadow: '0 0 30px rgba(222, 194, 160, 0.25)',
          backdropFilter: 'blur(12px)'
        }}
      >
        {/* Trophy icon */}
        <div className="w-11 h-11 rounded-xl bg-[#dec2a0]/20 border border-[#dec2a0]/40 flex items-center justify-center text-[#dec2a0] flex-shrink-0">
          <span className="material-symbols-outlined text-2xl animate-pulse">{achievement.icon}</span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="text-[8px] font-headline font-bold text-[#dec2a0] uppercase tracking-widest mb-0.5">
            🏆 Trophy Unlocked · Tier {achievement.tier}
          </div>
          <h4 className="font-headline text-xs font-bold text-white truncate">{achievement.title}</h4>
          <p className="font-body text-[10px] text-white/50 leading-snug line-clamp-2">{achievement.description}</p>
        </div>

        {/* Close */}
        <button
          onClick={onDismiss}
          className="text-white/20 hover:text-white/60 transition-colors p-1"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
};
