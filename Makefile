.PHONY: frontend backend install-frontend install-backend matching test-matching bench-matching docker-up

install-frontend:
	cd frontend && npm install

install-backend:
	cd backend && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt

frontend:
	cd frontend && npm run dev

backend:
	cd backend && . .venv/bin/activate && uvicorn app.main:app --reload --port 8000

matching:
	$(MAKE) -C matching-engine

test-matching:
	$(MAKE) -C matching-engine test

bench-matching:
	$(MAKE) -C matching-engine bench

docker-up:
	docker compose up --build