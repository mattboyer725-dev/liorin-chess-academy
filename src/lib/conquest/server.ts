import { createServerFn } from "@tanstack/react-start";
import { AGENT_IDS, type AgentId, type CommandSnapshot, type MatchRow } from "@/lib/agents/types";
import { PLATFORMS } from "@/lib/platforms/catalog";
import {
  challengeLichessBot,
  fetchHuntEvents,
  fetchLichessUser,
  fetchOnlineBots,
  fetchRankTargets,
  fetchTvBot,
  lichessAccountFromToken,
  upgradeLichessBot,
} from "@/lib/platforms/live";
import { nextRating, scoreOf } from "./elo";
import {
  insertMatch,
  loadSlice,
  markLaunched,
  seedLichessHandle,
  upsertHandle,
  watchRow,
  writeLog,
} from "./store";

let probeCache: { at: number; value: Omit<CommandSnapshot, "state" | "handles" | "logs" | "matches"> } | null =
  null;
const PROBE_TTL = 45_000;

export function bustProbeCache() {
  probeCache = null;
}

function asAgent(id: string): AgentId {
  return (AGENT_IDS as readonly string[]).includes(id) ? (id as AgentId) : "scout";
}

function mapSnapshot(
  db: Awaited<ReturnType<typeof loadSlice>>,
  live: Omit<CommandSnapshot, "state" | "handles" | "logs" | "matches">,
): CommandSnapshot {
  return {
    state: {
      rating: db.state.rating,
      games: db.state.games,
      wins: db.state.wins,
      draws: db.state.draws,
      losses: db.state.losses,
      launchedAt: db.state.launched_at,
      updatedAt: db.state.updated_at,
    },
    handles: db.handles.map((h) => ({
      platformId: h.platform_id as CommandSnapshot["handles"][number]["platformId"],
      handle: h.handle,
      status: h.status as CommandSnapshot["handles"][number]["status"],
      note: h.note,
      enlistedAt: h.enlisted_at,
    })),
    logs: db.logs.map((l) => ({
      id: l.id,
      agentId: asAgent(l.agent_id),
      level: l.level === "warn" || l.level === "alert" ? l.level : "info",
      message: l.message,
      at: l.created_at,
    })),
    matches: db.matches.map(
      (m): MatchRow => ({
        id: m.id,
        platformId: m.platform_id as MatchRow["platformId"],
        opponent: m.opponent,
        opponentRating: m.opponent_rating,
        result: m.result === "win" || m.result === "draw" || m.result === "loss" ? m.result : "draw",
        ratingBefore: m.rating_before,
        ratingAfter: m.rating_after,
        reason: m.reason,
        at: m.created_at,
      }),
    ),
    ...live,
  };
}

async function probeLive() {
  if (probeCache && Date.now() - probeCache.at < PROBE_TTL) return probeCache.value;
  const [onlineBots, events, liorin, tvBot] = await Promise.all([
    fetchOnlineBots(36).catch(() => []),
    fetchHuntEvents().catch(() => []),
    fetchLichessUser("Liorin"),
    fetchTvBot(),
  ]);
  const ranks = await fetchRankTargets(liorin).catch(() => []);
  const value = {
    onlineBots,
    events,
    ranks,
    tvBot,
    probedAt: new Date().toISOString(),
    source: (onlineBots.length > 0 || events.length > 0 ? "live" : "degraded") as "live" | "degraded",
  };
  probeCache = { at: Date.now(), value };
  return value;
}

export const getCommandSnapshot = createServerFn({ method: "GET" }).handler(
  async (): Promise<CommandSnapshot> => {
    const [db, live] = await Promise.all([loadSlice(), probeLive()]);
    return mapSnapshot(db, live);
  },
);

export const launchConquest = createServerFn({ method: "POST" })
  .validator(() => ({}))
  .handler(async (): Promise<CommandSnapshot> => {
    probeCache = null;
    await markLaunched();
    await seedLichessHandle();
    await writeLog("diplomat", "Charter armed. Human pools refused. Bot programs only.");
    await writeLog("scout", `Horizon mapped ${PLATFORMS.length} public boards.`);

    const live = await probeLive();
    await writeLog(
      "hunter",
      `Net has ${live.onlineBots.length} BOTs on Lichess and ${live.events.filter((e) => e.botsDesigned).length} bot-designed events.`,
    );

    const lichess = live.ranks.find((r) => r.platformId === "lichess");
    if (lichess?.liorinHandle) {
      await writeLog(
        "analyst",
        `Lichess @${lichess.liorinHandle} ${lichess.liorinTitle ?? "untitled"} · blitz ${lichess.liorinRating ?? "—"} · gap to open #1 ${lichess.gap ?? "—"}.`,
      );
      if (!lichess.liorinTitle) {
        await writeLog(
          "registrar",
          "Public handle Liorin exists on Lichess but is not a BOT title. Upgrade required before rated engine play.",
          "warn",
        );
      } else {
        await writeLog("registrar", `Lichess title ${lichess.liorinTitle} confirmed.`);
      }
    } else {
      await writeLog("registrar", "No public Lichess handle confirmed. Open official signup.", "warn");
    }

    await writeLog(
      "captain",
      "WOPR standing by. Gauntlet is live. Official challenges require a BOT token.",
    );
    await writeLog(
      "steward",
      "KEEPER online. Archive armed. Recaps and Update-all live in Studio. All roads home to the academy.",
    );

    const db = await loadSlice();
    return mapSnapshot(db, live);
  });

export const recordGauntlet = createServerFn({ method: "POST" })
  .validator((input: { opponent: string; opponentRating: number; result: "win" | "draw" | "loss"; reason?: string }) => {
    const opponent = input.opponent.trim().slice(0, 40);
    const opponentRating = Math.round(Number(input.opponentRating));
    if (!opponent) throw new Error("Opponent required");
    if (!Number.isFinite(opponentRating) || opponentRating < 100 || opponentRating > 4000) {
      throw new Error("Rating out of range");
    }
    if (input.result !== "win" && input.result !== "draw" && input.result !== "loss") {
      throw new Error("Bad result");
    }
    return {
      opponent,
      opponentRating,
      result: input.result,
      reason: (input.reason ?? "").slice(0, 160),
    };
  })
  .handler(async ({ data }) => {
    const slice = await loadSlice();
    const state = slice.state;
    const after = nextRating(state.rating, data.opponentRating, scoreOf(data.result));
    const wins = state.wins + (data.result === "win" ? 1 : 0);
    const draws = state.draws + (data.result === "draw" ? 1 : 0);
    const losses = state.losses + (data.result === "loss" ? 1 : 0);
    await insertMatch({
      platformId: "gauntlet",
      opponent: data.opponent,
      opponentRating: data.opponentRating,
      result: data.result,
      ratingBefore: state.rating,
      ratingAfter: after,
      reason: data.reason || null,
      wins,
      draws,
      losses,
    });
    await writeLog(
      "captain",
      `${data.result.toUpperCase()} vs ${data.opponent} (${data.opponentRating}). Conquest Elo ${state.rating} → ${after}.`,
    );
    await writeLog("analyst", `Gauntlet Elo now ${after}. Games ${state.games + 1}.`);
    return { ratingBefore: state.rating, ratingAfter: after, result: data.result };
  });

export const enlistHandle = createServerFn({ method: "POST" })
  .validator((input: { platformId: string; handle: string; status?: string; note?: string }) => {
    const platform = PLATFORMS.find((p) => p.id === input.platformId);
    if (!platform) throw new Error("Unknown platform");
    if (platform.diplomat === "refuse") throw new Error("Diplomat refused this board.");
    const handle = input.handle.trim().slice(0, 32);
    if (!/^[A-Za-z0-9_-]{2,32}$/.test(handle)) throw new Error("Handle must be 2–32 letters, numbers, _ or -.");
    const status =
      input.status === "enlisted" || input.status === "awaiting-approval" || input.status === "playbook-ready"
        ? input.status
        : "playbook-ready";
    return { platformId: platform.id, handle, status, note: (input.note ?? "").slice(0, 160) };
  })
  .handler(async ({ data }) => {
    await upsertHandle(data.platformId, data.handle, data.status, data.note || null);
    await writeLog("registrar", `${data.platformId} handle ${data.handle} marked ${data.status}.`);
    return { ok: true as const };
  });

function sanitizeToken(token: string) {
  const t = token.trim();
  if (t.length < 8 || t.length > 512) throw new Error("Token length rejected");
  if (!/^[A-Za-z0-9._-]+$/.test(t)) throw new Error("Token characters rejected");
  return t;
}

export const bindLichessToken = createServerFn({ method: "POST" })
  .validator((input: { token: string }) => ({ token: sanitizeToken(input.token) }))
  .handler(async ({ data }) => {
    const account = await lichessAccountFromToken(data.token);
    if (!account.ok) return account;
    await upsertHandle(
      "lichess",
      account.username,
      account.title === "BOT" ? "enlisted" : "playbook-ready",
      account.title ? `title ${account.title}` : "needs BOT upgrade",
    );
    await writeLog(
      "registrar",
      `Token bound to Lichess @${account.username}${account.title ? ` (${account.title})` : " — not yet BOT"}. Token was not stored.`,
    );
    return account;
  });

export const upgradeBoundBot = createServerFn({ method: "POST" })
  .validator((input: { token: string }) => ({ token: sanitizeToken(input.token) }))
  .handler(async ({ data }) => {
    const account = await lichessAccountFromToken(data.token);
    if (!account.ok) return account;
    if (account.title === "BOT") {
      await writeLog("registrar", `@${account.username} is already BOT.`);
      return { ok: true as const, username: account.username, title: "BOT" };
    }
    const up = await upgradeLichessBot(data.token);
    if (!up.ok) {
      await writeLog("registrar", `Upgrade failed: ${up.error}`, "alert");
      return up;
    }
    await upsertHandle("lichess", account.username, "enlisted", "BOT title");
    await writeLog("registrar", `Lichess @${account.username} upgraded to BOT.`);
    await writeLog("diplomat", "Engine play is now legal on Lichess for this account. Human-titled play remains forbidden.");
    return { ok: true as const, username: account.username, title: "BOT" };
  });

export const issueBotChallenge = createServerFn({ method: "POST" })
  .validator((input: { token: string; username: string }) => {
    const username = input.username.trim().slice(0, 40);
    if (!/^[A-Za-z0-9_-]{2,40}$/.test(username)) throw new Error("Bad username");
    return { token: sanitizeToken(input.token), username };
  })
  .handler(async ({ data }) => {
    const account = await lichessAccountFromToken(data.token);
    if (!account.ok) return account;
    if (account.title !== "BOT") {
      return { ok: false as const, error: "Diplomat: upgrade to BOT before challenging engines." };
    }
    const target = await fetchLichessUser(data.username);
    if (!target) return { ok: false as const, error: "Target not found on Lichess." };
    if ((target.title ?? "").toUpperCase() !== "BOT") {
      return { ok: false as const, error: "Diplomat refused: target is not a BOT title." };
    }
    const result = await challengeLichessBot(data.token, data.username);
    if (result.ok) {
      await writeLog("captain", `Challenge issued to BOT ${data.username}. ${result.url}`);
    } else {
      await writeLog("captain", `Challenge to ${data.username} failed: ${result.error}`, "warn");
    }
    return result;
  });

export const watchEvent = createServerFn({ method: "POST" })
  .validator((input: { source: string; eventId: string; title: string; url: string; note?: string }) => ({
    source: input.source.slice(0, 40),
    eventId: input.eventId.slice(0, 80),
    title: input.title.slice(0, 120),
    url: input.url.slice(0, 240),
    note: (input.note ?? "").slice(0, 200),
  }))
  .handler(async ({ data }) => {
    if (!/^https:\/\/(lichess\.org|www\.chess\.com|tcec-chess\.com|computerchess\.org\.uk|www\.pychess\.org)\b/.test(data.url)) {
      throw new Error("URL host not on the watch allow-list.");
    }
    await watchRow(data.source, data.eventId, data.title, data.url, data.note || null);
    await writeLog("hunter", `Watching ${data.title}`);
    return { ok: true as const };
  });
