import type { ChangeEvent, RefObject } from 'react';
import type { Room } from '../../lib/useMultiplayerSocket';
import RaceTrack from '../game/RaceTrack';
import TypingPrompt from './TypingPrompt';
import ResultModal from './ResultModal';

type MultiplayerArenaProps = {
  room: Room;
  countdown: number | null;
  typed: string;
  elapsedMs: number;
  isRacing: boolean;
  completedStats: { wpm: number; accuracy: number; timeMs: number } | null;
  serverRank: number | null;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  isHost: boolean;
  currentUsername: string;
  onCopyInviteLink: (code?: string) => void;
  onLeaveRoom: () => void;
  onStartCustomRace: () => void;
  onRematch: () => void;
  onHandleInput: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  calculateWpm: (typed?: string, timeMs?: number) => number;
  calculateAccuracy: (passage?: string, typed?: string) => number;
};

export default function MultiplayerArena({
  room,
  countdown,
  typed,
  elapsedMs,
  isRacing,
  completedStats,
  serverRank,
  textareaRef,
  isHost,
  currentUsername,
  onCopyInviteLink,
  onLeaveRoom,
  onStartCustomRace,
  onRematch,
  onHandleInput,
  calculateWpm,
  calculateAccuracy,
}: MultiplayerArenaProps) {
  const hostPlayer = room.players.find((p) => p.isHost);
  const currentPassage = room.passage || 'Deep in the Whispering Woods, a rogue shadows the sleeping dragon, waiting for the crystal to glow.';

  const handleContainerClick = () => {
    textareaRef.current?.focus();
  };

  const remainingSeconds = Math.max(0, Math.ceil((45000 - elapsedMs) / 1000));

  return (
    <div className="space-y-6">
      {/* Result Modal — only show when the server has confirmed our rank via race_finish_ack */}
      {serverRank !== null && completedStats && (
        <ResultModal
          stats={completedStats}
          rank={serverRank}
          onRematch={onRematch}
          onLeaveRoom={onLeaveRoom}
        />
      )}

      {/* Room Code Banner & Navigation */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Tavern Code
            </span>
            <h3 className="text-xl font-mono font-black text-indigo-400 uppercase tracking-widest">
              {room.roomCode}
            </h3>
          </div>
          <button
            onClick={() => onCopyInviteLink(room.roomCode)}
            className="mt-2 flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 text-[11px] font-bold uppercase text-cyan-300 transition-all cursor-pointer shadow-sm"
            title="Copy Invite Link"
          >
            <span>🔗</span>
            <span className="hidden sm:inline">Copy Invite Link</span>
          </button>
        </div>
        <button
          onClick={onLeaveRoom}
          className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-900/60 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer text-slate-400 hover:text-slate-200 transition-colors"
        >
          Exit Tavern
        </button>
      </div>

      {/* Speedway Header */}
      <RaceTrack players={room.players} />

      {/* LOBBY / WAITING SCREEN */}
      {room.status === 'waiting' && countdown === null && (
        <div className="rounded-2xl border border-slate-800 bg-[#0a0e1c]/80 p-6 text-center">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">
            Waiting for Speedrunners ({room.players.length}/4)
          </h3>

          <button
            onClick={() => onCopyInviteLink(room.roomCode)}
            className="mb-6 flex items-center gap-2 mx-auto px-4 py-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
          >
            <span>🔗</span>
            <span>Invite Friends (Copy Link)</span>
          </button>

          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {room.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-xl bg-slate-950/80 border border-slate-900 px-4 py-2.5"
              >
                <span>🛡️</span>
                <span className="text-xs font-bold font-mono text-slate-300">{p.username}</span>
                {p.isHost && (
                  <span className="rounded-full px-1.5 py-0.5 text-[8px] bg-indigo-950 text-indigo-400 border border-indigo-800 font-bold uppercase">
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>

          {isHost ? (
            <div className="space-y-2">
              <button
                disabled={room.players.length < 2}
                onClick={onStartCustomRace}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none text-white"
              >
                Start Race Match 🏁
              </button>
              {room.players.length < 2 && (
                <p className="text-[11px] text-amber-400/80 font-medium">
                  ⚠️ You need at least 1 more player in the room to launch the race. Share the invite link above!
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-center max-w-md mx-auto">
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                ⚔️ Joined Tavern of <span className="text-cyan-400 font-mono font-black">{hostPlayer?.username || 'Host'}</span>
              </p>
              <p className="mt-1 text-[11px] text-slate-400 animate-pulse">
                Waiting for host <span className="text-cyan-400 font-mono font-bold">{hostPlayer?.username || 'Host'}</span> to click <strong className="text-white">"Start Race Match 🏁"</strong> to begin typing!
              </p>
            </div>
          )}
        </div>
      )}

      {/* COUNTDOWN TIMER OVERLAY */}
      {(room.status === 'countdown' || countdown !== null) && (
        <div className="rounded-2xl border border-slate-800 bg-[#0a0e1c]/90 p-12 text-center shadow-2xl backdrop-blur-md">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Battle begins in
          </span>
          <h1 className="text-7xl font-black text-cyan-400 mt-2 font-mono animate-bounce drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]">
            {countdown ?? 1}
          </h1>
        </div>
      )}

      {/* TYPING ARENA */}
      {(room.status === 'racing' || isRacing || (room.status !== 'waiting' && countdown === null)) && (
        <div className="space-y-5">
          {/* Telemetry Stats HUD */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-[#080d1e]/90 p-4 text-center border border-slate-800/80 border-t-2 border-t-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.08)] backdrop-blur-md">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-cyan-400">
                ⚡ Live WPM
              </span>
              <p className="text-2xl font-black font-mono text-cyan-300 mt-1 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                {completedStats ? completedStats.wpm : calculateWpm(typed, elapsedMs)}
              </p>
            </div>

            <div className="rounded-2xl bg-[#080d1e]/90 p-4 text-center border border-slate-800/80 border-t-2 border-t-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.08)] backdrop-blur-md">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-400">
                🎯 Accuracy
              </span>
              <p className="text-2xl font-black font-mono text-emerald-300 mt-1 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                {completedStats ? `${completedStats.accuracy}%` : `${calculateAccuracy(currentPassage, typed)}%`}
              </p>
            </div>

            <div className="rounded-2xl bg-[#080d1e]/90 p-4 text-center border border-slate-800/80 border-t-2 border-t-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.08)] backdrop-blur-md">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-400">
                ⏱️ Race Limit ({remainingSeconds}s)
              </span>
              <p className={`text-2xl font-black font-mono mt-1 ${remainingSeconds <= 10 ? 'text-rose-400 animate-pulse' : 'text-indigo-300'}`}>
                {((completedStats ? completedStats.timeMs : elapsedMs) / 1000).toFixed(1)}s
              </p>
            </div>
          </div>

          {/* Continuous Inline Typing Prompt */}
          <TypingPrompt
            passage={currentPassage}
            typed={typed}
            onFocusRequest={handleContainerClick}
          />

          {/* Integrated Hidden/Overlay Textarea */}
          {!completedStats && room.status !== 'finished' && (
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={typed}
                onChange={onHandleInput}
                placeholder="Type the text above..."
                className="w-full h-24 rounded-2xl border border-slate-800/90 bg-[#090d1f]/90 px-5 py-4 text-base font-mono text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-400 focus:shadow-[0_0_25px_rgba(6,182,212,0.2)] resize-none transition-all duration-200"
                spellCheck={false}
                autoFocus
              />
              <div className="absolute bottom-3 right-4 text-[10px] font-mono font-bold text-slate-500">
                {typed.length} / {currentPassage.length} CHARS
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
