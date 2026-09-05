export function expectedScore(rating: number, opponent: number) {
  return 1 / (1 + 10 ** ((opponent - rating) / 400));
}

export function nextRating(
  rating: number,
  opponent: number,
  score: 0 | 0.5 | 1,
  k = 24,
) {
  const exp = expectedScore(rating, opponent);
  return Math.round(rating + k * (score - exp));
}

export function scoreOf(result: "win" | "draw" | "loss"): 0 | 0.5 | 1 {
  if (result === "win") return 1;
  if (result === "draw") return 0.5;
  return 0;
}
