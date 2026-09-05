import { Link } from "@tanstack/react-router";

export function AcademyCta({ line }: { line?: string }) {
  return (
    <aside className="rounded-lg border border-border-strong bg-raised p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted">LIORIN Chess Academy</p>
      <p className="mt-2 text-sm leading-relaxed text-fg">
        {line ?? "The board is always open. Lessons when you want them. Cold when you do not."}
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        <Link to="/play" className="text-xs uppercase tracking-[0.14em] text-primary">
          Play
        </Link>
        <Link to="/learn" className="text-xs uppercase tracking-[0.14em] text-primary">
          Learn
        </Link>
        <Link to="/ratings" className="text-xs uppercase tracking-[0.14em] text-primary">
          2700 Club
        </Link>
        <Link to="/admin" className="text-xs uppercase tracking-[0.14em] text-primary">
          Recaps
        </Link>
      </div>
    </aside>
  );
}
