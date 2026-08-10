# Pathwise

Interactive financial markets & quantitative finance learning platform.

Learn by doing: place orders against a live book, run Monte Carlo paths, price options, and work through scenario-based challenges — not static definitions.

> Learn a concept → interact with it → make a decision → see the market/math consequence.

## Architecture

| Service | Role |
|---------|------|
| `frontend/` | Next.js + TypeScript learning UI & labs |
| `backend/` | FastAPI API layer |
| `matching-engine/` | C++ order book & matching engine |
| `research/` | Python Monte Carlo, stats, option pricing |
| `docker-compose.yml` | Optional Postgres + full stack |

## MVP Labs

- **Orders 101** — market/limit orders, order book, matching, slippage explanations
- **Monte Carlo 101** — GBM stock paths, distribution, statistics
- **Learning** — lessons, scenario challenges, local progress

## Quick start (local)

### Prerequisites

- Node.js 18+
- Python 3.10+
- g++ (optional, for C++ matching engine benchmarks)

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

### 3. C++ matching engine (optional)

```bash
cd matching-engine
make
make test
make bench
```

### Docker (optional)

```bash
docker compose up --build
```

## Educational disclaimer

Pathwise is an educational research environment. It is **not** a brokerage, investment advisor, or recommendation engine. All markets and portfolios are simulated.