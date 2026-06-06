# evi's TicTacToe - Multiplayer Implementation

## Overview
This implementation adds peer-to-peer multiplayer functionality to the existing evi's TicTacToe game using WebRTC and QR code-based signaling.

## Features
- **Preserves Original Gameplay**: All existing single-player functionality remains unchanged
- **QR Code Signaling**: Uses QR codes to exchange WebRTC offer/answer and ICE candidates
- **WebRTC DataChannel**: Reliable peer-to-peer communication for game moves
- **Turn Management**: Proper turn synchronization between players
- **Optimistic Updates**: Immediate local feedback with move validation
- **Game Reset**: Synchronized game restart between players
- **Role Switching**: Ability to switch between offerer/answerer roles

## How to Play Multiplayer
1. Tap the "멀티플레이" (Multiplayer) button in the top-right corner
2. One player acts as the Offerer (creates the connection)
3. The other player acts as the Answerer (joins the connection)
4. Exchange QR codes:
   - Offerer shows their QR code first
   - Answerer scans it to receive the offer
   - Answerer then shows their QR code
   - Offerer scans it to complete the connection
5. Once connected, players take turns placing marks
6. The game state (board, scores, turn) is synchronized between both devices
7. Tap "다시 시작" or "한 판 더" to reset the game for both players

## Technical Implementation
- **WebRTC**: RTCPeerConnection with STUN server for NAT traversal
- **QR Code Generation**: QRCode.js library
- **QR Code Scanning**: html5-qrcode library
- **Signaling**: Offer/answer exchange via QR codes
- **Data Channel**: Reliable ordered delivery of game messages
- **Message Types**:
  - `{type: "move", row: <0-8>, col: <0-8>}` - Game moves
  - `{type: "reset"}` - Game reset requests

## File Structure
- `index.html` - Main game file with multiplayer implementation
- `index_backup.html` - Backup of original single-player version

## Browser Support
Works on modern browsers that support WebRTC and getUserMedia (most mobile and desktop browsers).

## Notes
- Requires camera access for QR code scanning
- Works best on local network or when both devices can establish direct connection
- Uses Google's public STUN server (stun.l.google.com:19302)
- No server-side components required - pure peer-to-peer