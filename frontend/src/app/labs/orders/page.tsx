"use client";

import { useCallback, useEffect, useState } from "react";
import { api, BookSnapshot, OrderResult } from "@/lib/api";
import { OrderBookView } from "@/components/OrderBookView";

export default function OrdersLabPage() {
  const [book, setBook] = useState<BookSnapshot | null>(null);
  const [side, setSide] = useState<"bid" | "ask">("bid");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [qty, setQty] = useState(500);
  const [limitPrice, setLimitPrice] = useState(201.4);
  const [log, setLog] = useState<OrderResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const snap = await api.getBook();
    setBook(snap);
  }, []);

  useEffect(() => {
    refresh().catch((e) => setError(String(e.message || e)));
  }, [refresh]);

  async function reset() {
    setBusy(true);
    setError(null);
    try {
      const snap = await api.resetBook();
      setBook(snap);
      setLog([]);
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const result = await api.placeOrder({
        side,
        order_type: orderType,
        quantity: qty,
        limit_price: orderType === "limit" ? limitPrice : undefined,
      });
      setBook(result.book);
      setLog((prev) => [result, ...prev].slice(0, 12));
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-mist-dim">Orders Lab</p>
        <h1 className="mt-1 text-2xl font-semibold text-mist">Matching engine playground</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist-muted">
          Place market and limit orders against a price-time priority book. Every fill comes with an
          explanation of what liquidity was consumed.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <OrderBookView book={book} />

        <div className="space-y-4">
          <div className="panel p-4">
            <p className="mb-3 text-xs uppercase tracking-wider text-mist-dim">Ticket</p>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`rounded-md py-2 text-sm font-medium ${
                  side === "bid" ? "bg-gain/20 text-gain" : "bg-ink text-mist-muted"
                }`}
                onClick={() => setSide("bid")}
              >
                Buy
              </button>
              <button
                type="button"
                className={`rounded-md py-2 text-sm font-medium ${
                  side === "ask" ? "bg-loss/20 text-loss" : "bg-ink text-mist-muted"
                }`}
                onClick={() => setSide("ask")}
              >
                Sell
              </button>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`rounded-md border py-2 text-sm ${
                  orderType === "market"
                    ? "border-accent text-accent"
                    : "border-ink-border text-mist-muted"
                }`}
                onClick={() => setOrderType("market")}
              >
                Market
              </button>
              <button
                type="button"
                className={`rounded-md border py-2 text-sm ${
                  orderType === "limit"
                    ? "border-accent text-accent"
                    : "border-ink-border text-mist-muted"
                }`}
                onClick={() => setOrderType("limit")}
              >
                Limit
              </button>
            </div>
            <label className="label">Quantity</label>
            <input
              className="input mb-3"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
            {orderType === "limit" && (
              <>
                <label className="label">Limit price</label>
                <input
                  className="input mb-3"
                  type="number"
                  step={0.01}
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(Number(e.target.value))}
                />
              </>
            )}
            <div className="flex gap-2">
              <button type="button" className="btn-primary flex-1" disabled={busy} onClick={submit}>
                Submit order
              </button>
              <button type="button" className="btn-ghost" disabled={busy} onClick={reset}>
                Reset
              </button>
            </div>
            {error && <p className="mt-3 text-xs text-loss">{error}</p>}
          </div>

          <div className="panel">
            <div className="panel-header">Execution tape</div>
            <div className="max-h-72 space-y-3 overflow-y-auto p-4">
              {log.length === 0 && (
                <p className="text-sm text-mist-dim">Submit an order to see matching commentary.</p>
              )}
              {log.map((item, i) => (
                <div key={i} className="rounded-md border border-ink-border bg-ink/40 p-3 text-sm">
                  <p className="text-mist-muted">{item.explanation}</p>
                  <p className="mt-2 font-mono text-xs text-mist-dim">
                    filled {item.filled_qty} · avg{" "}
                    {item.avg_price ? `$${item.avg_price.toFixed(2)}` : "—"} · {item.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}