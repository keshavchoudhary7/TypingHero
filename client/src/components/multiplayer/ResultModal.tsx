type ResultModalProps = {
  stats: { wpm: number; accuracy: number; timeMs: number } | null;
  rank: number | null; // null = awaiting server confirmation
  onRematch: () => void;
  onLeaveRoom: () => void;
};

export default function ResultModal({ stats, rank, onRematch, onLeaveRoom }: ResultModalProps) {
  const isWinner = rank === 1;
  const rankPending = rank === null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-[#080c1e]/95 p-8 text-center shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Glow backdrop behind card */}
        <div
          className={`absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full blur-[70px] pointer-events-none ${
            rankPending ? 'bg-slate-500/20' : isWinner ? 'bg-amber-500/25' : 'bg-indigo-500/25'
          }`}
        />

        {/* Victory / Defeat / Loading Header */}
        <div className="relative z-10 space-y-2">
          <span className="text-6xl inline-block animate-bounce">
            {rankPending ? '⏳' : isWinner ? '🏆' : '⚔️'}
          </span>

          <h2
            className={`text-3xl font-black uppercase tracking-wider ${
              rankPending
                ? 'text-slate-300'
                : isWinner
                ? 'bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                : 'bg-gradient-to-r from-indigo-300 via-cyan-400 to-purple-400 bg-clip-text text-transparent'
            }`}
          >
            {rankPending ? 'RACE COMPLETE!' : isWinner ? 'VICTORY! YOU WON!' : 'GOOD RACE!'}
          </h2>

          <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
            {rankPending
              ? '⏳ Confirming your rank...'
              : rank === 1 ? '🥇 1st Place Winner'
              : rank === 2 ? '🥈 2nd Place'
              : rank === 3 ? '🥉 3rd Place'
              : `🏅 ${rank}th Place`
            }
          </p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="relative z-10 grid grid-cols-3 gap-3 my-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-center">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">
                Net WPM
              </span>
              <p className="text-2xl font-mono font-black text-cyan-300 mt-1">
                {stats.wpm}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-center">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                Accuracy
              </span>
              <p className="text-2xl font-mono font-black text-emerald-300 mt-1">
                {stats.accuracy}%
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-center">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">
                Time
              </span>
              <p className="text-2xl font-mono font-black text-indigo-300 mt-1">
                {(stats.timeMs / 1000).toFixed(1)}s
              </p>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="relative z-10 space-y-3">
          <button
            onClick={onRematch}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg cursor-pointer transition-all active:scale-[0.98]"
          >
            Recompete / Rematch 🔁
          </button>

          <button
            onClick={onLeaveRoom}
            className="w-full py-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs uppercase tracking-widest rounded-xl cursor-pointer transition-colors"
          >
            Exit Tavern 🏰
          </button>
        </div>
      </div>
    </div>
  );
}
