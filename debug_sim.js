// TicTacToe Debug Simulation
const WIN_SCORE = 10;
const BOARD_SIZE = 9;
const DIRS = [
  { dr: 0,  dc: 1  },  // 0: horizontal →
  { dr: 1,  dc: 0  },  // 1: vertical ↓
  { dr: 1,  dc: 1  },  // 2: diagonal ↘
  { dr: 1,  dc: -1 },  // 3: diagonal ↗
];

function initBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({
      value: null,
      blockedDirs: [false, false, false, false],
    }))
  );
}

function detectTriples(board, player) {
  const found = [];
  for (let d = 0; d < 4; d++) {
    const { dr, dc } = DIRS[d];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c].value !== player) continue;
        const r1 = r + dr, c1 = c + dc;
        const r2 = r + 2*dr, c2 = c + 2*dc;
        if (r2 < 0 || r2 >= BOARD_SIZE || c2 < 0 || c2 >= BOARD_SIZE) continue;
        if (board[r1][c1].value !== player) continue;
        if (board[r2][c2].value !== player) continue;
        if (board[r][c].blockedDirs[d]) continue;
        if (board[r1][c1].blockedDirs[d]) continue;
        if (board[r2][c2].blockedDirs[d]) continue;
        found.push({ cells: [[r,c],[r1,c1],[r2,c2]], dirIdx: d, player });
      }
    }
  }
  return found;
}

function playGame(gameNum) {
  let board = initBoard();
  let scores = { O: 0, X: 0 };
  let current = 'O';
  let moves = 0;
  let triples = [];

  // Random game play
  while (scores.O < WIN_SCORE && scores.X < WIN_SCORE && moves < 400) {
    // Find valid moves
    let validMoves = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c].value === null) {
          validMoves.push([r, c]);
        }
      }
    }

    if (validMoves.length === 0) break;

    // Make a random move
    const randomIdx = Math.floor(Math.random() * validMoves.length);
    const [r, c] = validMoves[randomIdx];
    board[r][c].value = current;

    // Check for triples
    const newTriples = detectTriples(board, current);

    if (newTriples.length > 0) {
      for (const t of newTriples) {
        triples.push({...t, move: moves + 1});

        // Block direction
        t.cells.forEach(([tr, tc]) => {
          board[tr][tc].blockedDirs[t.dirIdx] = true;
        });
      }
      scores[current] += newTriples.length;

      if (scores[current] >= WIN_SCORE) {
        return { game: gameNum, winner: current, scores: {...scores}, triples, moves };
      }
    }

    current = current === 'O' ? 'X' : 'O';
    moves++;
  }

  return { game: gameNum, winner: 'draw', scores: {...scores}, triples, moves };
}

// Run 10 simulations
console.log('=== Running 10 Game Simulations ===\n');

let totalTriples = { O: 0, X: 0, byDir: { 0: 0, 1: 0, 2: 0, 3: 0 }, horiz: 0, diag: 0 };
let allTriples = [];

for (let i = 1; i <= 10; i++) {
  const result = playGame(i);

  console.log(`Game ${i}: Winner=${result.winner}, Moves=${result.moves}, Scores={O:${result.scores.O},X:${result.scores.X}}`);
  console.log(`  Triples scored: ${result.triples.length}`);

  const dirNames = ['→', '↓', '↘', '↗'];

  for (const t of result.triples) {
    totalTriples[t.player]++;
    totalTriples.byDir[t.dirIdx]++;

    if (t.dirIdx >= 2) {
      totalTriples.diag++;
    } else {
      totalTriples.horiz++;
    }

    console.log(`    - ${t.player} @ move ${t.move}: Dir ${t.dirIdx} ${dirNames[t.dirIdx]} cells=[(${t.cells[0][0]},${t.cells[0][1]}),(${t.cells[1][0]},${t.cells[1][1]}),(${t.cells[2][0]},${t.cells[2][1]})]`);
  }

  if (result.triples.length === 0) {
    console.log('    WARNING: No triples recorded!');
  }

  allTriples.push(...result.triples);
}

console.log('\n=== SUMMARY ===');
console.log(`Total triples: O=${totalTriples.O}, X=${totalTriples.X}, All=${allTriples.length}`);
console.log(`By direction: →=${totalTriples.byDir[0]}, ↓=${totalTriples.byDir[1]}, ↘=${totalTriples.byDir[2]}, ↗=${totalTriples.byDir[3]}`);
console.log(`Horiz+Vert: ${totalTriples.horiz}, Diagonal: ${totalTriples.diag}`);

if (totalTriples.diag === 0 && totalTriples.horiz > 0) {
  console.log('\n!!! BUG DETECTED: No diagonal triples in 10 games despite horizontal/vertical triples');
}

if (totalTriples.diag > 0) {
  console.log('\nDiagonal detection WORKS - bug is likely in LINE DRAWING code');
} else if (totalTriples.horiz === 0) {
  console.log('\nNo triples of any kind scored - may be random play issue');
}