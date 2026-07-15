import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { XPGain } from '../../lib/xp';
import type { HeroRank } from '../../lib/xp';

type XPToastProps = {
  gain: XPGain | null;
  leveledUp: HeroRank | null;
  onDone: () => void;
};

export default function XPToast({ gain, leveledUp, onDone }: XPToastProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!gain || !ref.current) return undefined;
    const el = ref.current;

    gsap.fromTo(el, { y: 40, opacity: 0, scale: 0.85 }, {
      duration: 0.5, y: 0, opacity: 1, scale: 1, ease: 'expo.out',
    });
    gsap.to(el, {
      delay: 3, duration: 0.4, y: -20, opacity: 0, ease: 'power2.in',
      onComplete: onDone,
    });

    return () => { gsap.killTweensOf(el); };
  }, [gain, onDone]);

  if (!gain) return null;

  return (
    <div
      ref={ref}
      className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2"
      style={{ pointerEvents: 'none' }}
    >
      {/* Level-up celebration */}
      {leveledUp && (
        <div
          className="mb-2 overflow-hidden rounded-2xl px-6 py-4 text-center"
          style={{
            background: `linear-gradient(135deg, rgba(8,12,22,0.98), rgba(20,26,50,0.98))`,
            border: `2px solid ${leveledUp.color}55`,
            boxShadow: `0 0 50px ${leveledUp.color}40, 0 0 100px ${leveledUp.color}20`,
          }}
        >
          <div className="mb-1 text-3xl" style={{ animation: 'level-up-burst 0.7s cubic-bezier(0.34,1.56,0.64,1)' }}>
            {leveledUp.icon}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: leveledUp.color }}>
            Rank Up!
          </p>
          <p className="text-2xl font-black" style={{ color: leveledUp.color, textShadow: `0 0 20px ${leveledUp.color}` }}>
            {leveledUp.title}
          </p>
        </div>
      )}

      {/* XP breakdown card */}
      <div
        className="rounded-2xl px-5 py-4"
        style={{
          background: 'rgba(8,12,22,0.96)',
          border: '1px solid rgba(57,255,20,0.3)',
          boxShadow: '0 0 30px rgba(57,255,20,0.15)',
          minWidth: '240px',
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#39ff14' }}>XP Earned</p>
        </div>
        <div className="space-y-1 text-xs">
          {gain.base > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">Base reward</span>
              <span className="font-bold" style={{ color: '#00f5ff', fontFamily: "'JetBrains Mono', monospace" }}>+{gain.base}</span>
            </div>
          )}
          {gain.accuracyBonus > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">Accuracy bonus</span>
              <span className="font-bold" style={{ color: '#39ff14', fontFamily: "'JetBrains Mono', monospace" }}>+{gain.accuracyBonus}</span>
            </div>
          )}
          {gain.speedBonus > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">Speed bonus</span>
              <span className="font-bold" style={{ color: '#bf5fff', fontFamily: "'JetBrains Mono', monospace" }}>+{gain.speedBonus}</span>
            </div>
          )}
          {gain.dailyBonus > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">Daily challenge</span>
              <span className="font-bold" style={{ color: '#ffb703', fontFamily: "'JetBrains Mono', monospace" }}>+{gain.dailyBonus}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t pt-1" style={{ borderColor: 'rgba(30,41,59,0.7)' }}>
            <span className="font-bold text-white">Total</span>
            <span className="text-lg font-black" style={{ color: '#39ff14', fontFamily: "'JetBrains Mono', monospace", textShadow: '0 0 10px rgba(57,255,20,0.5)' }}>
              +{gain.total}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
