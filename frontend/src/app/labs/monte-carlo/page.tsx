"use client";

import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";

type McResult = {
  elapsed_ms: number;
  n_paths: number;
  stats: Record<string, number>;
  chart: {
    t: number[];
    paths: number[][];
    mean: number[];
    p05: number[];
    p95: number[];
  };
  distribution: { centers: number[]; counts: number[] };
};

export default function MonteCarloLabPage() {
  const [s0, setS0] = useState(200);
  const [mu, setMu] = useState(0.08);
  const [sigma, setSigma] = useState(0.25);
  const [T, setT] = useState(1);
  const [nSteps, setNSteps] = useState(252);
  const [nPaths, setNPaths] = useState(10000);
  const [seed, setSeed] = useState(42);
  const [target, setTarget] = useState(220);
  const [result, setResult] = useState<McResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pathChart = useMemo(() => {
    if (!result) return [];
    const { t, mean, p05, p95, paths } = result.chart;
    return t.map((ti, i) => {
      const row: Record<string, number> = {
        t: Number(ti.toFixed(3)),
        mean: mean[i],
        p05: p05[i],
        p95: p95[i],
      };
      // show a subset of individual paths
      const show = Math.min(40, paths.length);
      for (let p = 0; p < show; p++) {
        row[`p${p}`] = paths[p][i];
      }
      return row;
    });
  }, [result]);

  const hist = useMemo(() => {
    if (!result) return [];
    return result.distribution.centers.map((c, i) => ({
      price: Number(c.toFixed(1)),
      count: result.distribution.counts[i],
    }));
  }, [result]);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const data = (await api.monteCarlo({
        s0,
        mu,
        sigma,
        T,
        n_steps: nSteps,
        n_paths: nPaths,
        seed,
        target_price: target,
        max_chart_paths: 80,
      })) as McResult;
      setResult(data);
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  }

  const pathKeys = useMemo(() => {
    if (!pathChart.length) return [] as string[];
    return Object.keys(pathChart[0]).filter((k) => k.startsWith("p"));
  }, [pathChart]);

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-mist-dim">Monte Carlo Lab</p>
        <h1 className="mt-1 text-2xl font-semibold text-mist">Geometric Brownian Motion</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist-muted">
          dS = μS dt + σS dW — configure drift and volatility, then watch an ensemble of paths and
          the terminal distribution.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="panel space-y-3 p-4">
          <Field label="Initial price" value={s0} set={setS0} step={1} />
          <Field label="Expected return (μ)" value={mu} set={setMu} step={0.01} />
          <Field label="Volatility (σ)" value={sigma} set={setSigma} step={0.01} />
          <Field label="Time horizon (years)" value={T} set={setT} step={0.25} />
          <Field label="Time steps" value={nSteps} set={setNSteps} step={1} />
          <div>
            <label className="label">Simulations</label>
            <select
              className="input"
              value={nPaths}
              onChange={(e) => setNPaths(Number(e.target.value))}
            >
              {[1000, 10000, 50000, 100000].map((n) => (
                <option key={n} value={n}>
                  {n.toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          <Field label="Seed" value={seed} set={setSeed} step={1} />
          <Field label="Target price" value={target} set={setTarget} step={1} />
          <button type="button" className="btn-primary w-full" disabled={busy} onClick={run}>
            {busy ? "Running…" : "Run simulation"}
          </button>
          {error && <p className="text-xs text-loss">{error}</p>}
          {result && (
            <p className="font-mono text-xs text-mist-dim">
              {result.n_paths.toLocaleString()} paths · {result.elapsed_ms.toFixed(0)} ms
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="panel p-2">
            <div className="panel-header mb-2 border-0 px-2">Price paths · mean · 5–95% band</div>
            <div className="h-72 w-full">
              {pathChart.length > 0 ? (
                <ResponsiveContainer>
                  <ComposedChart data={pathChart}>
                    <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
                    <XAxis dataKey="t" tick={{ fill: "#64748B", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#64748B", fontSize: 11 }} domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{
                        background: "#111827",
                        border: "1px solid #1F2937",
                        borderRadius: 8,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="p95"
                      stroke="none"
                      fill="#60A5FA"
                      fillOpacity={0.08}
                    />
                    <Area
                      type="monotone"
                      dataKey="p05"
                      stroke="none"
                      fill="#0B1120"
                      fillOpacity={1}
                    />
                    {pathKeys.map((k) => (
                      <Line
                        key={k}
                        type="monotone"
                        dataKey={k}
                        stroke="#334155"
                        strokeWidth={1}
                        dot={false}
                        legendType="none"
                        isAnimationActive={false}
                      />
                    ))}
                    <Line
                      type="monotone"
                      dataKey="mean"
                      stroke="#60A5FA"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>
          </div>

          <div className="panel p-2">
            <div className="panel-header mb-2 border-0 px-2">Terminal price distribution</div>
            <div className="h-56 w-full">
              {hist.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={hist}>
                    <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
                    <XAxis dataKey="price" tick={{ fill: "#64748B", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#64748B", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#111827",
                        border: "1px solid #1F2937",
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="count" fill="#34D399" fillOpacity={0.75} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>
          </div>

          {result && (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5">
              <Stat label="E[S_T]" value={`$${result.stats.expected_value.toFixed(2)}`} />
              <Stat label="Median" value={`$${result.stats.median.toFixed(2)}`} />
              <Stat label="Std" value={`$${result.stats.std.toFixed(2)}`} />
              <Stat label="5% / 95%" value={`$${result.stats.p05.toFixed(0)} / $${result.stats.p95.toFixed(0)}`} />
              <Stat
                label={`P(S_T > ${target})`}
                value={`${((result.stats.prob_exceed_target ?? 0) * 100).toFixed(1)}%`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  set,
  step,
}: {
  label: string;
  value: number;
  set: (n: number) => void;
  step: number;
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-mist-dim">
      Run a simulation to populate charts.
    </div>
  );
}