import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AcademyCta } from "@/components/academy-cta";
import { Button } from "@/components/ui/button";
import type { HuntEvent } from "@/lib/agents/types";
import { briefHuntEvent } from "@/lib/conquest/brief";
import { bestBotRating, formatElo } from "@/lib/conquest/format";
import { getCommandSnapshot, issueBotChallenge, watchEvent } from "@/lib/conquest/server";

export const Route = createFileRoute("/tournaments")({ component: HuntPage });

const TOKEN_KEY = "liorin.lichess.token";

function HuntPage() {
  const qc = useQueryClient();
  const snap = useQuery({
    queryKey: ["command"],
    queryFn: () => getCommandSnapshot(),
    refetchInterval: 45_000,
  });
  const [brief, setBrief] = useState<Record<string, string>>({});
  const [challengeMsg, setChallengeMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<"events" | "field">("events");

  const briefMut = useMutation({
    mutationFn: (ev: HuntEvent) =>
      briefHuntEvent({
        data: { title: ev.title, url: ev.url, note: ev.note, botsDesigned: ev.botsDesigned },
      }),
    onSuccess: (res, ev) => {
      if (res.ok) setBrief((b) => ({ ...b, [ev.id]: res.text }));
      else setBrief((b) => ({ ...b, [ev.id]: res.error }));
    },
  });
  const watch = useMutation({
    mutationFn: (ev: HuntEvent) =>
      watchEvent({
        data: { source: ev.source, eventId: ev.id, title: ev.title, url: ev.url, note: ev.note },
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["command"] }),
  });
  const challenge = useMutation({
    mutationFn: async (username: string) => {
      const token = sessionStorage.getItem(TOKEN_KEY) ?? "";
      if (!token) throw new Error("Bind a Lichess BOT token on Platforms first.");
      return issueBotChallenge({ data: { token, username } });
    },
    onSuccess: (res) => {
      if (res.ok) setChallengeMsg(`Challenge live: ${res.url}`);
      else setChallengeMsg(res.error);
    },
    onError: (e) => setChallengeMsg(e.message),
  });

  const events = snap.data?.events ?? [];
  const bots = snap.data?.onlineBots ?? [];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Hunter · NET</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Bot hunt</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Live Lichess BOT field, Bot TV, the Lichess Bots team, and standing engine championships.
          Hunter ignores human prize pools. Confirm BOT eligibility before Liorin joins.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={filter === "events" ? "primary" : "outline"} onClick={() => setFilter("events")}>
          Events
        </Button>
        <Button size="sm" variant={filter === "field" ? "primary" : "outline"} onClick={() => setFilter("field")}>
          Online BOTs
        </Button>
      </div>

      {challengeMsg ? <p className="text-sm text-primary">{challengeMsg}</p> : null}
      {snap.isError ? <p className="text-sm text-danger">{snap.error.message}</p> : null}

      {filter === "events" ? (
        <ul className="flex flex-col gap-3">
          {snap.isLoading && events.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="h-28 animate-pulse rounded-lg border border-border bg-surface" />
              ))
            : events.map((ev) => (
                <li key={ev.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-fg">{ev.title}</h2>
                      <p className="mt-1 text-xs leading-relaxed text-muted">{ev.note}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{ev.status}</Badge>
                      {ev.botsDesigned ? <Badge className="text-primary">Bots</Badge> : <Badge>Watch</Badge>}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={ev.url} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline">
                        Official page
                      </Button>
                    </a>
                    <Button size="sm" variant="ghost" onClick={() => watch.mutate(ev)} disabled={watch.isPending}>
                      Watch
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => briefMut.mutate(ev)}
                      disabled={briefMut.isPending}
                    >
                      Diplomat brief
                    </Button>
                  </div>
                  {brief[ev.id] ? (
                    <p className="mt-3 text-xs leading-relaxed text-fg/90">{brief[ev.id]}</p>
                  ) : null}
                </li>
              ))}
        </ul>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {bots.map((b) => (
            <li key={b.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{b.username}</p>
                <p className="text-xs text-muted">
                  bullet {formatElo(b.bullet)} · blitz {formatElo(b.blitz)} · rapid {formatElo(b.rapid)}
                  {b.playing ? " · in game" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/engage" search={{ opponent: b.username, rating: bestBotRating(b) }}>
                  <Button size="sm">Gauntlet</Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => challenge.mutate(b.username)}
                  disabled={challenge.isPending}
                >
                  Challenge
                </Button>
                <a href={`https://lichess.org/@/${b.username}`} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="ghost">
                    Lichess
                  </Button>
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
      <AcademyCta line="Hunt is for engines. Humans train on the academy board. The recap desk keeps the score." />
    </div>
  );
}
