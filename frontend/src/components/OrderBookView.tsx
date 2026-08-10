"use client";

import { BookSnapshot } from "@/lib/api";

export function OrderBookView({ book }: { book: BookSnapshot | null }) {
  if (!book) {
    return (
      <div className="panel flex h-full min-h-[320px] items-center justify-center text-sm text-mist-dim">
        Loading book…
      </div>
    );
  }

  const maxQty = Math.max(
    1,
    ...book.asks.map((l) => l.quantity),
    ...book.bids.map((l) => l.quantity)
  );

  return (
    <div className="panel overflow-hidden">
      <div className="panel-header flex items-center justify-between">
        <span>Order book · DEMO</span>
        <span className="font-mono text-xs text-mist-muted">
          mid {book.mid?.toFixed(2) ?? "—"} · spread{" "}
          <span className="text-warn">{book.spread != null ? book.spread.toFixed(2) : "—"}</span>
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-x-3 px-4 py-2 text-[10px] uppercase tracking-wider text-mist-dim">
        <span>Price</span>
        <span>Size</span>
      </div>
      <div className="space-y-0.5 px-2 pb-2">
        <p className="px-2 text-[10px] uppercase tracking-wider text-loss">Ask</p>
        {[...book.asks].reverse().map((lvl) => (
          <LevelRow key={`a-${lvl.price}`} side="ask" level={lvl} maxQty={maxQty} />
        ))}
        <div className="my-2 border-y border-ink-border bg-ink/40 px-2 py-2 text-center font-mono text-sm text-mist">
          {book.mid != null ? `$${book.mid.toFixed(2)}` : "—"}
        </div>
        {[...book.bids].map((lvl) => (
          <LevelRow key={`b-${lvl.price}`} side="bid" level={lvl} maxQty={maxQty} />
        ))}
        <p className="px-2 pt-1 text-[10px] uppercase tracking-wider text-gain">Bid</p>
      </div>
    </div>
  );
}

function LevelRow({
  side,
  level,
  maxQty,
}: {
  side: "bid" | "ask";
  level: { price: number; quantity: number };
  maxQty: number;
}) {
  const pct = (level.quantity / maxQty) * 100;
  const bar = side === "ask" ? "bg-loss/15" : "bg-gain/15";
  const priceColor = side === "ask" ? "text-loss" : "text-gain";

  return (
    <div className="relative grid grid-cols-[1fr_auto] items-center gap-x-3 overflow-hidden rounded px-2 py-1 font-mono text-sm">
      <div
        className={`absolute inset-y-0 ${side === "ask" ? "right-0" : "left-0"} ${bar} transition-all`}
        style={{ width: `${pct}%` }}
      />
      <span className={`relative ${priceColor}`}>${level.price.toFixed(2)}</span>
      <span className="relative text-mist-muted">{level.quantity}</span>
    </div>
  );
}