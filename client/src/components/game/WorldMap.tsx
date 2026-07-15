import type { Level } from '../../lib/typing';

type LevelResult = { accuracy: number; wpm: number; stars: number };

type WorldMapProps = {
  levels: Level[];
  completedLevels: number[];
  levelResults: Record<number, LevelResult>;
  activeLevelId: number;
  onSelectLevel: (levelId: number) => void;
};

// World themes
const worldConfig: Record<string, { color: string; glow: string; bg: string; border: string; icon: string; desc: string }> = {
  'Moonlit Forest': {
    color: '#39ff14',
    glow: 'rgba(57,255,20,0.3)',
    bg: 'rgba(57,255,20,0.05)',
    border: 'rgba(57,255,20,0.15)',
    icon: '🌲',
    desc: 'A peaceful forest lit by moonlight. Perfect for beginners.',
  },
  'Crystal Coast': {
    color: '#00f5ff',
    glow: 'rgba(0,245,255,0.3)',
    bg: 'rgba(0,245,255,0.05)',
    border: 'rgba(0,245,255,0.15)',
    icon: '🌊',
    desc: 'Shimmering waves demand steady rhythm and fluid motion.',
  },
  'Neon Circuit': {
    color: '#bf5fff',
    glow: 'rgba(191,95,255,0.3)',
    bg: 'rgba(191,95,255,0.05)',
    border: 'rgba(191,95,255,0.15)',
    icon: '⚡',
    desc: 'Electric circuits where every millisecond matters.',
  },
  'Nova Terminal': {
    color: '#ff3cac',
    glow: 'rgba(255,60,172,0.3)',
    bg: 'rgba(255,60,172,0.05)',
    border: 'rgba(255,60,172,0.15)',
    icon: '🚀',
    desc: 'The elite frontier — only the fastest survive.',
  },
};

const diffBadge: Record<string, { color: string; bg: string; border: string }> = {
  Easy:   { color: '#39ff14', bg: 'rgba(57,255,20,0.1)',   border: 'rgba(57,255,20,0.25)' },
  Medium: { color: '#00f5ff', bg: 'rgba(0,245,255,0.1)',   border: 'rgba(0,245,255,0.25)' },
  Hard:   { color: '#ff3cac', bg: 'rgba(255,60,172,0.1)',  border: 'rgba(255,60,172,0.25)' },
};

function StarRating({ stars, earned }: { stars: number; earned: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((s) => (
        <span
          key={s}
          style={{
            color: s <= earned ? '#ffb703' : 'rgba(100,116,139,0.25)',
            textShadow: s <= earned ? '0 0 8px rgba(255,183,3,0.7)' : 'none',
            fontSize: '0.75rem',
            transition: 'all 0.3s',
          }}
        >
          ★
        </span>
      ))}
      <span style={{ fontSize: '0.65rem', color: 'rgba(100,116,139,0.5)', marginLeft: '0.25rem' }}>
        {earned}/{stars}
      </span>
    </div>
  );
}

export default function WorldMap({ levels, completedLevels, levelResults, activeLevelId, onSelectLevel }: WorldMapProps) {
  // Group levels by world, preserving world order based on first appearance
  const worldOrder: string[] = [];
  const byWorld: Record<string, Level[]> = {};
  for (const level of levels) {
    if (!byWorld[level.world]) {
      byWorld[level.world] = [];
      worldOrder.push(level.world);
    }
    byWorld[level.world].push(level);
  }

  const isUnlocked = (levelId: number) => levelId === 1 || completedLevels.includes(levelId - 1);
  const isCompleted = (levelId: number) => completedLevels.includes(levelId);

  return (
    <div className="space-y-5">
      {worldOrder.map((worldName, worldIdx) => {
        const wc = worldConfig[worldName] ?? {
          color: '#94a3b8', glow: 'rgba(148,163,184,0.2)', bg: 'rgba(100,116,139,0.05)',
          border: 'rgba(100,116,139,0.15)', icon: '🌐', desc: '',
        };
        const worldLevels = byWorld[worldName];
        const clearedInWorld = worldLevels.filter(l => isCompleted(l.id)).length;
        const worldUnlocked = worldLevels.some(l => isUnlocked(l.id));

        return (
          <div
            key={worldName}
            className="overflow-hidden rounded-2xl"
            style={{
              background: worldUnlocked ? wc.bg : 'rgba(5,7,14,0.6)',
              border: `1px solid ${worldUnlocked ? wc.border : 'rgba(15,23,42,0.8)'}`,
              opacity: worldUnlocked ? 1 : 0.5,
            }}
          >
            {/* World header */}
            <div
              className="flex items-center justify-between gap-3 px-4 py-3"
              style={{
                borderBottom: `1px solid ${worldUnlocked ? wc.border : 'rgba(15,23,42,0.6)'}`,
                background: worldUnlocked
                  ? `linear-gradient(90deg, ${wc.bg}, transparent)`
                  : 'transparent',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                  style={{
                    background: worldUnlocked ? `rgba(0,0,0,0.3)` : 'rgba(15,23,42,0.5)',
                    border: `1px solid ${worldUnlocked ? wc.border : 'rgba(30,41,59,0.3)'}`,
                    boxShadow: worldUnlocked ? `0 0 10px ${wc.glow}` : 'none',
                  }}
                >
                  {worldUnlocked ? wc.icon : '🔒'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-black"
                      style={{ color: worldUnlocked ? wc.color : '#475569', textShadow: worldUnlocked ? `0 0 8px ${wc.glow}` : 'none' }}
                    >
                      {worldName}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                      style={{ background: 'rgba(0,0,0,0.3)', color: 'rgba(100,116,139,0.6)', border: '1px solid rgba(30,41,59,0.4)' }}
                    >
                      World {worldIdx + 1}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600">{wc.desc}</p>
                </div>
              </div>

              {/* World progress */}
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className="rounded-lg px-2.5 py-1 text-center"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(30,41,59,0.4)' }}
                >
                  <p className="text-[9px] text-slate-600 uppercase tracking-wider">Cleared</p>
                  <p
                    className="text-sm font-black tabular-nums"
                    style={{ color: worldUnlocked ? wc.color : '#475569', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {clearedInWorld}/{worldLevels.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Levels in this world */}
            <div className="divide-y" style={{ borderColor: 'rgba(15,23,42,0.5)' }}>
              {worldLevels.map((level) => {
                const unlocked = isUnlocked(level.id);
                const completed = isCompleted(level.id);
                const isActive = level.id === activeLevelId;
                const result = levelResults[level.id];
                const db = diffBadge[level.difficulty] ?? diffBadge.Medium;

                return (
                  <div
                    key={level.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-all duration-200"
                    style={{
                      background: isActive
                        ? `linear-gradient(90deg, ${wc.bg}, transparent)`
                        : 'transparent',
                      borderLeft: isActive ? `3px solid ${wc.color}` : '3px solid transparent',
                      cursor: unlocked ? 'pointer' : 'not-allowed',
                      opacity: unlocked ? 1 : 0.4,
                    }}
                    onClick={() => unlocked && onSelectLevel(level.id)}
                  >
                    {/* Level info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Status icon */}
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black"
                        style={{
                          background: completed
                            ? `rgba(57,255,20,0.12)`
                            : isActive
                            ? `${wc.bg}`
                            : 'rgba(15,23,42,0.6)',
                          border: `1px solid ${completed ? 'rgba(57,255,20,0.35)' : isActive ? wc.border : 'rgba(30,41,59,0.4)'}`,
                          color: completed ? '#39ff14' : isActive ? wc.color : '#475569',
                          boxShadow: completed ? '0 0 8px rgba(57,255,20,0.3)' : 'none',
                        }}
                      >
                        {completed ? '✓' : unlocked ? level.id : '🔒'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white truncate">{level.title}</span>
                          {isActive && (
                            <span
                              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                              style={{ background: `${wc.bg}`, border: `1px solid ${wc.border}`, color: wc.color }}
                            >
                              Active
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                            style={{ background: db.bg, border: `1px solid ${db.border}`, color: db.color }}
                          >
                            {level.difficulty}
                          </span>
                          {result && (
                            <span className="text-[10px] text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {result.wpm} WPM · {result.accuracy}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side: stars + replay */}
                    <div className="flex items-center gap-3 shrink-0">
                      {completed && result && (
                        <StarRating stars={3} earned={result.stars} />
                      )}
                      {unlocked && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onSelectLevel(level.id); }}
                          className="rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200"
                          style={{
                            background: isActive ? wc.bg : 'rgba(10,14,28,0.8)',
                            border: `1px solid ${isActive ? wc.border : 'rgba(30,41,59,0.6)'}`,
                            color: isActive ? wc.color : completed ? '#39ff14' : '#64748b',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = wc.bg;
                            (e.currentTarget as HTMLElement).style.borderColor = wc.border;
                            (e.currentTarget as HTMLElement).style.color = wc.color;
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = isActive ? wc.bg : 'rgba(10,14,28,0.8)';
                            (e.currentTarget as HTMLElement).style.borderColor = isActive ? wc.border : 'rgba(30,41,59,0.6)';
                            (e.currentTarget as HTMLElement).style.color = isActive ? wc.color : completed ? '#39ff14' : '#64748b';
                          }}
                        >
                          {isActive ? '▶ Playing' : completed ? '↺ Replay' : '▶ Start'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
