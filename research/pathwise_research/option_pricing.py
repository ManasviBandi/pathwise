"""European option pricing: Black-Scholes vs Monte Carlo."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

import numpy as np
from scipy.stats import norm

from .monte_carlo import GBMParams, gbm_paths


OptionType = Literal["call", "put"]


@dataclass
class OptionParams:
    spot: float = 200.0
    strike: float = 210.0
    T: float = 0.5
    rate: float = 0.04
    sigma: float = 0.25
    option_type: OptionType = "call"
    n_paths: int = 50_000
    n_steps: int = 1  # European: only terminal matter for MC under BS
    seed: int | None = 42


def black_scholes_price(
    spot: float,
    strike: float,
    T: float,
    rate: float,
    sigma: float,
    option_type: OptionType = "call",
) -> dict[str, float]:
    if T <= 0 or sigma <= 0:
        intrinsic = max(spot - strike, 0.0) if option_type == "call" else max(strike - spot, 0.0)
        return {"price": intrinsic, "delta": 1.0 if intrinsic > 0 else 0.0, "d1": 0.0, "d2": 0.0}

    d1 = (np.log(spot / strike) + (rate + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    if option_type == "call":
        price = spot * norm.cdf(d1) - strike * np.exp(-rate * T) * norm.cdf(d2)
        delta = float(norm.cdf(d1))
    else:
        price = strike * np.exp(-rate * T) * norm.cdf(-d2) - spot * norm.cdf(-d1)
        delta = float(norm.cdf(d1) - 1.0)
    return {"price": float(price), "delta": delta, "d1": float(d1), "d2": float(d2)}


def monte_carlo_option_price(params: OptionParams) -> dict[str, Any]:
    gbm = GBMParams(
        s0=params.spot,
        mu=params.rate,  # risk-neutral
        sigma=params.sigma,
        T=params.T,
        n_steps=max(params.n_steps, 1),
        n_paths=params.n_paths,
        seed=params.seed,
    )
    sim = gbm_paths(gbm)
    terminal = sim["terminal"]
    if params.option_type == "call":
        payoff = np.maximum(terminal - params.strike, 0.0)
    else:
        payoff = np.maximum(params.strike - terminal, 0.0)
    discounted = np.exp(-params.rate * params.T) * payoff
    mc_price = float(np.mean(discounted))
    mc_std = float(np.std(discounted, ddof=1))
    stderr = mc_std / np.sqrt(params.n_paths)

    bs = black_scholes_price(
        params.spot, params.strike, params.T, params.rate, params.sigma, params.option_type
    )

    return {
        "monte_carlo_price": mc_price,
        "monte_carlo_stderr": float(stderr),
        "black_scholes_price": bs["price"],
        "difference": mc_price - bs["price"],
        "n_paths": params.n_paths,
        "explanation": (
            "Monte Carlo and Black–Scholes should converge for European options under GBM. "
            "Small differences are simulation error (standard error shrinks as 1/√N). "
            "Increase the path count to observe the law of large numbers."
        ),
        "payoff_mean": float(np.mean(payoff)),
        "prob_itm": float(np.mean(payoff > 0)),
    }