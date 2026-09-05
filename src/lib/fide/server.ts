import { createServerFn } from "@tanstack/react-start";
import { FIDE_ROSTER } from "./roster";
import { deltaFrom, lastStep, parseHistory, peakOf, toRow } from "./format";
import { SEED_PLAYERS } from "./seed";
import type {
  BroadcastCard,
  FidePlayer,
  LiveRegister,
  OnlineRegister,
  PlayerDossier,
  RegisterRow,
} from "./types";

const UA = "LIORIN-Chess-Academy/2.0 (live-register; educational)";
const TTL_MS = 10 * 60 * 1000;
const HISTORY_TTL_MS = 6 * 60 * 60 * 1000;

let registerCache: { at: number; value: LiveRegister } | null = null;
let registerInflight: Promise<LiveRegister> | null = null;
const playerCache = new Map<number, { at: number; value: FidePlayer }>();
const historyCache = new Map<
  number,
  { at: number; value: { standard: number[]; rapid: number[]; blitz: number[] } }
>();

export function bustFideCache() {
  registerCache = null;
  registerInflight = null;
}

async function lichess<T>(path: string): Promise<T> {
  const res = await fetch(`https://lichess.org${path}`, {
    headers: { Accept: "application/json", "User-Agent": UA },
    signal: AbortSignal.timeout(4_000),
  });
  if (!res.ok) throw new Error(`Lichess ${res.status} ${path}`);
  return (await res.json()) as T;
}

async function pool<T, R>(
  items: T[],
  n: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      const item = items[idx];
      if (item === undefined) continue;
      out[idx] = await fn(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, () => worker()));
  return out;
}

function normalizePlayer(raw: Record<string, unknown>): FidePlayer | null {
  const id = Number(raw.id);
  if (!id) return null;
  return {
    id,
    name: String(raw.name ?? "Unknown"),
    federation: String(raw.federation ?? ""),
    year: typeof raw.year === "number" ? raw.year : null,
    title: raw.title ? String(raw.title) : null,
    standard: typeof raw.standard === "number" ? raw.standard : null,
    rapid: typeof raw.rapid === "number" ? raw.rapid : null,
    blitz: typeof raw.blitz === "number" ? raw.blitz : null,
    gender: raw.gender === "F" || raw.gender === "M" ? raw.gender : null,
    inactive: Boolean(raw.inactive),
    photo:
      raw.photo && typeof raw.photo === "object"
        ? (raw.photo as FidePlayer["photo"])
        : null,
  };
}

async function fetchPlayer(id: number): Promise<FidePlayer | null> {
  const hit = playerCache.get(id);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  try {
    const raw = await lichess<Record<string, unknown>>(`/api/fide/player/${id}`);
    const player = normalizePlayer(raw);
    if (player) playerCache.set(id, { at: Date.now(), value: player });
    return player;
  } catch {
    return hit?.value ?? null;
  }
}

function buildRegister(players: FidePlayer[], source: LiveRegister["source"]): LiveRegister {
  const rows = players
    .filter((p) => p.standard || p.rapid || p.blitz)
    .map((p) => toRow(p))
    .sort((a, b) => (b.standard ?? 0) - (a.standard ?? 0));
  return {
    source,
    fetchedAt: new Date().toISOString(),
    players: rows,
    clubCount: rows.filter((r) => r.club && !r.inactive).length,
    numberOne: rows[0] ?? null,
  };
}

export const getLiveRegister = createServerFn({ method: "GET" }).handler(
  async (): Promise<LiveRegister> => {
    if (registerCache && Date.now() - registerCache.at < TTL_MS) {
      return registerCache.value;
    }
    if (!registerInflight) {
      registerInflight = (async (): Promise<LiveRegister> => {
        try {
          const fetched = await pool(FIDE_ROSTER, 6, fetchPlayer);
          const players = fetched.filter((p): p is FidePlayer => p != null);
          const byId = new Map<number, FidePlayer>();
          for (const p of SEED_PLAYERS) byId.set(p.id, p);
          for (const p of players) byId.set(p.id, p);
          const value = buildRegister(
            [...byId.values()],
            players.length >= FIDE_ROSTER.length * 0.6 ? "live" : players.length ? "mixed" : "seed",
          );
          registerCache = { at: Date.now(), value };
          return value;
        } catch {
          const value = buildRegister(SEED_PLAYERS, "seed");
          registerCache = { at: Date.now(), value };
          return value;
        } finally {
          registerInflight = null;
        }
      })();
    }
    const winner = await Promise.race([
      registerInflight,
      new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), 1200)),
    ]);
    if (winner === "timeout") {
      return buildRegister(SEED_PLAYERS, "seed");
    }
    return winner;
  },
);

export const searchFidePlayers = createServerFn({ method: "POST" })
  .validator((input: { q: string }) => input)
  .handler(async ({ data }): Promise<RegisterRow[]> => {
    const q = data.q.trim();
    if (q.length < 2) return [];
    const raw = await lichess<Record<string, unknown>[]>(
      `/api/fide/player?q=${encodeURIComponent(q)}`,
    );
    return raw
      .map(normalizePlayer)
      .filter((p): p is FidePlayer => p != null)
      .slice(0, 20)
      .map((p) => toRow(p));
  });

export const getPlayerDossier = createServerFn({ method: "POST" })
  .validator((input: { id: number | string }) => ({ id: Number(input.id) }))
  .handler(async ({ data }): Promise<PlayerDossier | null> => {
    const player = await fetchPlayer(data.id);
    if (!player) return null;
    const histHit = historyCache.get(data.id);
    let historyRaw = histHit?.value;
    if (!historyRaw || Date.now() - (histHit?.at ?? 0) > HISTORY_TTL_MS) {
      try {
        const fetchedHist = await lichess<{
          standard?: number[];
          rapid?: number[];
          blitz?: number[];
        }>(`/api/fide/player/${data.id}/ratings`);
        historyRaw = {
          standard: fetchedHist.standard ?? [],
          rapid: fetchedHist.rapid ?? [],
          blitz: fetchedHist.blitz ?? [],
        };
        historyCache.set(data.id, { at: Date.now(), value: historyRaw });
      } catch {
        historyRaw = histHit?.value ?? { standard: [], rapid: [], blitz: [] };
      }
    }
    const standard = parseHistory(historyRaw.standard);
    const rapid = parseHistory(historyRaw.rapid);
    const blitz = parseHistory(historyRaw.blitz);
    return {
      player: toRow(player),
      history: { standard, rapid, blitz },
      peak: {
        standard: peakOf(standard),
        rapid: peakOf(rapid),
        blitz: peakOf(blitz),
      },
      delta12m: {
        standard: deltaFrom(standard, 12),
        rapid: deltaFrom(rapid, 12),
        blitz: deltaFrom(blitz, 12),
      },
      lastChange: {
        standard: lastStep(standard),
        rapid: lastStep(rapid),
        blitz: lastStep(blitz),
      },
    };
  });

type LichessTour = {
  tour?: {
    id: string;
    name: string;
    url: string;
    image?: string;
    dates?: number[];
    info?: { location?: string; format?: string; tc?: string; fideTC?: string };
  };
  round?: { name?: string; url?: string };
};

function mapBroadcast(item: LichessTour): BroadcastCard | null {
  const t = item.tour;
  if (!t?.id || !t.name || !t.url) return null;
  return {
    id: t.id,
    name: t.name,
    url: t.url,
    location: t.info?.location ?? null,
    format: t.info?.format ?? null,
    timeControl: t.info?.tc ?? t.info?.fideTC ?? null,
    image: t.image ?? null,
    dates: t.dates ?? null,
    roundName: item.round?.name ?? null,
    roundUrl: item.round?.url ?? null,
  };
}

export const getLiveEvents = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ active: BroadcastCard[]; upcoming: BroadcastCard[] }> => {
    const raw = await lichess<{ active?: LichessTour[]; upcoming?: LichessTour[] }>(
      "/api/broadcast/top",
    );
    return {
      active: (raw.active ?? []).map(mapBroadcast).filter((x): x is BroadcastCard => x != null),
      upcoming: (raw.upcoming ?? [])
        .map(mapBroadcast)
        .filter((x): x is BroadcastCard => x != null)
        .slice(0, 8),
    };
  },
);

type ChessComBoard = {
  rank?: number;
  username?: string;
  title?: string;
  score?: number;
  country?: string;
};

export const getOnlineRegister = createServerFn({ method: "GET" }).handler(
  async (): Promise<OnlineRegister> => {
    const res = await fetch("https://api.chess.com/pub/leaderboards", {
      headers: { Accept: "application/json", "User-Agent": UA },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) throw new Error(`Chess.com ${res.status}`);
    const body = (await res.json()) as Record<string, ChessComBoard[]>;
    const map = (rows: ChessComBoard[] | undefined): OnlineRegister["blitz"] =>
      (rows ?? []).slice(0, 25).map((p, i) => ({
        rank: p.rank ?? i + 1,
        username: p.username ?? "—",
        title: p.title ?? null,
        rating: p.score ?? 0,
        country: p.country?.split("/").pop() ?? null,
      }));
    return {
      fetchedAt: new Date().toISOString(),
      blitz: map(body.live_blitz),
      rapid: map(body.live_rapid),
      bullet: map(body.live_bullet),
    };
  },
);
