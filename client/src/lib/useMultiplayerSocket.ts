import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useAuth } from './authContext';
import { WS_BASE } from './apiBase';

export type Player = {
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

export type Room = {
  roomCode: string;
  status: 'waiting' | 'countdown' | 'racing' | 'finished';
  passage: string;
  levelId: number;
  players: Player[];
};

export function useMultiplayerSocket() {
  const { user } = useAuth();
  const username = user?.username || 'Guest Hero';
  const avatarId = user?.avatarId || 'knight';

  const wsRef = useRef<WebSocket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');
  const [matchState, setMatchState] = useState<'idle' | 'matching' | 'room'>('idle');
  const [queueCount, setQueueCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Room states
  const [room, setRoom] = useState<Room | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const autoJoinedRef = useRef(false);

  // Initial room code from URL parameters (?room=ROOM-123456 or ?join=ROOM-123456)
  const initialRoomCode = (() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return (params.get('room') || params.get('join') || '').toUpperCase();
    }
    return '';
  })();
  const [inputCode, setInputCode] = useState(initialRoomCode);

  // Game states
  const [typed, setTyped] = useState('');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRacing, setIsRacing] = useState(false);
  const [completedStats, setCompletedStats] = useState<{ wpm: number; accuracy: number; timeMs: number } | null>(null);

  // Stable refs to prevent reconnects or stale closure issues
  const usernameRef = useRef(username);
  const avatarIdRef = useRef(avatarId);
  const roomRef = useRef<Room | null>(null);
  const isRacingRef = useRef(false);

  usernameRef.current = username;
  avatarIdRef.current = avatarId;
  roomRef.current = room;
  isRacingRef.current = isRacing;

  // Send helper
  const sendWSMessage = (data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  const copyInviteLink = (code?: string, customMessage?: string) => {
    const targetCode = code || room?.roomCode;
    if (!targetCode) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${targetCode}`;
    void navigator.clipboard.writeText(url);
    setToastMessage(customMessage || '✅ Invite link copied to clipboard!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const startRaceLocal = (_passageText?: string) => {
    if (isRacingRef.current) return;
    setTyped('');
    setElapsedMs(0);
    setStartedAt(Date.now());
    setIsRacing(true);
    setCompletedStats(null);
    setTimeout(() => textareaRef.current?.focus(), 50);
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
        if (msg.roomCode) {
          copyInviteLink(msg.roomCode, `✅ Room ${msg.roomCode} created! Invite link copied to clipboard.`);
        }
        break;
      case 'room_state':
        setRoom(msg.room);
        setMatchState('room');
        if (msg.room?.status === 'racing' && !isRacingRef.current) {
          startRaceLocal(msg.room.passage);
        }
        break;
      case 'countdown_start':
        if (msg.room) setRoom(msg.room);
        setCountdown(msg.seconds);
        setMatchState('room');
        break;
      case 'countdown_update':
        setCountdown(msg.seconds);
        if (msg.room) setRoom(msg.room);
        setMatchState('room');
        break;
      case 'race_start':
        setCountdown(null);
        setMatchState('room');
        if (msg.room) setRoom(msg.room);
        if (!isRacingRef.current) {
          startRaceLocal(msg.room?.passage || roomRef.current?.passage);
        }
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

  const connectSocket = () => {
    setWsStatus('connecting');
    setErrorMessage(null);

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
      setWsStatus((prev) => {
        if (prev === 'connecting') {
          setErrorMessage('Connection to multiplayer server failed.');
          return 'failed';
        }
        return prev;
      });
    };

    ws.onclose = (evt) => {
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
  };

  // Socket init on mount
  useEffect(() => {
    connectSocket();
    return () => {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        wsRef.current.close(1000, 'component unmounted');
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-join from URL query parameter
  useEffect(() => {
    if (wsStatus === 'connected' && initialRoomCode && !autoJoinedRef.current && matchState === 'idle') {
      autoJoinedRef.current = true;
      joinRoom(initialRoomCode);
    }
  }, [wsStatus, initialRoomCode, matchState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Local race timer
  useEffect(() => {
    if (!isRacing || startedAt === null) return undefined;
    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 100);
    return () => window.clearInterval(interval);
  }, [isRacing, startedAt]);

  // Actions
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
    sendWSMessage({ type: 'join_room', roomCode: code.toUpperCase(), username: usernameRef.current, avatarId: avatarIdRef.current });
  };

  const startCustomRace = () => {
    sendWSMessage({ type: 'start_custom_race' });
  };

  const leaveRoom = () => {
    sendWSMessage({ type: 'leave_room' });
  };

  const calculateAccuracy = (passage?: string, currentTyped?: string) => {
    const safePassage = passage || '';
    const safeTyped = currentTyped || '';
    if (safeTyped.length === 0) return 100;
    let correct = 0;
    for (let i = 0; i < safeTyped.length; i++) {
      if (safeTyped[i] === safePassage[i]) correct++;
    }
    return Math.round((correct / safeTyped.length) * 100);
  };

  const calculateWpm = (currentTyped?: string, timeMs?: number) => {
    const safeTyped = currentTyped || '';
    const safeTime = timeMs || 1;
    if (safeTime <= 0) return 0;
    return Math.round((safeTyped.length / 5) / (safeTime / 1000 / 60));
  };

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (!room || (!isRacing && room.status !== 'racing')) return;
    const passage = room.passage || '';
    const nextValue = e.target.value.slice(0, passage.length);
    setTyped(nextValue);

    const timePassed = startedAt ? Date.now() - startedAt : 1;
    const wpm = calculateWpm(nextValue, timePassed);
    const progress = Math.round((nextValue.length / passage.length) * 100);

    sendWSMessage({
      type: 'race_progress',
      progress,
      wpm,
    });

    if (nextValue === passage && passage.length > 0) {
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

  const isHost = room?.players.find((p) => p.username === username)?.isHost ?? false;

  return {
    username,
    avatarId,
    wsStatus,
    matchState,
    queueCount,
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
    leaveRoom,
    copyInviteLink,
    handleInput,
    connectSocket,
    calculateWpm,
    calculateAccuracy,
  };
}
