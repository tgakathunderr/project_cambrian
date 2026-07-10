import React from 'react';

interface ZapConfirmProps {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ZapConfirmModal: React.FC<ZapConfirmProps> = ({ name, onConfirm, onCancel }) => (
  <div
    className="fixed inset-0 z-[95] flex items-center justify-center animate-fade-in"
    style={{ background: 'rgba(0,12,6,0.65)', backdropFilter: 'blur(6px)' }}
    onClick={onCancel}
  >
    <div
      className="glass-overlay rounded-2xl w-72 p-6 animate-modal"
      onClick={e => e.stopPropagation()}
    >
      {/* Icon */}
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 mx-auto mb-4">
        <span className="material-symbols-outlined text-[#ffb4ab] text-xl">bolt</span>
      </div>

      <h3 className="font-headline text-base font-semibold text-white/80 text-center mb-1">
        Remove from Biosphere?
      </h3>
      <p className="font-body text-[12px] text-white/35 text-center leading-relaxed mb-5">
        <span className="text-[#dec2a0]">{name}</span> will be permanently removed.
        Its biography will be preserved.
      </p>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl bg-white/4 text-white/40 font-headline text-sm hover:bg-white/8 hover:text-white/60 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2 rounded-xl bg-[#ffb4ab]/12 text-[#ffb4ab] font-headline text-sm font-semibold hover:bg-[#ffb4ab]/22 transition-all"
        >
          Remove
        </button>
      </div>
    </div>
  </div>
);
