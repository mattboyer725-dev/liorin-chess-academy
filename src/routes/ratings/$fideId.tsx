import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { RatingChart } from "@/components/rating-chart";
import { AcademyCta } from "@/components/academy-cta";
import { Badge } from "@/components/ui/badge";
import {
  displayName,
  federationLabel,
  formatDelta,
  formatRating,
} from "@/lib/fide/format";
import { getPlayerDossier } from "@/lib/fide/server";
import type { TimeControl } from "@/lib/fide/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ratings/$fideId")({
  component: DossierPage,
});

function DossierPage() {
  const { fideId } = Route.useParams();
  const id = Number(fideId);
  const [control, setControl] = useState<TimeControl>("standard");
  const dossier = useQuery({
    queryKey: ["dossier", id],
    queryFn: () => getPlayerDossier({ data: { id } }),
    enabled: Number.isFinite(id),
  });

  if (!Number.isFinite(id)) {
    return <p className="text-sm text-danger">Invalid FIDE id.</p>;
  }
  if (dossier.isLoading) {
    return <div className="h-96 animate-pulse rounded-xl border border-border bg-surface" />;
  }
  if (dossier.isError || !dossier.data) {
    return (
      <p className="text-sm text-danger">
        Player not found. {dossier.error instanceof Error ? dossier.error.message : ""}
      </p>
    );
  }

  const { player, history, peak, delta12m, lastChange } = dossier.data;
  const points = history[control];

  return (
    <div className="flex flex-col gap-6">
      <Link to="/ratings" className="text-[11px] uppercase tracking-[0.16em] text-muted hover:text-primary">
        Back to 2700 Club
      </Link>
      <header className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6 md:flex-row md:items-center">
        {player.photo?.medium ? (
          <img
            src={player.photo.medium}
            alt=""
            className="h-32 w-32 rounded-md border border-border object-cover"
          />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-md border border-border bg-raised text-2xl text-primary">
            {displayName(player.name).slice(0, 2)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
            FIDE {player.id} · {player.title ?? "untitled"}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{displayName(player.name)}</h1>
          <p className="mt-2 text-sm text-muted">
            {federationLabel(player.federation)}
            {player.age ? ` · age ${player.age}` : ""}
            {player.inactive ? " · inactive" : ""}
            {player.club ? " · 2700 club" : ""}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="text-primary">Classical {formatRating(player.standard)}</Badge>
            <Badge>Rapid {formatRating(player.rapid)}</Badge>
            <Badge>Blitz {formatRating(player.blitz)}</Badge>
          </div>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Last list" value={formatDelta(lastChange[control])} up={lastChange[control]} />
        <Stat label="12-month" value={formatDelta(delta12m[control])} up={delta12m[control]} />
        <Stat label="Peak" value={formatRating(peak[control])} />
        <Stat
          label="Gap to 2700"
          value={
            player.standard == null
              ? "—"
              : player.standard >= 2700
                ? "Inside"
                : String(2700 - player.standard)
          }
        />
      </dl>

      <div className="flex flex-wrap gap-1">
        {(["standard", "rapid", "blitz"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setControl(c)}
            className={cn(
              "h-11 rounded-sm px-4 text-[11px] uppercase tracking-[0.14em]",
              control === c ? "bg-primary text-primary-fg" : "text-muted hover:text-fg",
            )}
          >
            {c === "standard" ? "Classical" : c}
          </button>
        ))}
      </div>
      <RatingChart points={points} />

      <p className="text-xs leading-relaxed text-muted">
        Curve is the official FIDE list, not a live game-by-game estimate. For that tracker see{" "}
        <a
          className="text-fg underline decoration-border-strong underline-offset-4 hover:text-primary"
          href={`https://2700chess.com/players/${player.id}`}
          target="_blank"
          rel="noreferrer"
        >
          2700chess.com/players/{player.id}
        </a>
        . Photo credit: {player.photo?.credit ?? "FIDE / Lichess"}.
      </p>
      <AcademyCta line="Study the curve. Then sit with Liorin and play the structure, not the celebrity." />
    </div>
  );
}

function Stat({
  label,
  value,
  up,
}: {
  label: string;
  value: string;
  up?: number | null;
}) {
  const tone =
    up == null || up === 0 ? "text-fg" : up > 0 ? "text-primary" : "text-danger";
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-3">
      <dt className="text-[10px] uppercase tracking-[0.16em] text-muted">{label}</dt>
      <dd className={`mt-1 tabular text-lg ${tone}`}>{value}</dd>
    </div>
  );
}
