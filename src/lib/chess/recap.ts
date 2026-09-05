export const ACADEMY_CTA =
  "The academy board is open. Walk a lesson, then sit with the cold engine.";

type RecapInput = {
  result: "win" | "draw" | "loss";
  mode: string;
  ply: number;
  opening: string | null;
  lessonId: string | null;
  opponentLabel: string;
};

const LESSON_LINE: Record<string, string> = {
  fork: "The knight fork is a two-way threat. Train it until it is obvious.",
  pin: "A pin is a line the king cannot afford. Respect it, then break it.",
  "back-rank": "Luft or mate. The back rank is a habit, not a trick.",
  scholars: "Scholar's Mate dies the moment f7 is guarded. Kick the queen.",
  opposition: "Kings face. The pawn waits until the king leads.",
  castle: "Castle before the center opens. King safety is not a later problem.",
};

export function loveCopy(game: RecapInput) {
  const opening = game.opening ?? "the opening";
  const moves = Math.max(1, Math.round(game.ply / 2));
  const lesson = game.lessonId ? LESSON_LINE[game.lessonId] : null;

  if (game.mode === "lesson" && lesson) {
    return {
      title: "A lesson kept",
      body: `${lesson} ${moves} moves on the academy board. The archive holds the score so the next student can walk the same idea.`,
      loveLine: lesson,
      cta: ACADEMY_CTA,
    };
  }

  if (game.mode === "cold") {
    if (game.result === "win") {
      return {
        title: "Cold held",
        body: `${opening}, ${moves} moves. Liorin was not teaching. The engine kept the full score and did not yield. The same structure is waiting on the academy board.`,
        loveLine: "When the lesson ends, Liorin does not lose.",
        cta: ACADEMY_CTA,
      };
    }
    if (game.result === "draw") {
      return {
        title: "The line held",
        body: `${opening} went the distance — ${moves} moves and a draw. A draw is not a loss. Cold mode holds the position and sends you back to the teaching board for the idea behind it.`,
        loveLine: "A draw is not a loss. The academy keeps the line.",
        cta: ACADEMY_CTA,
      };
    }
    return {
      title: "A rare crack",
      body: `${opening} ended against the engine in ${moves} moves. The archive keeps it so Liorin can learn. Sit with the same position on the academy board.`,
      loveLine: "The archive keeps every crack so the engine can learn.",
      cta: ACADEMY_CTA,
    };
  }

  if (game.result === "loss") {
    return {
      title: "The student found it",
      body: `${opening} over ${moves} moves. Liorin was teaching, and the student found the idea. That is the point of the academy.`,
      loveLine: "Teaching means Liorin can lose. That is the lesson working.",
      cta: ACADEMY_CTA,
    };
  }
  if (game.result === "draw") {
    return {
      title: "Shared point",
      body: `${opening} held for ${moves} moves. The tutor named the threats. Come back and walk it again from the other side.`,
      loveLine: "A shared point. Walk it again from the other color.",
      cta: ACADEMY_CTA,
    };
  }
  return {
    title: "The tutor finished the idea",
    body: `${opening}, ${moves} moves. Liorin showed the conversion. The 2700 Club is the same ideas at elite strength — then return here and play them.`,
    loveLine: "See it on the 2700 Club. Play it on the academy board.",
    cta: ACADEMY_CTA,
  };
}

export function weeklyLetter(
  games: Array<{
    result: "win" | "draw" | "loss";
    mode: string;
    ply: number;
    opening: string | null;
  }>,
) {
  const n = games.length;
  if (!n) {
    return {
      title: "The board is quiet",
      body: "No games in the archive yet. The academy board is open. Play a lesson, or sit with the cold engine. Every finished game is kept so Liorin can learn, and so the recap desk can speak in full sentences.",
      cta: ACADEMY_CTA,
    };
  }
  const wins = games.filter((g) => g.result === "win").length;
  const draws = games.filter((g) => g.result === "draw").length;
  const losses = games.filter((g) => g.result === "loss").length;
  const cold = games.filter((g) => g.mode === "cold").length;
  const openings = [...new Set(games.map((g) => g.opening).filter(Boolean))].slice(0, 3);
  const openLine = openings.length ? openings.join(", ") : "a handful of openings";
  return {
    title: "Love letter from the archive",
    body: `${n} games kept. Liorin ${wins}–${draws}–${losses}. Cold in ${cold} of them — the engine does not yield when it is not teaching. The shapes were ${openLine}. None of this lives on another site. The 2700 Club, the lessons, and the cold board all lead back here.`,
    cta: ACADEMY_CTA,
  };
}
