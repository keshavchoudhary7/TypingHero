import { useMultiplayerSocket } from '../lib/useMultiplayerSocket';
import MultiplayerLobby from '../components/multiplayer/MultiplayerLobby';
import MultiplayerArena from '../components/multiplayer/MultiplayerArena';
import MultiplayerPodium from '../components/multiplayer/MultiplayerPodium';

export default function MultiplayerPage() {
  const {
    username,
    wsStatus,
    matchState,
    queueCount,
    serverRank,
    errorMessage,
    toastMessage,
    room,
    countdown,
    typed,
    elapsedMs,
    isRacing,
    completedStats,
    inputCode,
    setInputCode,
    textareaRef,
    isHost,
    // Actions
    joinQueue,
    leaveQueue,
    createRoom,
    joinRoom,
    startCustomRace,
    rematch,
    leaveRoom,
    copyInviteLink,
    handleInput,
    connectSocket,
    calculateWpm,
    calculateAccuracy,
  } = useMultiplayerSocket();

  return (
    <div className="mx-auto max-w-4xl p-6 text-white min-h-[85vh] relative">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-center text-xs font-bold text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* ERRORS */}
      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-center text-xs font-semibold text-red-400">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* ── CONNECTING ─────────────────────── */}
      {wsStatus === 'connecting' && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-5">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 border-r-indigo-400 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">⚔️</div>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400 animate-pulse">Connecting to Arena…</p>
            <p className="mt-1 text-xs text-slate-600">Establishing real-time connection</p>
          </div>
        </div>
      )}

      {/* ── FAILED ──────────────────────── */}
      {wsStatus === 'failed' && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center backdrop-blur-md">
          <span className="text-4xl">🔌</span>
          <h2 className="text-lg font-black text-red-400 uppercase tracking-widest mt-3">
            Multiplayer Unavailable
          </h2>
          <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Could not reach the real-time multiplayer server. Please check your connection or try again in a moment.
          </p>
          <button
            onClick={connectSocket}
            className="mt-5 px-6 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/15 text-red-400 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ── LOBBY ──────────────────────── */}
      {wsStatus === 'connected' && matchState === 'idle' && (
        <MultiplayerLobby
          onJoinQueue={joinQueue}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          inputCode={inputCode}
          setInputCode={setInputCode}
        />
      )}

      {/* ── MATCHMAKING WAIT ───────────── */}
      {wsStatus === 'connected' && matchState === 'matching' && (
        <div className="max-w-md mx-auto text-center rounded-2xl border border-slate-800 bg-[#0a0e1c]/80 p-8 backdrop-blur-md">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mx-auto mb-4" />
          <h3 className="text-xl font-black uppercase tracking-widest text-cyan-400">
            Finding Speedrunners...
          </h3>
          <p className="mt-2 text-xs text-slate-500 font-mono">
            Searching local taverns ({queueCount} in queue)
          </p>
          <button
            onClick={leaveQueue}
            className="mt-6 px-6 py-2 border border-red-500/30 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors"
          >
            Cancel Search
          </button>
        </div>
      )}

      {/* ── ROOM & GAME ARENA ───────────── */}
      {wsStatus === 'connected' && matchState === 'room' && room && (
        <div className="space-y-6">
          <MultiplayerArena
            room={room}
            countdown={countdown}
            typed={typed}
            elapsedMs={elapsedMs}
            isRacing={isRacing}
            completedStats={completedStats}
            serverRank={serverRank}
            textareaRef={textareaRef}
            isHost={isHost}
            currentUsername={username}
            onCopyInviteLink={copyInviteLink}
            onLeaveRoom={leaveRoom}
            onStartCustomRace={startCustomRace}
            onRematch={rematch}
            onHandleInput={handleInput}
            calculateWpm={calculateWpm}
            calculateAccuracy={calculateAccuracy}
          />

          {/* Podium Results */}
          {room.status === 'finished' && (
            <MultiplayerPodium room={room} currentUsername={username} />
          )}
        </div>
      )}
    </div>
  );
}
