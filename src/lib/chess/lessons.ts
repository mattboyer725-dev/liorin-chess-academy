export type Lesson = {
  id: string;
  title: string;
  brief: string;
  fen: string;
  hint: string;
  goal: string;
};

export const LESSONS: Lesson[] = [
  {
    id: "fork",
    title: "The knight fork",
    brief: "A knight attacks two pieces at once. Check the king and win the rook.",
    fen: "4k3/8/8/3n4/8/8/8/R3K3 b - - 0 1",
    hint: "Nc2+ or Nb3+ both fork king and rook. Prefer the check.",
    goal: "Win the rook with a royal fork.",
  },
  {
    id: "pin",
    title: "The pin",
    brief: "A piece that cannot move without exposing the king is pinned. Do not move it.",
    fen: "6k1/5n2/8/8/8/8/B7/6K1 b - - 0 1",
    hint: "The bishop on a2 pins the knight on f7 to the king. Moving the knight hangs the king.",
    goal: "Respect the pin. Improve the king or break the line.",
  },
  {
    id: "back-rank",
    title: "Back-rank mate",
    brief: "A rook on the eighth rank mates a king trapped by its own pawns.",
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    hint: "Black has no luft. Re8 is mate.",
    goal: "Deliver back-rank mate.",
  },
  {
    id: "scholars",
    title: "Stop Scholar's Mate",
    brief: "White aims Qh5 and Bc4 at f7. Defend f7 and kick the queen.",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3",
    hint: "g6 both defends f7 and attacks the queen.",
    goal: "Parry the Qh5 + Bc4 battery.",
  },
  {
    id: "opposition",
    title: "King opposition",
    brief: "Kings face each other with one square between. Escort the pawn without stalemate.",
    fen: "8/8/4k3/8/4K3/4P3/8/8 w - - 0 1",
    hint: "Keep the opposition. Do not rush the pawn to the seventh until the king leads.",
    goal: "Promote the e-pawn.",
  },
  {
    id: "castle",
    title: "Castle on time",
    brief: "King safety first. Castle before the center opens.",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    hint: "O-O is legal. Completing development beats hunting pawns.",
    goal: "Castle short and keep the king behind the pawn shield.",
  },
];
