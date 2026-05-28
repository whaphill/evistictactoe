# evi's TicTacToe — Game Design Document

## 1. Project Overview

| Field | Description |
|---|---|
| **Project Name** | evi's TicTacToe (evi의 3목 틱택토) |
| **Type** | Browser-based 2-player strategy board game |
| **Core Concept** | 9×9 보드판 위에서 2명의 플레이어가 O와 X를 번갈아 배치하며, 연속 3개의 같은 말을 나란히 놓으면 점수를 획득하는 게임. 점수에 사용된 셀도 다른 방향의 3목을 위해 계속 사용할 수 있다. |
| **Target Users** | 2명이 한 기기에서 플레이하는 오목 系列 게임 팬 |
| **Tech Stack** | Single HTML file (Vanilla JS, CSS, HTML) — no framework |

---

## 2. Game Rules

### 2.1 Basic Flow
1. 게임 시작 시 9×9 빈 보드와 턴 표시, 점수판이 표시된다.
2. Player O가 선공하며, Player X가 후공한다.
3. 플레이어는 빈 셀을 클릭하여 자신의 말을 배치한다.
4. 한 턴에 하나의 셀만 배치할 수 있다.
5. 연속된 3개의 같은 말이 가로/세로/대각선 중 어느 방향이든 달성되면 **1점**을 획득한다.
6. 이미 말을 놓은 셀에는 둘 수 없다 (유효한 클릭만 허용).
7. 10점을 먼저 달성한 플레이어가 승리한다.

### 2.2 Win Condition
- **승리 조건**: 어느 플레이어든 10점을 먼저 획득하면 게임 종료

### 2.3 Directional Block Scoring — 핵심 규칙

#### 블록 구조
- **각 셀(cell)마다 4개 방향(Direction)별 block 플래그**가 존재한다.
- Direction 인덱스: `0` = 가로(→), `1` = 세로(↓), `2` = 대각선↘, `3` = 대각선↗
- `blockedDirs[d] = true` 이면 해당 방향(d)으로 연속 3목檢출 시 **점수를加利하지 않음**.
- `blockedDirs[d] = false` 이면 해당 방향(d)으로 3목이 완성되면 점수 획득 가능.

#### 블록 작동 방식 (점수 획득 시)
1. 특정 방향 d로 연속 3목이 완성되고 점수가 획득된다.
2. **해당 3개 셀의 direction d만** `blockedDirs[d] = true`로 설정된다.
3. 나머지 3개 방향은 **변함 없이 계속開放** — 해당 셀들은 다른 방향으로 새로운 3목을 만드는 데 사용 가능하다.

```
예시: O가 (0,0)-(0,1)-(0,2) 수평으로 3목 완성 → 점수 1 획득
→ (0,0), (0,1), (0,2) 각각 blockedDirs[0]=true (가로 차단)
→ (0,0)仍然可以参与垂直/對角線方向的3目 forming
→ (0,1)또 likewise
→ (0,2)또 likewise
```

#### 블록 vs 기존 오목 규칙과의 차이
- 기존: 셀 전체를 "사용 완료"로 처리 → 다른 방향으로도 完全再利用 불가
- 신규: 방향별 개별 block → 같은 셀이라도 未사용 방향으로는 계속 점수 획득 가능

#### 3목 완성 감지 순서
1. 네 방향(가로/세로/대각선↘/대각선↗) 각각에 대해 보드를 스캔
2. 각 방향마다 모든 가능한 연속 3셀 조합을 확인
3. 세 셀이 모두 현재 플레이어의 표시이고, 모두 `blockedDirs[d] == false`인 경우에만 **유효한 3목**으로 인정
4. 유효한 3목이 발견되면 점수 부여 + 해당 3셀의 `blockedDirs[d] = true`

### 2.4 중복 점수 방지
- 이미 해당 방향으로 block된 셀은 다시 점수를加利할 수 없다.
- 세 방향 모두에서 사용 가능한 셀이 없는 경우 해당 방향의 3목은 완성되지 않는다.
- 따라서 별도의 "이미 점수받은 triple 목록" Set이 필요 없음 — `blockedDirs` 상태만으로 중복이 자동 방지됨.

---

## 3. Visual & Rendering Specification

### 3.1 Layout Structure

```
┌──────────────────────────────────────┐
│           HEADER / TITLE             │
│         evi's TicTacToe              │
├──────────────────────────────────────┤
│         SCOREBOARD (중앙)             │
│    [O: 0]        vs        [X: 0]    │
│          현재 턴: Player O             │
├──────────────────────────────────────┤
│            9×9 BOARD                 │
│         (본 게임 보드)                  │
├──────────────────────────────────────┤
│         GAME MESSAGE / STATUS        │
│   (승리 / 무승부 / 현재 턴 안내)        │
├──────────────────────────────────────┤
│           [RESTART] 버튼               │
└──────────────────────────────────────┘
```

### 3.2 Color Palette

| Element | Color |
|---|---|
| Page Background | `#0a0a0f` (깊은 네이비) |
| Board Background | `#12121a` |
| Grid Lines | `#2a2a3a` |
| Cell Hover | `#1e1e2e` |
| O Mark (Player 1) | `#ff6b9d` (따뜻한 핑크) |
| X Mark (Player 2) | `#4ecdc4` (쿨 티줄) |
| Score Panel BG | `#1a1a2e` |
| Winner Highlight | gold glow animation |
| Text Primary | `#e0e0e0` |
| Text Accent | `#ffd700` (gold, 점수 표시) |

### 3.3 Typography
- **Title**: `'Playfair Display'` (Google Fonts) — 올드好莱坞 스타일, 귀족적
- **Score / Turn**: `'JetBrains Mono'` (Google Fonts) — 모던 모노스페이스
- **Message**: `'Noto Sans KR'` (Google Fonts) — 한글 표시 지원

### 3.4 Board Design
- 9×9 그리드는 **두께 있는 실선**으로 구분 (0.5px, 밝은 블루)
- 홀수 3×3 블록 경계는 더 진하게 표시 (2px)
- 각 셀 크기: `min(5vw, 45px)` — 반응형
- 셀間の 간격: `2px`
- O / X 마크: 텍스트 렌더링, 크기는 셀의 70%

### 3.5 Animations
| Event | Animation |
|---|---|
| 셀에 말 배치 | scale 0→1 + opacity fade-in, 200ms ease-out |
| 3목 완성 | 해당 3개 셀에 glow pulse + 점수 +1 카운트 업 애니메이션 |
| 승리 | 전체 보드에 radial gold glow, 승리 메시지 bounce-in |
| Restart 버튼 hover | scale up + glow |
| 셀 hover | 배경만 slight highlight |

---

## 4. Audio Specification (Optional Enhancement)

*사운드는 메인 개발 후 추가 옵션이며, 초기 버전은 무음으로 제작*

---

## 5. Interaction Specification

### 5.1 User Input
- **마우스 클릭**: 빈 셀에 말 배치
- **터치**: 모바일에서의 탭 입력
- **Restart 버튼**: 게임 초기화 (점수, 보드, 턴 모두 초기 상태로)

### 5.2 Game States
```
IDLE → PLAYING → GAME_OVER
         ↑              │
         └──── RESTART ─┘
```

| State | 설명 |
|---|---|
| `PLAYING` | 게임 진행 중, 클릭 수락 |
| `GAME_OVER` | 승자 결정, 보드 잠김, Restart 버튼만 활성화 |

### 5.3 Feedback
- Hover 시 배치 가능 여부를 시각적으로 표시 (불가능 시 cursor: not-allowed)
- 유효하지 않은 클릭 (이미 차 있는 셀): 해당 셀에 shake animation (100ms)

---

## 6. Technical Implementation

### 6.1 File Structure
```
evisTicTacToe/
├── index.html    (all-in-one: HTML + CSS + JS)
└── SPEC.md       (본 문서)
```

### 6.2 HTML Structure
```html
<div id="app">
  <header>
    <h1>evi's TicTacToe</h1>
    <p class="subtitle">3목 틱택토 · 10점 먼저 이기는 사람이 승리</p>
  </header>

  <div id="scoreboard">
    <!-- 점수판 UI -->
  </div>

  <div id="board">
    <!-- 9×9 = 81 cells -->
  </div>

  <div id="message">
    <!-- 게임 메시지 / 턴 안내 -->
  </div>

  <button id="restart-btn">다시 시작</button>
</div>
```

### 6.3 3목 Detection Algorithm (Directional Block 방식)

```
directions = [
  { dr: 0,  dc: 1  },  // 0: 가로 (→)
  { dr: 1,  dc: 0  },  // 1: 세로 (↓)
  { dr: 1,  dc: 1  },  // 2: 대각선↘
  { dr: 1,  dc: -1 },  // 3: 대각선↗
]

FOR EACH direction d (0~3):
  dr = directions[d].dr, dc = directions[d].dc

  FOR r = 0..8:
    FOR c = 0..8:
      // Check if cell (r,c) can START a triple in direction d
      // A cell is valid start if all cells [r, r+dr, r+2dr] × [c, c+dc, c+2dc] are:
      //   1. within bounds
      //   2. same player value (board[r][c].value)
      //   3. NOT blocked in direction d (board[rr][cc].blockedDirs[d] == false)
      // If YES for ALL 3 cells → valid triple found → score++ and block {d} for all 3 cells
```

**중요**: 4개 방향 각각 독립적으로檢출한다.同一セルが複数の異なる方法で3목を形成 가능하다.

### 6.4 State Management

```javascript
// board[r][c] = { value: null | 'O' | 'X', blockedDirs: [false, false, false, false] }
// blockedDirs[d] === true → direction d로는 이 셀을使った3목禁止

const state = {
  board: Array(9).fill(null).map(() =>
    Array(9).fill(null).map(() => ({
      value: null,
      blockedDirs: [false, false, false, false],
    }))
  ),
  scores: { O: 0, X: 0 },
  currentPlayer: 'O',
  gameStatus: 'PLAYING' // 'PLAYING' | 'GAME_OVER'
};
```

**Key invariant**: `blockedDirs`는 오직 세 셀 모두의 값이 동일한 방향 d의 triple完成시에만 `true`로 설정된다. 다른 상황에서는 변경되지 않는다.

---

## 7. Acceptance Criteria

| # | Criteria |
|---|---|
| 1 | 9×9 보드가 올바르게 렌더링된다 |
| 2 | Player O가 먼저 시작하고 O와 X가 번갈아 배치된다 |
| 3 | 이미 차 있는 셀에는 말을 놓을 수 없다 |
| 4 | 가로/세로/대각선 연속 3목 완성 시 점수가 1점씩 올라간다 |
| 5 | 동시에 여러 방향 3목 완성 시 각각 점수가 올라간다 |
| 6 | 점수 획득 시 해당 3셀의 해당 방향만 block되고, 나머지 방향은 계속 사용 가능하다 |
| 7 | 같은 방향으로 이미 block된 셀은 중복 점수를 받을 수 없다 |
| 8 | 먼저 10점에 도달한 플레이어가 승리 처리된다 |
| 9 | 승리 시 게임이 멈추고 승리 메시지가 표시된다 |
| 10 | Restart 버튼 클릭 시 모든 상태가 초기화된다 |
| 11 | 모바일 터치 입력으로 정상적으로 플레이할 수 있다 |