"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const QUICK = [
  { href: "/labs/monte-carlo", title: "Simulate Stock Prices", blurb: "GBM paths & distributions" },
  { href: "/labs/options", title: "Price an Option", blurb: "Monte Carlo vs Black–Scholes" },
  { href: "/labs/orders", title: "Explore Order Book", blurb: "Market & limit matching" },
  { href: "/learn", title: "Continue Learning", blurb: "Lessons & challenges" },
];

export default function DashboardPage() {
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    api.health().then(() => setApiOk(true)).catch(() => setApiOk(false));
  }, []);

  const tracks = [
    { track: "MARKETS", percent: 0 },
    { track: "ORDERS", percent: 0 },
    { track: "EQUITIES", percent: 0 },
    { track: "MONTE CARLO", percent: 0 },
    { track: "OPTIONS PRICING", percent: 0 },
  ];

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden">
        <div className="grid gap-6 p-6 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-mist-dim">Pathwise</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-mist md:text-4xl">
              Welcome back.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-mist-muted">
              Learn how markets work by placing orders, watching fills, and running simulations —
              not by memorizing definitions.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/learn" className="btn-primary">Continue Learning</Link>
              <Link href="/labs/orders" className="btn-ghost">Open Orders Lab</Link>
            </div>
            {apiOk === false && (
              <p className="mt-4 text-sm text-warn">
                API offline — start the backend on port 8000 to unlock labs.
              </p>
            )}
          </div>
          <div className="rounded-md border border-ink-border bg-ink/50 p-4">
            <p className="text-xs uppercase tracking-wider text-mist-dim">Learning progress</p>
            <ul className="mt-3 space-y-2.5">
              {tracks.map((t) => (
                <li key={t.track} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-2 text-sm">
                  <span className="font-mono text-xs text-mist-muted">{t.track}</span>
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink-border">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${t.percent}%` }} />
                  </div>
                  <span className="text-right font-mono text-xs text-mist">{t.percent}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {QUICK.map((q) => (
          <Link key={q.href} href={q.href} className="panel group p-4 transition hover:border-accent/40 hover:bg-ink-elevated">
            <p className="text-sm font-medium text-mist group-hover:text-accent">{q.title}</p>
            <p className="mt-1 text-xs text-mist-muted">{q.blurb}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
