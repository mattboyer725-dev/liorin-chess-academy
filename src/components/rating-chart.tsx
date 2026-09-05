import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RatingPoint } from "@/lib/fide/types";

export function RatingChart({ points }: { points: RatingPoint[] }) {
  if (points.length < 2) {
    return (
      <p className="border border-border bg-surface px-4 py-8 text-sm text-muted">
        Not enough published lists to draw a curve.
      </p>
    );
  }
  const data = points.slice(-48).map((p) => ({ period: p.period, rating: p.rating }));
  return (
    <div className="h-64 w-full rounded-lg border border-border bg-surface p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="period"
            tick={{ fill: "var(--color-muted)", fontSize: 10, fontFamily: "IBM Plex Mono" }}
            interval="preserveStartEnd"
            minTickGap={28}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
          />
          <YAxis
            domain={["dataMin - 20", "dataMax + 20"]}
            tick={{ fill: "var(--color-muted)", fontSize: 10, fontFamily: "IBM Plex Mono" }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
            width={44}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border-strong)",
              borderRadius: 8,
              fontFamily: "IBM Plex Mono",
              fontSize: 12,
              color: "var(--color-fg)",
            }}
          />
          <Line
            type="monotone"
            dataKey="rating"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
