import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Command" },
  { to: "/play", label: "Play" },
  { to: "/learn", label: "Learn" },
  { to: "/ratings", label: "2700" },
  { to: "/tournaments", label: "Hunt" },
  { to: "/agents", label: "Agents" },
  { to: "/admin", label: "Recaps" },
  { to: "/ops", label: "Studio" },
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="crt-frame min-h-dvh bg-bg text-fg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-fg"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.28em] text-muted">
              LIORIN Chess Academy // v4.0
            </p>
            <p className="truncate text-sm font-semibold tracking-[0.12em] text-primary">
              Teach. Then hold.
            </p>
          </Link>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-sm border border-border text-fg md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
            {NAV.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "inline-flex h-11 items-center px-2.5 text-[11px] uppercase tracking-[0.14em]",
                    active ? "text-primary" : "text-muted hover:text-fg",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        {open ? (
          <nav className="border-t border-border px-4 py-2 md:hidden" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex h-11 items-center text-sm uppercase tracking-[0.14em] text-fg"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
        <nav
          className="hidden border-t border-border px-4 py-1 md:flex lg:hidden"
          aria-label="Tablet"
        >
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="inline-flex h-11 items-center px-2 text-[11px] uppercase tracking-[0.12em] text-muted hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 md:py-8">
        {children}
      </main>
      <footer className="border-t border-border px-4 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-[11px] uppercase tracking-[0.14em] text-muted">
          <p className="text-fg">LIORIN Chess Academy — the board is always open.</p>
          <p className="flex flex-wrap gap-x-4 gap-y-2">
            <Link to="/play" className="text-primary">
              Play
            </Link>
            <Link to="/learn" className="text-primary">
              Learn
            </Link>
            <Link to="/ratings" className="text-primary">
              2700 Club
            </Link>
            <Link to="/events" className="text-primary">
              Events
            </Link>
            <Link to="/admin" className="text-primary">
              Recaps
            </Link>
            <Link to="/ops" className="text-primary">
              Studio
            </Link>
            <Link to="/about" className="text-primary">
              Charter
            </Link>
          </p>
          <p>Fair-play charter: engines vs bots only · Youth-safe academy boards remain</p>
          <p>
            Public APIs: Lichess Bot, Lichess FIDE, Chess.com leaderboards. Liorin is not affiliated
            with Lichess, Chess.com, FIDE, or TCEC.
          </p>
        </div>
      </footer>
    </div>
  );
}
