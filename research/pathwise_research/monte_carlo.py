"""Geometric Brownian Motion Monte Carlo simulation."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np


@dataclass
class GBMParams:
    s0: float = 200.0
    mu: float = 0.08
    sigma: float = 0.25
    T: float = 1.0
    n_steps: int = 252
    n_paths: int = 10_000
    seed: int | None = 42


def gbm_paths(params: GBMParams) -> dict[str, Any]:
    """
    Simulate GBM: dS = μ S dt + σ S dW

    Returns paths (subset for charting), terminal values, and timing.
    """
    rng = np.random.default_rng(params.seed)
    dt = params.T / params.n_steps
    # Log-Euler discretization
    z = rng.standard_normal((params.n_paths, params.n_steps))
    increments = (params.mu - 0.5 * params.sigma**2) * dt + params.sigma * np.sqrt(dt) * z
    log_paths = np.cumsum(increments, axis=1)
    log_paths = np.concatenate([np.zeros((params.n_paths, 1)), log_paths], axis=1)
    paths = params.s0 * np.exp(log_paths)
    t = np.linspace(0.0, params.T, params.n_steps + 1)
    return {"t": t, "paths": paths, "terminal": paths[:, -1]}


def summarize_paths(
    terminal: np.ndarray,
    paths: np.ndarray,
    t: np.ndarray,
    target_price: float | None = None,
    max_chart_paths: int = 200,
) -> dict[str, Any]:
    """Compute educational statistics and downsampled chart series."""
    mean_path = paths.mean(axis=0)
    p05 = np.percentile(paths, 5, axis=0)
    p95 = np.percentile(paths, 95, axis=0)

    # Downsample paths for frontend
    n = paths.shape[0]
    idx = np.linspace(0, n - 1, min(max_chart_paths, n), dtype=int)
    chart_paths = paths[idx]

    # Histogram of terminal prices
    hist_counts, hist_edges = np.histogram(terminal, bins=40)
    hist_centers = 0.5 * (hist_edges[:-1] + hist_edges[1:])

    stats: dict[str, Any] = {
        "expected_value": float(np.mean(terminal)),
        "median": float(np.median(terminal)),
        "std": float(np.std(terminal, ddof=1)),
        "p05": float(np.percentile(terminal, 5)),
        "p25": float(np.percentile(terminal, 25)),
        "p75": float(np.percentile(terminal, 75)),
        "p95": float(np.percentile(terminal, 95)),
        "min": float(np.min(terminal)),
        "max": float(np.max(terminal)),
    }
    if target_price is not None:
        stats["prob_exceed_target"] = float(np.mean(terminal > target_price))
        stats["target_price"] = target_price

    return {
        "stats": stats,
        "chart": {
            "t": t.tolist(),
            "paths": chart_paths.tolist(),
            "mean": mean_path.tolist(),
            "p05": p05.tolist(),
            "p95": p95.tolist(),
        },
        "distribution": {
            "centers": hist_centers.tolist(),
            "counts": hist_counts.astype(int).tolist(),
        },
    }