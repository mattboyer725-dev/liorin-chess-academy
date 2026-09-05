export type GameMode = "teach" | "cold" | "gauntlet" | "lesson";

export type SaveGameInput = {
  mode: GameMode;
  lessonId?: string | null;
  engineProfile: string;
  liorinColor: "w" | "b";
  opponentLabel: string;
  result: "win" | "draw" | "loss";
  ply: number;
  pgn: string;
  fenStart: string;
  fenEnd: string;
  opening: string | null;
};

export type AcademyGame = {
  id: number;
  mode: GameMode;
  lessonId: string | null;
  engineProfile: string;
  liorinColor: "w" | "b";
  opponentLabel: string;
  result: "win" | "draw" | "loss";
  ply: number;
  pgn: string;
  fenStart: string;
  fenEnd: string;
  opening: string | null;
  recap: string | null;
  loveLine: string | null;
  at: string;
};

export type AcademyLetter = {
  id: number;
  kind: string;
  title: string;
  body: string;
  cta: string;
  source: string;
  at: string;
};

export type AcademySummary = {
  games: number;
  wins: number;
  draws: number;
  losses: number;
  coldGames: number;
  teachGames: number;
  pendingRecaps: number;
  recent: AcademyGame[];
  letter: { title: string; body: string; cta: string; source: string; at: string | null };
};
