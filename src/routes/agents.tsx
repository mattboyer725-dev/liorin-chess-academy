import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AGENTS } from "@/lib/agents/roster";
import { getCommandSnapshot } from "@/lib/conquest/server";
import { formatWhen } from "@/lib/conquest/format";

export const Route = createFileRoute("/agents")({ component: AgentsPage });

function AgentsPage() {
  const snap = useQuery({ queryKey: ["command"], queryFn: () => getCommandSnapshot() });
  const logs = snap.data?.logs ?? [];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Six specialists</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Agent dossiers</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Six specialists plus KEEPER. Scout maps boards, Registrar walks official signup, Hunter
          finds bot events, Captain plays, Analyst reads ladders, Diplomat refuses cheating, KEEPER
          runs maintenance.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {AGENTS.map((a) => {
          const mine = logs.filter((l) => l.agentId === a.id).slice(0, 5);
          return (
            <section
              key={a.id}
              id={a.id}
              className="scroll-mt-24 rounded-lg border border-border bg-surface p-5"
            >
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{a.designation}</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[0.06em] text-primary">{a.callsign}</h2>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-faint">{a.role}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{a.brief}</p>
              <ul className="mt-4 divide-y divide-border rounded-md border border-border bg-bg">
                {mine.length === 0 ? (
                  <li className="px-3 py-3 text-xs text-muted">No log lines yet. Launch conquest from Command.</li>
                ) : (
                  mine.map((l) => (
                    <li key={l.id} className="flex flex-col gap-1 px-3 py-2 sm:flex-row sm:justify-between">
                      <span className="text-xs leading-relaxed text-fg">{l.message}</span>
                      <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-muted">
                        {formatWhen(l.at)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="text-xs text-muted">
        <Link to="/" className="text-primary">
          Return to command
        </Link>
        {" · "}
        <Link to="/platforms" className="text-primary">
          Registration playbooks
        </Link>
        {" · "}
        <Link to="/ops" className="text-primary">
          Studio · KEEPER
        </Link>
        {" · "}
        <Link to="/play" className="text-primary">
          Academy board
        </Link>
      </p>
    </div>
  );
}
