/**
 * eviTicTacToe — WebSocket Game Server
 *
 * 로컬 PC에서 실행되는 게임 서버.
 * 방 생성/참여를 관리하고 플레이어 간 메시지를 중계합니다.
 *
 * 사용법: node server.js
 * 기본 포트: 8080 (PORT 환경변수로 변경 가능)
 */

const { WebSocketServer } = require('ws');

const PORT = parseInt(process.env.PORT, 10) || 8080;
const ROOM_CODE_LENGTH = 4;

// ─── 방/플레이어 상태 ───
const rooms = new Map();   // roomCode → { host, guest, state }

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동 문자 제외 (0O, 1I)
  let code;
  do {
    code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));
  return code;
}

// ─── 메시지 송신 헬퍼 ───
function send(ws, data) {
  if (ws && ws.readyState === 1) { // WebSocket.OPEN
    ws.send(JSON.stringify(data));
  }
}

// ─── WebSocket 서버 ───
const wss = new WebSocketServer({ port: PORT });
console.log(`[eviTicTacToe Server] listening on port ${PORT}`);
console.log(`[eviTicTacToe Server] http://localhost:${PORT}`);

wss.on('connection', (ws) => {
  console.log(`[+] New connection (total: ${wss.clients.size})`);

  let playerInfo = null; // { code, role, isAlive: bool }

  // ─── 핑/퐁 (연결 유지) ───
  const pingTimer = setInterval(() => {
    if (ws.readyState === 1) {
      ws.ping();
    }
  }, 15000);

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, { type: 'ERROR', payload: 'Invalid JSON' });
      return;
    }

    switch (msg.type) {

      // ───── CREATE_ROOM ─────
      case 'CREATE_ROOM': {
        const code = generateRoomCode();
        const room = { host: ws, guest: null, state: 'WAITING' };
        rooms.set(code, room);
        playerInfo = { code, role: 'O', room };

        send(ws, { type: 'ROOM_CREATED', payload: { code, role: 'O' } });
        console.log(`[ROOM] ${code} created by host`);
        break;
      }

      // ───── JOIN_ROOM ─────
      case 'JOIN_ROOM': {
        const { code } = msg.payload;
        if (!code) {
          send(ws, { type: 'ERROR', payload: '방 코드가 필요합니다' });
          return;
        }

        const room = rooms.get(code.toUpperCase());
        if (!room) {
          send(ws, { type: 'ERROR', payload: '방을 찾을 수 없습니다' });
          return;
        }
        if (room.guest) {
          send(ws, { type: 'ERROR', payload: '방이 이미 가득 찼습니다' });
          return;
        }
        if (room.state !== 'WAITING') {
          send(ws, { type: 'ERROR', payload: '더 이상 참여할 수 없는 방입니다' });
          return;
        }

        room.guest = ws;
        room.state = 'PLAYING';
        playerInfo = { code, role: 'X', room };

        send(ws, { type: 'ROOM_JOINED', payload: { code, role: 'X' } });
        send(room.host, { type: 'PEER_JOINED', payload: { role: 'X' } });
        console.log(`[ROOM] ${code}: guest joined, game started`);
        break;
      }

      // ───── GAME_MESSAGE (중계) ─────
      case 'GAME_MESSAGE': {
        if (!playerInfo || !playerInfo.room) {
          send(ws, { type: 'ERROR', payload: '방에 참여하지 않았습니다' });
          return;
        }
        const { room, role } = playerInfo;
        const target = role === 'O' ? room.guest : room.host;
        if (target) {
          send(target, { type: 'GAME_MESSAGE', payload: msg.payload });
        }
        break;
      }

      // ───── PING ─────
      case 'PING': {
        send(ws, { type: 'PONG' });
        break;
      }

      default:
        send(ws, { type: 'ERROR', payload: `Unknown message type: ${msg.type}` });
    }
  });

  // ─── 연결 종료 처리 ───
  ws.on('close', () => {
    clearInterval(pingTimer);
    console.log(`[-] Connection closed (total: ${wss.clients.size - 1})`);

    if (!playerInfo || !playerInfo.room) return;
    const { code, role, room } = playerInfo;

    // 상대방에게 알림
    const opponent = role === 'O' ? room.guest : room.host;
    if (opponent && opponent.readyState === 1) {
      send(opponent, { type: 'PEER_DISCONNECTED', payload: { message: '상대방이 연결을 끊었습니다' } });
    }

    rooms.delete(code);
    console.log(`[ROOM] ${code} destroyed (player disconnected)`);
  });

  ws.on('error', (err) => {
    console.error('[!] WebSocket error:', err.message);
  });
});

console.log(`[eviTicTacToe Server] Ready for connections`);