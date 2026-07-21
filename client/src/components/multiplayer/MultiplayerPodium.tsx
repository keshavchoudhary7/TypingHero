import type { Room } from '../../lib/useMultiplayerSocket';

type MultiplayerPodiumProps = {
  room: Room;
  currentUsername: string;
};

export default function MultiplayerPodium({ room, currentUsername }: MultiplayerPodiumProps) {
  const sortedPlayers = [...room.players].sort((a, b) => (a.rank || 99) - (b.rank || 99));

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-[#0a0e1c]/90 p-8 space-y-6 shadow-2xl backdrop-blur-md">
      <div className="text-center border-b border-slate-800 pb-4">
        <span className="text-4xl">🏆</span>
        <h3 className="text-xl font-black uppercase tracking-[0.15em] text-indigo-400 mt-2">
          Race Leaderboard Podiums
        </h3>
        <p className="mt-1 text-xs text-slate-500 font-mono">
          Final Net-Adjusted WPM & Accuracy Results
        </p>
      </div>

      <div className="space-y-3">
        {sortedPlayers.map((p, idx) => (
          <div
            key={p.id}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              p.username === currentUsername
                ? 'border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                : 'border-slate-800/80 bg-slate-950/60'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="text-2xl font-bold font-mono">
                {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank || idx + 1}`}
              </span>
              <div>
                <span className="font-bold text-slate-100 font-mono text-sm block truncate">{p.username}</span>
                <span className="text-[10px] text-slate-500 font-mono uppercase">{p.avatarId}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-slate-400">{p.accuracy}% Acc</span>
              <span className="text-cyan-400 font-black text-sm">{p.wpm} WPM</span>
              <span className="text-slate-500 font-bold">
                {p.timeMs ? `${(p.timeMs / 1000).toFixed(2)}s` : '—'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
