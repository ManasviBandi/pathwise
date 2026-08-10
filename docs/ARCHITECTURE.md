# Decision: Matching engine dual implementation
#
# C++ (`matching-engine/`) is the performance-oriented, tested reference for
# price-time priority matching. The FastAPI service uses a Python mirror
# (`backend/app/matching.py`) so the educational UI runs without a native build.
# Behavior and demo seeding are intentionally aligned; C++ benchmarks demonstrate
# engineering depth for portfolio review.

# Decision: Progress storage (MVP)
#
# Progress is in-memory on the API (plus localStorage on the client) so the
# core labs work with zero infrastructure. PostgreSQL is wired in docker-compose
# for the next phase (auth + durable progress) without blocking MVP learning.

# Decision: Monte Carlo in Python (NumPy)
#
# Vectorized NumPy GBM is clear, seedable, and fast enough for 10k–100k paths in
# an interactive lab. C++ acceleration can be added later for 1M+ path races.
## Matching engine (C++)

The C++ engine is the performance-oriented reference for price-time priority.
Bids are sorted descending, asks ascending; FIFO within a price level.
Market orders walk available liquidity; unfilled limit remainder rests on the book.

## Python matching façade

FastAPI exposes a Python mirror of the C++ matching semantics so the Orders Lab runs without a native build.
Behavior (price-time priority, demo ladder, fill explanations) is intentionally aligned with the C++ reference.
