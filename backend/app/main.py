"""Pathwise API."""

from __future__ import annotations

from typing import Any, Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .matching import MatchingEngine, OrderType, Side

import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "research"))

from pathwise_research.monte_carlo import GBMParams, gbm_paths, summarize_paths
from pathwise_research.option_pricing import OptionParams, monte_carlo_option_price

app = FastAPI(
    title="Pathwise API",
    description="Educational markets & quantitative finance API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_engines: dict[str, MatchingEngine] = {}


def get_engine(session_id: str = "default") -> MatchingEngine:
    if session_id not in _engines:
        eng = MatchingEngine()
        eng.seed_demo_book()
        _engines[session_id] = eng
    return _engines[session_id]


class OrderRequest(BaseModel):
    session_id: str = "default"
    side: Literal["bid", "ask"]
    order_type: Literal["market", "limit"]
    quantity: int = Field(gt=0, le=1_000_000)
    limit_price: Optional[float] = None




class OptionPriceRequest(BaseModel):
    spot: float = Field(200.0, gt=0)
    strike: float = Field(210.0, gt=0)
    T: float = Field(0.5, gt=0)
    rate: float = Field(0.04, ge=-0.5, le=1)
    sigma: float = Field(0.25, gt=0, le=5)
    option_type: Literal["call", "put"] = "call"
    n_paths: int = Field(50_000, ge=100, le=1_000_000)
    seed: Optional[int] = 42

class MonteCarloRequest(BaseModel):
    s0: float = Field(200.0, gt=0)
    mu: float = Field(0.08, ge=-1, le=2)
    sigma: float = Field(0.25, gt=0, le=5)
    T: float = Field(1.0, gt=0, le=50)
    n_steps: int = Field(252, ge=1, le=2000)
    n_paths: int = Field(10_000, ge=100, le=1_000_000)
    seed: Optional[int] = 42
    target_price: Optional[float] = None
    max_chart_paths: int = Field(150, ge=10, le=500)

class ResetBookRequest(BaseModel):
    session_id: str = "default"
    mid: float = 201.42


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/book")
def get_book(session_id: str = "default", depth: int = 10) -> dict[str, Any]:
    snap = get_engine(session_id).snapshot(depth)
    return {
        "bids": [lvl.__dict__ for lvl in snap.bids],
        "asks": [lvl.__dict__ for lvl in snap.asks],
        "best_bid": snap.best_bid,
        "best_ask": snap.best_ask,
        "mid": snap.mid,
        "spread": snap.spread,
    }


@app.post("/api/orders")
def place_order(req: OrderRequest) -> dict[str, Any]:
    eng = get_engine(req.session_id)
    side = Side.BID if req.side == "bid" else Side.ASK
    otype = OrderType.MARKET if req.order_type == "market" else OrderType.LIMIT
    if otype == OrderType.LIMIT and req.limit_price is None:
        raise HTTPException(400, "limit_price required for limit orders")
    result = eng.submit(side, otype, req.quantity, req.limit_price or 0.0)
    snap = eng.snapshot()
    return {
        "filled_qty": result.filled_qty,
        "avg_price": result.avg_price,
        "status": result.order.status.value,
        "remaining": result.order.remaining,
        "explanation": result.explanation,
        "fills": [f.__dict__ for f in result.fills],
        "book": {
            "bids": [lvl.__dict__ for lvl in snap.bids],
            "asks": [lvl.__dict__ for lvl in snap.asks],
            "best_bid": snap.best_bid,
            "best_ask": snap.best_ask,
            "mid": snap.mid,
            "spread": snap.spread,
        },
    }


@app.post("/api/book/reset")
def reset_book(req: ResetBookRequest) -> dict[str, Any]:
    eng = MatchingEngine()
    eng.seed_demo_book(req.mid)
    _engines[req.session_id] = eng
    snap = eng.snapshot()
    return {
        "bids": [lvl.__dict__ for lvl in snap.bids],
        "asks": [lvl.__dict__ for lvl in snap.asks],
        "best_bid": snap.best_bid,
        "best_ask": snap.best_ask,
        "mid": snap.mid,
        "spread": snap.spread,
    }


@app.post("/api/monte-carlo/gbm")
def run_monte_carlo(req: MonteCarloRequest) -> dict[str, Any]:
    t0 = time.perf_counter()
    params = GBMParams(
        s0=req.s0,
        mu=req.mu,
        sigma=req.sigma,
        T=req.T,
        n_steps=req.n_steps,
        n_paths=req.n_paths,
        seed=req.seed,
    )
    sim = gbm_paths(params)
    summary = summarize_paths(
        sim["terminal"],
        sim["paths"],
        sim["t"],
        target_price=req.target_price,
        max_chart_paths=req.max_chart_paths,
    )
    elapsed_ms = (time.perf_counter() - t0) * 1000
    return {
        "params": req.model_dump(),
        "elapsed_ms": elapsed_ms,
        "n_paths": req.n_paths,
        **summary,
    }


@app.post("/api/options/price")
def price_option(req: OptionPriceRequest) -> dict[str, Any]:
    t0 = time.perf_counter()
    params = OptionParams(
        spot=req.spot,
        strike=req.strike,
        T=req.T,
        rate=req.rate,
        sigma=req.sigma,
        option_type=req.option_type,
        n_paths=req.n_paths,
        seed=req.seed,
    )
    result = monte_carlo_option_price(params)
    result["elapsed_ms"] = (time.perf_counter() - t0) * 1000
    return result
