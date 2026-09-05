import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type Square } from "chess.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { AcademyCta } from "@/components/academy-cta";
import { ChessBoard } from "@/components/chess-board";
import { Button } from "@/components/ui/button";
import { chooseMove, type EngineProfile } from "@/lib/chess/engine";
import { boardFrom, liorinResult, makePgn, openingName, START_FEN } from "@/lib/chess/pgn";
import { bestBotRating, formatElo } from "@/lib/conquest/format";
import { getCommandSnapshot, recordGauntlet } from "@/lib/conquest/server";
import { saveAcademyGame } from "@/lib/games/server";
import type { SaveGameInput } from "@/lib/games/types";

type Search = { opponent?: string; rating?: number };

export const Route = createFileRoute("/engage")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    opponent: typeof s.opponent === "string" ? s.opponent.slice(0, 40) : undefined,
    rating: typeof s.rating === "number" ? s.rating : typeof s.rating === "string" ? Number(s.rating) : undefined,
  }),
  component: EngagePage,
});

function fieldProfile(rating: number): EngineProfile {
  if (rating < 1200) return "fast";
  if (rating < 1800) return "balanced";
  if (rating < 2300) return "tactics";
  return "deep";
}

function EngagePage() {
  const { opponent: oppName, rating: oppRatingRaw } = Route.useSearch();
  const snap = useQuery({ queryKey: ["command"], queryFn: () => getCommandSnapshot() });
  const opponent = oppName?.trim() || "field-bot";
  const oppRating =
    Number.isFinite(oppRatingRaw) && (oppRatingRaw as number) > 0 ? Math.round(oppRatingRaw as number) : 1600;

  const [sans, setSans] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>(["Captain standing by. Liorin is White. Cold holds."]);
  const recorded = useRef(false);
  const chess = useMemo(() => boardFrom(START_FEN, sans), [sans]);
  const over = chess.isGameOver();

  const record = useMutation({
    mutationFn: (input: { result: "win" | "draw" | "loss"; reason: string }) =>
      recordGauntlet({
        data: { opponent, opponentRating: oppRating, result: input.result, reason: input.reason },
      }),
    onSuccess: (res) => {
      setLog((prev) => [`Conquest Elo ${res.ratingBefore} → ${res.ratingAfter}`, ...prev].slice(0, 14));
    },
  });

  const archive = useMutation({
    mutationFn: (input: SaveGameInput) => saveAcademyGame({ data: input }),
  });

  useEffect(() => {
    recorded.current = false;
    setSans([]);
    setLastMove(null);
    setRunning(false);
    setLog([`Target ${opponent} · field ${formatElo(oppRating)}. Liorin White, cold.`]);
  }, [opponent, oppRating]);

  useEffect(() => {
    if (!running || over) return;
    const handle = window.setTimeout(() => {
      const board = boardFrom(START_FEN, sans);
      if (board.isGameOver()) return;
      const white = board.turn() === "w";
      const profile = white ? "cold" : fieldProfile(oppRating);
      const move = chooseMove(board.fen(), profile);
      if (!move) return;
      board.move(move);
      setSans((prev) => [...prev, move.san]);
      setLastMove({ from: move.from, to: move.to });
      const who = white ? "Liorin" : opponent;
      setLog((prev) => [`${who}: ${move.san}`, ...prev].slice(0, 14));
    }, 260);
    return () => window.clearTimeout(handle);
  }, [sans, running, over, opponent, oppRating]);

  useEffect(() => {
    if (!over || recorded.current || sans.length < 1) return;
    recorded.current = true;
    setRunning(false);
    const result = liorinResult(chess, "w");
    let reason = "Draw.";
    if (chess.isCheckmate()) {
      reason = result === "win" ? "Checkmate. Liorin wins." : `Checkmate. ${opponent} wins.`;
    } else if (chess.isStalemate()) reason = "Stalemate.";
    else if (chess.isDraw()) reason = "Draw by rule.";
    setLog((prev) => [reason, ...prev].slice(0, 14));
    record.mutate({ result, reason });
    archive.mutate({
      mode: "gauntlet",
      lessonId: null,
      engineProfile: "cold",
      liorinColor: "w",
      opponentLabel: opponent,
      result,
      ply: sans.length,
      pgn: makePgn({
        startFen: START_FEN,
        sans,
        white: "Liorin",
        black: opponent,
        result,
        liorinColor: "w",
        event: "LIORIN Gauntlet",
      }),
      fenStart: START_FEN,
      fenEnd: chess.fen(),
      opening: openingName(sans),
    });
  }, [over, chess, opponent, record, archive, sans]);

  const status = over
    ? chess.isCheckmate()
      ? `Checkmate — ${chess.turn() === "w" ? opponent : "Liorin"} wins.`
      : "Game drawn."
    : running
      ? chess.turn() === "w"
        ? "Liorin thinking…"
        : `${opponent} thinking…`
      : "Ready.";

  const field = snap.data?.onlineBots.slice(0, 10) ?? [];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Captain · WOPR</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Gauntlet</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Liorin plays White in cold mode against a field engine calibrated to a live BOT’s public
          rating. Liorin does not yield. The score updates Conquest Elo and the academy archive.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,520px)_1fr]">
        <div className="flex flex-col gap-3">
          <ChessBoard
            chess={chess}
            selected={null}
            onSelect={() => {}}
            lastMove={lastMove}
            disabled
          />
          <p className="text-sm text-fg">{status}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setRunning(true)} disabled={running || over}>
              Start match
            </Button>
            <Button variant="outline" onClick={() => setRunning(false)} disabled={!running}>
              Pause
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                recorded.current = false;
                setSans([]);
                setLastMove(null);
                setRunning(false);
                setLog([`Reset vs ${opponent}. Cold.`]);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Pairing</p>
            <p className="mt-2 text-sm text-fg">
              Liorin (White, cold) vs {opponent} ({formatElo(oppRating)}, {fieldProfile(oppRating)})
            </p>
            {record.data ? (
              <p className="mt-2 text-xs text-primary">
                Recorded {record.data.result}. Elo {record.data.ratingAfter}.{" "}
                <Link to="/admin" className="underline">
                  Recap
                </Link>
              </p>
            ) : null}
            {record.isError ? <p className="mt-2 text-xs text-danger">{record.error.message}</p> : null}
          </div>
          <ol className="max-h-56 overflow-auto rounded-lg border border-border bg-bg px-4 py-3 text-xs leading-relaxed text-muted">
            {log.map((line, i) => (
              <li key={`${i}-${line}`} className="py-0.5">
                {line}
              </li>
            ))}
          </ol>
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted">Live BOT field</p>
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              {field.map((b) => (
                <li key={b.id}>
                  <Link
                    to="/engage"
                    search={{ opponent: b.username, rating: bestBotRating(b) }}
                    className="flex min-h-11 items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-raised"
                  >
                    <span className="truncate">{b.username}</span>
                    <span className="tabular text-primary">{formatElo(bestBotRating(b))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <AcademyCta line="Gauntlet is training. Official rated games wait on Hunt after the BOT upgrade. The academy board stays home." />
    </div>
  );
}
