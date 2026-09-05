import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AcademyCta } from "@/components/academy-cta";
import { getLiveEvents } from "@/lib/fide/server";
import type { BroadcastCard } from "@/lib/fide/types";

export const Route = createFileRoute("/events")({ component: EventsPage });

function EventsPage() {
  const events = useQuery({ queryKey: ["events"], queryFn: () => getLiveEvents() });

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Broadcasts</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Live events</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Elite games as they are played, relayed from Lichess broadcasts. Open a round to follow
          the boards, look the players up in the 2700 Club, then play the same idea on the academy
          board.
        </p>
      </header>

      {events.isError ? (
        <p className="text-sm text-danger">Could not load broadcasts. {events.error.message}</p>
      ) : events.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm uppercase tracking-[0.16em] text-muted">On now</h2>
            <Grid items={events.data?.active ?? []} empty="No live broadcast flagged right now." />
          </section>
          <section>
            <h2 className="mb-3 text-sm uppercase tracking-[0.16em] text-muted">Upcoming</h2>
            <Grid items={events.data?.upcoming ?? []} empty="Nothing queued." />
          </section>
        </>
      )}
      <AcademyCta line="Watch the elite boards. Then come home and play the idea against Liorin." />
    </div>
  );
}

function Grid({ items, empty }: { items: BroadcastCard[]; empty: string }) {
  if (!items.length) {
    return <p className="rounded-lg border border-border bg-surface px-4 py-8 text-sm text-muted">{empty}</p>;
  }
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {items.map((ev) => (
        <li key={ev.id}>
          <a
            href={ev.roundUrl ?? ev.url}
            target="_blank"
            rel="noreferrer"
            className="flex h-full flex-col rounded-lg border border-border bg-surface p-4 hover:border-primary"
          >
            <p className="text-sm font-medium text-fg">{ev.name}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {ev.roundName ?? ev.format ?? "Round not posted"}
              {ev.timeControl ? ` · ${ev.timeControl}` : ""}
              {ev.location ? ` · ${ev.location}` : ""}
            </p>
          </a>
        </li>
      ))}
    </ul>
  );
}
