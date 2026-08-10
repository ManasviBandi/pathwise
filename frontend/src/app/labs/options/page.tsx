"use client";

import { useState } from "react";
import { api } from "@/lib/api";

type OptionResult = {
  monte_carlo_price: number;
  monte_carlo_stderr: number;
  black_scholes_price: number;
  difference: number;
  n_paths: number;
  explanation: string;
  elapsed_ms: number;
  prob_itm: number;
};

export default function OptionsLabPage() {
  const [spot, setSpot] = useState(200);
  const [strike, setStrike] = useState(210);
  const [T, setT] = useState(0.5);
  const [rate, setRate] = useState(0.04);
  const [sigma, setSigma] = useState(0.25);
  const [optionType, setOptionType] = useState<"call" | "put">("call");
  const [nPaths, setNPaths] = useState(50000);
  const [seed, setSeed] = useState(42);
  const [result, setResult] = useState<OptionResult | null>(null);
  const [history, setHistory] = useState<OptionResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const data = (await api.priceOption({
        spot,
        strike,
        T,
        rate,
        sigma,
        option_type: optionType,
        n_paths: nPaths,
        seed,
      })) as OptionResult;
      setResult(data);
      setHistory((h) => [data, ...h].slice(0, 8));
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-mist-dim">Options Lab</p>
        <h1 className="mt-1 text-2xl font-semibold text-mist">Monte Carlo vs Black–Scholes</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist-muted">
          Price a European option two ways. Raise the simulation count and watch Monte Carlo
          converge toward the closed form — a live demo of the law of large numbers.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="panel space-y-3 p-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`rounded-md border py-2 text-sm ${
                optionType === "call" ? "border-gain text-gain" : "border-ink-border text-mist-muted"
              }`}
              onClick={() => setOptionType("call")}
            >
              Call
            </button>
            <button
              type="button"
              className={`rounded-md border py-2 text-sm ${
                optionType === "put" ? "border-loss text-loss" : "border-ink-border text-mist-muted"
              }`}
              onClick={() => setOptionType("put")}
            >
              Put
            </button>
          </div>
          <Num label="Spot" value={spot} set={setSpot} />
          <Num label="Strike" value={strike} set={setStrike} />
          <Num label="Expiration (years)" value={T} set={setT} step={0.05} />
          <Num label="Risk-free rate" value={rate} set={setRate} step={0.005} />
          <Num label="Volatility" value={sigma} set={setSigma} step={0.01} />
          <div>
            <label className="label">Simulations</label>
            <select
              className="input"
              value={nPaths}
              onChange={(e) => setNPaths(Number(e.target.value))}
            >
              {[1000, 10000, 50000, 100000, 250000].map((n) => (
                <option key={n} value={n}>
                  {n.toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          <Num label="Seed" value={seed} set={setSeed} step={1} />
          <button type="button" className="btn-primary w-full" disabled={busy} onClick={run}>
            {busy ? "Pricing…" : "Price option"}
          </button>
          {error && <p className="text-xs text-loss">{error}</p>}
        </div>

        <div className="space-y-4">
          {result ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="stat">
                  <div className="stat-label">Monte Carlo</div>
                  <div className="stat-value text-lg">${result.monte_carlo_price.toFixed(4)}</div>
                  <p className="mt-1 font-mono text-[10px] text-mist-dim">
                    stderr ±{result.monte_carlo_stderr.toFixed(4)}
                  </p>
                </div>
                <div className="stat">
                  <div className="stat-label">Black–Scholes</div>
                  <div className="stat-value text-lg">${result.black_scholes_price.toFixed(4)}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Difference (MC − BS)</div>
                  <div
                    className={`stat-value text-lg ${
                      Math.abs(result.difference) < 2 * result.monte_carlo_stderr
                        ? "text-gain"
                        : "text-warn"
                    }`}
                  >
                    {result.difference >= 0 ? "+" : ""}
                    {result.difference.toFixed(4)}
                  </div>
                </div>
              </div>
              <div className="panel p-4 text-sm leading-relaxed text-mist-muted">
                {result.explanation}
                <p className="mt-2 font-mono text-xs text-mist-dim">
                  N={result.n_paths.toLocaleString()} · P(ITM)={(result.prob_itm * 100).toFixed(1)}% ·{" "}
                  {result.elapsed_ms.toFixed(0)} ms
                </p>
              </div>
            </>
          ) : (
            <div className="panel flex min-h-[180px] items-center justify-center text-sm text-mist-dim">
              Configure parameters and price an option.
            </div>
          )}

          {history.length > 0 && (
            <div className="panel overflow-hidden">
              <div className="panel-header">Convergence tape</div>
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] uppercase tracking-wider text-mist-dim">
                  <tr className="border-b border-ink-border">
                    <th className="px-4 py-2">N</th>
                    <th className="px-4 py-2">MC</th>
                    <th className="px-4 py-2">BS</th>
                    <th className="px-4 py-2">Δ</th>
                    <th className="px-4 py-2">stderr</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  {history.map((h, i) => (
                    <tr key={i} className="border-b border-ink-border/70">
                      <td className="px-4 py-2 text-mist-muted">{h.n_paths.toLocaleString()}</td>
                      <td className="px-4 py-2">{h.monte_carlo_price.toFixed(4)}</td>
                      <td className="px-4 py-2">{h.black_scholes_price.toFixed(4)}</td>
                      <td className="px-4 py-2">{h.difference.toFixed(4)}</td>
                      <td className="px-4 py-2 text-mist-dim">{h.monte_carlo_stderr.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Num({
  label,
  value,
  set,
  step = 1,
}: {
  label: string;
  value: number;
  set: (n: number) => void;
  step?: number;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        type="number"
        step={step}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
      />
    </div>
  );
}