.PHONY: dev backend frontend install seed

dev:
	@echo "Starting ReassureAI..."
	@make -j2 backend frontend

backend:
	cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

install:
	cd frontend && npm install
	cd backend && pip install -r requirements.txt

seed:
	cd backend && source venv/bin/activate && python scripts/seed.py