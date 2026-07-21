

type Player = {
  id: string;
  username: string;
  avatarId: string;
  progress: number;
  wpm: number;
  finished: boolean;
  rank?: number;
  accuracy?: number;
};

type RaceTrackProps = {
  players: Player[];
};

const AVATAR_EMOJIS: Record<string, string> = {
  knight: '🛡️',
  wizard: '🔮',
  rogue: '🗡️',
  ranger: '🏹',
  cleric: '❇️',
};

const RANK_MEDALS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
  4: '🏅',
};

export default function RaceTrack({ players }: RaceTrackProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-4">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
        🏰 Live Race Track
      </h3>

      <div className="space-y-3.5">
        {players.map((player) => {
          const emoji = AVATAR_EMOJIS[player.avatarId] || '🛡️';
          return (
            <div key={player.id} className="relative">
              {/* Lane Info Header */}
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-1 px-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono text-slate-600">
                    {player.finished && player.rank ? RANK_MEDALS[player.rank] || `#${player.rank}` : '🏃'}
                  </span>
                  <span className="font-bold text-slate-300 truncate">{player.username}</span>
                  <span className="rounded-full px-1.5 py-0.5 text-[8px] bg-slate-900 text-slate-500 uppercase">
                    {player.avatarId}
                  </span>
                </div>
                <span className="font-mono text-cyan-400 font-bold">
                  {player.finished ? `${player.wpm} WPM (Done)` : `${player.wpm} WPM · ${player.progress}%`}
                </span>
              </div>

              {/* Lane Track Grid */}
              <div className="relative h-6 w-full rounded-lg bg-slate-900/40 border border-slate-900 overflow-hidden">
                {/* Lane Dividers */}
                <div className="absolute inset-y-0 right-4 w-px bg-slate-800 border-dashed" title="Finish Line" />
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent pointer-events-none" />

                {/* Avatar Slider */}
                <div
                  className="absolute inset-y-0 flex items-center transition-all duration-300 ease-out"
                  style={{
                    left: `calc(${player.progress}% - 20px)`,
                    // Bind within track boundaries
                    marginLeft: player.progress === 0 ? '4px' : '0px',
                  }}
                >
                  <div
                    className={`h-5 w-5 rounded-md flex items-center justify-center text-sm transition-transform ${
                      player.finished
                        ? 'bg-emerald-500/10 border border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)] scale-[1.1]'
                        : 'bg-slate-950 border border-slate-800'
                    }`}
                  >
                    {emoji}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
