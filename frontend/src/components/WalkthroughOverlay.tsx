import React, { useState } from 'react';

interface WalkthroughOverlayProps {
  onComplete: () => void;
}

const STEPS = [
  {
    step: 1,
    title: "Welcome, Director",
    tag: "STEP 1 OF 4 · THE BIOSPHERE",
    icon: "public",
    accentColor: "#05f094",
    description: "Project Cambrian is a living digital terrarium. Every organism runs a biologically inspired brain (BIB) that perceives, learns, and fights for metabolic survival in real time.",
    actionHint: "Click anywhere on the world using God Mode tools to spawn organisms, plant trees, or add water pools."
  },
  {
    step: 2,
    title: "The Mind Inside",
    tag: "STEP 2 OF 4 · BRAIN TELEMETRY",
    icon: "psychology",
    accentColor: "#dec2a0",
    description: "Click any glowing organism to open its live brain chemistry panel. Watch Dopamine (Reward), Serotonin (Patience), Acetylcholine (Curiosity), and Cortisol (Fear) fluctuate live.",
    actionHint: "No hardcoded rules — behavior emerges dynamically from sparse brain math and homeostatic survival drives."
  },
  {
    step: 3,
    title: "Metabolic Urgency",
    tag: "STEP 3 OF 4 · SURVIVAL & DRIVES",
    icon: "ecg_heart",
    accentColor: "#ffb4ab",
    description: "Organisms consume energy and hydration each second. When hungry or thirsty, their Basal Ganglia selects forage or drink actions. If resources vanish, they face dehydration or starvation.",
    actionHint: "Drop Food clusters or paint Water pools using the top toolbar to sustain your population."
  },
  {
    step: 4,
    title: "Lineage & Legacy",
    tag: "STEP 4 OF 4 · EVOLUTION & BIOGRAPHIES",
    icon: "account_tree",
    accentColor: "#93c5fd",
    description: "When mature organisms meet, nature takes over. Children inherit and mutate DNA traits (speed, size, vision). Every specimen generates a complete post-mortem life story upon death.",
    actionHint: "Open the Lineage tab or click any death entry in the Discovery feed to read full specimen biographies."
  }
];

export const WalkthroughOverlay: React.FC<WalkthroughOverlayProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const stepData = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0, 12, 6, 0.78)', backdropFilter: 'blur(10px)' }}
    >
      <div className="glass-overlay rounded-3xl max-w-lg w-full p-8 border border-white/12 shadow-2xl relative overflow-hidden animate-modal">
        {/* Glow backdrop behind step icon */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500"
          style={{ background: stepData.accentColor }}
        />

        {/* Step Header / Tag */}
        <div className="flex justify-between items-center mb-5">
          <span
            className="text-[9px] font-headline font-bold uppercase tracking-widest px-3 py-1 rounded-full border transition-colors"
            style={{
              color: stepData.accentColor,
              borderColor: `${stepData.accentColor}40`,
              backgroundColor: `${stepData.accentColor}12`
            }}
          >
            {stepData.tag}
          </span>
          <button
            onClick={onComplete}
            className="text-[10px] font-body text-white/30 hover:text-white/60 transition-colors uppercase tracking-wider"
          >
            Skip Tutorial ↗
          </button>
        </div>

        {/* Icon & Title */}
        <div className="flex items-center gap-3.5 mb-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg transition-colors"
            style={{
              borderColor: `${stepData.accentColor}40`,
              backgroundColor: `${stepData.accentColor}15`,
              color: stepData.accentColor
            }}
          >
            <span className="material-symbols-outlined text-2xl">{stepData.icon}</span>
          </div>
          <div>
            <h2 className="font-headline text-xl font-bold text-white tracking-wide">{stepData.title}</h2>
            <div className="flex gap-1 mt-1">
              {STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === currentStep ? 'w-6' : 'w-2 bg-white/15'
                  }`}
                  style={{ backgroundColor: idx === currentStep ? stepData.accentColor : undefined }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="font-body text-xs text-white/70 leading-relaxed mb-4">
          {stepData.description}
        </p>

        {/* Action Hint Card */}
        <div className="p-3.5 rounded-2xl bg-white/4 border border-white/8 mb-6">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-sm text-[#dec2a0] mt-0.5">tips_and_updates</span>
            <p className="font-body text-[11px] text-[#dec2a0]/90 leading-snug">
              {stepData.actionHint}
            </p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2.5 rounded-xl font-headline text-xs font-semibold text-white/40 hover:text-white/70 disabled:opacity-0 disabled:pointer-events-none transition-all"
          >
            ← Back
          </button>

          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl font-headline text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 hover:scale-[1.02]"
            style={{
              backgroundColor: stepData.accentColor,
              color: '#000c06',
              boxShadow: `0 0 20px ${stepData.accentColor}40`
            }}
          >
            <span>{isLast ? "Enter Biosphere" : "Next Step"}</span>
            <span className="material-symbols-outlined text-sm">{isLast ? "rocket_launch" : "arrow_forward"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
