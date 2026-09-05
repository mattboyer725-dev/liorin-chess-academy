import { Link } from "@tanstack/react-router";
import { AGENTS } from "@/lib/agents/roster";
import type { AgentId, AgentLog, AgentStatus } from "@/lib/agents/types";
import { cn } from "@/lib/utils";

const STATUS: Record<AgentStatus, string> = {
  idle: "Idle",
  running: "Running",
  ready: "Ready",
  blocked: "Blocked",
  alert: "Alert",
};

export function AgentCard({
  id,
  status,
  log,
}: {
  id: AgentId;
  status: AgentStatus;
  log?: AgentLog;
}) {
  const agent = AGENTS.find((a) => a.id === id);
  if (!agent) return null;
  const dest = id === "steward" ? "/ops" : "/agents";
  return (
    <Link
      to={dest}
      hash={id === "steward" ? undefined : id}
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-surface p-4 transition-colors duration-200 hover:border-primary",
        status === "alert" || status === "blocked" ? "border-warn" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{agent.designation}</p>
          <h3 className="mt-1 text-sm font-semibold tracking-[0.08em] text-fg">{agent.callsign}</h3>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[10px] uppercase tracking-[0.16em]",
            status === "running"
              ? "border-primary text-primary"
              : status === "ready"
                ? "border-border-strong text-primary"
                : status === "alert" || status === "blocked"
                  ? "border-warn text-warn"
                  : "border-border text-muted",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              status === "running" || status === "ready" ? "bg-primary agent-live-dot" : status === "alert" ? "bg-warn" : "bg-faint",
            )}
          />
          {STATUS[status]}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-muted">{agent.role}</p>
      <p className="line-clamp-2 text-xs leading-relaxed text-fg/80">
        {log?.message ?? "Awaiting launch."}
      </p>
    </Link>
  );
}
