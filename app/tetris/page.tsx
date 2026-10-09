"use client";

import { useEffect, useReducer, useSyncExternalStore } from "react";
import type { MouseEvent, ReactNode } from "react";

const COLS = 10;
const ROWS = 20;
const PREVIEW_COUNT = 3;
const LINES_PER_LEVEL = 10;
const LINE_SCORES = [0, 100, 300, 500, 800];
const BEST_SCORE_KEY = "tetris-best-score";
const BEST_SCORE_EVENT = "tetris-best-score-change";

type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
type Matrix = number[][];
type Board = (PieceType | null)[][];
type Status = "idle" | "playing" | "paused" | "over";

type Piece = {
  type: PieceType;
  matrix: Matrix;
  x: number;
  y: number;
};

type Game = {
  board: Board;
  piece: Piece | null;
  queue: PieceType[];
  hold: PieceType | null;
  canHold: boolean;
  score: number;
  lines: number;
  level: number;
  status: Status;
};

// `bag` is a freshly shuffled set of the 7 pieces. Randomness is generated
// by the caller so the reducer itself stays pure.
type Action =
  | { type: "start"; bag: PieceType[] }
  | { type: "tick"; bag: PieceType[] }
  | { type: "hardDrop"; bag: PieceType[] }
  | { type: "hold"; bag: PieceType[] }
  | { type: "move"; dx: number }
  | { type: "softDrop" }
  | { type: "rotate"; dir: 1 | -1 }
  | { type: "togglePause" }
  | { type: "pause" };

const PIECE_TYPES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

const SHAPES: Record<PieceType, Matrix> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

const PIECE_COLOR: Record<PieceType, string> = {
  I: "bg-cyan-400",
  O: "bg-yellow-400",
  T: "bg-purple-500",
  S: "bg-green-500",
  Z: "bg-red-500",
  J: "bg-blue-500",
  L: "bg-orange-500",
};

const GHOST_COLOR: Record<PieceType, string> = {
  I: "border-cyan-400",
  O: "border-yellow-400",
  T: "border-purple-500",
  S: "border-green-500",
  Z: "border-red-500",
  J: "border-blue-500",
  L: "border-orange-500",
};

// Offsets tried in order when a rotation doesn't fit in place.
const KICKS: [number, number][] = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [-2, 0],
  [2, 0],
  [0, -1],
];

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<PieceType | null>(COLS).fill(null));
}

const INITIAL_GAME: Game = {
  board: emptyBoard(),
  piece: null,
  queue: [],
  hold: null,
  canHold: true,
  score: 0,
  lines: 0,
  level: 1,
  status: "idle",
};

function shuffledBag(): PieceType[] {
  const bag = [...PIECE_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function rotateMatrix(m: Matrix, dir: 1 | -1): Matrix {
  return dir === 1
    ? m[0].map((_, c) => m.map((row) => row[c]).reverse())
    : m[0].map((_, c) => m.map((row) => row[row.length - 1 - c]));
}

function spawn(type: PieceType): Piece {
  const matrix = SHAPES[type];
  return {
    type,
    matrix,
    x: Math.floor((COLS - matrix[0].length) / 2),
    // The I piece has an empty first row; lift it so it appears on the top row.
    y: type === "I" ? -1 : 0,
  };
}

function collides(board: Board, matrix: Matrix, x: number, y: number) {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (!matrix[r][c]) continue;
      const bx = x + c;
      const by = y + r;
      if (bx < 0 || bx >= COLS || by >= ROWS) return true;
      if (by >= 0 && board[by][bx]) return true;
    }
  }
  return false;
}

function dropDistance(board: Board, piece: Piece) {
  let d = 0;
  while (!collides(board, piece.matrix, piece.x, piece.y + d + 1)) d++;
  return d;
}

function takeNext(queue: PieceType[], bag: PieceType[]) {
  const filled = queue.length <= PREVIEW_COUNT ? [...queue, ...bag] : queue;
  return { next: filled[0], queue: filled.slice(1) };
}

// Merge the active piece into the board, clear full lines and spawn the next piece.
function lockPiece(game: Game, piece: Piece, bag: PieceType[]): Game {
  const board = game.board.map((row) => [...row]);
  let overflow = false;
  piece.matrix.forEach((row, r) =>
    row.forEach((filled, c) => {
      if (!filled) return;
      const by = piece.y + r;
      if (by < 0) overflow = true;
      else board[by][piece.x + c] = piece.type;
    }),
  );

  const remaining = board.filter((row) => row.some((cell) => !cell));
  const cleared = ROWS - remaining.length;
  const nextBoard: Board = [
    ...Array.from({ length: cleared }, () => Array<PieceType | null>(COLS).fill(null)),
    ...remaining,
  ];

  const lines = game.lines + cleared;
  const { next, queue } = takeNext(game.queue, bag);
  const nextPiece = spawn(next);
  const over =
    overflow || collides(nextBoard, nextPiece.matrix, nextPiece.x, nextPiece.y);

  return {
    ...game,
    board: nextBoard,
    piece: over ? null : nextPiece,
    queue,
    canHold: true,
    score: game.score + LINE_SCORES[cleared] * game.level,
    lines,
    level: Math.floor(lines / LINES_PER_LEVEL) + 1,
    status: over ? "over" : "playing",
  };
}

function reducer(game: Game, action: Action): Game {
  if (action.type === "start") {
    if (game.status === "playing" || game.status === "paused") return game;
    return {
      ...INITIAL_GAME,
      board: emptyBoard(),
      piece: spawn(action.bag[0]),
      queue: action.bag.slice(1),
      status: "playing",
    };
  }
  if (action.type === "togglePause") {
    if (game.status === "playing") return { ...game, status: "paused" };
    if (game.status === "paused") return { ...game, status: "playing" };
    return game;
  }

  const { piece } = game;
  if (game.status !== "playing" || !piece) return game;

  switch (action.type) {
    case "pause":
      return { ...game, status: "paused" };
    case "move": {
      const x = piece.x + action.dx;
      if (collides(game.board, piece.matrix, x, piece.y)) return game;
      return { ...game, piece: { ...piece, x } };
    }
    case "rotate": {
      const matrix = rotateMatrix(piece.matrix, action.dir);
      for (const [dx, dy] of KICKS) {
        const x = piece.x + dx;
        const y = piece.y + dy;
        if (!collides(game.board, matrix, x, y)) {
          return { ...game, piece: { ...piece, matrix, x, y } };
        }
      }
      return game;
    }
    case "softDrop": {
      if (collides(game.board, piece.matrix, piece.x, piece.y + 1)) return game;
      return {
        ...game,
        piece: { ...piece, y: piece.y + 1 },
        score: game.score + 1,
      };
    }
    case "tick": {
      if (collides(game.board, piece.matrix, piece.x, piece.y + 1)) {
        return lockPiece(game, piece, action.bag);
      }
      return { ...game, piece: { ...piece, y: piece.y + 1 } };
    }
    case "hardDrop": {
      const d = dropDistance(game.board, piece);
      return lockPiece(
        { ...game, score: game.score + d * 2 },
        { ...piece, y: piece.y + d },
        action.bag,
      );
    }
    case "hold": {
      if (!game.canHold) return game;
      if (game.hold) {
        const swapped = spawn(game.hold);
        if (collides(game.board, swapped.matrix, swapped.x, swapped.y)) return game;
        return { ...game, piece: swapped, hold: piece.type, canHold: false };
      }
      const { next, queue } = takeNext(game.queue, action.bag);
      return {
        ...game,
        piece: spawn(next),
        queue,
        hold: piece.type,
        canHold: false,
      };
    }
  }
}

function dropInterval(level: number) {
  return Math.max(80, 800 - (level - 1) * 70);
}

function subscribeBestScore(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(BEST_SCORE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(BEST_SCORE_EVENT, onChange);
  };
}

function readBestScore() {
  try {
    return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function PiecePreview({ type }: { type: PieceType | null }) {
  const rows = type ? SHAPES[type].filter((row) => row.some(Boolean)) : [];
  return (
    <div className="flex h-10 items-center justify-center">
      <div className="flex flex-col gap-px">
        {rows.map((row, r) => (
          <div key={r} className="flex gap-px">
            {row.map((filled, c) => (
              <span
                key={c}
                className={`h-3.5 w-3.5 rounded-[3px] ${
                  filled && type ? PIECE_COLOR[type] : ""
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex w-20 flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-2 text-center sm:w-24 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{title}</span>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Panel title={label}>
      <span className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </span>
    </Panel>
  );
}

function ControlButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  // Blur after clicking so a later Space/Enter keypress doesn't re-trigger the button.
  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    e.currentTarget.blur();
    onPress();
  }
  return (
    <button
      aria-label={label}
      onClick={handleClick}
      className="flex h-12 touch-manipulation items-center justify-center rounded-xl border border-zinc-300 bg-white text-lg font-bold text-zinc-700 transition-colors select-none hover:bg-zinc-100 active:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      {children}
    </button>
  );
}

export default function TetrisPage() {
  const [game, dispatch] = useReducer(reducer, INITIAL_GAME);
  const { status, level, score } = game;
  const bestScore = useSyncExternalStore(subscribeBestScore, readBestScore, () => 0);

  // Gravity
  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(
      () => dispatch({ type: "tick", bag: shuffledBag() }),
      dropInterval(level),
    );
    return () => clearInterval(id);
  }, [status, level]);

  // Keyboard controls
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case "ArrowLeft":
          dispatch({ type: "move", dx: -1 });
          break;
        case "ArrowRight":
          dispatch({ type: "move", dx: 1 });
          break;
        case "ArrowDown":
          dispatch({ type: "softDrop" });
          break;
        case "ArrowUp":
        case "x":
        case "X":
          if (!e.repeat) dispatch({ type: "rotate", dir: 1 });
          break;
        case "z":
        case "Z":
          if (!e.repeat) dispatch({ type: "rotate", dir: -1 });
          break;
        case " ":
          if (!e.repeat) dispatch({ type: "hardDrop", bag: shuffledBag() });
          break;
        case "c":
        case "C":
          if (!e.repeat) dispatch({ type: "hold", bag: shuffledBag() });
          break;
        case "p":
        case "P":
        case "Escape":
          if (!e.repeat) dispatch({ type: "togglePause" });
          break;
        case "Enter":
          if (!e.repeat) dispatch({ type: "start", bag: shuffledBag() });
          break;
        default:
          return;
      }
      e.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Pause automatically when the tab is hidden.
  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) dispatch({ type: "pause" });
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  // Persist the best score once a game ends.
  useEffect(() => {
    if (status !== "over" || score <= readBestScore()) return;
    try {
      localStorage.setItem(BEST_SCORE_KEY, String(score));
      window.dispatchEvent(new Event(BEST_SCORE_EVENT));
    } catch {
      // Storage unavailable — skip saving
    }
  }, [status, score]);

  const start = () => dispatch({ type: "start", bag: shuffledBag() });

  // Compose the board with the ghost and the active piece for rendering.
  const cells: { type: PieceType | null; ghost: boolean }[][] = game.board.map(
    (row) => row.map((type) => ({ type, ghost: false })),
  );
  if (game.piece) {
    const { piece } = game;
    const ghostY = piece.y + dropDistance(game.board, piece);
    for (const [y, ghost] of [
      [ghostY, true],
      [piece.y, false],
    ] as const) {
      piece.matrix.forEach((row, r) =>
        row.forEach((filled, c) => {
          const by = y + r;
          if (filled && by >= 0) cells[by][piece.x + c] = { type: piece.type, ghost };
        }),
      );
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center gap-6 bg-zinc-50 px-4 py-12 dark:bg-black">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        🧱 俄羅斯方塊
      </h1>

      <div className="flex items-start gap-3">
        {/* 左側:暫存與分數 */}
        <div className="flex flex-col gap-3">
          <Panel title="暫存">
            <PiecePreview type={game.hold} />
          </Panel>
          <Stat label="分數" value={game.score} />
          <Stat label="最高分" value={Math.max(bestScore, game.score)} />
        </div>

        {/* 遊戲盤面 */}
        <div className="relative rounded-xl border-2 border-zinc-300 bg-zinc-900 p-1 dark:border-zinc-700">
          <div
            className="grid w-[min(52vw,260px)] gap-px"
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
          >
            {cells.flatMap((row, r) =>
              row.map((cell, c) => (
                <span
                  key={`${r}-${c}`}
                  className={`aspect-square rounded-[3px] ${
                    !cell.type
                      ? "bg-zinc-800/60"
                      : cell.ghost
                        ? `border-2 ${GHOST_COLOR[cell.type]} opacity-40`
                        : `${PIECE_COLOR[cell.type]} shadow-[inset_0_-3px_0_rgba(0,0,0,0.25),inset_0_2px_0_rgba(255,255,255,0.3)]`
                  }`}
                />
              )),
            )}
          </div>

          {status !== "playing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg bg-black/70 px-4 text-center backdrop-blur-sm">
              {status === "over" && (
                <>
                  <span className="winner-pop text-2xl font-bold text-white">
                    遊戲結束
                  </span>
                  <span className="text-sm text-zinc-300">
                    分數 {game.score}・消除 {game.lines} 行
                  </span>
                </>
              )}
              {status === "paused" && (
                <span className="text-2xl font-bold text-white">已暫停</span>
              )}
              <button
                onClick={
                  status === "paused"
                    ? () => dispatch({ type: "togglePause" })
                    : start
                }
                className="rounded-full bg-violet-500 px-6 py-2.5 text-base font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                {status === "idle"
                  ? "開始遊戲"
                  : status === "paused"
                    ? "繼續"
                    : "再玩一次"}
              </button>
            </div>
          )}
        </div>

        {/* 右側:下一個與等級 */}
        <div className="flex flex-col gap-3">
          <Panel title="下一個">
            {Array.from({ length: PREVIEW_COUNT }).map((_, i) => (
              <PiecePreview key={i} type={game.queue[i] ?? null} />
            ))}
          </Panel>
          <Stat label="等級" value={game.level} />
          <Stat label="行數" value={game.lines} />
        </div>
      </div>

      {/* 觸控 / 滑鼠按鈕 */}
      <div className="grid w-full max-w-sm grid-cols-4 gap-2">
        <ControlButton label="暫存" onPress={() => dispatch({ type: "hold", bag: shuffledBag() })}>
          暫存
        </ControlButton>
        <ControlButton label="旋轉" onPress={() => dispatch({ type: "rotate", dir: 1 })}>
          ↻
        </ControlButton>
        <ControlButton label="直接落下" onPress={() => dispatch({ type: "hardDrop", bag: shuffledBag() })}>
          ⤓
        </ControlButton>
        <ControlButton label="暫停" onPress={() => dispatch({ type: "togglePause" })}>
          {status === "paused" ? "▶" : "⏸"}
        </ControlButton>
        <ControlButton label="左移" onPress={() => dispatch({ type: "move", dx: -1 })}>
          ←
        </ControlButton>
        <ControlButton label="下移" onPress={() => dispatch({ type: "softDrop" })}>
          ↓
        </ControlButton>
        <ControlButton label="右移" onPress={() => dispatch({ type: "move", dx: 1 })}>
          →
        </ControlButton>
      </div>

      {/* 操作說明 */}
      <p className="max-w-sm text-center text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        ← → 移動・↑ / X 順時針旋轉・Z 逆時針旋轉・↓ 加速下落
        <br />
        空白鍵 直接落下・C 暫存・P 暫停・Enter 開始
      </p>
    </div>
  );
}
