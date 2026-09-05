import { createServerFn } from "@tanstack/react-start";
import { ACADEMY_CTA, weeklyLetter } from "@/lib/chess/recap";
import { writeLog } from "@/lib/conquest/store";
import {
  gameCounts,
  insertAcademyGame,
  insertLetter,
  latestLetter,
  listAcademyGames,
} from "./store";
import type { AcademySummary, GameMode, SaveGameInput } from "./types";

function asMode(mode: string): GameMode {
  if (mode === "cold" || mode === "gauntlet" || mode === "lesson" || mode === "teach") return mode;
  throw new Error("Bad mode");
}

export const saveAcademyGame = createServerFn({ method: "POST" })
  .validator((input: SaveGameInput) => {
    const result = input.result;
    if (result !== "win" && result !== "draw" && result !== "loss") throw new Error("Bad result");
    if (input.liorinColor !== "w" && input.liorinColor !== "b") throw new Error("Bad color");
    const ply = Math.round(Number(input.ply));
    if (!Number.isFinite(ply) || ply < 1 || ply > 400) throw new Error("Ply out of range");
    return {
      mode: asMode(input.mode),
      lessonId: input.lessonId ? String(input.lessonId).slice(0, 40) : null,
      engineProfile: String(input.engineProfile ?? "cold").slice(0, 24),
      liorinColor: input.liorinColor,
      opponentLabel: String(input.opponentLabel ?? "Student").slice(0, 40),
      result,
      ply,
      pgn: String(input.pgn ?? "").slice(0, 8000),
      fenStart: String(input.fenStart ?? "").slice(0, 120),
      fenEnd: String(input.fenEnd ?? "").slice(0, 120),
      opening: input.opening ? String(input.opening).slice(0, 48) : "Academy game",
    };
  })
  .handler(async ({ data }) => {
    const game = await insertAcademyGame(data);
    await writeLog(
      "steward",
      `Archive ${game.result.toUpperCase()} · ${game.opening ?? "game"} · ${game.ply} ply · ${game.mode}.`,
    );
    return game;
  });

export const getAcademySummary = createServerFn({ method: "GET" }).handler(
  async (): Promise<AcademySummary> => {
    const counts = await gameCounts();
    const stored = await latestLetter();
    const generated = weeklyLetter(counts.recent);
    return {
      ...counts,
      letter: stored
        ? {
            title: stored.title,
            body: stored.body,
            cta: stored.cta,
            source: stored.source,
            at: stored.at,
          }
        : { ...generated, source: "live", at: null },
    };
  },
);

export const listArchive = createServerFn({ method: "GET" }).handler(async () => {
  return listAcademyGames(48);
});

export const composeLoveLetter = createServerFn({ method: "POST" })
  .validator(() => ({}))
  .handler(async () => {
    const recent = await listAcademyGames(16);
    const local = weeklyLetter(recent);
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      const letter = await insertLetter({ ...local, kind: "weekly", source: "local" });
      await writeLog("steward", "Love letter composed from the archive (local).");
      return letter;
    }
    const digest = recent
      .slice(0, 12)
      .map(
        (g) =>
          `${g.opening ?? "game"} · ${g.mode} · Liorin ${g.result} · ${Math.round(g.ply / 2)} moves`,
      )
      .join("\n");
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 320,
        messages: [
          {
            role: "system",
            content:
              "You write cold, exact love letters about chess for LIORIN Chess Academy. No exclamation points. No sales language. No personal names. 120-160 words. Always end by inviting the reader back to the academy board, the lessons, or the 2700 Club. Title on the first line, then a blank line, then the body.",
          },
          {
            role: "user",
            content: `Compose this week's letter from these archived games:\n${digest || "No games yet."}`,
          },
        ],
      }),
    });
    if (!res.ok) {
      const letter = await insertLetter({ ...local, kind: "weekly", source: "local" });
      await writeLog("steward", `Love letter fell back to local (${res.status}).`, "warn");
      return letter;
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    const [first, ...rest] = text.split("\n").filter((l) => l.trim());
    const title = (first ?? local.title).replace(/^#+\s*/, "").slice(0, 80);
    const para = (rest.join(" ").trim() || local.body).slice(0, 2000);
    const letter = await insertLetter({
      kind: "weekly",
      title,
      body: para,
      cta: ACADEMY_CTA,
      source: "grok",
    });
    await writeLog("steward", "Love letter composed from the archive.");
    return letter;
  });
