import { useEffect, useState } from 'react';
import type { Level } from '../../lib/typing';

type DailyChallengeProps = {
  level: Level;
  isDone: boolean;
  onStart: () => void;
};

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = String(Math.floor(diff / 3_600_000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3_600_000) / 60_000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60_000) / 1000)).padStart(2, '0');
      setTimeLeft(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return timeLeft;
}

const diffBadge: Record<string, { color: string; bg: string; border: string }> = {
  Easy:   { color: '#39ff14', bg: 'rgba(57,255,20,0.1)',   border: 'rgba(57,255,20,0.25)' },
  Medium: { color: '#00f5ff', bg: 'rgba(0,245,255,0.1)',   border: 'rgba(0,245,255,0.25)' },
  Hard:   { color: '#ff3cac', bg: 'rgba(255,60,172,0.1)',  border: 'rgba(255,60,172,0.25)' },
};

export default function DailyChallenge({ level, isDone, onStart }: DailyChallengeProps) {
  const countdown = useCountdown();
  const db = diffBadge[level.difficulty] ?? diffBadge.Medium;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4"
      style={{
        background: isDone
          ? 'rgba(57,255,20,0.04)'
          : 'linear-gradient(135deg, rgba(255,183,3,0.06), rgba(255,60,172,0.04))',
        border: `1px solid ${isDone ? 'rgba(57,255,20,0.2)' : 'rgba(255,183,3,0.25)'}`,
        boxShadow: isDone ? 'none' : '0 0 25px rgba(255,183,3,0.08)',
      }}
    >
      {/* Top accent */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: isDone
            ? 'linear-gradient(90deg, transparent, #39ff14, transparent)'
            : 'linear-gradient(90deg, transparent, #ffb703 40%, #ff3cac, transparent)',
        }}
      />

      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{isDone ? '✅' : '⭐'}</span>
          <div>
            <p
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{ color: isDone ? '#39ff14' : '#ffb703' }}
            >
              {isDone ? 'Completed' : 'Daily Challenge'}
            </p>
            <p className="text-sm font-bold text-white">{level.title}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[9px] text-slate-600 uppercase tracking-wider">Resets in</p>
          <p
            className="text-sm font-black tabular-nums"
            style={{ color: isDone ? 'rgba(100,116,139,0.5)' : '#ffb703', fontFamily: "'JetBrains Mono', monospace" }}
          >
            {countdown}
          </p>
        </div>
      </div>

      {/* Level info */}
      <div className="mb-3 flex items-center gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[9px] font-bold"
          style={{ background: db.bg, border: `1px solid ${db.border}`, color: db.color }}
        >
          {level.difficulty}
        </span>
        <span className="text-[10px] text-slate-600">{level.world}</span>
      </div>

      {/* Bonus XP badge */}
      <div
        className="mb-3 flex items-center gap-2 rounded-lg px-3 py-1.5"
        style={{ background: 'rgba(255,183,3,0.07)', border: '1px solid rgba(255,183,3,0.18)' }}
      >
        <span className="text-sm">🎁</span>
        <p className="text-xs font-semibold" style={{ color: '#ffb703' }}>
          {isDone ? 'Bonus XP claimed — come back tomorrow!' : '+200 Bonus XP for completing today'}
        </p>
      </div>

      {/* Action */}
      {!isDone && (
        <button
          onClick={onStart}
          className="w-full rounded-xl py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, rgba(255,183,3,0.15), rgba(255,60,172,0.1))',
            border: '1px solid rgba(255,183,3,0.35)',
            color: '#ffb703',
            boxShadow: '0 0 15px rgba(255,183,3,0.1)',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(255,183,3,0.25), rgba(255,60,172,0.15))'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(255,183,3,0.15), rgba(255,60,172,0.1))'; }}
        >
          ⭐ Play Daily Challenge
        </button>
      )}
    </div>
  );
}
