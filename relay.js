/**
 * evi's TicTacToe — WebSocket Relay Server
 *
 * 4자리 방 코드 기반 중계 서버.
 * Host가 방을 만들면 코드를 생성하고, Guest가 코드로 입장.
 * 이후 모든 게임 메시지를 양측에 중계.
 *
 * Usage: node relay.js
 * Port: 환경변수 PORT || 7650
 */
const WebSocket = require('ws');

const PORT = process.env.PORT || 7650;
const wss = new WebSocket.Server({ port: PORT });

// rooms: Map<roomCode, { host: WebSocket, guest: WebSocket|null }>
const rooms = new Map();

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));
  return code;
}

wss.on('connection', (ws) => {
  ws._roomCode = null;
  ws._role = null;
  let keepAlive = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {

      case 'CREATE_ROOM': {
        const code = generateCode();
        rooms.set(code, { host: ws, guest: null });
        ws._roomCode = code;
        ws._role = 'host';
        ws.send(JSON.stringify({ type: 'ROOM_CREATED', payload: { code } }));
        console.log(`[ROOM] Created: ${code}`);
        break;
      }

      case 'JOIN_ROOM': {
        const code = (msg.payload && msg.payload.code || '').toUpperCase();
        const room = rooms.get(code);
        if (!room) {
          ws.send(JSON.stringify({ type: 'ERROR', payload: '방을 찾을 수 없습니다' }));
          return;
        }
        if (room.guest) {
          ws.send(JSON.stringify({ type: 'ERROR', payload: '방이 가득 찼습니다' }));
          return;
        }
        room.guest = ws;
        ws._roomCode = code;
        ws._role = 'guest';
        ws.send(JSON.stringify({ type: 'ROOM_JOINED', payload: { code } }));
        room.host.send(JSON.stringify({ type: 'PEER_JOINED' }));
        console.log(`[ROOM] Joined: ${code}`);
        break;
      }

      case 'GAME_MESSAGE': {
        const room = rooms.get(ws._roomCode);
        if (!room) return;
        const target = ws._role === 'host' ? room.guest : room.host;
        if (target && target.readyState === WebSocket.OPEN) {
          target.send(JSON.stringify({ type: 'GAME_MESSAGE', payload: msg.payload }));
        }
        break;
      }

      case 'PING': {
        ws.send(JSON.stringify({ type: 'PONG' }));
        break;
      }
    }
  });

  ws.on('close', () => {
    const code = ws._roomCode;
    const room = rooms.get(code);
    if (!room) return;

    const other = ws._role === 'host' ? room.guest : room.host;
    if (other && other.readyState === WebSocket.OPEN) {
      other.send(JSON.stringify({ type: 'PEER_DISCONNECTED' }));
    }
    rooms.delete(code);
    if (keepAlive) clearInterval(keepAlive);
    console.log(`[ROOM] Closed: ${code}`);
  });

  ws.on('error', () => {});
});

console.log(`\n  evi's TicTacToe — Relay Server`);
console.log(`  ─────────────────────────────`);
console.log(`  Port : ${PORT}`);
console.log(`  URL  : ws://localhost:${PORT}\n`);
