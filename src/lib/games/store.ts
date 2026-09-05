import { loveCopy } from "@/lib/chess/recap";
import type { AcademyGame, AcademyLetter, GameMode, SaveGameInput } from "./types";

type Sql = {
  <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>;
};

type GameDb = {
  id: number;
  mode: string;
  lesson_id: string | null;
  engine_profile: string;
  liorin_color: string;
  opponent_label: string;
  result: string;
  ply: number;
  pgn: string;
  fen_start: string;
  fen_end: string;
  opening: string | null;
  recap: string | null;
  love_line: string | null;
  created_at: string;
};

type LetterDb = {
  id: number;
  kind: string;
  title: string;
  body: string;
  cta: string;
  source: string;
  created_at: string;
};

const memGames: GameDb[] = [];
const memLetters: LetterDb[] = [];
let nextGame = 1;
let nextLetter = 1;

let sqlCache: Sql | null | undefined;

async function sql(): Promise<Sql | null> {
  if (sqlCache !== undefined) return sqlCache;
  const prodWithoutDb =
    process.env.NODE_ENV === "production" && !process.env.DATABASE_URL?.trim();
  if (prodWithoutDb) {
    sqlCache = null;
    return null;
  }
  try {
    const mod = await import("@/lib/db");
    sqlCache = await mod.getSql();
    return sqlCache;
  } catch {
    sqlCache = null;
    return null;
  }
}

function asMode(mode: string): GameMode {
  if (mode === "cold" || mode === "gauntlet" || mode === "lesson" || mode === "teach") return mode;
  return "teach";
}

function asResult(result: string): "win" | "draw" | "loss" {
  if (result === "win" || result === "draw" || result === "loss") return result;
  return "draw";
}

function mapGame(row: GameDb): AcademyGame {
  return {
    id: row.id,
    mode: asMode(row.mode),
    lessonId: row.lesson_id,
    engineProfile: row.engine_profile,
    liorinColor: row.liorin_color === "b" ? "b" : "w",
    opponentLabel: row.opponent_label,
    result: asResult(row.result),
    ply: row.ply,
    pgn: row.pgn,
    fenStart: row.fen_start,
    fenEnd: row.fen_end,
    opening: row.opening,
    recap: row.recap,
    loveLine: row.love_line,
    at: row.created_at,
  };
}

function mapLetter(row: LetterDb): AcademyLetter {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    cta: row.cta,
    source: row.source,
    at: row.created_at,
  };
}

export type NewGame = SaveGameInput;

export async function insertAcademyGame(input: SaveGameInput): Promise<AcademyGame> {
  const copy = loveCopy({
    result: input.result,
    mode: input.mode,
    ply: input.ply,
    opening: input.opening,
    lessonId: input.lessonId ?? null,
    opponentLabel: input.opponentLabel,
  });
  const recap = copy.body.slice(0, 800);
  const loveLine = copy.loveLine.slice(0, 200);
  const pgn = input.pgn.slice(0, 8000);
  const opponent = input.opponentLabel.slice(0, 40);
  const db = await sql();
  if (!db) {
    const row: GameDb = {
      id: nextGame++,
      mode: input.mode,
      lesson_id: input.lessonId ?? null,
      engine_profile: input.engineProfile.slice(0, 24),
      liorin_color: input.liorinColor,
      opponent_label: opponent,
      result: input.result,
      ply: input.ply,
      pgn,
      fen_start: input.fenStart.slice(0, 120),
      fen_end: input.fenEnd.slice(0, 120),
      opening: (input.opening ?? "Academy game").slice(0, 48),
      recap,
      love_line: loveLine,
      created_at: new Date().toISOString(),
    };
    memGames.unshift(row);
    return mapGame(row);
  }
  const rows = await db<GameDb>`
    insert into academy_games (
      mode, lesson_id, engine_profile, liorin_color, opponent_label, result, ply,
      pgn, fen_start, fen_end, opening, recap, love_line
    ) values (
      ${input.mode}, ${input.lessonId ?? null}, ${input.engineProfile.slice(0, 24)},
      ${input.liorinColor}, ${opponent}, ${input.result}, ${input.ply},
      ${pgn}, ${input.fenStart.slice(0, 120)}, ${input.fenEnd.slice(0, 120)},
      ${(input.opening ?? "Academy game").slice(0, 48)}, ${recap}, ${loveLine}
    ) returning id, mode, lesson_id, engine_profile, liorin_color, opponent_label,
      result, ply, pgn, fen_start, fen_end, opening, recap, love_line, created_at`;
  const row = rows[0];
  if (!row) throw new Error("Game insert failed");
  return mapGame(row);
}

export async function listAcademyGames(limit = 40): Promise<AcademyGame[]> {
  const cap = Math.min(Math.max(limit, 1), 80);
  const db = await sql();
  if (!db) return memGames.slice(0, cap).map(mapGame);
  const rows = await db<GameDb>`
    select id, mode, lesson_id, engine_profile, liorin_color, opponent_label, result, ply,
      pgn, fen_start, fen_end, opening, recap, love_line, created_at
    from academy_games order by id desc limit ${cap}`;
  return rows.map(mapGame);
}

export async function gamesMissingRecap(): Promise<AcademyGame[]> {
  const db = await sql();
  if (!db) return memGames.filter((g) => !g.recap).map(mapGame);
  const rows = await db<GameDb>`
    select id, mode, lesson_id, engine_profile, liorin_color, opponent_label, result, ply,
      pgn, fen_start, fen_end, opening, recap, love_line, created_at
    from academy_games where recap is null order by id desc limit 40`;
  return rows.map(mapGame);
}

export async function fillGameRecap(id: number, recap: string, loveLine: string) {
  const db = await sql();
  if (!db) {
    const g = memGames.find((row) => row.id === id);
    if (g) {
      g.recap = recap;
      g.love_line = loveLine;
    }
    return;
  }
  await db`update academy_games set recap = ${recap.slice(0, 800)}, love_line = ${loveLine.slice(0, 200)} where id = ${id}`;
}

export async function insertLetter(input: {
  kind: string;
  title: string;
  body: string;
  cta: string;
  source: string;
}): Promise<AcademyLetter> {
  const db = await sql();
  if (!db) {
    const row: LetterDb = {
      id: nextLetter++,
      kind: input.kind,
      title: input.title.slice(0, 80),
      body: input.body.slice(0, 2000),
      cta: input.cta.slice(0, 240),
      source: input.source,
      created_at: new Date().toISOString(),
    };
    memLetters.unshift(row);
    return mapLetter(row);
  }
  const rows = await db<LetterDb>`
    insert into academy_letters (kind, title, body, cta, source)
    values (${input.kind}, ${input.title.slice(0, 80)}, ${input.body.slice(0, 2000)}, ${input.cta.slice(0, 240)}, ${input.source})
    returning id, kind, title, body, cta, source, created_at`;
  const row = rows[0];
  if (!row) throw new Error("Letter insert failed");
  return mapLetter(row);
}

export async function latestLetter(): Promise<AcademyLetter | null> {
  const db = await sql();
  if (!db) return memLetters[0] ? mapLetter(memLetters[0]) : null;
  const rows = await db<LetterDb>`
    select id, kind, title, body, cta, source, created_at
    from academy_letters order by id desc limit 1`;
  return rows[0] ? mapLetter(rows[0]) : null;
}

export async function gameCounts() {
  const games = await listAcademyGames(80);
  return {
    games: games.length,
    wins: games.filter((g) => g.result === "win").length,
    draws: games.filter((g) => g.result === "draw").length,
    losses: games.filter((g) => g.result === "loss").length,
    coldGames: games.filter((g) => g.mode === "cold").length,
    teachGames: games.filter((g) => g.mode === "teach" || g.mode === "lesson").length,
    pendingRecaps: games.filter((g) => !g.recap).length,
    recent: games.slice(0, 24),
  };
}
