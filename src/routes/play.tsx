import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Chess, type PieceSymbol, type Square } from "chess.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChessBoard } from "@/components/chess-board";
import { Button } from "@/components/ui/button";
import { chooseMove, type EngineProfile } from "@/lib/chess/engine";
import { LESSONS } from "@/lib/chess/lessons";
import { boardFrom, liorinResult, makePgn, openingName, START_FEN } from "@/lib/chess/pgn";
import { explainMove, openingHint } from "@/lib/chess/tutor";
import { saveAcademyGame } from "@/lib/games/server";
import type { SaveGameInput } from "@/lib/games/types";
import { cn } from "@/lib/utils";

type Search = { lesson?: string };

export const Route = createFileRoute("/play")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    lesson: typeof s.lesson === "string" ? s.lesson : undefined,
  }),
  component: PlayPage,
});

const PROFILES: { id: EngineProfile | "review"; label: string }[] = [
  { id: "cold", label: "Cold" },
  { id: "balanced", label: "Teach" },
  { id: "fast", label: "Coach" },
  { id: "deep", label: "Deep" },
  { id: "tactics", label: "Tactics" },
  { id: "review", label: "Review" },
];

function PlayPage() {
  const { lesson: lessonId } = Route.useSearch();
  const lesson = LESSONS.find((l) => l.id === lessonId);
  const initialFen = lesson?.fen ?? START_FEN;

  const [startFen, setStartFen] = useState(initialFen);
  const [sans, setSans] = useState<string[]>([]);
  const [selected, setSelected] = useState<Square | null>(null);
  const [log, setLog] = useState<string[]>(() =>
    lesson
      ? [`Lesson: ${lesson.title}. ${lesson.brief}`, lesson.hint]
      : ["Cold mode. Liorin does not yield. The academy still names every move."],
  );
  const [profile, setProfile] = useState<EngineProfile | "review">(lesson ? "balanced" : "cold");
  const [orient, setOrient] = useState<"w" | "b">(
    lesson && lesson.fen.includes(" b ") ? "b" : "w",
  );
  const [pendingPromo, setPendingPromo] = useState<{ from: Square; to: Square } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const saved = useRef(false);

  const chess = useMemo(() => boardFrom(startFen, sans), [startFen, sans]);
  const over = chess.isGameOver();
  const status = over
    ? chess.isCheckmate()
      ? `Checkmate — ${chess.turn() === "w" ? "Black" : "White"} wins.`
      : chess.isStalemate()
        ? "Stalemate. Draw."
        : "Draw."
    : chess.inCheck()
      ? "Check."
      : thinking
        ? "Liorin is thinking…"
        : `${chess.turn() === "w" ? "White" : "Black"} to move.`;

  const push = useCallback((line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 12));
  }, []);

  const save = useMutation({
    mutationFn: (input: SaveGameInput) => saveAcademyGame({ data: input }),
    onSuccess: (game) => {
      if (game.loveLine) push(game.loveLine);
      push("Saved to the academy archive.");
    },
  });

  const playEngine = useCallback(
    (fromFen: string, force?: EngineProfile | "review") => {
      const used = force ?? profile;
      if (used === "review") return;
      setThinking(true);
      window.setTimeout(() => {
        const move = chooseMove(fromFen, used);
        const board = new Chess(fromFen);
        if (!move) {
          setThinking(false);
          return;
        }
        const before = board.fen();
        board.move(move);
        setSans((prev) => [...prev, move.san]);
        setLastMove({ from: move.from, to: move.to });
        const tag = used === "cold" ? "Liorin (cold)" : `Liorin (${used})`;
        push(`${tag}: ${move.san}. ${explainMove(before, move, board.fen())}`);
        setThinking(false);
      }, 40);
    },
    [profile, push],
  );

  const tryMove = (from: Square, to: Square, promotion?: PieceSymbol) => {
    if (thinking || over) return;
    const board = boardFrom(startFen, sans);
    const legal = board.moves({ square: from, verbose: true }).find((m) => m.to === to);
    if (!legal) return;
    if (legal.promotion && !promotion) {
      setPendingPromo({ from, to });
      return;
    }
    const before = board.fen();
    const played = board.move({ from, to, promotion: promotion ?? legal.promotion });
    if (!played) return;
    setSans((prev) => [...prev, played.san]);
    setLastMove({ from, to });
    setSelected(null);
    setPendingPromo(null);
    push(`You: ${played.san}. ${explainMove(before, played, board.fen())}`);
    const hint = openingHint(board.fen());
    if (hint && profile !== "cold") push(hint);
    if (!board.isGameOver() && profile !== "review" && board.turn() !== orient) {
      playEngine(board.fen());
    }
  };

  const onSelect = (square: Square) => {
    if (thinking || over || pendingPromo) return;
    if (chess.turn() !== orient && profile !== "review") return;
    const piece = chess.get(square);
    if (selected) {
      if (square === selected) {
        setSelected(null);
        return;
      }
      const legal = chess.moves({ square: selected, verbose: true }).some((m) => m.to === square);
      if (legal) {
        tryMove(selected, square);
        return;
      }
    }
    if (piece && piece.color === chess.turn() && (profile === "review" || piece.color === orient)) {
      setSelected(square);
    } else {
      setSelected(null);
    }
  };

  const loadPosition = useCallback(
    (
      nextFen: string | undefined,
      nextOrient: "w" | "b",
      lines: string[],
      engineProfile?: EngineProfile | "review",
    ) => {
      const fen = nextFen ?? START_FEN;
      const board = new Chess(fen);
      saved.current = false;
      setStartFen(board.fen());
      setSans([]);
      setSelected(null);
      setPendingPromo(null);
      setLastMove(null);
      setThinking(false);
      setOrient(nextOrient);
      setLog(lines);
      const used = engineProfile ?? profile;
      if (used !== "review" && !board.isGameOver() && board.turn() !== nextOrient) {
        playEngine(board.fen(), used);
      }
    },
    [playEngine, profile],
  );

  useEffect(() => {
    if (!lesson) return;
    setProfile("balanced");
    loadPosition(
      lesson.fen,
      lesson.fen.includes(" b ") ? "b" : "w",
      [`Lesson: ${lesson.title}. ${lesson.brief}`, lesson.hint],
      "balanced",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  useEffect(() => {
    if (!over || saved.current || profile === "review" || sans.length < 1) return;
    saved.current = true;
    const liorinColor: "w" | "b" = orient === "w" ? "b" : "w";
    const result = liorinResult(chess, liorinColor);
    const mode = lesson ? "lesson" : profile === "cold" ? "cold" : "teach";
    const white = liorinColor === "w" ? "Liorin" : "Student";
    const black = liorinColor === "b" ? "Liorin" : "Student";
    save.mutate({
      mode,
      lessonId: lesson?.id ?? null,
      engineProfile: profile,
      liorinColor,
      opponentLabel: "Student",
      result,
      ply: sans.length,
      pgn: makePgn({
        startFen,
        sans,
        white,
        black,
        result,
        liorinColor,
      }),
      fenStart: startFen,
      fenEnd: chess.fen(),
      opening: openingName(sans),
    });
  }, [over, chess, sans, profile, orient, lesson, startFen, save]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex flex-1 flex-col items-center gap-4">
        <div className="w-full max-w-[520px]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
            {profile === "cold" ? "Cold board" : "Teaching board"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {lesson ? lesson.title : profile === "cold" ? "Play Liorin cold" : "Play Liorin"}
          </h1>
          <p className="mt-1 text-sm text-muted">{status}</p>
        </div>
        <ChessBoard
          chess={chess}
          selected={selected}
          onSelect={onSelect}
          orientation={orient}
          lastMove={lastMove}
          disabled={thinking || Boolean(pendingPromo)}
        />
        {pendingPromo ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-[0.14em] text-muted">Promote to</span>
            {(["q", "r", "b", "n"] as const).map((p) => (
              <Button key={p} size="sm" onClick={() => tryMove(pendingPromo.from, pendingPromo.to, p)}>
                {p.toUpperCase()}
              </Button>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              loadPosition(
                lesson?.fen,
                lesson && lesson.fen.includes(" b ") ? "b" : "w",
                lesson
                  ? [`Lesson: ${lesson.title}. ${lesson.brief}`, lesson.hint]
                  : profile === "cold"
                    ? ["New game. Cold mode. Liorin does not yield."]
                    : ["New game. Legal moves only. The archive keeps the score."],
              )
            }
          >
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const next = orient === "w" ? "b" : "w";
              loadPosition(undefined, next, [
                `Playing ${next === "w" ? "White" : "Black"}. ${profile === "cold" ? "Cold." : "Legal moves only."}`,
              ]);
            }}
          >
            Flip / play {orient === "w" ? "Black" : "White"}
          </Button>
          <Button
            variant="ghost"
            disabled={sans.length === 0 || thinking}
            onClick={() => {
              setSans((prev) => {
                if (prev.length === 0) return prev;
                const next = prev.slice(0, -1);
                const board = boardFrom(startFen, next);
                if (profile !== "review" && board.turn() !== orient && next.length) {
                  return next.slice(0, -1);
                }
                return next;
              });
              setSelected(null);
              saved.current = false;
              push("Takeback.");
            }}
          >
            Takeback
          </Button>
        </div>
        {save.data ? (
          <p className="text-xs text-primary">
            Archived.{" "}
            <Link to="/admin" className="underline">
              Read the recap
            </Link>
          </p>
        ) : null}
      </div>

      <aside className="flex w-full flex-col gap-4 lg:max-w-sm">
        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted">Engine mode</h2>
          <div className="mt-3 flex flex-wrap gap-1">
            {PROFILES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProfile(p.id)}
                className={cn(
                  "h-11 rounded-sm px-3 text-[11px] uppercase tracking-[0.12em]",
                  profile === p.id ? "bg-primary text-primary-fg" : "text-muted hover:text-fg",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {profile === "review"
              ? "Both sides are yours. Use this to walk a lesson."
              : profile === "cold"
                ? "Liorin is not teaching. The engine holds. A draw is not a loss."
                : "Liorin is teaching. The tutor names the idea. Ranked human matches stay locked."}
          </p>
        </section>
        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted">Move review</h2>
          <ol className="mt-3 flex max-h-72 flex-col gap-2 overflow-auto text-sm leading-relaxed text-fg">
            {log.map((line, i) => (
              <li key={`${i}-${line.slice(0, 16)}`} className={i === 0 ? "text-fg" : "text-muted"}>
                {line}
              </li>
            ))}
          </ol>
        </section>
        <p className="text-xs leading-relaxed text-muted">
          Finished games are kept for recaps and for the engine to learn.{" "}
          <Link to="/learn" className="text-primary">
            Lessons
          </Link>
          {" · "}
          <Link to="/ratings" className="text-primary">
            2700 Club
          </Link>
        </p>
      </aside>
    </div>
  );
}
