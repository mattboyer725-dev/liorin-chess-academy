import type { PieceSymbol } from "chess.js";

const PATHS: Record<PieceSymbol, string> = {
  k: "M50 10 L56 22 H66 L58 30 L62 44 H38 L42 30 L34 22 H44 Z M38 48 H62 L66 86 H34 Z M28 86 H72 V92 H28 Z",
  q: "M28 18 L34 44 L50 28 L66 44 L72 18 L78 44 H22 Z M36 48 H64 L68 86 H32 Z M26 86 H74 V92 H26 Z",
  r: "M30 16 H42 V28 H58 V16 H70 V40 H30 Z M34 44 H66 L70 86 H30 Z M24 86 H76 V92 H24 Z",
  b: "M50 12 L62 36 C62 52 42 52 42 36 Z M46 52 H54 L58 86 H42 Z M30 86 H70 V92 H30 Z",
  n: "M30 86 H70 V92 H30 Z M38 80 L34 56 C28 44 36 30 48 22 C62 14 72 28 68 42 L62 52 L72 62 L64 80 Z",
  p: "M50 22 A12 12 0 1 1 49.9 22 Z M44 44 H56 L60 78 H40 Z M32 78 H68 V86 H32 Z",
};

export function PieceGlyph({
  piece,
  color,
  className,
}: {
  piece: PieceSymbol;
  color: "w" | "b";
  className?: string;
}) {
  const fill = color === "w" ? "var(--color-piece-w)" : "var(--color-piece-b)";
  const stroke = color === "w" ? "var(--color-bg)" : "var(--color-primary)";
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path
        d={PATHS[piece]}
        fill={fill}
        stroke={stroke}
        strokeWidth={color === "b" ? 4 : 3}
        strokeLinejoin="round"
      />
    </svg>
  );
}
