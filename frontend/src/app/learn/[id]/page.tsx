"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, LessonDetail } from "@/lib/api";

export default function LessonPage() {
  const params = useParams();
  const id = String(params.id);
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quizPick, setQuizPick] = useState<number | null>(null);
  const [challengePick, setChallengePick] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    api
      .lesson(id)
      .then(setLesson)
      .catch((e) => setError(String(e.message || e)));
  }, [id]);

  if (error) {
    return <p className="text-loss">{error}</p>;
  }
  if (!lesson) {
    return <p className="text-mist-dim">Loading lesson…</p>;
  }

  const challenge = lesson.challenge as {
    prompt: string;
    type: string;
    options?: string[];
    answer_index?: number;
    explanation?: string;
    expected?: Record<string, unknown>;
    hint?: string;
  };

  const quiz = lesson.quiz as {
    prompt: string;
    options: string[];
    answer_index: number;
  };

  async function gradeChoice(
    kind: "quiz" | "challenge",
    pick: number,
    answerIndex: number,
    explanation?: string
  ) {
    const ok = pick === answerIndex;
    setFeedback(
      ok
        ? explanation || "Correct — concept locked in."
        : "Not quite. Re-read the concept, try the lab, then answer again."
    );
    if (ok) {
      await api.updateProgress({
        lesson_id: lesson!.id,
        completed: true,
        quiz_score: kind === "quiz" ? 1 : undefined,
        challenge_passed: kind === "challenge" ? true : undefined,
      });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/learn" className="text-xs text-accent hover:underline">
        ← All lessons
      </Link>
      <header>
        <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
          {lesson.track}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-mist">{lesson.title}</h1>
      </header>

      <section className="panel p-5">
        <h2 className="text-xs uppercase tracking-wider text-mist-dim">1 · Concept</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-mist-muted">
          {lesson.concept.replace(/\*\*(.*?)\*\*/g, "$1")}
        </p>
      </section>

      <section className="panel p-5">
        <h2 className="text-xs uppercase tracking-wider text-mist-dim">2 · Guided example</h2>
        <p className="mt-3 text-sm leading-relaxed text-mist-muted">{lesson.guided}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/labs/orders" className="btn-ghost">
            Orders Lab
          </Link>
          <Link href="/labs/monte-carlo" className="btn-ghost">
            Monte Carlo Lab
          </Link>
          <Link href="/labs/options" className="btn-ghost">
            Options Lab
          </Link>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="text-xs uppercase tracking-wider text-mist-dim">3 · Challenge</h2>
        <p className="mt-3 text-sm text-mist">{challenge.prompt}</p>
        {challenge.type === "choice" && challenge.options && (
          <div className="mt-4 space-y-2">
            {challenge.options.map((opt, i) => (
              <button
                key={opt}
                type="button"
                className={`block w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                  challengePick === i
                    ? "border-accent bg-accent/10 text-mist"
                    : "border-ink-border text-mist-muted hover:border-mist-dim"
                }`}
                onClick={() => setChallengePick(i)}
              >
                {opt}
              </button>
            ))}
            <button
              type="button"
              className="btn-primary mt-2"
              disabled={challengePick === null}
              onClick={() =>
                gradeChoice(
                  "challenge",
                  challengePick!,
                  challenge.answer_index ?? -1,
                  challenge.explanation
                )
              }
            >
              Check challenge
            </button>
          </div>
        )}
        {challenge.type === "order" && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-mist-muted">{challenge.hint}</p>
            <Link href="/labs/orders" className="btn-primary inline-flex">
              Open Orders Lab & submit
            </Link>
            <button
              type="button"
              className="btn-ghost ml-2"
              onClick={async () => {
                setFeedback(
                  "Mark this challenge complete after you submit the matching order in the lab."
                );
                await api.updateProgress({
                  lesson_id: lesson.id,
                  challenge_passed: true,
                  completed: true,
                });
              }}
            >
              I completed it in the lab
            </button>
          </div>
        )}
      </section>

      <section className="panel p-5">
        <h2 className="text-xs uppercase tracking-wider text-mist-dim">4 · Quiz</h2>
        <p className="mt-3 text-sm text-mist">{quiz.prompt}</p>
        <div className="mt-4 space-y-2">
          {quiz.options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              className={`block w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                quizPick === i
                  ? "border-accent bg-accent/10 text-mist"
                  : "border-ink-border text-mist-muted hover:border-mist-dim"
              }`}
              onClick={() => setQuizPick(i)}
            >
              {opt}
            </button>
          ))}
          <button
            type="button"
            className="btn-primary mt-2"
            disabled={quizPick === null}
            onClick={() => gradeChoice("quiz", quizPick!, quiz.answer_index)}
          >
            Submit quiz
          </button>
        </div>
      </section>

      {feedback && (
        <div className="rounded-md border border-ink-border bg-ink-elevated px-4 py-3 text-sm text-mist-muted">
          {feedback}
        </div>
      )}
    </div>
  );
}