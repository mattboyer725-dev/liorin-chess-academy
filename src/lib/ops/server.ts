import { createServerFn } from "@tanstack/react-start";
import { loveCopy } from "@/lib/chess/recap";
import { bustProbeCache, getCommandSnapshot } from "@/lib/conquest/server";
import { writeLog } from "@/lib/conquest/store";
import { bustFideCache, getLiveRegister } from "@/lib/fide/server";
import { fillGameRecap, gamesMissingRecap, gameCounts } from "@/lib/games/store";
import type { CommandSnapshot } from "@/lib/agents/types";
import type { LiveRegister } from "@/lib/fide/types";

async function race<T>(work: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

export type MaintenanceReport = {
  at: string;
  db: "live" | "memory";
  fideSource: string;
  clubCount: number;
  botsOnline: number;
  events: number;
  games: number;
  recapsFilled: number;
  notes: string[];
};

export const runMaintenance = createServerFn({ method: "POST" })
  .validator(() => ({}))
  .handler(async (): Promise<MaintenanceReport> => {
    const notes: string[] = [];
    bustFideCache();
    bustProbeCache();

    const emptyRegister = {
      source: "seed",
      clubCount: 0,
    } as Pick<LiveRegister, "source" | "clubCount">;

    const [register, snap, missing, counts] = await Promise.all([
      race(getLiveRegister().catch(() => null), 2500, null),
      race(getCommandSnapshot().catch(() => null), 4500, null),
      gamesMissingRecap().catch(() => []),
      gameCounts().catch(() => null),
    ]);

    let recapsFilled = 0;
    for (const game of missing) {
      const copy = loveCopy({
        result: game.result,
        mode: game.mode,
        ply: game.ply,
        opening: game.opening,
        lessonId: game.lessonId,
        opponentLabel: game.opponentLabel,
      });
      await fillGameRecap(game.id, copy.body, copy.loveLine);
      recapsFilled += 1;
    }

    const fide = register ?? emptyRegister;
    const fideSource = fide.source;
    const clubCount = fide.clubCount;
    const botsOnline = snap?.onlineBots.length ?? 0;
    const events = snap?.events.filter((e) => e.botsDesigned).length ?? 0;
    const games = counts?.games ?? 0;
    const db: "live" | "memory" = process.env.DATABASE_URL?.trim() ? "live" : "memory";

    notes.push(`2700 Club source ${fideSource}, ${clubCount} at 2700+.`);
    notes.push(`${botsOnline} BOTs online, ${events} bot-designed events.`);
    notes.push(`Archive ${games} games. Recaps filled ${recapsFilled}.`);
    notes.push("Every road still points home to LIORIN Chess Academy.");

    await writeLog("steward", `Update-all complete. ${notes.join(" ")}`);
    await writeLog("analyst", `FIDE ${fideSource} · club ${clubCount}.`);
    await writeLog("hunter", `Field ${botsOnline} BOTs · ${events} hunts.`);

    return {
      at: new Date().toISOString(),
      db,
      fideSource,
      clubCount,
      botsOnline,
      events,
      games,
      recapsFilled,
      notes,
    };
  });

export const getOpsHealth = createServerFn({ method: "GET" }).handler(async () => {
  const [register, snap, counts] = await Promise.all([
    race(getLiveRegister().catch(() => null), 2500, null),
    race(getCommandSnapshot().catch(() => null), 4000, null),
    gameCounts().catch(() => null),
  ]);
  const snapshot = snap as CommandSnapshot | null;
  return {
    at: new Date().toISOString(),
    db: process.env.DATABASE_URL?.trim() ? ("live" as const) : ("memory" as const),
    fideSource: register?.source ?? "seed",
    clubCount: register?.clubCount ?? 0,
    botsOnline: snapshot?.onlineBots.length ?? 0,
    launched: Boolean(snapshot?.state.launchedAt),
    games: counts?.games ?? 0,
    wins: counts?.wins ?? 0,
    draws: counts?.draws ?? 0,
    losses: counts?.losses ?? 0,
    pendingRecaps: counts?.pendingRecaps ?? 0,
    lastLog: snapshot?.logs.find((l) => l.agentId === "steward") ?? snapshot?.logs[0] ?? null,
  };
});
