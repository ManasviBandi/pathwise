"""Unit tests for educational matching engine."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.matching import MatchingEngine, OrderType, Side


def test_market_buy_avg():
    eng = MatchingEngine()
    eng.seed_demo_book(201.42)
    r = eng.submit(Side.BID, OrderType.MARKET, 500)
    assert r.filled_qty == 500
    assert abs(r.avg_price - 201.43) < 1e-6


def test_limit_rests():
    eng = MatchingEngine()
    eng.seed_demo_book(201.42)
    r = eng.submit(Side.BID, OrderType.LIMIT, 100, 200.5)
    assert r.filled_qty == 0
    assert any(abs(lvl.price - 200.5) < 1e-9 for lvl in eng.snapshot().bids)