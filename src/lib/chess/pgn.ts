import { Chess } from "chess.js";

export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function boardFrom(startFen: string, sans: string[]) {
  const chess = new Chess(startFen);
  for (const san of sans) chess.move(san);
  return chess;
}

const OPENINGS: [string, string][] = [
  ["e4 e5 Nf3 Nc6 Bc4", "Italian Game"],
  ["e4 e5 Nf3 Nc6 Bb5", "Ruy Lopez"],
  ["e4 e5 Nf3 Nc6 d4", "Scotch Game"],
  ["e4 e5 Nf3 Nf6", "Petrov Defence"],
  ["e4 e5 Nf3 Nc6", "King's Knight"],
  ["e4 e5 f4", "King's Gambit"],
  ["e4 e5 Nc3", "Vienna Game"],
  ["e4 c5", "Sicilian Defence"],
  ["e4 e6", "French Defence"],
  ["e4 c6", "Caro-Kann"],
  ["e4 d5", "Scandinavian"],
  ["e4 d6", "Pirc Defence"],
  ["e4 Nf6", "Alekhine Defence"],
  ["e4 g6", "Modern Defence"],
  ["d4 d5 c4", "Queen's Gambit"],
  ["d4 d5", "Queen's Pawn"],
  ["d4 Nf6 c4 g6", "King's Indian"],
  ["d4 Nf6 c4 e6", "Nimzo / Queen's Indian"],
  ["d4 Nf6", "Indian Defence"],
  ["c4", "English Opening"],
  ["Nf3", "Reti"],
  ["e4 e5", "Open Game"],
  ["e4", "King's Pawn"],
  ["d4", "Queen's Pawn"],
];

export function openingName(sans: string[]) {
  const joined = sans.join(" ");
  for (const [prefix, name] of OPENINGS) {
    if (joined === prefix || joined.startsWith(`${prefix} `)) return name;
  }
  return sans.length ? "Academy game" : "Start position";
}

export function liorinResult(
  chess: Chess,
  liorinColor: "w" | "b",
): "win" | "draw" | "loss" {
  if (chess.isCheckmate()) {
    const winner: "w" | "b" = chess.turn() === "w" ? "b" : "w";
    return winner === liorinColor ? "win" : "loss";
  }
  return "draw";
}

export function resultPgn(result: "win" | "draw" | "loss", liorinColor: "w" | "b") {
  if (result === "draw") return "1/2-1/2";
  if (result === "win") return liorinColor === "w" ? "1-0" : "0-1";
  return liorinColor === "w" ? "0-1" : "1-0";
}

export function makePgn(input: {
  startFen: string;
  sans: string[];
  white: string;
  black: string;
  result: "win" | "draw" | "loss";
  liorinColor: "w" | "b";
  event?: string;
}) {
  const chess = new Chess(input.startFen);
  for (const san of input.sans) chess.move(san);
  const headers: Record<string, string> = {
    Event: input.event ?? "LIORIN Chess Academy",
    Site: "LIORIN Chess Academy",
    White: input.white,
    Black: input.black,
    Result: resultPgn(input.result, input.liorinColor),
  };
  if (input.startFen !== START_FEN) {
    headers.SetUp = "1";
    headers.FEN = input.startFen;
  }
  chess.setHeader("Event", headers.Event);
  chess.setHeader("Site", headers.Site);
  chess.setHeader("White", headers.White);
  chess.setHeader("Black", headers.Black);
  chess.setHeader("Result", headers.Result);
  if (headers.SetUp) {
    chess.setHeader("SetUp", headers.SetUp);
    chess.setHeader("FEN", headers.FEN);
  }
  return chess.pgn();
}
