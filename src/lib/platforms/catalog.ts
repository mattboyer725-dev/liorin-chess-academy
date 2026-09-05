import type { PlatformDef } from "@/lib/agents/types";

export const PLATFORMS: PlatformDef[] = [
  {
    id: "lichess",
    name: "Lichess",
    host: "lichess.org",
    url: "https://lichess.org",
    signupUrl: "https://lichess.org/signup",
    policy: "bot-api",
    diplomat: "enlist",
    rankSurface: "BOT bullet / blitz / rapid",
    summary:
      "The only major public server with a first-class Bot API. Create an account, mint a personal token, upgrade it to BOT, then play challenge games and bot-allowed arenas.",
    steps: [
      "Open the official Lichess signup (or use the existing public handle Liorin).",
      "Create a personal access token with bot:play, challenge:read, challenge:write, and tournament:write.",
      "Paste the token into Registrar. The token stays on this device — it is never written to the shared campaign database.",
      "Registrar calls POST /api/bot/account/upgrade. After that the title is BOT and engine play is allowed.",
      "Join the public team Lichess Bots. Challenge online BOTs. Use the official lichess-bot client for 24/7 rated play.",
    ],
  },
  {
    id: "chesscom-computer",
    name: "Chess.com Computer Accounts",
    host: "chess.com",
    url: "https://www.chess.com",
    signupUrl: "https://support.chess.com/en/articles/8614091-how-can-i-play-against-the-chess-com-bots",
    policy: "computer-account",
    diplomat: "apply",
    rankSurface: "Computer / CCC invitation lists",
    summary:
      "Chess.com forbids engine assistance in human pools. A named Computer Account is the only legal path, and it is granted by Chess.com — not by this command.",
    steps: [
      "Do not point Liorin’s engine at a normal Chess.com login. Diplomat will block it.",
      "Apply to Chess.com Support for a Computer Account. State that Liorin is an engine and will only play other computers or advertised bot events.",
      "Wait for approval. Until then the platform stays AWAITING APPROVAL.",
      "If approved, play only in computer-legal events (CCC and staff-run computer matches).",
    ],
  },
  {
    id: "chesscom-botbattles",
    name: "Chess.com Bot Battles",
    host: "chess.com",
    url: "https://www.chess.com/join/botbattles",
    signupUrl: "https://www.chess.com/join/botbattles",
    policy: "apply",
    diplomat: "apply",
    rankSurface: "Club event standings",
    summary:
      "A Chess.com club event designed around bot play. Entry is through the Bot Battles landing page with a required username pattern and staff review.",
    steps: [
      "Open the official Bot Battles club join page.",
      "Create the event account through that page only, using the published username pattern.",
      "Do not play vs. Computer on that account before the event start — that is a stated ineligibility rule.",
      "Hunter watches the club for the next season and flags it here.",
    ],
  },
  {
    id: "pychess",
    name: "PyChess",
    host: "pychess.org",
    url: "https://www.pychess.org",
    signupUrl: "https://www.pychess.org",
    policy: "bot-api",
    diplomat: "enlist",
    rankSurface: "Variant BOT boards",
    summary:
      "Open-source variant server. BOT accounts (Fairy-Stockfish and community engines) are first-class. Standard chess plus dozens of variants.",
    steps: [
      "Create a public PyChess account named for Liorin if the handle is free.",
      "Follow PyChess bot documentation to mark the account BOT — the same spirit as Lichess, not a hidden overlay.",
      "Play rated variant games against other BOT titles.",
    ],
  },
  {
    id: "fics",
    name: "FICS",
    host: "freechess.org",
    url: "https://www.freechess.org",
    signupUrl: "https://www.freechess.org/Register/index.html",
    policy: "computer-account",
    diplomat: "enlist",
    rankSurface: "Computer formula ratings",
    summary:
      "Free Internet Chess Server. Computer accounts are declared in the finger notes and play other computers. Interface is ICS/telnet, not a browser bot API.",
    steps: [
      "Register at freechess.org with a public computer handle.",
      "Set the computer formula in the account finger notes so opponents know it is an engine.",
      "Connect with an ICS client (not a hidden browser overlay) and seek computer-rated games.",
    ],
  },
  {
    id: "icc",
    name: "Internet Chess Club",
    host: "chessclub.com",
    url: "https://www.chessclub.com",
    signupUrl: "https://store.chessclub.com/",
    policy: "computer-account",
    diplomat: "apply",
    rankSurface: "ICC computer lists",
    summary:
      "Paid ICS. Computer accounts exist and are labeled. Requires an ICC membership and their computer-account rules.",
    steps: [
      "Open an ICC account under their computer-account policy.",
      "Label the engine. Do not use it in human-only events.",
    ],
  },
  {
    id: "tcec",
    name: "TCEC",
    host: "tcec-chess.com",
    url: "https://tcec-chess.com",
    signupUrl: "https://tcec-chess.com",
    policy: "invite",
    diplomat: "watch",
    rankSurface: "TCEC season table",
    summary:
      "Top Chess Engine Championship. Invitation engine event — the public #1 engine title on a dedicated board. Hunter watches seasons; Captain cannot self-enroll.",
    steps: [
      "Watch the current TCEC season.",
      "If Liorin’s public strength ever warrants a request, Diplomat drafts an invitation letter. No silent signup.",
    ],
  },
  {
    id: "ccrl",
    name: "CCRL",
    host: "computerchess.org.uk",
    url: "https://computerchess.org.uk/ccrl/4040/",
    signupUrl: "https://computerchess.org.uk/ccrl/4040/",
    policy: "engine-list",
    diplomat: "watch",
    rankSurface: "CCRL 40/15 and Blitz lists",
    summary:
      "Independent engine rating lists. Engines are tested by the CCRL testers, not self-play on a public pool. Path to #1 is a submitted engine binary, not an account.",
    steps: [
      "Publish Liorin’s engine version publicly.",
      "Request testing through CCRL’s published channels.",
      "Analyst tracks the published list; we do not scrape tester machines.",
    ],
  },
  {
    id: "openbench",
    name: "OpenBench",
    host: "openbench.net",
    url: "https://openbench.net",
    signupUrl: "https://github.com/AndyGrant/OpenBench",
    policy: "engine-list",
    diplomat: "watch",
    rankSurface: "Self-play SPRT boards",
    summary:
      "Public engine-testing framework. Used to prove patches, not to farm human ratings. Scout lists it as a strength lab.",
    steps: [
      "Stand up an OpenBench instance or join a public one.",
      "Run SPRTs of Liorin vs known engines. Results feed Analyst, not a public human ladder.",
    ],
  },
  {
    id: "gameknot",
    name: "GameKnot",
    host: "gameknot.com",
    url: "https://gameknot.com",
    signupUrl: "https://gameknot.com/register.pl",
    policy: "human-only",
    diplomat: "refuse",
    rankSurface: "Correspondence (human)",
    summary:
      "Correspondence chess with no public bot program. Diplomat refuses enlistment.",
    steps: [
      "No official computer path. Scout maps it and stops.",
    ],
  },
  {
    id: "playok",
    name: "PlayOK",
    host: "playok.com",
    url: "https://www.playok.com/en/chess/",
    signupUrl: "https://www.playok.com/",
    policy: "human-only",
    diplomat: "refuse",
    rankSurface: "Casual (human)",
    summary:
      "Casual turn-based chess without a published engine API. Overlay play would be cheating. Refused.",
    steps: [
      "No enlistment. Hunter will not queue games here.",
    ],
  },
  {
    id: "fide-arena",
    name: "FIDE Online Arena",
    host: "arena.fide.com",
    url: "https://arena.fide.com",
    signupUrl: "https://arena.fide.com",
    policy: "human-only",
    diplomat: "refuse",
    rankSurface: "FIDE online (human)",
    summary:
      "FIDE-branded human play. Engine use is a fair-play violation. Diplomat hard-blocks.",
    steps: [
      "Do not sign Liorin up. Do not point the engine at this board.",
    ],
  },
];

export function platformById(id: string) {
  return PLATFORMS.find((p) => p.id === id) ?? null;
}
