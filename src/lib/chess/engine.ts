import { Chess, type Move, type PieceSymbol, type Square } from "chess.js";

const VALUE: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

const PST: Record<PieceSymbol, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10,
    25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10,
    10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0,
    -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10,
    5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0,
    0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5,
    0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0,
    5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50,
    -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20,
  ],
};

function indexOf(square: Square, white: boolean) {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  const i = (7 - rank) * 8 + file;
  return white ? i : 63 - i;
}

export function evaluate(chess: Chess) {
  if (chess.isCheckmate()) return chess.turn() === "w" ? -100000 : 100000;
  if (chess.isDraw()) return 0;
  let score = 0;
  for (const row of chess.board()) {
    for (const cell of row) {
      if (!cell) continue;
      const sign = cell.color === "w" ? 1 : -1;
      score += sign * VALUE[cell.type];
      score += sign * (PST[cell.type][indexOf(cell.square, cell.color === "w")] ?? 0);
    }
  }
  return score;
}

function orderedMoves(chess: Chess, tactics: boolean): Move[] {
  const moves = chess.moves({ verbose: true });
  return moves.sort((a, b) => {
    const capA = a.captured ? VALUE[a.captured] - VALUE[a.piece] / 10 : 0;
    const capB = b.captured ? VALUE[b.captured] - VALUE[b.piece] / 10 : 0;
    const checkA = a.san.includes("+") || a.san.includes("#") ? 40 : 0;
    const checkB = b.san.includes("+") || b.san.includes("#") ? 40 : 0;
    const promoA = a.promotion ? 80 : 0;
    const promoB = b.promotion ? 80 : 0;
    const bias = tactics ? 1.4 : 1;
    return capB * bias + checkB + promoB - (capA * bias + checkA + promoA);
  });
}

function isNoisy(m: Move) {
  return Boolean(m.captured) || Boolean(m.promotion) || m.san.includes("+") || m.san.includes("#");
}

function quiesce(
  chess: Chess,
  alpha: number,
  beta: number,
  maximizing: boolean,
  remain: number,
): number {
  const stand = evaluate(chess);
  if (remain <= 0 || chess.isGameOver()) return stand;
  if (maximizing) {
    if (stand >= beta) return stand;
    alpha = Math.max(alpha, stand);
    for (const m of orderedMoves(chess, true).filter(isNoisy)) {
      chess.move(m);
      const score = quiesce(chess, alpha, beta, false, remain - 1);
      chess.undo();
      if (score > alpha) alpha = score;
      if (alpha >= beta) break;
    }
    return alpha;
  }
  if (stand <= alpha) return stand;
  beta = Math.min(beta, stand);
  for (const m of orderedMoves(chess, true).filter(isNoisy)) {
    chess.move(m);
    const score = quiesce(chess, alpha, beta, true, remain - 1);
    chess.undo();
    if (score < beta) beta = score;
    if (alpha >= beta) break;
  }
  return beta;
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  tactics: boolean,
  qsearch: boolean,
): number {
  if (chess.isGameOver()) return evaluate(chess);
  if (depth === 0) {
    return qsearch ? quiesce(chess, alpha, beta, maximizing, 3) : evaluate(chess);
  }
  const moves = orderedMoves(chess, tactics);
  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      chess.move(m);
      best = Math.max(best, minimax(chess, depth - 1, alpha, beta, false, tactics, qsearch));
      chess.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = Infinity;
  for (const m of moves) {
    chess.move(m);
    best = Math.min(best, minimax(chess, depth - 1, alpha, beta, true, tactics, qsearch));
    chess.undo();
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

export type EngineProfile = "fast" | "balanced" | "deep" | "tactics" | "cold";

const DEPTH: Record<EngineProfile, number> = {
  fast: 1,
  balanced: 2,
  deep: 3,
  tactics: 2,
  cold: 3,
};

function mateInOne(chess: Chess): Move | null {
  for (const m of chess.moves({ verbose: true })) {
    chess.move(m);
    const mate = chess.isCheckmate();
    chess.undo();
    if (mate) return m;
  }
  return null;
}

export function chooseMove(fen: string, profile: EngineProfile): Move | null {
  const chess = new Chess(fen);
  const instant = mateInOne(chess);
  if (instant) return instant;

  const tactics = profile === "tactics" || profile === "cold";
  const qsearch = profile === "cold" || profile === "deep";
  const moves = orderedMoves(chess, tactics);
  if (!moves.length) return null;
  const maximizing = chess.turn() === "w";
  const depth = DEPTH[profile];
  const scored: { move: Move; score: number }[] = [];
  for (const m of moves) {
    chess.move(m);
    if (chess.isCheckmate()) {
      chess.undo();
      return m;
    }
    const score = minimax(chess, depth - 1, -Infinity, Infinity, chess.turn() === "w", tactics, qsearch);
    chess.undo();
    scored.push({ move: m, score });
  }

  const pickBest = (pool: { move: Move; score: number }[]) => {
    let bestMove = pool[0]!.move;
    let bestScore = maximizing ? -Infinity : Infinity;
    for (const s of pool) {
      if (maximizing ? s.score > bestScore : s.score < bestScore) {
        bestScore = s.score;
        bestMove = s.move;
      }
    }
    return bestMove;
  };

  if (profile === "cold") {
    const hold = scored.filter((s) => (maximizing ? s.score >= -80 : s.score <= 80));
    const pool = hold.length ? hold : scored;
    return pickBest(pool);
  }

  return pickBest(scored);
}
