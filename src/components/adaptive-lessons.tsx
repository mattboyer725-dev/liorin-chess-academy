import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LESSONS } from "@/lib/chess/lessons";
import { LocalPolicy } from "@/lib/learning/policy.mjs";
import { Button } from "@/components/ui/button";

let policy: LocalPolicy | null = null;
let suggestion: { id: string; receipt: number | null; opened: boolean } | null =
  null;

export function AdaptiveLessons() {
  const [ready, setReady] = useState(false);
  const [, refresh] = useState(0);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!policy) {
      let storage: Storage | null = null;
      try {
        storage = window.localStorage;
      } catch {
        /* memory-only fallback */
      }
      policy = new LocalPolicy(
        "liorin:lesson-learning:v1",
        LESSONS.map((l) => l.id),
        storage,
      );
    }
    setReady(true);
  }, []);
  if (!ready || !policy) return null;
  const learner = policy;
  const lesson = LESSONS.find((l) => l.id === suggestion?.id);
  function next() {
    const id = learner.choose(LESSONS.map((l) => l.id));
    suggestion = id ? { id, receipt: null, opened: false } : null;
    refresh((n) => n + 1);
  }
  function rate(value: number) {
    if (
      suggestion?.receipt != null &&
      learner.reward(suggestion.receipt, value)
    ) {
      setMessage(
        "Feedback recorded. Your next suggestion uses the updated preferences.",
      );
      next();
    }
  }
  return (
    <section
      aria-labelledby="adaptive-heading"
      className="rounded-lg border border-border bg-surface p-5"
    >
      <p className="text-[11px] uppercase tracking-[0.14em] text-primary">
        Separate staged experiment
      </p>
      <h2 id="adaptive-heading" className="mt-2 text-lg font-medium">
        Your next practice idea
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Optional suggestions learn only from your helpful / not helpful
        feedback. Preferences stay on this browser, not your account. No grades,
        moves, or student names are stored. This does not train the chess engine
        or measure mastery.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => {
            learner.setEnabled(!learner.enabled);
            suggestion = null;
            if (learner.enabled) next();
            setMessage(
              learner.enabled
                ? "Local learning enabled."
                : "Learning disabled.",
            );
            refresh((n) => n + 1);
          }}
        >
          {learner.enabled ? "Disable learning" : "Enable local learning"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const removed = learner.forget();
            suggestion = null;
            setMessage(
              removed
                ? "Local preferences forgotten. Learning is off."
                : "Session cleared. Browser storage could not be cleared; use browser site settings.",
            );
            refresh((n) => n + 1);
          }}
        >
          Forget preferences
        </Button>
      </div>
      {learner.enabled && (
        <div className="mt-4">
          {lesson ? (
            <>
              <h3 className="font-medium">{lesson.title}</h3>
              <p className="mt-1 text-sm text-muted">{lesson.brief}</p>
              <Link
                to="/play"
                search={{ lesson: lesson.id }}
                className="mt-3 inline-block underline underline-offset-4"
                onClick={() => {
                  if (suggestion && !suggestion.opened) {
                    suggestion.receipt = learner.expose(suggestion.id);
                    suggestion.opened = true;
                  }
                }}
              >
                Open suggested lesson
              </Link>
              <p className="mt-2 text-sm text-muted">
                Try it on the board, then return here to rate the suggestion.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button disabled={!suggestion?.opened} onClick={() => rate(1)}>
                  Helpful
                </Button>
                <Button
                  variant="outline"
                  disabled={!suggestion?.opened}
                  onClick={() => rate(-1)}
                >
                  Not helpful
                </Button>
                <Button variant="outline" onClick={next}>
                  Skip suggestion
                </Button>
              </div>
            </>
          ) : (
            <Button onClick={next}>Suggest a lesson</Button>
          )}
          <p className="mt-3 text-xs text-muted">
            {learner.count} feedback signals.{" "}
            {learner.persistent
              ? "Stored on this browser."
              : "Memory only; resets on reload."}
          </p>
        </div>
      )}
      <p role="status" className="mt-3 text-sm text-primary">
        {message}
      </p>
    </section>
  );
}
