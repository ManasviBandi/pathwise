"""Pathwise API."""

from __future__ import annotations

from typing import Any, Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .matching import MatchingEngine, OrderType, Side

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
