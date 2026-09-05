import { createFileRoute, Link } from "@tanstack/react-router";
import { AcademyCta } from "@/components/academy-cta";

export const Route = createFileRoute("/about")({ component: AboutPage });

function AboutPage() {
  return (
    <article className="flex max-w-2xl flex-col gap-6 text-sm leading-relaxed text-muted">
      <header>
        <p className="text-[11px] uppercase tracking-[0.22em]">Charter</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg">LIORIN Chess Academy</h1>
      </header>
      <p>
        Liorin is a chess engine with a teaching academy around it. Lessons when you want them. Cold
        when you do not — the engine does not yield. Conquest is the operations floor: seven agents
        whose job is to enlist Liorin, legally, on every public chess platform that allows bots, hunt
        tournaments designed for engines, and keep every finished game for recap and for learning.
      </p>
      <h2 className="text-lg font-medium text-fg">Cold mode</h2>
      <p>
        Teaching can lose. That is the lesson working. When Liorin is not teaching, the engine holds.
        A draw is not a loss. The archive keeps the score either way.
      </p>
      <h2 className="text-lg font-medium text-fg">What the team will not do</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>No engine assistance in human pools. Chess.com, FIDE Arena, PlayOK, GameKnot — refused.</li>
        <li>No overlay cheats, no captcha farms, no silent account mills.</li>
        <li>No storing of API tokens in the shared campaign database. Tokens stay on this device.</li>
        <li>Challenges on Lichess go only to accounts with the BOT title.</li>
      </ul>
      <h2 className="text-lg font-medium text-fg">What the team will do</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          Walk the official Lichess Bot API: signup, personal token,{" "}
          <code className="text-fg">/api/bot/account/upgrade</code>, team Lichess Bots, Bot TV, BOT
          leaderboard.
        </li>
        <li>File Computer Account and Bot Battles applications on Chess.com — never a stealth login.</li>
        <li>Watch TCEC, CCRL, and PyChess BOT boards as engine-native ladders.</li>
        <li>Keep every academy game for recaps, marketing copy, and engine memory.</li>
      </ul>
      <p>
        Ranked human matches on this site stay locked. Guests play on this device. The 2700 Club, the
        lessons, and the cold board all lead back here.
      </p>
      <p>
        <Link to="/" className="text-primary">
          Return to command
        </Link>
        {" · "}
        <Link to="/play" className="text-primary">
          Teaching board
        </Link>
        {" · "}
        <Link to="/admin" className="text-primary">
          Recaps
        </Link>
      </p>
      <AcademyCta />
    </article>
  );
}
