import { createFileRoute, Link } from "@tanstack/react-router";
import { AcademyCta } from "@/components/academy-cta";
import { LESSONS } from "@/lib/chess/lessons";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/learn")({ component: LearnPage });

function LearnPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Learning hub</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Move-by-move</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Short positions, one idea each. The tutor names the threat after every accepted move.
          Open a lesson on the teaching board, or watch the 2700 Club to see the same ideas at
          elite strength.
        </p>
      </header>
      <ul className="grid gap-3 md:grid-cols-2">
        {LESSONS.map((lesson) => (
          <li key={lesson.id} className="flex flex-col rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-medium">{lesson.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{lesson.brief}</p>
            <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-primary">{lesson.goal}</p>
            <Link to="/play" search={{ lesson: lesson.id }} className="mt-4">
              <Button variant="outline" className="w-full">
                Open on the board
              </Button>
            </Link>
          </li>
        ))}
      </ul>
      <AcademyCta line="Finish a lesson, then sit with the cold engine. The idea only counts if you can hold it." />
    </div>
  );
}
