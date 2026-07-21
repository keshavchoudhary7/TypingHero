type MultiplayerLobbyProps = {
  onJoinQueue: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  inputCode: string;
  setInputCode: (val: string) => void;
};

export default function MultiplayerLobby({
  onJoinQueue,
  onCreateRoom,
  onJoinRoom,
  inputCode,
  setInputCode,
}: MultiplayerLobbyProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
      {/* Quick Play Card */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0a0e1c]/80 p-8 text-center relative overflow-hidden backdrop-blur-md shadow-xl hover:border-slate-700 transition-all">
        <span className="text-5xl">⚡</span>
        <h3 className="text-2xl font-black uppercase tracking-wider text-white mt-4">
          Quick Match
        </h3>
        <p className="mt-2 text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
          Jump directly into matchmaking and queue up with other online hero speedrunners.
        </p>
        <button
          onClick={onJoinQueue}
          className="mt-6 w-full py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer shadow-lg hover:brightness-110 active:scale-[0.98] transition-all text-white"
        >
          Find Race Track ⚔️
        </button>
      </div>

      {/* Custom Lobby Card */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0a0e1c]/80 p-8 text-center relative overflow-hidden backdrop-blur-md shadow-xl hover:border-slate-700 transition-all">
        <span className="text-5xl">🏰</span>
        <h3 className="text-2xl font-black uppercase tracking-wider text-white mt-4">
          Private Tavern
        </h3>

        <div className="mt-6 space-y-4">
          <button
            onClick={onCreateRoom}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors text-slate-200"
          >
            Create Invite Code 🔗
          </button>

          <div className="relative">
            <input
              type="text"
              placeholder="Enter Tavern Code"
              id="tavern-code-input"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onJoinRoom(inputCode);
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-slate-200 outline-none focus:border-indigo-500 transition-all"
            />
            <button
              onClick={() => onJoinRoom(inputCode)}
              className="mt-2.5 w-full py-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 hover:border-indigo-500/50 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer text-indigo-400 transition-colors"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
