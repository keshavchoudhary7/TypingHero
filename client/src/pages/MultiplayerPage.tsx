import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useAuth } from '../lib/authContext';
import RaceTrack from '../components/game/RaceTrack';
import { WS_BASE } from '../lib/apiBase';

type Player = {
  id: string;
  username: string;
  avatarId: string;
  progress: number;
  wpm: number;
  finished: boolean;
  isHost: boolean;
  rank?: number;
  accuracy?: number;
  timeMs?: number;
};

type Room = {
  roomCode: string;
  status: 'waiting' | 'countdown' | 'racing' | 'finished';
  passage: string;
  levelId: number;
  players: Player[];
};

export default function MultiplayerPage() {
  const { user } = useAuth();
  
  // Connection lifecycle: 'connecting' during handshake, 'connected' on open,
  // 'failed' only after a confirmed onerror or unexpected close.
  const wsRef = useRef<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');
  const [matchState, setMatchState] = useState<'idle' | 'matching' | 'room'>('idle');
  const [queueCount, setQueueCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Room states
  const [room, setRoom] = useState<Room | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // Game states
  const [typed, setTyped] = useState('');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRacing, setIsRacing] = useState(false);
  const [completedStats, setCompletedStats] = useState<{ wpm: number; accuracy: number; timeMs: number } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const username = user?.username || 'Guest Hero';
  const avatarId = user?.avatarId || 'knight';

  // ── Stable refs ─────────────────────────────────────────────────────────
  // Kept in sync on every render so the long-lived WebSocket handlers always
  // read the latest values without needing to reconnect when they change.
  const usernameRef = useRef(username);
  const avatarIdRef = useRef(avatarId);
  const roomRef = useRef<Room | null>(null);
  usernameRef.current = username;
  avatarIdRef.current = avatarId;
  roomRef.current = room;

  // ── WebSocket — created ONCE on mount, never recreated ─────────────────
  // Using empty deps [] ensures only one socket exists at a time.
  // All values the socket handlers need are read via refs (usernameRef etc.)
  // so they always have the latest value without triggering a reconnect.
  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/multiplayer`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('connected');
      setErrorMessage(null);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleSocketMessage(msg);
      } catch (err) {
        console.error('Failed to parse websocket message:', err);
      }
    };

    ws.onerror = () => {
      // Only transition to 'failed' if we were still connecting.
      // Only show the error message when we actually fail.
      setWsStatus((prev) => {
        if (prev === 'connecting') {
          setErrorMessage('Connection to multiplayer server failed.');
          return 'failed';
        }
        return prev;
      });
    };

    ws.onclose = (evt) => {
      // Surface a failure only on unexpected mid-session drops.
      setWsStatus((prev) => {
        if (prev === 'connected' && !evt.wasClean) {
          setErrorMessage('Lost connection to multiplayer server.');
          return 'failed';
        }
        return prev;
      });
      setMatchState('idle');
      setRoom(null);
      setIsRacing(false);
    };

    return () => {
      // Use CLOSING/OPEN check; the cleanup close is intentional (wasClean=true)
      // so onclose will NOT transition to 'failed'.
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'component unmounted');
      }
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer logic for local elapsed time
  useEffect(() => {
    if (!isRacing || startedAt === null) return undefined;
    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 100);
    return () => window.clearInterval(interval);
  }, [isRacing, startedAt]);

  const sendWSMessage = (data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  const handleSocketMessage = (msg: any) => {
    switch (msg.type) {
      case 'queue_status':
        setQueueCount(msg.count);
        setMatchState('matching');
        break;
      case 'left_queue':
        setMatchState('idle');
        setQueueCount(0);
        break;
      case 'room_created':
        setMatchState('room');
        setCountdown(null);
        break;
      case 'room_state':
        setRoom(msg.room);
        setMatchState('room');
        if (msg.room.status === 'racing') {
          startRaceLocal(msg.room.passage);
        }
        break;
      case 'countdown_start':
        setRoom(msg.room);
        setCountdown(msg.seconds);
        break;
      case 'countdown_update':
        setCountdown(msg.seconds);
        break;
      case 'race_start':
        setCountdown(null);
        // Use roomRef so we always have the latest room, not the stale
        // closure value captured when the effect first ran.
        if (roomRef.current) startRaceLocal(roomRef.current.passage);
        break;
      case 'race_results':
        setRoom(msg.room);
        setIsRacing(false);
        break;
      case 'left_room':
        setMatchState('idle');
        setRoom(null);
        setCountdown(null);
        setTyped('');
        setCompletedStats(null);
        break;
      case 'error':
        setErrorMessage(msg.message);
        break;
    }
  };

  // Lobby actions — read username/avatarId from refs so we always send the
  // latest values without needing to recreate the WebSocket connection.
  const joinQueue = () => {
    setErrorMessage(null);
    sendWSMessage({ type: 'join_queue', username: usernameRef.current, avatarId: avatarIdRef.current });
  };

  const leaveQueue = () => {
    sendWSMessage({ type: 'leave_queue' });
  };

  const createRoom = () => {
    setErrorMessage(null);
    sendWSMessage({ type: 'create_room', username: usernameRef.current, avatarId: avatarIdRef.current });
  };

  const joinRoom = (code: string) => {
    if (!code.trim()) return;
    setErrorMessage(null);
    sendWSMessage({ type: 'join_room', roomCode: code, username: usernameRef.current, avatarId: avatarIdRef.current });
  };

  const startCustomRace = () => {
    sendWSMessage({ type: 'start_custom_race' });
  };

  const leaveRoom = () => {
    sendWSMessage({ type: 'leave_room' });
  };

  // Typing Arena logic
  const startRaceLocal = (_passageText: string) => {
    setTyped('');
    setElapsedMs(0);
    setStartedAt(Date.now());
    setIsRacing(true);
    setCompletedStats(null);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const calculateAccuracy = (passage: string, currentTyped: string) => {
    if (currentTyped.length === 0) return 100;
    let correct = 0;
    for (let i = 0; i < currentTyped.length; i++) {
      if (currentTyped[i] === passage[i]) correct++;
    }
    return Math.round((correct / currentTyped.length) * 100);
  };

  const calculateWpm = (currentTyped: string, timeMs: number) => {
    if (timeMs <= 0) return 0;
    return Math.round((currentTyped.length / 5) / (timeMs / 1000 / 60));
  };

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (!room || !isRacing) return;
    const passage = room.passage;
    const nextValue = e.target.value.slice(0, passage.length);
    setTyped(nextValue);

    const timePassed = startedAt ? Date.now() - startedAt : 1;
    const wpm = calculateWpm(nextValue, timePassed);
    const progress = Math.round((nextValue.length / passage.length) * 100);

    // Send progress broadcast
    sendWSMessage({
      type: 'race_progress',
      progress,
      wpm,
    });

    if (nextValue === passage) {
      // Finished!
      const acc = calculateAccuracy(passage, nextValue);
      setIsRacing(false);
      setCompletedStats({
        wpm,
        accuracy: acc,
        timeMs: timePassed,
      });

      sendWSMessage({
        type: 'race_finish',
        wpm,
        accuracy: acc,
        elapsedMs: timePassed,
      });
    }
  };

  // Render character feedback helper (character by character)
  const renderPassage = () => {
    if (!room) return null;
    const passage = room.passage;
    const words = passage.split(' ');
    const typedWords = typed.trimEnd().split(' ');
    const isTrailingSpace = typed.endsWith(' ');
    const activeIndex = isTrailingSpace ? typedWords.length : typedWords.length - 1;

    return words.map((word, wIdx) => {
      const typedWord = typedWords[wIdx] ?? '';
      const isActive = wIdx === activeIndex;
      const isLocked = wIdx < typedWords.length - (isTrailingSpace ? 0 : 1);

      if (isLocked) {
        const correct = typedWord === word;
        return (
          <span
            key={wIdx}
            className={`inline-block border rounded px-1.5 py-0.5 mr-1.5 ${
              correct
                ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 font-bold'
                : 'border-rose-500/20 bg-rose-500/5 text-rose-400 font-bold'
            }`}
          >
            {word}
          </span>
        );
      }

      if (isActive) {
        return (
          <span
            key={wIdx}
            className="inline-flex border border-indigo-500/20 bg-indigo-500/5 rounded px-1.5 py-0.5 mr-1.5"
          >
            {word.split('').map((char, charIdx) => {
              let charState: 'untyped' | 'correct' | 'incorrect' = 'untyped';
              if (typedWord[charIdx] !== undefined) {
                charState = typedWord[charIdx] === char ? 'correct' : 'incorrect';
              }
              const isCursor = charIdx === typedWord.length;

              return (
                <span key={charIdx} className="relative">
                  {isCursor && (
                    <span className="absolute left-0 top-[15%] w-0.5 h-4 bg-cyan-400 animate-pulse" />
                  )}
                  <span
                    className={
                      charState === 'correct'
                        ? 'text-emerald-400 font-bold shadow-[0_0_8px_rgba(57,255,20,0.5)]'
                        : charState === 'incorrect'
                        ? 'text-rose-400 font-bold'
                        : 'text-slate-400'
                    }
                  >
                    {char}
                  </span>
                </span>
              );
            })}
          </span>
        );
      }

      return (
        <span key={wIdx} className="text-slate-600 mr-1.5">
          {word}
        </span>
      );
    });
  };

  const isHost = room?.players.find((p) => p.username === username)?.isHost ?? false;

  return (
    <div className="mx-auto max-w-4xl p-6 text-white min-h-[85vh] relative">
      {/* ERRORS */}
      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-center text-xs font-semibold text-red-400">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* ── CONNECTING: initial handshake spinner ─────────────────────── */}
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

      {/* ── FAILED: confirmed server unreachable ──────────────────────── */}
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
            onClick={() => {
              setWsStatus('connecting');
              setErrorMessage(null);
              const ws = new WebSocket(`${WS_BASE}/multiplayer`);
              wsRef.current = ws;
              ws.onopen = () => { setWsStatus('connected'); setErrorMessage(null); };
              ws.onerror = () => { setWsStatus('failed'); setErrorMessage('Connection to multiplayer server failed.'); };
              ws.onclose = (e) => {
                setWsStatus((p) => (p === 'connected' && !e.wasClean ? 'failed' : p));
                setMatchState('idle'); setRoom(null); setIsRacing(false);
              };
              ws.onmessage = (event) => {
                try { handleSocketMessage(JSON.parse(event.data)); } catch {}
              };
            }}
            className="mt-5 px-6 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/15 text-red-400 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {wsStatus === 'connected' && matchState === 'idle' && (
        /* ─── LOBBY LANDING SCREEN ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          
          {/* Quick Play Card */}
          <div className="rounded-2xl border border-slate-800 bg-[#0a0e1c]/80 p-8 text-center relative overflow-hidden backdrop-blur-md">
            <span className="text-5xl">⚡</span>
            <h3 className="text-2xl font-black uppercase tracking-wider text-white mt-4">
              Quick Match
            </h3>
            <p className="mt-2 text-xs text-slate-500 max-w-xs mx-auto">
              Jump directly into matchmaking and queue up with other online hero speedrunners.
            </p>
            <button
              onClick={joinQueue}
              className="mt-6 w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Find Race Track ⚔️
            </button>
          </div>

          {/* Custom Lobby Card */}
          <div className="rounded-2xl border border-slate-800 bg-[#0a0e1c]/80 p-8 text-center relative overflow-hidden backdrop-blur-md">
            <span className="text-5xl">🏰</span>
            <h3 className="text-2xl font-black uppercase tracking-wider text-white mt-4">
              Private Tavern
            </h3>
            
            <div className="mt-6 space-y-4">
              <button
                onClick={createRoom}
                className="w-full py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors"
              >
                Create Invite Code
              </button>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter Tavern Code"
                  id="tavern-code-input"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-slate-200 outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => {
                    const el = document.getElementById('tavern-code-input') as HTMLInputElement;
                    if (el) joinRoom(el.value);
                  }}
                  className="mt-2 w-full py-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 hover:border-indigo-500/50 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer text-indigo-400 transition-colors"
                >
                  Join Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {wsStatus === 'connected' && matchState === 'matching' && (
        /* ─── MATCHMAKING WAIT SCREEN ─── */
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

      {wsStatus === 'connected' && matchState === 'room' && room && (
        /* ─── ROOM GAME INTERFACE ─── */
        <div className="space-y-6">
          {/* Room Code Banner & Navigation */}
          <div className="flex items-center justify-between border-b border-slate-900 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Tavern Code
              </span>
              <h3 className="text-xl font-mono font-black text-indigo-400 uppercase tracking-widest">
                {room.roomCode}
              </h3>
            </div>
            <button
              onClick={leaveRoom}
              className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-900/60 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer text-slate-400 hover:text-slate-200 transition-colors"
            >
              Exit Tavern
            </button>
          </div>

          {/* Race Track Header */}
          <RaceTrack players={room.players} />

          {/* LOBBY / WAITING SCREEN */}
          {room.status === 'waiting' && (
            <div className="rounded-2xl border border-slate-800 bg-[#0a0e1c]/80 p-6 text-center">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">
                Waiting for Speedrunners ({room.players.length}/4)
              </h3>
              
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
                <button
                  disabled={room.players.length < 2}
                  onClick={startCustomRace}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  Start Race Match 🏁
                </button>
              ) : (
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest animate-pulse">
                  ⚔️ Waiting for the Tavern Host to launch...
                </p>
              )}
            </div>
          )}

          {/* COUNTDOWN TIMER */}
          {room.status === 'countdown' && countdown !== null && (
            <div className="rounded-2xl border border-slate-800 bg-[#0a0e1c]/80 p-12 text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Battle begins in
              </span>
              <h1 className="text-7xl font-black text-cyan-400 mt-2 font-mono animate-bounce">
                {countdown}
              </h1>
            </div>
          )}

          {/* TYPING ARENA */}
          {(room.status === 'racing' || (room.status === 'finished' && completedStats)) && (
            <div className="space-y-4">
              
              {/* Gross stats bar */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-[#0a0e1c]/80 p-3 text-center border border-slate-900">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">WPM</span>
                  <p className="text-lg font-black font-mono text-cyan-400 mt-0.5">
                    {completedStats ? completedStats.wpm : calculateWpm(typed, elapsedMs)}
                  </p>
                </div>
                <div className="rounded-xl bg-[#0a0e1c]/80 p-3 text-center border border-slate-900">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Accuracy</span>
                  <p className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                    {completedStats ? `${completedStats.accuracy}%` : `${calculateAccuracy(room.passage, typed)}%`}
                  </p>
                </div>
                <div className="rounded-xl bg-[#0a0e1c]/80 p-3 text-center border border-slate-900">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Time</span>
                  <p className="text-lg font-black font-mono text-indigo-400 mt-0.5">
                    {((completedStats ? completedStats.timeMs : elapsedMs) / 1000).toFixed(1)}s
                  </p>
                </div>
              </div>

              {/* Passage text box */}
              <div className="rounded-2xl bg-slate-950/80 border border-slate-900 p-5 min-h-[6rem] leading-8 select-none font-mono">
                {renderPassage()}
              </div>

              {/* Input text box */}
              {isRacing && (
                <textarea
                  ref={textareaRef}
                  value={typed}
                  onChange={handleInput}
                  placeholder="Type the passage to race..."
                  className="w-full h-24 rounded-2xl border border-slate-800 bg-[#0a0e1c] px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-500/50 resize-none font-mono"
                  spellCheck={false}
                />
              )}
            </div>
          )}

          {/* RACE PODIUM SUMMARY */}
          {room.status === 'finished' && (
            <div className="rounded-2xl border border-slate-800 bg-[#0a0e1c]/85 p-6 space-y-4">
              <h3 className="text-center text-sm font-black uppercase tracking-widest text-indigo-400 border-b border-slate-900 pb-3">
                🏆 Race Leaderboard Podiums 🏆
              </h3>
              
              <div className="space-y-2">
                {[...room.players]
                  .sort((a, b) => (a.rank || 99) - (b.rank || 99))
                  .map((p, idx) => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border ${
                        p.username === username
                          ? 'border-cyan-500/40 bg-cyan-500/5'
                          : 'border-slate-800/80 bg-slate-950/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl font-bold font-mono">
                          {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank || idx + 1}`}
                        </span>
                        <span className="font-bold text-slate-200 font-mono truncate">{p.username}</span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-slate-400">{p.accuracy}% Acc</span>
                        <span className="text-cyan-400 font-bold">{p.wpm} WPM</span>
                        <span className="text-slate-500">
                          {p.timeMs ? `${(p.timeMs / 1000).toFixed(2)}s` : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
