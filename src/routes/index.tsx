import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Radio, Swords, Target, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { AgentCard } from "@/components/agent-card";
import { AcademyCta } from "@/components/academy-cta";
import { ConquestStats } from "@/components/conquest-stats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AGENTS } from "@/lib/agents/roster";
import type { AgentId, AgentStatus, CommandSnapshot } from "@/lib/agents/types";
import { formatElo, bestBotRating } from "@/lib/conquest/format";
import { getCommandSnapshot, launchConquest } from "@/lib/conquest/server";

export const Route = createFileRoute("/")({ component: CommandPage });

function statusFor(id: AgentId, snap: CommandSnapshot | undefined, launching: boolean): AgentStatus {
  if (launching) return "running";
  if (!snap) return "idle";
  const last = snap.logs.find((l) => l.agentId === id);
  if (last?.level === "alert") return "alert";
  if (last?.level === "warn") return "blocked";
  if (snap.state.launchedAt) return "ready";
  return "idle";
}

function CommandPage() {
  const qc = useQueryClient();
  const snap = useQuery({
    queryKey: ["command"],
    queryFn: () => getCommandSnapshot(),
    refetchInterval: 60_000,
  });
  const [armed, setArmed] = useState(false);
  const launch = useMutation({
    mutationFn: () => launchConquest({ data: {} }),
    onSuccess: (data) => {
      qc.setQueryData(["command"], data);
      setArmed(true);
    },
  });

  const data = snap.data;
  const launching = launch.isPending;
  const hunt = data?.events.filter((e) => e.botsDesigned).slice(0, 5) ?? [];
  const bots = data?.onlineBots.slice(0, 8) ?? [];
  const lastLog = data?.logs[0];

  const mission = useMemo(
    () =>
      data?.source === "degraded"
        ? "Live probes degraded. Charter still holds. Retry launch."
        : "Mission: teach here, hold here. Enlist Liorin only on public boards that allow engines. Hunt tournaments designed for bots. Climb until number one. Never cheat a human pool.",
    [data?.source],
  );

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-xl border border-border bg-surface p-6 md:p-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Shall we play a game?</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-5xl">
          I am Liorin.
          <span className="block text-primary">The academy is home.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">{mission}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={() => launch.mutate()}
            disabled={launching}
            aria-busy={launching}
          >
            {launching ? "Launching team…" : armed || data?.state.launchedAt ? "Re-probe all boards" : "Launch conquest"}
          </Button>
          <Link to="/play">
            <Button variant="outline">Play cold</Button>
          </Link>
          <Link to="/learn">
            <Button variant="ghost">Lessons</Button>
          </Link>
        </div>
        {launch.isError ? (
          <p className="mt-3 text-sm text-danger">Launch failed. {launch.error.message}</p>
        ) : null}
        {lastLog ? (
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Last: {lastLog.agentId.toUpperCase()} — {lastLog.message}
          </p>
        ) : null}
      </section>

      {snap.isError ? (
        <p className="text-sm text-danger">Command snapshot failed. {snap.error.message}</p>
      ) : snap.isLoading && !data ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-md border border-border bg-surface" />
          ))}
        </div>
      ) : data ? (
        <ConquestStats snap={data} />
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-muted">
            <Radio className="size-4 text-primary" /> Agent team
          </h2>
          <Link to="/agents" className="text-xs uppercase tracking-[0.14em] text-primary">
            Dossiers
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a) => (
            <AgentCard
              key={a.id}
              id={a.id}
              status={statusFor(a.id, data, launching)}
              log={data?.logs.find((l) => l.agentId === a.id)}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-muted">
              <Target className="size-4 text-primary" /> Bot-designed events
            </h2>
            <Link to="/tournaments" className="text-xs uppercase tracking-[0.14em] text-primary">
              Full hunt
            </Link>
          </div>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {hunt.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="h-16 animate-pulse bg-surface" />
                ))
              : hunt.map((ev) => (
                  <li key={ev.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{ev.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted">{ev.note}</p>
                    </div>
                    <Badge>{ev.status}</Badge>
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs uppercase tracking-[0.14em] text-primary"
                    >
                      Open
                    </a>
                  </li>
                ))}
          </ul>
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-muted">
            <Swords className="size-4 text-primary" /> Live BOT field
          </h2>
          <ol className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {bots.length === 0
              ? Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="h-12 animate-pulse bg-surface" />
                ))
              : bots.map((b) => (
                  <li key={b.id}>
                    <Link
                      to="/engage"
                      search={{ opponent: b.username, rating: bestBotRating(b) }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-raised"
                    >
                      <span className="flex-1 truncate text-sm text-fg">{b.username}</span>
                      <Badge>BOT</Badge>
                      <span className="tabular text-sm text-primary">{formatElo(bestBotRating(b))}</span>
                    </Link>
                  </li>
                ))}
          </ol>
          {data?.tvBot ? (
            <a
              href={data.tvBot.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border-strong bg-raised p-4 hover:border-primary"
            >
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <Trophy className="size-4" /> Bot TV now
              </p>
              <p className="mt-1 text-xs text-muted">
                {data.tvBot.username} · {formatElo(data.tvBot.rating)} · dedicated BOT channel
              </p>
            </a>
          ) : (
            <Link to="/platforms" className="rounded-lg border border-border-strong bg-raised p-4">
              <p className="text-sm font-medium text-primary">Registration playbooks</p>
              <p className="mt-1 text-xs text-muted">Official signup only. Diplomat vetoes human pools.</p>
            </Link>
          )}
        </div>
      </section>

      <AcademyCta line="Command is the war room. The academy board is still the product. Play, then hold." />
    </div>
  );
}
