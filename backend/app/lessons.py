"""Curriculum content for Pathwise MVP learning tracks."""

from __future__ import annotations

from typing import Any, Optional

LESSONS: list[dict[str, Any]] = [
    {
        "id": "markets-bid-ask",
        "track": "MARKETS",
        "order": 1,
        "title": "Bid, Ask & the Spread",
        "summary": "Why every quote has two prices — and what the gap between them means.",
        "concept": (
            "The **bid** is the highest price a buyer is willing to pay. The **ask** (or offer) "
            "is the lowest price a seller will accept. The **spread** is ask − bid. "
            "A tight spread usually signals deep, competitive liquidity; a wide spread often "
            "means thin liquidity or elevated uncertainty."
        ),
        "guided": (
            "Open the Orders Lab. Note the top of book. The mid is halfway between bid and ask — "
            "a reference price, not a price you can always trade."
        ),
        "challenge": {
            "prompt": (
                "The spread suddenly widens from $0.02 to $0.25. What does this most likely suggest?"
            ),
            "type": "choice",
            "options": [
                "Liquidity improved and trading became cheaper",
                "Liquidity thinned or risk rose — crossing the spread is more expensive",
                "The stock was halted forever",
                "Volatility must be exactly zero",
            ],
            "answer_index": 1,
            "explanation": (
                "A wider spread typically means less competitive liquidity or higher perceived risk. "
                "Immediate buys pay more (lift the ask); immediate sells receive less (hit the bid)."
            ),
        },
        "quiz": {
            "prompt": "If the best bid is $201.41 and the best ask is $201.43, what is the spread?",
            "type": "choice",
            "options": ["$0.01", "$0.02", "$0.04", "$201.42"],
            "answer_index": 1,
        },
    },
    {
        "id": "orders-market",
        "track": "ORDERS",
        "order": 2,
        "title": "Market Orders",
        "summary": "Trade now against available liquidity — and learn how slippage appears.",
        "concept": (
            "A **market order** requests immediate execution at the best available prices. "
            "It does not guarantee a price. In a thin book, a large market order **walks the book**, "
            "consuming multiple price levels and producing a worse average fill than the touch."
        ),
        "guided": (
            "In Orders Lab, submit a market buy for 500 shares. Watch which ask levels disappear "
            "and read the execution explanation."
        ),
        "challenge": {
            "prompt": (
                "You need to buy 1,000 shares immediately and accept whatever average price the book "
                "gives you. Which order type should you submit in the lab?"
            ),
            "type": "order",
            "expected": {"side": "bid", "order_type": "market", "min_qty": 1000},
            "hint": "Use a market buy for size ≥ 1000.",
        },
        "quiz": {
            "prompt": "Market orders primarily guarantee:",
            "type": "choice",
            "options": ["A fixed price", "Immediate priority for execution (not price)", "Zero slippage", "A resting quote"],
            "answer_index": 1,
        },
    },
    {
        "id": "orders-limit",
        "track": "ORDERS",
        "order": 3,
        "title": "Limit Orders",
        "summary": "Set your worst acceptable price — and wait for the market to come to you.",
        "concept": (
            "A **limit order** specifies the worst price you will accept. A buy limit at $200.50 "
            "will never pay more than $200.50. If it does not cross the book, it **rests** and "
            "adds liquidity under price-time priority."
        ),
        "guided": (
            "Place a limit buy below the best bid. Confirm it rests. Then place a limit buy at or "
            "above the ask and watch it execute."
        ),
        "challenge": {
            "prompt": (
                "You want to buy 1,000 shares but refuse to pay more than $200.50. "
                "Submit the appropriate order in the Orders Lab (reset the book mid to 201.42 first "
                "if needed — use limit price 200.50)."
            ),
            "type": "order",
            "expected": {"side": "bid", "order_type": "limit", "limit_price": 200.50, "min_qty": 1000},
            "hint": "Limit buy, qty ≥ 1000, limit price 200.50.",
        },
        "quiz": {
            "prompt": "A resting limit buy primarily:",
            "type": "choice",
            "options": [
                "Removes liquidity immediately at any price",
                "Adds liquidity at a chosen price",
                "Always executes at the mid",
                "Cancels after one millisecond by definition",
            ],
            "answer_index": 1,
        },
    },
    {
        "id": "orders-slippage",
        "track": "ORDERS",
        "order": 4,
        "title": "Liquidity & Slippage",
        "summary": "See why size versus depth determines your average fill.",
        "concept": (
            "**Slippage** is the difference between the price you expected (often the touch or mid) "
            "and the average price you actually got. It grows when your order size is large relative "
            "to depth at the inside levels."
        ),
        "guided": (
            "Compare a market buy of 50 shares vs 800 shares on the demo book. "
            "Note how average price worsens as you consume deeper asks."
        ),
        "challenge": {
            "prompt": "Which situation typically increases slippage for a market buy?",
            "type": "choice",
            "options": [
                "Deeper ask size at the touch",
                "Thinner ask liquidity and larger order size",
                "A tighter spread with more depth",
                "Using a limit that never crosses",
            ],
            "answer_index": 1,
        },
        "quiz": {
            "prompt": "Price-time priority means:",
            "type": "choice",
            "options": [
                "Better prices trade first; at the same price, earlier orders trade first",
                "Larger orders always trade first",
                "Market makers always lose",
                "Time priority overrides price",
            ],
            "answer_index": 0,
        },
    },
    {
        "id": "mc-gbm-intro",
        "track": "MONTE CARLO",
        "order": 5,
        "title": "Monte Carlo & GBM",
        "summary": "Simulate thousands of possible price paths under geometric Brownian motion.",
        "concept": (
            "Under **GBM**, returns are driven by a drift μ and volatility σ with a random shock dW: "
            "dS = μS dt + σS dW. Monte Carlo draws many random paths to approximate distributions "
            "of future prices — useful when closed forms are hard or intuition needs a picture."
        ),
        "guided": (
            "In Monte Carlo Lab, set S₀=$200, μ=8%, σ=25%, T=1y, N=10,000. Run. "
            "Inspect the fan of paths, the mean path, and the terminal histogram."
        ),
        "challenge": {
            "prompt": (
                "You simulated 10,000 paths. What happens to a Monte Carlo estimate as you increase "
                "to 100,000 paths (same seed policy aside)?"
            ),
            "type": "choice",
            "options": [
                "Estimates become arbitrarily biased upward",
                "Sampling noise typically shrinks — estimates converge (law of large numbers)",
                "Volatility of the stock must fall to zero",
                "The mean path disappears",
            ],
            "answer_index": 1,
        },
        "quiz": {
            "prompt": "In dS = μS dt + σS dW, σ primarily controls:",
            "type": "choice",
            "options": ["Dividend yield only", "The magnitude of random moves", "The risk-free rate", "Share count"],
            "answer_index": 1,
        },
    },
    {
        "id": "mc-distribution",
        "track": "MONTE CARLO",
        "order": 6,
        "title": "Distributions & Tail Risk",
        "summary": "Read expected value, percentiles, and probability of exceeding a target.",
        "concept": (
            "The terminal-price histogram approximates the predictive distribution under your model. "
            "Expected value is the mean; percentiles describe tails. P(S_T > K) is the fraction of "
            "paths finishing above a target — model-dependent, not a forecast guarantee."
        ),
        "guided": (
            "Set a target price above S₀ and read Prob(exceed). Raise σ and observe how the "
            "distribution widens and tail probabilities change."
        ),
        "challenge": {
            "prompt": "Raising volatility σ while holding μ fixed generally:",
            "type": "choice",
            "options": [
                "Narrows the terminal distribution",
                "Widens the terminal distribution and fattened outcome range",
                "Removes all uncertainty",
                "Forces every path to the mean",
            ],
            "answer_index": 1,
        },
        "quiz": {
            "prompt": "A reproducible Monte Carlo experiment should set:",
            "type": "choice",
            "options": ["No seed ever", "A random seed (and record it)", "Only one path", "σ = 0 always"],
            "answer_index": 1,
        },
    },
    {
        "id": "options-mc-vs-bs",
        "track": "OPTIONS PRICING",
        "order": 7,
        "title": "Monte Carlo vs Black–Scholes",
        "summary": "Price a European option two ways and watch convergence with path count.",
        "concept": (
            "For a European call/put on GBM with constant rates/vol, **Black–Scholes** gives a "
            "closed-form price. Monte Carlo discounts simulated payoffs under the risk-neutral "
            "measure. Differences are mostly simulation error; stderr scales like 1/√N."
        ),
        "guided": (
            "Price a 6-month call: S=200, K=210, σ=25%, r=4%. Compare MC vs BS at 1k, 10k, 100k paths."
        ),
        "challenge": {
            "prompt": "Why might MC and BS differ slightly for the same European GBM parameters?",
            "type": "choice",
            "options": [
                "Because BS cannot price Europeans",
                "Finite-sample simulation error (which shrinks as N grows)",
                "Because MC ignores the strike",
                "Because interest rates must be negative",
            ],
            "answer_index": 1,
        },
        "quiz": {
            "prompt": "Risk-neutral Monte Carlo for option pricing replaces μ with approximately:",
            "type": "choice",
            "options": ["Implied dividends only", "The risk-free rate r", "Historical Sharpe", "Zero always"],
            "answer_index": 1,
        },
    },
    {
        "id": "equities-basics",
        "track": "EQUITIES",
        "order": 8,
        "title": "Shares & Market Cap",
        "summary": "Connect share price, shares outstanding, and firm value — carefully.",
        "concept": (
            "**Market capitalization** ≈ share price × shares outstanding. It is not cash in the "
            "bank, not enterprise value, and not a guarantee of liquidity. Price moves with "
            "information, risk, and order flow; volume measures traded shares, not the same as "
            "depth in the book."
        ),
        "guided": "Reflect: a $200 stock with 1B shares has a very different notional size than a $200 stock with 1M shares.",
        "challenge": {
            "prompt": "Market cap most nearly equals:",
            "type": "choice",
            "options": [
                "Price × shares outstanding",
                "Price × daily volume",
                "Bid-ask spread × depth",
                "Earnings ÷ price",
            ],
            "answer_index": 0,
        },
        "quiz": {
            "prompt": "High trading volume alone guarantees:",
            "type": "choice",
            "options": ["Tight spreads forever", "Nothing by itself — depth and volatility still matter", "Zero risk", "Profitable strategies"],
            "answer_index": 1,
        },
    },
]


def get_lesson(lesson_id: str) -> Optional[dict[str, Any]]:
    for lesson in LESSONS:
        if lesson["id"] == lesson_id:
            return lesson
    return None


TRACK_ORDER = [
    "MARKETS",
    "ORDERS",
    "EQUITIES",
    "FX",
    "DERIVATIVES",
    "PROBABILITY",
    "MONTE CARLO",
    "OPTIONS PRICING",
    "RISK",
    "QUANT STRATEGIES",
]


def progress_summary(user_data: dict[str, Any]) -> dict[str, Any]:
    by_track: dict[str, dict[str, int]] = {}
    for lesson in LESSONS:
        track = lesson["track"]
        by_track.setdefault(track, {"total": 0, "done": 0})
        by_track[track]["total"] += 1
        entry = user_data.get(lesson["id"], {})
        if entry.get("completed") or entry.get("challenge_passed") or (entry.get("quiz_score") or 0) >= 1:
            by_track[track]["done"] += 1

    tracks = []
    for name in TRACK_ORDER:
        info = by_track.get(name)
        if not info:
            tracks.append({"track": name, "percent": 0, "done": 0, "total": 0})
            continue
        pct = int(round(100 * info["done"] / info["total"])) if info["total"] else 0
        tracks.append({"track": name, "percent": pct, "done": info["done"], "total": info["total"]})

    completed = sum(1 for v in user_data.values() if v.get("completed") or v.get("challenge_passed"))
    return {
        "tracks": tracks,
        "lessons_completed": completed,
        "lessons_total": len(LESSONS),
        "raw": user_data,
    }