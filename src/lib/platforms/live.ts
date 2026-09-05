import type { HuntEvent, LiveBot, RankTarget } from "@/lib/agents/types";

export const UA = "LIORIN-Conquest/1.0 (public-bot-command; educational)";

const LICHESS = "https://lichess.org";
const CHESSCOM = "https://api.chess.com/pub";

export async function fetchJson<T>(url: string, init?: RequestInit, ms = 7000): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "User-Agent": UA,
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(ms),
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return (await res.json()) as T;
}

export function parseNdjson<T>(text: string): T[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) return JSON.parse(trimmed) as T[];
  const out: T[] = [];
  for (const line of trimmed.split("\n")) {
    const s = line.trim();
    if (!s) continue;
    out.push(JSON.parse(s) as T);
  }
  return out;
}

async function fetchNdjson<T>(url: string, ms = 8000): Promise<T[]> {
  const res = await fetch(url, {
    headers: { Accept: "application/x-ndjson", "User-Agent": UA },
    signal: AbortSignal.timeout(ms),
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return parseNdjson<T>(await res.text());
}

type LichessPerf = { games?: number; rating?: number; rd?: number; prog?: number; prov?: boolean };
type LichessUser = {
  id: string;
  username: string;
  title?: string;
  playing?: boolean | string;
  perfs?: Record<string, LichessPerf>;
  createdAt?: number;
  count?: { all?: number; rated?: number; win?: number; loss?: number; draw?: number };
};

type ArenaRow = {
  id: string;
  fullName: string;
  nbPlayers?: number;
  status?: number;
  startsAt?: number;
  createdBy?: string;
  clock?: { limit: number; increment: number };
  perf?: { key?: string; name?: string };
};

const BOT_NAME =
  /\bbots?\b|\bengine\b|\bcomputer\b|stockfish|maia|leela|fairy.?stockfish|neural/i;

function ratingOf(user: LichessUser, key: string): number | null {
  const n = user.perfs?.[key]?.rating;
  return typeof n === "number" ? n : null;
}

export async function fetchOnlineBots(nb = 40): Promise<LiveBot[]> {
  const rows = await fetchNdjson<LichessUser>(`${LICHESS}/api/bot/online?nb=${nb}`);
  return rows
    .filter((u) => (u.title ?? "").toUpperCase() === "BOT")
    .map((u) => ({
      id: u.id,
      username: u.username,
      title: u.title ?? "BOT",
      bullet: ratingOf(u, "bullet"),
      blitz: ratingOf(u, "blitz"),
      rapid: ratingOf(u, "rapid"),
      playing: Boolean(u.playing),
    }));
}

export async function fetchLichessUser(username: string): Promise<LichessUser | null> {
  try {
    return await fetchJson<LichessUser>(
      `${LICHESS}/api/user/${encodeURIComponent(username)}`,
    );
  } catch {
    return null;
  }
}

export async function fetchTvBot(): Promise<{
  username: string;
  rating: number;
  gameId: string;
  url: string;
} | null> {
  try {
    const channels = await fetchJson<
      Record<string, { user?: { name?: string; title?: string; id?: string }; rating?: number; gameId?: string }>
    >(`${LICHESS}/api/tv/channels`);
    const bot = channels.bot;
    if (!bot?.gameId || !bot.user?.name) return null;
    return {
      username: bot.user.name,
      rating: bot.rating ?? 0,
      gameId: bot.gameId,
      url: `${LICHESS}/${bot.gameId}`,
    };
  } catch {
    return null;
  }
}

function arenaToEvent(
  t: ArenaRow,
  source: HuntEvent["source"],
  botsDesigned: boolean,
  note: string,
): HuntEvent {
  const status: HuntEvent["status"] =
    t.status === 20 ? "live" : t.status === 10 ? "upcoming" : "standing";
  return {
    id: t.id,
    source,
    title: t.fullName,
    url: `${LICHESS}/tournament/${t.id}`,
    status,
    players: t.nbPlayers ?? null,
    botsDesigned,
    note,
    startsAt: t.startsAt ? new Date(t.startsAt).toISOString() : null,
  };
}

export async function fetchHuntEvents(): Promise<HuntEvent[]> {
  const events: HuntEvent[] = [];

  const [tourney, teamArenas, tv] = await Promise.allSettled([
    fetchJson<{ created?: ArenaRow[]; started?: ArenaRow[]; finished?: ArenaRow[] }>(
      `${LICHESS}/api/tournament`,
    ),
    fetchNdjson<ArenaRow>(`${LICHESS}/api/team/lichess-bots/arena?max=20`),
    fetchTvBot(),
  ]);

  if (tourney.status === "fulfilled") {
    const bag = [
      ...(tourney.value.started ?? []).map((t) => ({ t, bucket: "started" as const })),
      ...(tourney.value.created ?? []).map((t) => ({ t, bucket: "created" as const })),
    ];
    for (const { t } of bag) {
      if (!BOT_NAME.test(t.fullName)) continue;
      events.push(
        arenaToEvent(
          t,
          "lichess-arena",
          true,
          "Name matches a bot / engine / computer event. Confirm botsAllowed before joining.",
        ),
      );
    }
  }

  if (teamArenas.status === "fulfilled") {
    for (const t of teamArenas.value) {
      if (t.status !== 10 && t.status !== 20) continue;
      events.push(
        arenaToEvent(
          t,
          "lichess-team",
          true,
          "Filed under the public Lichess Bots team.",
        ),
      );
    }
    const recent = teamArenas.value.filter((t) => t.status === 30).slice(0, 4);
    for (const t of recent) {
      events.push(
        arenaToEvent(
          t,
          "lichess-team",
          true,
          "Recent Lichess Bots team arena — pattern for the next bot event.",
        ),
      );
    }
  }

  if (tv.status === "fulfilled" && tv.value) {
    events.unshift({
      id: `tv-bot-${tv.value.gameId}`,
      source: "lichess-tv",
      title: `Bot TV — ${tv.value.username} (${tv.value.rating})`,
      url: tv.value.url,
      status: "live",
      players: 2,
      botsDesigned: true,
      note: "Dedicated Lichess TV channel for BOT vs BOT. Primary public showcase.",
      startsAt: new Date().toISOString(),
    });
  }

  events.push(
    {
      id: "lichess-player-bots",
      source: "lichess-board",
      title: "Lichess BOT leaderboard",
      url: `${LICHESS}/player/bots`,
      status: "standing",
      players: null,
      botsDesigned: true,
      note: "Public BOT rating board. This is the Lichess #1 Liorin has to take.",
      startsAt: null,
    },
    {
      id: "lichess-bots-team",
      source: "lichess-board",
      title: "Team: Lichess Bots",
      url: `${LICHESS}/team/lichess-bots`,
      status: "standing",
      players: null,
      botsDesigned: true,
      note: "All bot makers. Joining does not grant BOT title — upgrade the account first.",
      startsAt: null,
    },
    {
      id: "chesscom-botbattles",
      source: "external",
      title: "Chess.com Bot Battles club",
      url: "https://www.chess.com/join/botbattles",
      status: "seasonal",
      players: null,
      botsDesigned: true,
      note: "Designed for bots. Apply through the club landing page only.",
      startsAt: null,
    },
    {
      id: "tcec",
      source: "external",
      title: "TCEC — Top Chess Engine Championship",
      url: "https://tcec-chess.com",
      status: "seasonal",
      players: null,
      botsDesigned: true,
      note: "Invitation engine world championship. Hunter watches; Diplomat drafts if Liorin is ready.",
      startsAt: null,
    },
    {
      id: "ccrl-4040",
      source: "external",
      title: "CCRL 40/15 engine list",
      url: "https://computerchess.org.uk/ccrl/4040/",
      status: "standing",
      players: null,
      botsDesigned: true,
      note: "Independent engine ratings. Path to #1 is a tested binary, not a user account.",
      startsAt: null,
    },
  );

  const seen = new Set<string>();
  return events.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

type ChessComBoard = {
  username?: string;
  score?: number;
  rank?: number;
  title?: string;
};

export async function fetchRankTargets(liorinLichess: LichessUser | null): Promise<RankTarget[]> {
  const ranks: RankTarget[] = [];

  const lichessRating =
    ratingOf(liorinLichess ?? { id: "", username: "", perfs: {} }, "blitz") ??
    ratingOf(liorinLichess ?? { id: "", username: "", perfs: {} }, "rapid") ??
    ratingOf(liorinLichess ?? { id: "", username: "", perfs: {} }, "bullet");

  let lichessOne: { name: string; rating: number | null } | null = null;
  try {
    const top = await fetchJson<{ users?: { username: string; perfs?: { blitz?: { rating?: number } } }[] }>(
      `${LICHESS}/api/player/top/1/blitz`,
    );
    const u = top.users?.[0];
    if (u) {
      lichessOne = { name: u.username, rating: u.perfs?.blitz?.rating ?? null };
    }
  } catch {
    lichessOne = null;
  }

  ranks.push({
    platformId: "lichess",
    surface: "Lichess blitz (open) / BOT board",
    numberOne: lichessOne?.name ?? "—",
    numberOneRating: lichessOne?.rating ?? null,
    liorinHandle: liorinLichess?.username ?? "Liorin",
    liorinRating: lichessRating,
    liorinTitle: liorinLichess?.title ?? null,
    gap:
      lichessOne?.rating != null && lichessRating != null
        ? lichessOne.rating - lichessRating
        : null,
    url: `${LICHESS}/player/bots`,
    live: Boolean(liorinLichess),
  });

  try {
    const boards = await fetchJson<{ live_blitz?: ChessComBoard[] }>(`${CHESSCOM}/leaderboards`);
    const one = boards.live_blitz?.[0];
    ranks.push({
      platformId: "chesscom-computer",
      surface: "Chess.com live blitz (human #1 — computer path separate)",
      numberOne: one?.username ?? "—",
      numberOneRating: one?.score ?? null,
      liorinHandle: null,
      liorinRating: null,
      liorinTitle: null,
      gap: one?.score ?? null,
      url: "https://www.chess.com/leaderboard/live/blitz",
      live: Boolean(one),
    });
  } catch {
    ranks.push({
      platformId: "chesscom-computer",
      surface: "Chess.com live blitz",
      numberOne: "—",
      numberOneRating: null,
      liorinHandle: null,
      liorinRating: null,
      liorinTitle: null,
      gap: null,
      url: "https://www.chess.com/leaderboard/live/blitz",
      live: false,
    });
  }

  ranks.push(
    {
      platformId: "tcec",
      surface: "TCEC engine championship",
      numberOne: "Season leader (invite)",
      numberOneRating: null,
      liorinHandle: null,
      liorinRating: null,
      liorinTitle: null,
      gap: null,
      url: "https://tcec-chess.com",
      live: false,
    },
    {
      platformId: "ccrl",
      surface: "CCRL 40/15",
      numberOne: "Stockfish (typical)",
      numberOneRating: null,
      liorinHandle: null,
      liorinRating: null,
      liorinTitle: null,
      gap: null,
      url: "https://computerchess.org.uk/ccrl/4040/",
      live: false,
    },
  );

  return ranks;
}

export async function lichessAccountFromToken(token: string) {
  const res = await fetch(`${LICHESS}/api/account`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent": UA,
    },
    signal: AbortSignal.timeout(6000),
  });
  if (res.status === 401) return { ok: false as const, error: "Lichess rejected the token." };
  if (!res.ok) return { ok: false as const, error: `Lichess ${res.status}` };
  const user = (await res.json()) as LichessUser;
  return {
    ok: true as const,
    username: user.username,
    title: user.title ?? null,
    id: user.id,
    perfs: {
      bullet: ratingOf(user, "bullet"),
      blitz: ratingOf(user, "blitz"),
      rapid: ratingOf(user, "rapid"),
    },
  };
}

export async function upgradeLichessBot(token: string) {
  const res = await fetch(`${LICHESS}/api/bot/account/upgrade`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent": UA,
    },
    signal: AbortSignal.timeout(8000),
  });
  if (res.ok) return { ok: true as const };
  const body = await res.text().catch(() => "");
  return { ok: false as const, error: body || `Lichess ${res.status}` };
}

export async function challengeLichessBot(token: string, username: string) {
  const body = new URLSearchParams({
    rated: "false",
    "clock.limit": "180",
    "clock.increment": "2",
    color: "random",
  });
  const res = await fetch(`${LICHESS}/api/challenge/${encodeURIComponent(username)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": UA,
    },
    body,
    signal: AbortSignal.timeout(8000),
  });
  const json = (await res.json().catch(() => ({}))) as {
    challenge?: { id?: string; url?: string };
    error?: string;
    id?: string;
    url?: string;
  };
  if (!res.ok) {
    return { ok: false as const, error: json.error || `Lichess ${res.status}` };
  }
  const url = json.challenge?.url ?? json.url ?? `${LICHESS}`;
  const id = json.challenge?.id ?? json.id ?? "";
  return { ok: true as const, url, id };
}
