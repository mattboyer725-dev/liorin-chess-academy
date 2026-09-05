export function formatElo(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return String(Math.round(n));
}

export function formatWhen(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function bestBotRating(bot: { bullet: number | null; blitz: number | null; rapid: number | null }) {
  return bot.blitz ?? bot.bullet ?? bot.rapid ?? 1500;
}
