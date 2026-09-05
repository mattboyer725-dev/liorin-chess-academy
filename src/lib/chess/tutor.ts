import { Chess, type Move, type PieceSymbol } from "chess.js";

const NAMES: Record<PieceSymbol, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

export function explainMove(beforeFen: string, move: Move, afterFen: string): string {
  const before = new Chess(beforeFen);
  const after = new Chess(afterFen);
  const piece = NAMES[move.piece];
  const dest = move.to;

  if (after.isCheckmate()) {
    return `Checkmate. The ${piece} landing on ${dest} ends the game.`;
  }
  if (after.isStalemate()) {
    return `Stalemate. ${dest} leaves the opponent with no legal move and no check — a draw.`;
  }
  if (move.san === "O-O" || move.san === "O-O-O") {
    return `Castle ${move.san === "O-O" ? "short" : "long"}. The king tucks toward the rook and the rook comes to the center.`;
  }

  const lines: string[] = [];
  if (move.captured) {
    lines.push(`The ${piece} takes the ${NAMES[move.captured]} on ${dest}.`);
  } else {
    lines.push(`${piece[0]!.toUpperCase()}${piece.slice(1)} to ${dest}.`);
  }
  if (after.inCheck()) {
    lines.push("Check — the king must step, block, or capture.");
  }
  if (move.promotion) {
    lines.push(`Promotion to ${NAMES[move.promotion as PieceSymbol]}.`);
  }
  if (!move.captured && move.piece === "n" && ["c3", "f3", "c6", "f6"].includes(move.to)) {
    lines.push("Developing toward the center. Knights belong on c3/f3 or c6/f6 in the opening.");
  }
  if (before.history().length < 8 && move.piece === "p" && (move.to[1] === "4" || move.to[1] === "5")) {
    lines.push("A center pawn move. Occupying e4/d4 (or e5/d5) claims space.");
  }

  return lines.slice(0, 3).join(" ");
}

export function openingHint(fen: string) {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  const castle = moves.find((m) => m.san.startsWith("O-O"));
  if (castle && !chess.inCheck() && chess.history().length < 16) {
    return `Castling is legal. ${castle.san} tucks the king and connects the rooks.`;
  }
  return null;
}
