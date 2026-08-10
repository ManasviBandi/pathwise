"""Python mirror of the C++ matching engine for the API layer.

The C++ engine is the performance-oriented reference implementation.
This module keeps the educational API runnable without a native build.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class Side(str, Enum):
    BID = "bid"
    ASK = "ask"


class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"


class OrderStatus(str, Enum):
    NEW = "new"
    PARTIALLY_FILLED = "partially_filled"
    FILLED = "filled"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


@dataclass
class Order:
    id: int
    side: Side
    type: OrderType
    price: float
    quantity: int
    remaining: int
    status: OrderStatus = OrderStatus.NEW
    timestamp: int = 0


@dataclass
class Fill:
    maker_id: int
    taker_id: int
    price: float
    quantity: int


@dataclass
class Level:
    price: float
    quantity: int
    order_count: int


@dataclass
class BookSnapshot:
    bids: list[Level]
    asks: list[Level]
    best_bid: Optional[float]
    best_ask: Optional[float]
    mid: Optional[float]
    spread: Optional[float]


@dataclass
class MatchResult:
    order: Order
    fills: list[Fill]
    avg_price: float
    filled_qty: int
    explanation: str


class OrderBook:
    def __init__(self) -> None:
        self._bids: dict[float, list[int]] = {}
        self._asks: dict[float, list[int]] = {}
        self._orders: dict[int, Order] = {}

    def rest(self, order: Order) -> None:
        order.remaining = order.quantity
        order.status = OrderStatus.NEW
        self._orders[order.id] = order
        book = self._bids if order.side == Side.BID else self._asks
        book.setdefault(order.price, []).append(order.id)

    def cancel(self, order_id: int) -> bool:
        order = self._orders.get(order_id)
        if not order:
            return False
        book = self._bids if order.side == Side.BID else self._asks
        q = book.get(order.price, [])
        if order_id in q:
            q.remove(order_id)
        if not q and order.price in book:
            del book[order.price]
        del self._orders[order_id]
        return True

    def match(self, taker: Order) -> MatchResult:
        taker.remaining = taker.quantity
        fills: list[Fill] = []
        notional = 0.0
        filled = 0

        def can_cross(book_price: float) -> bool:
            if taker.type == OrderType.MARKET:
                return True
            if taker.side == Side.BID:
                return book_price <= taker.price + 1e-12
            return book_price + 1e-12 >= taker.price

        if taker.side == Side.BID:
            while taker.remaining > 0 and self._asks:
                px = min(self._asks.keys())
                if not can_cross(px):
                    break
                queue = self._asks[px]
                while taker.remaining > 0 and queue:
                    maker = self._orders[queue[0]]
                    qty = min(taker.remaining, maker.remaining)
                    fills.append(Fill(maker.id, taker.id, px, qty))
                    notional += px * qty
                    filled += qty
                    taker.remaining -= qty
                    maker.remaining -= qty
                    if maker.remaining == 0:
                        maker.status = OrderStatus.FILLED
                        queue.pop(0)
                        del self._orders[maker.id]
                    else:
                        maker.status = OrderStatus.PARTIALLY_FILLED
                if not queue:
                    del self._asks[px]
        else:
            while taker.remaining > 0 and self._bids:
                px = max(self._bids.keys())
                if not can_cross(px):
                    break
                queue = self._bids[px]
                while taker.remaining > 0 and queue:
                    maker = self._orders[queue[0]]
                    qty = min(taker.remaining, maker.remaining)
                    fills.append(Fill(maker.id, taker.id, px, qty))
                    notional += px * qty
                    filled += qty
                    taker.remaining -= qty
                    maker.remaining -= qty
                    if maker.remaining == 0:
                        maker.status = OrderStatus.FILLED
                        queue.pop(0)
                        del self._orders[maker.id]
                    else:
                        maker.status = OrderStatus.PARTIALLY_FILLED
                if not queue:
                    del self._bids[px]

        if filled == 0:
            taker.status = OrderStatus.REJECTED if taker.type == OrderType.MARKET else OrderStatus.NEW
        elif taker.remaining == 0:
            taker.status = OrderStatus.FILLED
        else:
            taker.status = OrderStatus.PARTIALLY_FILLED

        if taker.type == OrderType.LIMIT and taker.remaining > 0 and taker.status != OrderStatus.REJECTED:
            resting = Order(
                id=taker.id,
                side=taker.side,
                type=taker.type,
                price=taker.price,
                quantity=taker.remaining,
                remaining=taker.remaining,
                status=OrderStatus.NEW,
                timestamp=taker.timestamp,
            )
            self.rest(resting)

        avg = notional / filled if filled else 0.0
        explanation = self._explain(taker, fills, avg, filled)
        return MatchResult(taker, fills, avg, filled, explanation)

    def snapshot(self, depth: int = 10) -> BookSnapshot:
        bids: list[Level] = []
        asks: list[Level] = []
        for px in sorted(self._bids.keys(), reverse=True)[:depth]:
            q = self._bids[px]
            qty = sum(self._orders[i].remaining for i in q)
            bids.append(Level(px, qty, len(q)))
        for px in sorted(self._asks.keys())[:depth]:
            q = self._asks[px]
            qty = sum(self._orders[i].remaining for i in q)
            asks.append(Level(px, qty, len(q)))
        best_bid = bids[0].price if bids else None
        best_ask = asks[0].price if asks else None
        mid = (best_bid + best_ask) / 2 if best_bid is not None and best_ask is not None else None
        spread = (best_ask - best_bid) if best_bid is not None and best_ask is not None else None
        return BookSnapshot(bids, asks, best_bid, best_ask, mid, spread)

    def _explain(self, taker: Order, fills: list[Fill], avg: float, filled: int) -> str:
        side = "buy" if taker.side == Side.BID else "sell"
        typ = "market" if taker.type == OrderType.MARKET else "limit"
        if filled == 0:
            if taker.type == OrderType.MARKET:
                return (
                    f"Your market order to {side} {taker.quantity} shares found no liquidity "
                    "and was rejected."
                )
            return (
                f"You submitted a limit {side} for {taker.quantity} @ ${taker.price:.2f}. "
                "It did not cross the book and rests as a working order."
            )
        levels = len({round(f.price, 4) for f in fills})
        msg = (
            f"You submitted a {typ} order to {side} {taker.quantity} shares. "
            f"The order consumed liquidity at {levels} price level{'s' if levels != 1 else ''}, "
            f"filling {filled} shares at an average execution price of ${avg:.2f}."
        )
        if taker.type == OrderType.MARKET and levels > 1:
            msg += " Walking multiple levels is how market orders create slippage when liquidity is thin."
        if taker.remaining > 0 and taker.type == OrderType.LIMIT:
            msg += f" The unfilled remainder ({taker.remaining}) rests on the book."
        return msg


@dataclass
class MatchingEngine:
    book: OrderBook = field(default_factory=OrderBook)
    _id: int = 0
    _time: int = 0

    def next_id(self) -> int:
        self._id += 1
        return self._id

    def seed_demo_book(self, mid: float = 201.42, base_qty: int = 100) -> None:
        ask_offsets = [0.01, 0.02, 0.03]
        bid_offsets = [0.01, 0.02, 0.03]
        ask_qtys = [500, 250, 100]
        bid_qtys = [200, 350, 100]
        scale = max(base_qty // 100, 1)
        for i in range(3):
            self._time += 1
            self.book.rest(
                Order(
                    id=self.next_id(),
                    side=Side.ASK,
                    type=OrderType.LIMIT,
                    price=round(mid + ask_offsets[i], 2),
                    quantity=ask_qtys[i] * scale,
                    remaining=ask_qtys[i] * scale,
                    timestamp=self._time,
                )
            )
            self._time += 1
            self.book.rest(
                Order(
                    id=self.next_id(),
                    side=Side.BID,
                    type=OrderType.LIMIT,
                    price=round(mid - bid_offsets[i], 2),
                    quantity=bid_qtys[i] * scale,
                    remaining=bid_qtys[i] * scale,
                    timestamp=self._time,
                )
            )

    def submit(
        self, side: Side, order_type: OrderType, quantity: int, limit_price: float = 0.0
    ) -> MatchResult:
        self._time += 1
        order = Order(
            id=self.next_id(),
            side=side,
            type=order_type,
            price=limit_price,
            quantity=quantity,
            remaining=quantity,
            timestamp=self._time,
        )
        return self.book.match(order)

    def snapshot(self, depth: int = 10) -> BookSnapshot:
        return self.book.snapshot(depth)