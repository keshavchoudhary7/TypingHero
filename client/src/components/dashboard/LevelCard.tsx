import { type Level } from '../../lib/typing';

type LevelCardProps = {
  level: Level;
  active: boolean;
  unlocked: boolean;
  stars: number;
  onSelect: () => void;
};

const difficultyConfig: Record<string, { color: string; bg: string; border: string }> = {
  Easy: { color: '#39ff14', bg: 'rgba(57,255,20,0.08)', border: 'rgba(57,255,20,0.2)' },
  Medium: { color: '#00f5ff', bg: 'rgba(0,245,255,0.08)', border: 'rgba(0,245,255,0.2)' },
  Hard: { color: '#ff3cac', bg: 'rgba(255,60,172,0.08)', border: 'rgba(255,60,172,0.2)' },
};

export default function LevelCard({ level, active, unlocked, stars, onSelect }: LevelCardProps) {
  const diff = difficultyConfig[level.difficulty] ?? difficultyConfig.Medium;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="level-card group relative w-full overflow-hidden rounded-xl border p-3 text-left transition-all duration-300"
      style={{
        background: active
          ? 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(191,95,255,0.06))'
          : unlocked
          ? 'rgba(10,14,28,0.8)'
          : 'rgba(5,7,14,0.6)',
        borderColor: active
          ? 'rgba(0,245,255,0.4)'
          : unlocked
          ? 'rgba(30,41,59,0.8)'
          : 'rgba(15,23,42,0.5)',
        boxShadow: active
          ? '0 0 20px rgba(0,245,255,0.15), inset 0 1px 0 rgba(0,245,255,0.1)'
          : 'none',
        opacity: unlocked ? 1 : 0.5,
        cursor: unlocked ? 'pointer' : 'not-allowed',
      }}
    >
      {active && (
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #00f5ff, transparent)' }}
        />
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(100,116,139,0.7)' }}>
            {level.world}
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-white">{level.title}</p>
        </div>
        <div className="shrink-0">
          {unlocked ? (
            <div className="flex items-center gap-0.5">
              {[1, 2, 3].map((s) => (
                <span
                  key={s}
                  className="text-xs"
                  style={{
                    color: s <= stars ? '#ffb703' : 'rgba(100,116,139,0.3)',
                    textShadow: s <= stars ? '0 0 8px rgba(255,183,3,0.6)' : 'none',
                  }}
                >
                  ★
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-600">🔒</span>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
          style={{ background: diff.bg, border: `1px solid ${diff.border}`, color: diff.color }}
        >
          {level.difficulty}
        </span>
        {active && (
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
            style={{ background: 'rgba(191,95,255,0.1)', border: '1px solid rgba(191,95,255,0.25)', color: '#bf5fff' }}
          >
            Active
          </span>
        )}
      </div>
    </button>
  );
}
