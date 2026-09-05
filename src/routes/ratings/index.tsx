import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { RatingsTable } from "@/components/ratings-table";
import { AcademyCta } from "@/components/academy-cta";
import { Button } from "@/components/ui/button";
import { displayName, formatRating } from "@/lib/fide/format";
import { getLiveRegister, getOnlineRegister, searchFidePlayers } from "@/lib/fide/server";
import type { RegisterList, TimeControl } from "@/lib/fide/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ratings/")({ component: RatingsPage });

const TABS: { id: RegisterList; label: string }[] = [
  { id: "classical", label: "Classical" },
  { id: "rapid", label: "Rapid" },
  { id: "blitz", label: "Blitz" },
  { id: "women", label: "Women" },
  { id: "online", label: "Online" },
];

function controlFor(list: RegisterList): TimeControl {
  if (list === "rapid") return "rapid";
  if (list === "blitz") return "blitz";
  return "standard";
}

function RatingsPage() {
  const [list, setList] = useState<RegisterList>("classical");
  const [q, setQ] = useState("");
  const register = useQuery({
    queryKey: ["register"],
    queryFn: () => getLiveRegister(),
    refetchInterval: (q) => (q.state.data?.source === "seed" ? 4000 : false),
  });
  const online = useQuery({
    queryKey: ["online"],
    queryFn: () => getOnlineRegister(),
    enabled: list === "online",
  });
  const search = useQuery({
    queryKey: ["fide-search", q],
    queryFn: () => searchFidePlayers({ data: { q } }),
    enabled: q.trim().length >= 2,
  });

  const control = controlFor(list);
  const rows = useMemo(() => {
    const players = register.data?.players ?? [];
    const filtered = list === "women" ? players.filter((p) => p.gender === "F") : players;
    return [...filtered].sort((a, b) => (b[control] ?? 0) - (a[control] ?? 0));
  }, [register.data, list, control]);

  const onlineRows = list === "online" ? (online.data?.blitz ?? []) : [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Live register</p>
        <h1 className="text-3xl font-semibold tracking-tight">2700 Club</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Published FIDE ratings for the elite ladder, pulled live through the Lichess FIDE API.
          This is the 2700chess.com idea — a single board for the super-GM club — rebuilt inside
          LIORIN Chess Academy. See a shape at the top, then play it here.
        </p>
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
          {register.data
            ? `${register.data.clubCount} players at 2700+ · source ${register.data.source} · ${new Date(register.data.fetchedAt).toUTCString()}`
            : "Awaiting register"}
        </p>
      </header>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <label className="relative flex-1">
          <span className="sr-only">Search any FIDE player</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search any FIDE name"
            className="h-11 w-full rounded-sm border border-border bg-surface pl-10 pr-3 text-sm text-fg placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </label>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {q.trim().length >= 2 ? (
        <div className="rounded-lg border border-border">
          <p className="border-b border-border px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-muted">
            Search results
          </p>
          {search.isLoading ? (
            <p className="px-4 py-6 text-sm text-muted">Scanning FIDE…</p>
          ) : (search.data ?? []).length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted">No players matched.</p>
          ) : (
            <ul>
              {(search.data ?? []).map((p) => (
                <li key={p.id} className="border-t border-border first:border-t-0">
                  <Link
                    to="/ratings/$fideId"
                    params={{ fideId: String(p.id) }}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface"
                  >
                    <span>
                      <span className="font-medium">{displayName(p.name)}</span>
                      <span className="ml-2 text-xs text-muted">
                        {p.title ?? ""} {p.federation}
                      </span>
                    </span>
                    <span className="tabular text-primary">{formatRating(p.standard)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Rating lists">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={list === tab.id}
            onClick={() => setList(tab.id)}
            className={cn(
              "h-11 rounded-sm px-4 text-[11px] uppercase tracking-[0.14em]",
              list === tab.id ? "bg-primary text-primary-fg" : "text-muted hover:text-fg",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {list === "online" ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-surface text-[10px] uppercase tracking-[0.16em] text-muted">
              <tr>
                <th className="px-3 py-3 font-medium">#</th>
                <th className="px-3 py-3 font-medium">Username</th>
                <th className="px-3 py-3 font-medium">Title</th>
                <th className="px-3 py-3 font-medium">Fed</th>
                <th className="px-3 py-3 font-medium">Blitz</th>
              </tr>
            </thead>
            <tbody>
              {online.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-sm text-muted">
                    Loading Chess.com boards…
                  </td>
                </tr>
              ) : (
                onlineRows.map((row) => (
                  <tr key={row.username} className="border-t border-border">
                    <td className="tabular px-3 py-2.5 text-muted">{row.rank}</td>
                    <td className="px-3 py-2.5 font-medium">{row.username}</td>
                    <td className="px-3 py-2.5 text-muted">{row.title ?? "—"}</td>
                    <td className="px-3 py-2.5 text-muted">{row.country ?? "—"}</td>
                    <td className="tabular px-3 py-2.5 text-primary">{row.rating}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <p className="border-t border-border px-3 py-2 text-[11px] text-muted">
            Chess.com public leaderboards. Online ratings are not FIDE.
          </p>
        </div>
      ) : register.isError ? (
        <p className="rounded-lg border border-danger/40 bg-surface px-4 py-6 text-sm text-danger">
          Register unavailable. {register.error.message}
        </p>
      ) : register.isLoading ? (
        <p className="rounded-lg border border-border bg-surface px-4 py-10 text-sm text-muted">
          Scanning FIDE register…
        </p>
      ) : (
        <RatingsTable rows={rows} control={control} />
      )}
      <AcademyCta line="The 2700 Club is a window. The academy board is where the same ideas get played." />
    </div>
  );
}
