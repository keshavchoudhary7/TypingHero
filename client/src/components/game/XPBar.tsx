import { useEffect, useRef } from 'react';
import { getHeroRank, HERO_RANKS, type HeroRank } from '../../lib/xp';

type XPBarProps = {
  totalXp: number;
  justEarned?: number; // flashes when set > 0
  leveledUp?: HeroRank | null;
};

export default function XPBar({ totalXp, justEarned = 0, leveledUp = null }: XPBarProps) {
  const rank = getHeroRank(totalXp);
  const fillRef = useRef<HTMLDivElement | null>(null);

  // Animate bar fill
  useEffect(() => {
    if (!fillRef.current) return;
    fillRef.current.style.width = `${rank.progressPct}%`;
  }, [rank.progressPct]);

  const isLegend = rank.maxXp === Infinity;

  return (
    <div className="relative">
      {/* Level-up banner */}
      {leveledUp && (
        <div
          className="absolute -top-10 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2 text-center"
          style={{
            background: `linear-gradient(135deg, rgba(10,14,28,0.95), rgba(20,26,50,0.95))`,
            border: `1px solid ${leveledUp.color}55`,
            boxShadow: `0 0 30px ${leveledUp.color}40`,
            animation: 'level-up-burst 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: leveledUp.color, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            {leveledUp.icon} Level Up! → {leveledUp.title}
          </span>
        </div>
      )}

      <div
        className="relative overflow-hidden rounded-xl p-3"
        style={{
          background: 'rgba(10,14,28,0.85)',
          border: `1px solid ${rank.color}30`,
          boxShadow: `0 0 15px ${rank.color}15`,
        }}
      >
        {/* Top accent */}
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${rank.color}, transparent)` }} />

        {/* Header: rank icon + title + XP label */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
              style={{ background: `${rank.color}18`, border: `1px solid ${rank.color}35` }}
            >
              {rank.icon}
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(100,116,139,0.7)' }}>
                Hero Level {rank.level}
              </p>
              <p className="text-sm font-black" style={{ color: rank.color, textShadow: `0 0 10px ${rank.color}60` }}>
                {rank.title}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[9px] text-slate-600 uppercase tracking-wider">Total XP</p>
            <p
              className="text-sm font-black tabular-nums"
              style={{ color: rank.color, fontFamily: "'JetBrains Mono', monospace", textShadow: `0 0 8px ${rank.color}50` }}
            >
              {totalXp.toLocaleString()}
            </p>
            {justEarned > 0 && (
              <p
                className="text-[10px] font-bold"
                style={{ color: '#39ff14', animation: 'xp-float 1.5s ease-out forwards' }}
              >
                +{justEarned} XP
              </p>
            )}
          </div>
        </div>

        {/* XP progress bar */}
        {isLegend ? (
          <div
            className="h-2 w-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${rank.color}, #ffffff)`, boxShadow: `0 0 10px ${rank.color}` }}
          />
        ) : (
          <div>
            <div
              className="relative h-2 overflow-hidden rounded-full"
              style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.5)' }}
            >
              <div
                ref={fillRef}
                className="h-full rounded-full"
                style={{
                  width: '0%',
                  background: `linear-gradient(90deg, ${rank.color}, ${HERO_RANKS[Math.min(rank.level, 7)].color})`,
                  boxShadow: `0 0 8px ${rank.color}80`,
                  transition: 'width 0.8s cubic-bezier(0.34, 1.2, 0.64, 1)',
                }}
              />
              {/* Shimmer when earning XP */}
              {justEarned > 0 && (
                <div
                  className="absolute inset-0 rounded-full opacity-40"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 0.8s ease-out',
                  }}
                />
              )}
            </div>
            <div className="mt-1 flex justify-between text-[9px] text-slate-700">
              <span>{rank.xpIntoLevel.toLocaleString()} XP</span>
              <span>{rank.xpNeeded.toLocaleString()} to next rank</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
