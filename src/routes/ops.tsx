import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AGENTS } from "@/lib/agents/roster";
import { AcademyCta } from "@/components/academy-cta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCommandSnapshot } from "@/lib/conquest/server";
import { formatWhen } from "@/lib/conquest/format";
import { getOpsHealth, runMaintenance } from "@/lib/ops/server";

export const Route = createFileRoute("/ops")({ component: OpsPage });

function OpsPage() {
  const qc = useQueryClient();
  const health = useQuery({
    queryKey: ["ops-health"],
    queryFn: () => getOpsHealth(),
    refetchInterval: 60_000,
  });
  const snap = useQuery({
    queryKey: ["command"],
    queryFn: () => getCommandSnapshot(),
  });
  const update = useMutation({
    mutationFn: () => runMaintenance({ data: {} }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ops-health"] });
      void qc.invalidateQueries({ queryKey: ["command"] });
      void qc.invalidateQueries({ queryKey: ["archive"] });
      void qc.invalidateQueries({ queryKey: ["register"] });
    },
  });

  const keeper = AGENTS.find((a) => a.id === "steward");
  const data = health.data;
  const logs = (snap.data?.logs ?? []).filter((l) => l.agentId === "steward").slice(0, 8);
  const report = update.data;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
          {keeper?.designation} · {keeper?.callsign}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Studio</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          {keeper?.brief} Update all refreshes the 2700 Club, the hunt field, and missing recaps.
          Nothing here leaves the academy.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-surface p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium text-fg">Project manager</h2>
            <p className="mt-1 text-sm text-muted">One action. The rest of the platform follows.</p>
          </div>
          <Button onClick={() => update.mutate()} disabled={update.isPending} aria-busy={update.isPending}>
            {update.isPending ? "Updating…" : "Update all"}
          </Button>
        </div>
        {update.isError ? (
          <p className="mt-3 text-sm text-danger">{update.error.message}</p>
        ) : null}
        {report ? (
          <ul className="mt-4 flex flex-col gap-1 text-sm leading-relaxed text-fg">
            {report.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        ) : null}
      </section>

      {health.isError ? (
        <p className="text-sm text-danger">Health check failed. {health.error.message}</p>
      ) : !data ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-md border border-border bg-surface" />
          ))}
        </div>
      ) : (
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Database", value: data.db },
            { label: "FIDE source", value: data.fideSource },
            { label: "2700 club", value: String(data.clubCount) },
            { label: "BOTs online", value: String(data.botsOnline) },
            { label: "Games archived", value: String(data.games) },
            { label: "Liorin W-D-L", value: `${data.wins}–${data.draws}–${data.losses}` },
            { label: "Recaps pending", value: String(data.pendingRecaps) },
            { label: "Conquest", value: data.launched ? "launched" : "idle" },
          ].map((it) => (
            <div key={it.label} className="rounded-md border border-border bg-bg px-3 py-3">
              <dt className="text-[10px] uppercase tracking-[0.16em] text-muted">{it.label}</dt>
              <dd className="mt-1 truncate tabular text-lg text-primary">{it.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-[0.16em] text-muted">KEEPER log</h2>
          <Link to="/agents" hash="steward" className="text-xs uppercase tracking-[0.14em] text-primary">
            All agents
          </Link>
        </div>
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {logs.length === 0 ? (
            <li className="px-4 py-4 text-sm text-muted">No steward lines yet. Run Update all.</li>
          ) : (
            logs.map((l) => (
              <li key={l.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:justify-between">
                <span className="text-sm leading-relaxed text-fg">{l.message}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-muted">
                  {formatWhen(l.at)}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-[0.16em] text-muted">Maintenance map</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {[
            { to: "/admin" as const, title: "Recaps", note: "Love letters and PGN archive." },
            { to: "/play" as const, title: "Board", note: "Teach, or sit cold. Games save themselves." },
            { to: "/ratings" as const, title: "2700 Club", note: "Live FIDE ladder. Refresh with Update all." },
            { to: "/tournaments" as const, title: "Hunt", note: "Bot-designed events only." },
            { to: "/platforms" as const, title: "Platforms", note: "Official enlistment playbooks." },
            { to: "/learn" as const, title: "Lessons", note: "One idea each. Then the cold engine." },
          ].map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex h-full flex-col rounded-lg border border-border bg-surface p-4 hover:border-primary"
              >
                <span className="text-sm font-medium text-primary">{item.title}</span>
                <span className="mt-1 text-xs leading-relaxed text-muted">{item.note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {data?.lastLog ? (
        <p className="text-xs text-muted">
          Last: {data.lastLog.agentId.toUpperCase()} — {data.lastLog.message}{" "}
          <Badge>{data.lastLog.level}</Badge>
        </p>
      ) : null}

      <AcademyCta line="KEEPER does not send you away. Every refresh lands back on this academy." />
    </div>
  );
}
