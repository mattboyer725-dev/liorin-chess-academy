import type { CommandSnapshot } from "@/lib/agents/types";
import { formatElo } from "@/lib/conquest/format";
import { PLATFORMS } from "@/lib/platforms/catalog";

export function ConquestStats({ snap }: { snap: CommandSnapshot }) {
  const enlisted = snap.handles.filter((h) => h.status === "enlisted").length;
  const open = PLATFORMS.filter((p) => p.diplomat === "enlist" || p.diplomat === "apply").length;
  const lichess = snap.ranks.find((r) => r.platformId === "lichess");
  const items = [
    { label: "Conquest Elo", value: formatElo(snap.state.rating) },
    { label: "Gauntlet W-D-L", value: `${snap.state.wins}-${snap.state.draws}-${snap.state.losses}` },
    { label: "BOTs online", value: String(snap.onlineBots.length) },
    { label: "Enlisted / open", value: `${enlisted}/${open}` },
    { label: "Lichess handle", value: lichess?.liorinHandle ?? "—" },
    { label: "BOT title", value: lichess?.liorinTitle ?? "none" },
    { label: "Live blitz", value: formatElo(lichess?.liorinRating) },
    { label: "Gap to open #1", value: lichess?.gap != null ? formatElo(lichess.gap) : "—" },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-md border border-border bg-bg px-3 py-3">
          <dt className="text-[10px] uppercase tracking-[0.16em] text-muted">{it.label}</dt>
          <dd className="mt-1 truncate tabular text-lg text-primary">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
