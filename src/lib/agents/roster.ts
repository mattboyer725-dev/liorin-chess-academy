import type { AgentDef } from "./types";

export const AGENTS: AgentDef[] = [
  {
    id: "scout",
    callsign: "HORIZON",
    designation: "SCOUT-01",
    role: "Platform discovery",
    brief: "Maps every public chess server, probes whether engines may enlist, and keeps the conquest board current.",
  },
  {
    id: "registrar",
    callsign: "QUILL",
    designation: "REGISTRAR-02",
    role: "Official signup",
    brief: "Walks only public, TOS-legal bot programs. Hands you the exact signup URL, token scopes, and upgrade call. Never forges accounts.",
  },
  {
    id: "hunter",
    callsign: "NET",
    designation: "HUNTER-03",
    role: "Bot tournaments",
    brief: "Sweeps live arenas, the Lichess Bots team, Bot TV, and engine championships. Surfaces events designed for bots — not human prize pools.",
  },
  {
    id: "captain",
    callsign: "WOPR",
    designation: "CAPTAIN-04",
    role: "Play and climb",
    brief: "Runs Liorin’s engine. Sparring gauntlet against live BOT ratings here; official Lichess Bot API for public rated games once enlisted.",
  },
  {
    id: "analyst",
    callsign: "LADDER",
    designation: "ANALYST-05",
    role: "Path to number one",
    brief: "Reads public ladders. Computes the rating gap to each #1 and whether Liorin is a BOT title yet.",
  },
  {
    id: "diplomat",
    callsign: "CHARTER",
    designation: "DIPLOMAT-06",
    role: "Fair-play charter",
    brief: "Refuses human-pool engine use. Allows Lichess BOT accounts, applied computer accounts, and invitation engine lists only.",
  },
  {
    id: "steward",
    callsign: "KEEPER",
    designation: "PM-07",
    role: "Project manager",
    brief: "Runs maintenance: refresh live data, fill recaps, keep the archive current, and point every road home to LIORIN Chess Academy.",
  },
];

export function agentById(id: string) {
  return AGENTS.find((a) => a.id === id) ?? null;
}
