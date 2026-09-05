import type { AgentId } from "@/lib/agents/types";

type Sql = {
  <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>;
};

export type StateRow = {
  rating: number;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  launched_at: string | null;
  updated_at: string;
};

export type HandleRow = {
  platform_id: string;
  handle: string;
  status: string;
  note: string | null;
  enlisted_at: string;
};

export type LogRow = {
  id: number;
  agent_id: string;
  level: string;
  message: string;
  created_at: string;
};

export type MatchDb = {
  id: number;
  platform_id: string;
  opponent: string;
  opponent_rating: number | null;
  result: string;
  rating_before: number;
  rating_after: number;
  reason: string | null;
  created_at: string;
};

type Mem = {
  state: StateRow;
  handles: HandleRow[];
  logs: LogRow[];
  matches: MatchDb[];
  nextLog: number;
  nextMatch: number;
};

const mem: Mem = {
  state: {
    rating: 1500,
    games: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    launched_at: null,
    updated_at: new Date().toISOString(),
  },
  handles: [],
  logs: [],
  matches: [],
  nextLog: 1,
  nextMatch: 1,
};

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

export async function loadSlice() {
  const db = await sql();
  if (!db) {
    return {
      state: mem.state,
      handles: [...mem.handles],
      logs: [...mem.logs].sort((a, b) => b.id - a.id).slice(0, 40),
      matches: [...mem.matches].sort((a, b) => b.id - a.id).slice(0, 20),
    };
  }
  const stateRows = await db<StateRow>`select rating, games, wins, draws, losses, launched_at, updated_at from conquest_state where id = 1`;
  if (!stateRows[0]) {
    await db`insert into conquest_state (id) values (1) on conflict (id) do nothing`;
  }
  const state =
    stateRows[0] ??
    (await db<StateRow>`select rating, games, wins, draws, losses, launched_at, updated_at from conquest_state where id = 1`)[0] ??
    mem.state;
  const handles = await db<HandleRow>`select platform_id, handle, status, note, enlisted_at from conquest_handles order by enlisted_at desc`;
  const logs = await db<LogRow>`select id, agent_id, level, message, created_at from conquest_logs order by id desc limit 40`;
  const matches = await db<MatchDb>`select id, platform_id, opponent, opponent_rating, result, rating_before, rating_after, reason, created_at from conquest_matches order by id desc limit 20`;
  return { state, handles, logs, matches };
}

export async function markLaunched() {
  const db = await sql();
  const now = new Date().toISOString();
  if (!db) {
    mem.state = { ...mem.state, launched_at: mem.state.launched_at ?? now, updated_at: now };
    return;
  }
  await db`update conquest_state set launched_at = coalesce(launched_at, now()), updated_at = now() where id = 1`;
}

export async function seedLichessHandle() {
  const db = await sql();
  if (!db) {
    if (!mem.handles.some((h) => h.platform_id === "lichess")) {
      mem.handles.push({
        platform_id: "lichess",
        handle: "Liorin",
        status: "playbook-ready",
        note: "Public account exists; BOT title pending",
        enlisted_at: new Date().toISOString(),
      });
    }
    return;
  }
  await db`insert into conquest_handles (platform_id, handle, status, note)
    values ('lichess', 'Liorin', 'playbook-ready', 'Public account exists; BOT title pending')
    on conflict (platform_id) do nothing`;
}

export async function writeLog(agentId: AgentId, message: string, level: "info" | "warn" | "alert" = "info") {
  const db = await sql();
  const msg = message.slice(0, 400);
  if (!db) {
    mem.logs.unshift({
      id: mem.nextLog++,
      agent_id: agentId,
      level,
      message: msg,
      created_at: new Date().toISOString(),
    });
    mem.logs = mem.logs.slice(0, 80);
    return;
  }
  await db`insert into conquest_logs (agent_id, level, message) values (${agentId}, ${level}, ${msg})`;
}

export async function upsertHandle(platformId: string, handle: string, status: string, note: string | null) {
  const db = await sql();
  if (!db) {
    mem.handles = mem.handles.filter((h) => h.platform_id !== platformId);
    mem.handles.unshift({
      platform_id: platformId,
      handle,
      status,
      note,
      enlisted_at: new Date().toISOString(),
    });
    return;
  }
  await db`insert into conquest_handles (platform_id, handle, status, note)
    values (${platformId}, ${handle}, ${status}, ${note})
    on conflict (platform_id) do update set handle = excluded.handle, status = excluded.status, note = excluded.note, enlisted_at = now()`;
}

export async function insertMatch(row: {
  platformId: string;
  opponent: string;
  opponentRating: number;
  result: string;
  ratingBefore: number;
  ratingAfter: number;
  reason: string | null;
  wins: number;
  draws: number;
  losses: number;
}) {
  const db = await sql();
  if (!db) {
    mem.matches.unshift({
      id: mem.nextMatch++,
      platform_id: row.platformId,
      opponent: row.opponent,
      opponent_rating: row.opponentRating,
      result: row.result,
      rating_before: row.ratingBefore,
      rating_after: row.ratingAfter,
      reason: row.reason,
      created_at: new Date().toISOString(),
    });
    mem.state = {
      ...mem.state,
      rating: row.ratingAfter,
      games: mem.state.games + 1,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      updated_at: new Date().toISOString(),
    };
    return;
  }
  await db`insert into conquest_matches (platform_id, opponent, opponent_rating, result, rating_before, rating_after, reason)
    values (${row.platformId}, ${row.opponent}, ${row.opponentRating}, ${row.result}, ${row.ratingBefore}, ${row.ratingAfter}, ${row.reason})`;
  await db`update conquest_state set rating = ${row.ratingAfter}, games = games + 1, wins = ${row.wins}, draws = ${row.draws}, losses = ${row.losses}, updated_at = now() where id = 1`;
}

export async function watchRow(source: string, eventId: string, title: string, url: string, note: string | null) {
  const db = await sql();
  if (!db) return;
  await db`insert into conquest_watch (source, event_id, title, url, bots_designed, note)
    values (${source}, ${eventId}, ${title}, ${url}, true, ${note})
    on conflict (source, event_id) do update set title = excluded.title, url = excluded.url, note = excluded.note`;
}
