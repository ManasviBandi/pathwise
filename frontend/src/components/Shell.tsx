"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/labs/orders", label: "Orders Lab" },
  { href: "/labs/monte-carlo", label: "Monte Carlo" },
  { href: "/labs/options", label: "Options" },
  { href: "/learn", label: "Learn" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-ink-border/80 bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="group flex items-baseline gap-2">
            <span className="font-mono text-lg font-semibold tracking-tight text-mist">
              pathwise
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.2em] text-mist-dim sm:inline">
              markets · quant · lab
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-2.5 py-1.5 text-sm transition ${
                    active
                      ? "bg-ink-elevated text-mist"
                      : "text-mist-muted hover:bg-ink-hover hover:text-mist"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 animate-fade-up">{children}</main>
      <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs text-mist-dim">
        Educational simulation — not a brokerage or investment advisor.
      </footer>
    </div>
  );
}