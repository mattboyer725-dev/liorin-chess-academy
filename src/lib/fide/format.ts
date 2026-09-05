import { CLUB_GATE, FEDERATION_NAME } from "./roster";
import type { FidePlayer, RatingPoint, RegisterRow, TimeControl } from "./types";

export function federationLabel(code: string | null | undefined) {
  if (!code) return "—";
  return FEDERATION_NAME[code] ?? code;
}

export function ageFromYear(year: number | null | undefined, now = new Date()) {
  if (!year || year < 1900 || year > now.getFullYear()) return null;
  return now.getFullYear() - year;
}

export function toRow(player: FidePlayer, now = new Date()): RegisterRow {
  return {
    ...player,
    age: ageFromYear(player.year, now),
    club: (player.standard ?? 0) >= CLUB_GATE,
  };
}

export function ratingOf(row: RegisterRow, control: TimeControl) {
  return row[control];
}

export function formatRating(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(0);
}

export function formatDelta(n: number | null | undefined) {
  if (n == null || Number.isNaN(n) || n === 0) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(0)}`;
}

export function displayName(name: string) {
  return name;
}

export function surname(name: string) {
  return name.split(",")[0]?.trim() ?? name;
}

export function parseHistory(raw: number[] | undefined): RatingPoint[] {
  if (!raw?.length) return [];
  const points: RatingPoint[] = [];
  for (const packed of raw) {
    const s = String(packed);
    if (s.length < 7) continue;
    const year = Number(s.slice(0, 4));
    const month = Number(s.slice(4, 6));
    const rating = Number(s.slice(6));
    if (!year || !month || !rating) continue;
    points.push({
      period: `${year}-${String(month).padStart(2, "0")}`,
      year,
      month,
      rating,
    });
  }
  return points;
}

export function deltaFrom(points: RatingPoint[], monthsBack: number) {
  if (points.length < 2) return null;
  const latest = points[points.length - 1];
  if (!latest) return null;
  const targetMonth = latest.year * 12 + latest.month - monthsBack;
  let best: RatingPoint | null = null;
  for (const p of points) {
    const m = p.year * 12 + p.month;
    if (m <= targetMonth) best = p;
  }
  if (!best) return null;
  return latest.rating - best.rating;
}

export function lastStep(points: RatingPoint[]) {
  if (points.length < 2) return null;
  const a = points[points.length - 2];
  const b = points[points.length - 1];
  if (!a || !b) return null;
  return b.rating - a.rating;
}

export function peakOf(points: RatingPoint[]) {
  if (!points.length) return null;
  return Math.max(...points.map((p) => p.rating));
}
