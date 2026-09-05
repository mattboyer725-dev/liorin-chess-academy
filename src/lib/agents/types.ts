export const AGENT_IDS = [
  "scout",
  "registrar",
  "hunter",
  "captain",
  "analyst",
  "diplomat",
  "steward",
] as const;

export type AgentId = (typeof AGENT_IDS)[number];

export type AgentStatus = "idle" | "running" | "ready" | "blocked" | "alert";

export type BotPolicy =
  | "bot-api"
  | "computer-account"
  | "apply"
  | "invite"
  | "engine-list"
  | "human-only";

export type EnlistStatus =
  | "scouted"
  | "playbook-ready"
  | "awaiting-approval"
  | "enlisted"
  | "blocked";

export type PlatformId =
  | "lichess"
  | "chesscom-computer"
  | "chesscom-botbattles"
  | "pychess"
  | "fics"
  | "icc"
  | "tcec"
  | "ccrl"
  | "openbench"
  | "gameknot"
  | "playok"
  | "fide-arena";

export type AgentDef = {
  id: AgentId;
  callsign: string;
  designation: string;
  role: string;
  brief: string;
};

export type AgentLog = {
  id: number;
  agentId: AgentId;
  level: "info" | "warn" | "alert";
  message: string;
  at: string;
};

export type PlatformDef = {
  id: PlatformId;
  name: string;
  host: string;
  url: string;
  signupUrl: string;
  policy: BotPolicy;
  diplomat: "enlist" | "apply" | "watch" | "refuse";
  rankSurface: string;
  summary: string;
  steps: string[];
};

export type LiveHandle = {
  platformId: PlatformId;
  handle: string;
  status: EnlistStatus;
  note: string | null;
  enlistedAt: string;
};

export type LiveBot = {
  id: string;
  username: string;
  title: string | null;
  bullet: number | null;
  blitz: number | null;
  rapid: number | null;
  playing: boolean;
};

export type HuntEvent = {
  id: string;
  source: "lichess-arena" | "lichess-team" | "lichess-tv" | "lichess-board" | "external";
  title: string;
  url: string;
  status: "live" | "upcoming" | "standing" | "seasonal";
  players: number | null;
  botsDesigned: boolean;
  note: string;
  startsAt: string | null;
};

export type MatchRow = {
  id: number;
  platformId: PlatformId | "gauntlet";
  opponent: string;
  opponentRating: number | null;
  result: "win" | "draw" | "loss";
  ratingBefore: number;
  ratingAfter: number;
  reason: string | null;
  at: string;
};

export type ConquestState = {
  rating: number;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  launchedAt: string | null;
  updatedAt: string;
};

export type RankTarget = {
  platformId: PlatformId;
  surface: string;
  numberOne: string;
  numberOneRating: number | null;
  liorinHandle: string | null;
  liorinRating: number | null;
  liorinTitle: string | null;
  gap: number | null;
  url: string;
  live: boolean;
};

export type CommandSnapshot = {
  state: ConquestState;
  handles: LiveHandle[];
  logs: AgentLog[];
  matches: MatchRow[];
  onlineBots: LiveBot[];
  events: HuntEvent[];
  ranks: RankTarget[];
  tvBot: { username: string; rating: number; gameId: string; url: string } | null;
  probedAt: string;
  source: "live" | "degraded";
};
