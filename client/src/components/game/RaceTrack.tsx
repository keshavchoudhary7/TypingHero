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

const RANK_BADGES: Record<number, { medal: string; text: string; style: string }> = {
  1: { medal: '🥇', text: '1ST', style: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  2: { medal: '🥈', text: '2ND', style: 'bg-slate-400/20 text-slate-200 border-slate-400/40' },
  3: { medal: '🥉', text: '3RD', style: 'bg-amber-700/20 text-amber-400 border-amber-700/40' },
  4: { medal: '🏅', text: '4TH', style: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
};

export default function RaceTrack({ players }: RaceTrackProps) {
  // Sort copy of players by progress / WPM to determine live standings
  const sortedByProgress = [...players].sort((a, b) => b.progress - a.progress || b.wpm - a.wpm);

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-[#080c1a]/90 p-5 shadow-[0_0_35px_rgba(79,70,229,0.1)] backdrop-blur-md space-y-4">
      {/* Speedway Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
          </span>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            🏎️ Live Speedway Arena
          </h3>
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
          {players.length} Racers Active
        </span>
      </div>

      {/* Racers Track Lanes */}
      <div className="space-y-4">
        {players.map((player) => {
          const emoji = AVATAR_EMOJIS[player.avatarId] || '🛡️';
          const liveRankIdx = sortedByProgress.findIndex((p) => p.id === player.id) + 1;
          const displayRank = player.rank || liveRankIdx;
          const rankInfo = RANK_BADGES[displayRank] || { medal: '⚡', text: `#${displayRank}`, style: 'bg-slate-800 text-slate-400 border-slate-700' };
          const clampProgress = Math.min(100, Math.max(0, player.progress));

          return (
            <div key={player.id} className="space-y-1.5">
              {/* Lane Info Bar */}
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold border ${rankInfo.style}`}>
                    <span>{rankInfo.medal}</span>
                    <span>{rankInfo.text}</span>
                  </span>
                  <span className="font-bold text-slate-200 truncate">{player.username}</span>
                  <span className="rounded-full px-2 py-0.5 text-[9px] bg-slate-900/90 text-slate-400 border border-slate-800 uppercase font-sans">
                    {player.avatarId}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-black tracking-wider">
                    {player.wpm} <span className="text-[10px] text-cyan-600 font-sans font-normal">WPM</span>
                  </span>
                  <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-800">
                    {clampProgress}%
                  </span>
                </div>
              </div>

              {/* Speedway Track Line */}
              <div className="relative h-7 w-full rounded-xl bg-slate-950/90 border border-slate-800/80 overflow-hidden shadow-inner flex items-center">
                {/* Track Grid Lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px)] bg-[size:10%_100%] opacity-20 pointer-events-none" />
                
                {/* Finish Line Marker */}
                <div className="absolute inset-y-0 right-3 flex items-center gap-1 z-10 pointer-events-none">
                  <div className="h-full w-0.5 bg-gradient-to-b from-cyan-400 via-indigo-500 to-rose-500 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-tighter text-slate-500 opacity-60">FINISH</span>
                </div>

                {/* Progress Nitro Trail */}
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500/5 via-cyan-500/20 to-indigo-500/50 transition-all duration-300 ease-out border-r border-indigo-400/80 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                  style={{ width: `${clampProgress}%` }}
                />

                {/* Racer Avatar Icon */}
                <div
                  className="absolute inset-y-0 flex items-center transition-all duration-300 ease-out z-20"
                  style={{
                    left: `calc(${clampProgress}% - 14px)`,
                    marginLeft: clampProgress < 3 ? '4px' : '0px',
                  }}
                >
                  <div
                    className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs shadow-md transition-all ${
                      player.finished
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border border-emerald-300 text-white shadow-[0_0_12px_rgba(16,185,129,0.8)] scale-110'
                        : 'bg-slate-900 border border-cyan-500/40 text-slate-100 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
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
