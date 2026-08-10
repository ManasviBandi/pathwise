"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, LessonSummary, ProgressSummary } from "@/lib/api";

export default function LearnIndexPage() {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.lessons(), api.progress()])
      .then(([L, P]) => {
        setLessons(L.sort((a, b) => a.order - b.order));
        setProgress(P);
      })
      .catch((e) => setError(String(e.message || e)));
  }, []);

  const raw = progress?.raw || {};

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-mist-dim">Learning path</p>
        <h1 className="mt-1 text-2xl font-semibold text-mist">Learn → interact → decide</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist-muted">
          Each module pairs a short concept with a lab action and a scenario challenge.
        </p>
      </header>

      {error && <p className="text-sm text-warn">Could not load lessons: {error}</p>}

      <div className="grid gap-3">
        {lessons.map((lesson) => {
          const done = Boolean(
            (raw[lesson.id] as { completed?: boolean; challenge_passed?: boolean } | undefined)
              ?.completed ||
              (raw[lesson.id] as { challenge_passed?: boolean } | undefined)?.challenge_passed
          );
          return (
            <Link
              key={lesson.id}
              href={`/learn/${lesson.id}`}
              className="panel flex items-start justify-between gap-4 p-4 transition hover:border-accent/40"
            >
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                  {lesson.track} · {String(lesson.order).padStart(2, "0")}
                </p>
                <h2 className="mt-1 text-base font-medium text-mist">{lesson.title}</h2>
                <p className="mt-1 text-sm text-mist-muted">{lesson.summary}</p>
              </div>
              <span
                className={`shrink-0 rounded-md px-2 py-1 font-mono text-[10px] uppercase ${
                  done ? "bg-gain/15 text-gain" : "bg-ink text-mist-dim"
                }`}
              >
                {done ? "Done" : "Open"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}