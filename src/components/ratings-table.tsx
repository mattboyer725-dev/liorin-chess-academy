import { Link } from "@tanstack/react-router";
import { displayName, federationLabel, formatRating } from "@/lib/fide/format";
import { CLUB_GATE } from "@/lib/fide/roster";
import type { RegisterRow, TimeControl } from "@/lib/fide/types";
import { cn } from "@/lib/utils";

export function RatingsTable({
  rows,
  control,
}: {
  rows: RegisterRow[];
  control: TimeControl;
}) {
  let gateDrawn = false;
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead className="bg-surface text-[10px] uppercase tracking-[0.16em] text-muted">
          <tr>
            <th className="px-3 py-3 font-medium">#</th>
            <th className="px-3 py-3 font-medium">Name</th>
            <th className="px-3 py-3 font-medium">Fed</th>
            <th className="px-3 py-3 font-medium">Title</th>
            <th className="px-3 py-3 font-medium">Classical</th>
            <th className="px-3 py-3 font-medium">Rapid</th>
            <th className="px-3 py-3 font-medium">Blitz</th>
            <th className="px-3 py-3 font-medium">Age</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const rating = row[control] ?? 0;
            const showGate = !gateDrawn && control === "standard" && rating < CLUB_GATE;
            if (showGate) gateDrawn = true;
            return (
              <RowBlock
                key={row.id}
                row={row}
                rank={i + 1}
                showGate={showGate}
                highlight={control}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RowBlock({
  row,
  rank,
  showGate,
  highlight,
}: {
  row: RegisterRow;
  rank: number;
  showGate: boolean;
  highlight: TimeControl;
}) {
  return (
    <>
      {showGate ? (
        <tr>
          <td colSpan={8} className="bg-raised px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-primary">
            2700 gate — club threshold
          </td>
        </tr>
      ) : null}
      <tr className="border-t border-border hover:bg-surface">
        <td className="tabular px-3 py-2.5 text-muted">{rank}</td>
        <td className="px-3 py-2.5">
          <Link
            to="/ratings/$fideId"
            params={{ fideId: String(row.id) }}
            className="font-medium text-fg hover:text-primary"
          >
            {displayName(row.name)}
          </Link>
        </td>
        <td className="px-3 py-2.5 text-muted" title={federationLabel(row.federation)}>
          {row.federation || "—"}
        </td>
        <td className="px-3 py-2.5 text-muted">{row.title ?? "—"}</td>
        <Cell value={row.standard} active={highlight === "standard"} club={row.club} />
        <Cell value={row.rapid} active={highlight === "rapid"} />
        <Cell value={row.blitz} active={highlight === "blitz"} />
        <td className="tabular px-3 py-2.5 text-muted">{row.age ?? "—"}</td>
      </tr>
    </>
  );
}

function Cell({
  value,
  active,
  club,
}: {
  value: number | null;
  active?: boolean;
  club?: boolean;
}) {
  return (
    <td
      className={cn(
        "tabular px-3 py-2.5",
        active ? "text-primary" : "text-fg",
        club && active && "font-semibold",
      )}
    >
      {formatRating(value)}
    </td>
  );
}
