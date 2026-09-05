import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AcademyCta } from "@/components/academy-cta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EnlistStatus, PlatformId } from "@/lib/agents/types";
import { bindLichessToken, enlistHandle, getCommandSnapshot, upgradeBoundBot } from "@/lib/conquest/server";
import { PLATFORMS } from "@/lib/platforms/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/platforms")({ component: PlatformsPage });

const TOKEN_KEY = "liorin.lichess.token";

const POLICY: Record<string, string> = {
  "bot-api": "Bot API",
  "computer-account": "Computer account",
  apply: "Apply",
  invite: "Invite",
  "engine-list": "Engine list",
  "human-only": "Human only",
};

const DIPLOMAT: Record<string, string> = {
  enlist: "Enlist",
  apply: "Apply",
  watch: "Watch",
  refuse: "Refuse",
};

function PlatformsPage() {
  const qc = useQueryClient();
  const snap = useQuery({ queryKey: ["command"], queryFn: () => getCommandSnapshot() });
  const [token, setToken] = useState("");
  const [tokenMsg, setTokenMsg] = useState<string | null>(null);
  const [handles, setHandles] = useState<Record<string, string>>({});

  const bind = useMutation({
    mutationFn: (t: string) => bindLichessToken({ data: { token: t } }),
    onSuccess: (res) => {
      if (res.ok) {
        sessionStorage.setItem(TOKEN_KEY, token.trim());
        setTokenMsg(`Bound to @${res.username}${res.title ? ` · ${res.title}` : " · not BOT yet"}. Token stays on this device.`);
        void qc.invalidateQueries({ queryKey: ["command"] });
      } else setTokenMsg(res.error);
    },
    onError: (e) => setTokenMsg(e.message),
  });
  const upgrade = useMutation({
    mutationFn: (t: string) => upgradeBoundBot({ data: { token: t } }),
    onSuccess: (res) => {
      if (res.ok) {
        setTokenMsg(`@${res.username} is BOT.`);
        void qc.invalidateQueries({ queryKey: ["command"] });
      } else setTokenMsg("error" in res ? res.error : "Upgrade failed");
    },
    onError: (e) => setTokenMsg(e.message),
  });
  const enlist = useMutation({
    mutationFn: (input: { platformId: PlatformId; handle: string; status: EnlistStatus }) =>
      enlistHandle({ data: input }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["command"] }),
  });

  const handleMap = new Map(snap.data?.handles.map((h) => [h.platformId, h]));

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Registrar · Scout</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Public boards</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Every mapped server, with Diplomat’s ruling. Liorin signs up only through official bot programs.
          Tokens are never written to the shared campaign store.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold tracking-[0.08em] text-fg">Lichess BOT handshake</h2>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted">
          Mint a personal token at{" "}
          <a className="text-primary underline-offset-4 hover:underline" href="https://lichess.org/account/oauth/token" target="_blank" rel="noreferrer">
            lichess.org/account/oauth/token
          </a>{" "}
          with bot:play, challenge:read, challenge:write, tournament:write. Paste it here to bind and upgrade.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Input
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="Personal access token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            aria-label="Lichess personal access token"
          />
          <Button onClick={() => bind.mutate(token)} disabled={bind.isPending || token.trim().length < 8}>
            {bind.isPending ? "Binding…" : "Bind"}
          </Button>
          <Button
            variant="outline"
            onClick={() => upgrade.mutate(token)}
            disabled={upgrade.isPending || token.trim().length < 8}
          >
            {upgrade.isPending ? "Upgrading…" : "Upgrade to BOT"}
          </Button>
        </div>
        {tokenMsg ? <p className="mt-3 text-xs leading-relaxed text-fg">{tokenMsg}</p> : null}
      </section>

      <ul className="flex flex-col gap-4">
        {PLATFORMS.map((p) => {
          const enlisted = handleMap.get(p.id);
          const refuse = p.diplomat === "refuse";
          return (
            <li key={p.id} className="rounded-lg border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{p.host}</p>
                  <h2 className="mt-1 text-lg font-semibold text-fg">{p.name}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{POLICY[p.policy]}</Badge>
                  <Badge className={cn(p.diplomat === "refuse" ? "text-danger" : p.diplomat === "enlist" ? "text-primary" : "text-warn")}>
                    {DIPLOMAT[p.diplomat]}
                  </Badge>
                  {enlisted ? <Badge className="text-primary">{enlisted.status}</Badge> : null}
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">{p.summary}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-faint">{p.rankSurface}</p>
              <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-fg/90">
                {p.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a href={p.signupUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm">
                    Official signup
                  </Button>
                </a>
                {refuse ? (
                  <p className="text-xs text-danger">Diplomat hard-block. No handle will be stored.</p>
                ) : (
                  <>
                    <Input
                      className="sm:max-w-xs"
                      placeholder="Public handle"
                      value={handles[p.id] ?? enlisted?.handle ?? ""}
                      onChange={(e) => setHandles((h) => ({ ...h, [p.id]: e.target.value }))}
                      aria-label={`${p.name} public handle`}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={enlist.isPending}
                      onClick={() =>
                        enlist.mutate({
                          platformId: p.id,
                          handle: handles[p.id] ?? enlisted?.handle ?? "",
                          status: p.diplomat === "enlist" ? "playbook-ready" : "awaiting-approval",
                        })
                      }
                    >
                      Record handle
                    </Button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted">
        Need the engine on a board right now?{" "}
        <Link to="/engage" className="text-primary">
          Open the gauntlet
        </Link>
        {" · "}
        <Link to="/play" className="text-primary">
          Academy board
        </Link>
        .
      </p>
      <AcademyCta line="Signup lives on the host. Training, recaps, and the 2700 Club live here." />
    </div>
  );
}
