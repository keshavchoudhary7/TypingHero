type StreakBadgeProps = {
  streak: number;
  atRisk?: boolean;
  broken?: boolean;
  compact?: boolean;
};

export default function StreakBadge({ streak, atRisk = false, broken = false, compact = false }: StreakBadgeProps) {
  const isZero = streak === 0;
  const color  = broken || isZero ? '#475569' : atRisk ? '#ffb703' : streak >= 7 ? '#ff3cac' : streak >= 3 ? '#ff6b35' : '#ffb703';
  const glow   = broken || isZero ? 'none' : atRisk ? 'rgba(255,183,3,0.4)' : streak >= 7 ? 'rgba(255,60,172,0.5)' : 'rgba(255,107,53,0.4)';
  const bg     = broken || isZero ? 'rgba(30,41,59,0.5)' : atRisk ? 'rgba(255,183,3,0.08)' : 'rgba(255,107,53,0.08)';
  const border = broken || isZero ? 'rgba(30,41,59,0.5)' : atRisk ? 'rgba(255,183,3,0.3)' : streak >= 7 ? 'rgba(255,60,172,0.35)' : 'rgba(255,107,53,0.3)';
  const icon   = broken ? '💔' : isZero ? '🔥' : atRisk ? '⚠️' : streak >= 14 ? '🌋' : streak >= 7 ? '🔥' : '🔥';
  const pulsing = !broken && !isZero && streak >= 3;

  if (compact) {
    return (
      <div
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
        style={{ background: bg, border: `1px solid ${border}`, boxShadow: glow !== 'none' ? `0 0 10px ${glow}` : 'none' }}
      >
        <span style={{ fontSize: '0.85rem', animation: pulsing ? 'live-pulse 1.5s ease-in-out infinite' : 'none' }}>{icon}</span>
        <span className="text-xs font-black tabular-nums" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>
          {streak}
        </span>
        {atRisk && <span className="text-[9px] font-bold" style={{ color: '#ffb703' }}>!</span>}
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 text-center"
      style={{ background: bg, border: `1px solid ${border}`, boxShadow: glow !== 'none' ? `0 0 20px ${glow}` : 'none' }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}80, transparent)` }} />

      <div
        style={{ fontSize: '2rem', lineHeight: 1, animation: pulsing ? 'live-pulse 2s ease-in-out infinite' : 'none' }}
      >
        {icon}
      </div>

      <p
        className="mt-1 text-3xl font-black tabular-nums"
        style={{ color, fontFamily: "'JetBrains Mono', monospace", textShadow: glow !== 'none' ? `0 0 15px ${glow}` : 'none' }}
      >
        {streak}
      </p>
      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(100,116,139,0.6)' }}>
        Day Streak
      </p>

      {atRisk && !broken && (
        <p
          className="mt-1.5 rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{ background: 'rgba(255,183,3,0.12)', color: '#ffb703', border: '1px solid rgba(255,183,3,0.25)' }}
        >
          ⚠️ Play today to keep it!
        </p>
      )}
      {broken && streak <= 1 && (
        <p className="mt-1.5 text-[9px] text-slate-600">Start a new streak today</p>
      )}
    </div>
  );
}
