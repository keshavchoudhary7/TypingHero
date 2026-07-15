import http from 'http';
import crypto from 'crypto';
import { getDatabase } from '../lib/db.js';

// Types for multiplayer sessions
type Player = {
  id: string;
  socket: any; // Raw net.Socket
  username: string;
  avatarId: string;
  progress: number; // 0 - 100
  wpm: number;
  finished: boolean;
  accuracy?: number;
  timeMs?: number;
  rank?: number;
  isHost: boolean;
};

type Room = {
  roomCode: string;
  players: Player[];
  status: 'waiting' | 'countdown' | 'racing' | 'finished';
  passage: string;
  levelId: number;
  countdownTimer?: NodeJS.Timeout;
};

const rooms = new Map<string, Room>();
const matchmakingQueue: { id: string; socket: any; username: string; avatarId: string }[] = [];

// Sample passages for multiplayer races
const MULTIPLAYER_PASSAGES = [
  { levelId: 101, passage: 'Deep in the Whispering Woods, a rogue shadows the sleeping dragon, waiting for the crystal to glow.' },
  { levelId: 102, passage: 'Mages of the Obsidian Citadel chant old runes of power, locking the gates against the invading iron army.' },
  { levelId: 103, passage: 'The swift archer draws her golden bow, aiming at the target glowing on top of the ancient stone ruins.' },
  { levelId: 104, passage: 'Valiant knights shield the castle gates as wizards conjure celestial fires to protect the realm.' },
  { levelId: 105, passage: 'Under the blood moon, shadow blades duel on the high rooftops of the forgotten desert city.' }
];

function getRandomPassage() {
  return MULTIPLAYER_PASSAGES[Math.floor(Math.random() * MULTIPLAYER_PASSAGES.length)];
}

// ─── WebSocket Framing Protocol Implementation ──────────────────────────────

function parseWSFrame(buffer: Buffer): { opcode: number; message: string } | null {
  if (buffer.length < 2) return null;
  const firstByte = buffer[0];
  const secondByte = buffer[1];
  
  const opcode = firstByte & 0x0f;
  const isMasked = (secondByte & 0x80) !== 0;
  let payloadLen = secondByte & 0x7f;
  let offset = 2;

  // Connection close opcode
  if (opcode === 0x8) {
    return { opcode, message: '' };
  }

  if (payloadLen === 126) {
    if (buffer.length < 4) return null;
    payloadLen = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLen === 127) {
    if (buffer.length < 10) return null;
    const high = buffer.readUInt32BE(2);
    const low = buffer.readUInt32BE(6);
    payloadLen = high * 0x100000000 + low;
    offset = 10;
  }

  if (isMasked) {
    if (buffer.length < offset + 4 + payloadLen) return null;
    const maskKey = buffer.slice(offset, offset + 4);
    offset += 4;
    const payload = buffer.slice(offset, offset + payloadLen);
    const decoded = Buffer.alloc(payloadLen);
    for (let i = 0; i < payloadLen; i++) {
      decoded[i] = payload[i] ^ maskKey[i % 4];
    }
    return { opcode, message: decoded.toString('utf8') };
  } else {
    if (buffer.length < offset + payloadLen) return null;
    const payload = buffer.slice(offset, offset + payloadLen);
    return { opcode, message: payload.toString('utf8') };
  }
}

function sendWSMessage(socket: any, data: any) {
  try {
    const payload = Buffer.from(JSON.stringify(data), 'utf8');
    const len = payload.length;
    let header: Buffer;

    if (len <= 125) {
      header = Buffer.alloc(2);
      header[0] = 0x81; // FIN + Text frame opcode
      header[1] = len;  // Mask = 0
    } else if (len <= 65535) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeUInt32BE(Math.floor(len / 0x100000000), 2);
      header.writeUInt32BE(len % 0x100000000, 6);
    }

    socket.write(Buffer.concat([header, payload]));
  } catch (err) {
    console.error('Socket write error:', err);
  }
}

// ─── Room / Game Management ──────────────────────────────────────────────────

function getPlayerRoom(socket: any): Room | null {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.socket === socket)) {
      return room;
    }
  }
  return null;
}

function getPlayerInRoom(room: Room, socket: any): Player | null {
  return room.players.find((p) => p.socket === socket) || null;
}

function broadcastToRoom(room: Room, data: any) {
  // Strip raw sockets from broadcasting to prevent JSON circular reference errors
  const safePlayers = room.players.map((p) => ({
    id: p.id,
    username: p.username,
    avatarId: p.avatarId,
    progress: p.progress,
    wpm: p.wpm,
    finished: p.finished,
    isHost: p.isHost,
    rank: p.rank,
    timeMs: p.timeMs,
    accuracy: p.accuracy
  }));

  const broadcastData = {
    ...data,
    room: {
      roomCode: room.roomCode,
      status: room.status,
      passage: room.passage,
      levelId: room.levelId,
      players: safePlayers
    }
  };

  room.players.forEach((p) => {
    sendWSMessage(p.socket, broadcastData);
  });
}

function handleDisconnect(socket: any) {
  // Remove from matchmaking queue
  const qIdx = matchmakingQueue.findIndex((q) => q.socket === socket);
  if (qIdx !== -1) {
    matchmakingQueue.splice(qIdx, 1);
    broadcastQueueStatus();
    return;
  }

  // Remove from room
  const room = getPlayerRoom(socket);
  if (room) {
    const pIdx = room.players.findIndex((p) => p.socket === socket);
    if (pIdx !== -1) {
      const player = room.players[pIdx];
      room.players.splice(pIdx, 1);

      // If room is empty, delete it
      if (room.players.length === 0) {
        if (room.countdownTimer) clearInterval(room.countdownTimer);
        rooms.delete(room.roomCode);
        return;
      }

      // If host left, elect new host
      if (player.isHost && room.players.length > 0) {
        room.players[0].isHost = true;
      }

      // If racing, check if this disconnect triggers the end of race
      if (room.status === 'racing' || room.status === 'countdown') {
        checkRaceCompletion(room);
      } else {
        broadcastToRoom(room, { type: 'room_state' });
      }
    }
  }
}

function broadcastQueueStatus() {
  matchmakingQueue.forEach((q) => {
    sendWSMessage(q.socket, {
      type: 'queue_status',
      count: matchmakingQueue.length
    });
  });
}

function checkRaceCompletion(room: Room) {
  const allCompleted = room.players.every((p) => p.finished);
  if (allCompleted) {
    room.status = 'finished';
    broadcastToRoom(room, { type: 'race_results' });
  } else {
    broadcastToRoom(room, { type: 'room_state' });
  }
}

function startCountdown(room: Room) {
  room.status = 'countdown';
  let seconds = 5;

  broadcastToRoom(room, { type: 'countdown_start', seconds });

  room.countdownTimer = setInterval(() => {
    seconds--;
    if (seconds <= 0) {
      if (room.countdownTimer) clearInterval(room.countdownTimer);
      room.status = 'racing';
      broadcastToRoom(room, { type: 'race_start' });
    } else {
      broadcastToRoom(room, { type: 'countdown_update', seconds });
    }
  }, 1000);
}

// ─── WebSocket Event Router ──────────────────────────────────────────────────

function handleWSMessage(socket: any, message: string) {
  try {
    const payload = JSON.parse(message);
    const playerId = socket.playerId;

    switch (payload.type) {
      case 'join_queue': {
        // Remove from existing rooms first
        handleDisconnect(socket);

        matchmakingQueue.push({
          id: playerId,
          socket,
          username: payload.username || 'Guest Hero',
          avatarId: payload.avatarId || 'knight'
        });

        broadcastQueueStatus();

        // Matchmaking logic: Group 2-4 players together
        if (matchmakingQueue.length >= 2) {
          // Take top 2-3 players and start a match
          const playersToMatch = matchmakingQueue.splice(0, 3);
          const roomCode = 'ROOM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
          const passageInfo = getRandomPassage();

          const matchedRoom: Room = {
            roomCode,
            status: 'waiting',
            passage: passageInfo.passage,
            levelId: passageInfo.levelId,
            players: playersToMatch.map((p, index) => ({
              id: p.id,
              socket: p.socket,
              username: p.username,
              avatarId: p.avatarId,
              progress: 0,
              wpm: 0,
              finished: false,
              isHost: index === 0
            }))
          };

          rooms.set(roomCode, matchedRoom);
          broadcastToRoom(matchedRoom, { type: 'room_state' });
          startCountdown(matchedRoom);
        }
        break;
      }

      case 'leave_queue': {
        handleDisconnect(socket);
        sendWSMessage(socket, { type: 'left_queue' });
        break;
      }

      case 'create_room': {
        handleDisconnect(socket);
        const roomCode = 'ROOM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const passageInfo = getRandomPassage();

        const newRoom: Room = {
          roomCode,
          status: 'waiting',
          passage: passageInfo.passage,
          levelId: passageInfo.levelId,
          players: [{
            id: playerId,
            socket,
            username: payload.username || 'Guest Hero',
            avatarId: payload.avatarId || 'knight',
            progress: 0,
            wpm: 0,
            finished: false,
            isHost: true
          }]
        };

        rooms.set(roomCode, newRoom);
        sendWSMessage(socket, { type: 'room_created', roomCode });
        broadcastToRoom(newRoom, { type: 'room_state' });
        break;
      }

      case 'join_room': {
        handleDisconnect(socket);
        const roomCode = (payload.roomCode || '').toUpperCase();
        const room = rooms.get(roomCode);

        if (!room) {
          sendWSMessage(socket, { type: 'error', message: 'Room not found.' });
          return;
        }

        if (room.status !== 'waiting') {
          sendWSMessage(socket, { type: 'error', message: 'Race is already in progress or completed.' });
          return;
        }

        if (room.players.length >= 4) {
          sendWSMessage(socket, { type: 'error', message: 'Room is full.' });
          return;
        }

        room.players.push({
          id: playerId,
          socket,
          username: payload.username || 'Guest Hero',
          avatarId: payload.avatarId || 'knight',
          progress: 0,
          wpm: 0,
          finished: false,
          isHost: false
        });

        broadcastToRoom(room, { type: 'room_state' });
        break;
      }

      case 'start_custom_race': {
        const room = getPlayerRoom(socket);
        const player = room ? getPlayerInRoom(room, socket) : null;
        if (room && player && player.isHost && room.status === 'waiting') {
          startCountdown(room);
        }
        break;
      }

      case 'race_progress': {
        const room = getPlayerRoom(socket);
        const player = room ? getPlayerInRoom(room, socket) : null;
        if (room && player && room.status === 'racing') {
          player.progress = Math.min(100, Math.max(0, Number(payload.progress)));
          player.wpm = Math.round(Number(payload.wpm));
          
          // Broadcast progress update to opponents
          broadcastToRoom(room, { type: 'room_state' });
        }
        break;
      }

      case 'race_finish': {
        const room = getPlayerRoom(socket);
        const player = room ? getPlayerInRoom(room, socket) : null;
        if (room && player && room.status === 'racing' && !player.finished) {
          player.progress = 100;
          player.wpm = Math.round(Number(payload.wpm));
          player.accuracy = Math.round(Number(payload.accuracy));
          player.timeMs = Number(payload.elapsedMs);
          player.finished = true;

          // Assign placement rank
          const finishers = room.players.filter((p) => p.finished).length;
          player.rank = finishers;

          // Record score submission to DB if valid/authenticated
          void (async () => {
            try {
              const db = await getDatabase();
              await db.collection('attempts').insertOne({
                userId: player.id,
                username: player.username,
                avatarId: player.avatarId,
                levelId: room.levelId,
                wpm: player.wpm,
                accuracy: player.accuracy,
                netWpm: Math.round(player.wpm * ((player.accuracy || 100) / 100)),
                stars: 3, // Multiplayer defaults to 3-star rating logs
                status: 'valid',
                multiplayer: true,
                rank: player.rank,
                createdAt: new Date()
              });
            } catch (err) {
              console.error('Multiplayer score recording error:', err);
            }
          })();

          checkRaceCompletion(room);
        }
        break;
      }

      case 'leave_room': {
        handleDisconnect(socket);
        sendWSMessage(socket, { type: 'left_room' });
        break;
      }
    }
  } catch (e) {
    console.error('Message parsing failure:', e);
  }
}

// ─── WebSocket Server Initialization ────────────────────────────────────────

export function initializeWebSocketServer(server: http.Server) {
  server.on('upgrade', (req, socket, head) => {
    if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
      const socketKey = req.headers['sec-websocket-key'];
      if (!socketKey) {
        socket.destroy();
        return;
      }

      // Handshake upgrade approval
      const hash = crypto
        .createHash('sha1')
        .update(socketKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
        .digest('base64');

      socket.write(
        'HTTP/1.1 101 Switching Protocols\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        `Sec-WebSocket-Accept: ${hash}\r\n` +
        '\r\n'
      );

      // Assign dynamic connection ID
      const playerId = 'usr-' + crypto.randomBytes(6).toString('hex');
      const wsSocket = socket as any;
      wsSocket.playerId = playerId;

      // Handle raw buffer data
      socket.on('data', (buffer) => {
        const frame = parseWSFrame(buffer);
        if (frame) {
          if (frame.opcode === 0x8) {
            handleDisconnect(wsSocket);
          } else {
            handleWSMessage(wsSocket, frame.message);
          }
        }
      });

      socket.on('close', () => {
        handleDisconnect(wsSocket);
      });

      socket.on('error', (err) => {
        console.error('Socket stream error:', err);
        handleDisconnect(wsSocket);
      });
    }
  });
}
