import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AcademyCta } from "@/components/academy-cta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatWhen } from "@/lib/conquest/format";
import { composeLoveLetter, getAcademySummary } from "@/lib/games/server";
import type { AcademyGame } from "@/lib/games/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function resultLabel(g: AcademyGame) {
  if (g.result === "win") return "Liorin held";
  if (g.result === "draw") return "Shared point";
  return g.mode === "cold" ? "Rare crack" : "Student found it";
}

function AdminPage() {
  const qc = useQueryClient();
  const summary = useQuery({
    queryKey: ["archive"],
    queryFn: () => getAcademySummary(),
  });
  const letter = useMutation({
    mutationFn: () => composeLoveLetter({ data: {} }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["archive"] });
    },
  });

  const data = summary.data;
  const games = data?.recent ?? [];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Admin · archive</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Love recaps</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Every finished game on the academy board is kept. The desk writes it cold — no pitch, no
          noise — then points the reader back to the board, the lessons, and the 2700 Club.
        </p>
      </header>

      {summary.isError ? (
        <p className="text-sm text-danger">Archive failed. {summary.error.message}</p>
      ) : !data ? (
        <div className="h-48 animate-pulse rounded-xl border border-border bg-surface" />
      ) : (
        <>
          <section className="rounded-xl border border-border bg-surface p-6 md:p-8">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
              {data.letter.source === "grok" ? "Composed" : "From the archive"}
              {data.letter.at ? ` · ${formatWhen(data.letter.at)}` : ""}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-primary">
              {data.letter.title}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-fg">{data.letter.body}</p>
            <p className="mt-4 text-sm text-muted">{data.letter.cta}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => letter.mutate()} disabled={letter.isPending}>
                {letter.isPending ? "Composing…" : "Compose this week's letter"}
              </Button>
              <Link to="/play">
                <Button variant="outline">Open the board</Button>
              </Link>
              <Link to="/ops">
                <Button variant="ghost">Studio · KEEPER</Button>
              </Link>
            </div>
            {letter.isError ? (
              <p className="mt-3 text-sm text-danger">{letter.error.message}</p>
            ) : null}
          </section>

          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Games kept", value: String(data.games) },
              { label: "Liorin W-D-L", value: `${data.wins}–${data.draws}–${data.losses}` },
              { label: "Cold games", value: String(data.coldGames) },
              { label: "Teaching games", value: String(data.teachGames) },
            ].map((it) => (
              <div key={it.label} className="rounded-md border border-border bg-bg px-3 py-3">
                <dt className="text-[10px] uppercase tracking-[0.16em] text-muted">{it.label}</dt>
                <dd className="mt-1 tabular text-lg text-primary">{it.value}</dd>
              </div>
            ))}
          </dl>

          <section>
            <h2 className="mb-3 text-sm uppercase tracking-[0.16em] text-muted">Game recaps</h2>
            {games.length === 0 ? (
              <div className="rounded-lg border border-border bg-surface p-6">
                <p className="text-sm text-muted">
                  The archive is empty. Play a game on the academy board. Cold or teach — the recap
                  desk writes after the last move.
                </p>
                <Link to="/play" className="mt-3 inline-flex text-xs uppercase tracking-[0.14em] text-primary">
                  Play Liorin
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {games.map((g) => (
                  <li key={g.id} className="rounded-lg border border-border bg-surface p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{g.mode}</Badge>
                      <span
                        className={cn(
                          "text-[11px] uppercase tracking-[0.14em]",
                          g.result === "loss" ? "text-warn" : "text-primary",
                        )}
                      >
                        {resultLabel(g)}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
                        {formatWhen(g.at)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-fg">
                      {g.opening ?? "Academy game"} · {Math.max(1, Math.round(g.ply / 2))} moves
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {g.recap ?? g.loveLine ?? "Recap pending. Run Update all in Studio."}
                    </p>
                    <p className="mt-2 text-xs text-primary">{g.loveLine}</p>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-[11px] uppercase tracking-[0.14em] text-muted">
                        PGN
                      </summary>
                      <pre className="mt-2 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-muted">
                        {g.pgn}
                      </pre>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <AcademyCta line="Marketing copy lives here so it never has to live anywhere else. The academy is the destination." />
    </div>
  );
}
