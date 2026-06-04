# =============================================================================
#  Road Warrior — Monorepo Makefile
# =============================================================================
#  Usage:  make <target>
#  Run `make` (no args) or `make help` to list all targets.
# =============================================================================

# ---------- Config -----------------------------------------------------------
PYTHON       := python3
PIP          := $(PYTHON) -m pip
COMPOSE      := docker compose
BACKEND_DIR  := backend
FRONTEND_DIR := frontend

# Show help by default
.DEFAULT_GOAL := help

# ---------- Help -------------------------------------------------------------
.PHONY: help
help: ## Show this help message
	@echo ""
	@echo "  🚗 Road Warrior — available targets"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""

# ---------- Install ----------------------------------------------------------
.PHONY: install
install: install-backend install-frontend ## Install backend + frontend deps

.PHONY: install-backend
install-backend: ## Install backend Python dependencies
	cd $(BACKEND_DIR) && $(PIP) install -r requirements-dev.txt

.PHONY: install-frontend
install-frontend: ## Install frontend Node dependencies
	cd $(FRONTEND_DIR) && npm install

# ---------- Database (local docker) -----------------------------------------
.PHONY: db-up
db-up: ## Start local Postgres via docker-compose
	$(COMPOSE) up -d db

.PHONY: db-down
db-down: ## Stop local Postgres
	$(COMPOSE) down

.PHONY: db-shell
db-shell: ## Open psql shell into local Postgres
	$(COMPOSE) exec db psql -U roadwarrior -d roadwarrior

# ---------- Database (Alembic) ----------------------------------------------
.PHONY: db-migrate
db-migrate: ## Apply all pending Alembic migrations
	cd $(BACKEND_DIR) && alembic upgrade head

.PHONY: db-rollback
db-rollback: ## Roll back the last Alembic migration
	cd $(BACKEND_DIR) && alembic downgrade -1

.PHONY: db-reset
db-reset: ## Drop all tables, re-create, and re-apply all migrations
	cd $(BACKEND_DIR) && alembic downgrade base && alembic upgrade head

.PHONY: db-revision
db-revision: ## Create a new Alembic migration (usage: make db-revision m="message")
	cd $(BACKEND_DIR) && alembic revision --autogenerate -m "$(m)"

.PHONY: db-history
db-history: ## Show Alembic migration history
	cd $(BACKEND_DIR) && alembic history

# ---------- Seed / Sample data ----------------------------------------------
.PHONY: seed
seed: ## Seed sample data (implemented in a later PR)
	@echo "🌱  Seed script not implemented yet — will arrive in PR #2."

# ---------- Dev servers ------------------------------------------------------
.PHONY: backend
backend: ## Run FastAPI dev server (with reload)
	cd $(BACKEND_DIR) && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

.PHONY: frontend
frontend: ## Run Next.js dev server
	cd $(FRONTEND_DIR) && npm run dev

# ---------- Docker stack -----------------------------------------------------
.PHONY: docker-up
docker-up: ## Start full local stack (db + backend + frontend)
	$(COMPOSE) up --build

.PHONY: docker-down
docker-down: ## Stop full local stack
	$(COMPOSE) down

.PHONY: docker-logs
docker-logs: ## Tail logs from all services
	$(COMPOSE) logs -f

.PHONY: docker-clean
docker-clean: ## Stop stack + remove volumes
	$(COMPOSE) down -v

# ---------- Testing & quality ------------------------------------------------
.PHONY: test
test: ## Run backend tests
	cd $(BACKEND_DIR) && pytest

.PHONY: test-cov
test-cov: ## Run backend tests with coverage
	cd $(BACKEND_DIR) && pytest --cov=app --cov-report=term-missing

.PHONY: lint
lint: lint-backend lint-frontend ## Run all linters

.PHONY: lint-backend
lint-backend: ## Lint backend (ruff + mypy)
	cd $(BACKEND_DIR) && ruff check . && mypy app

.PHONY: lint-frontend
lint-frontend: ## Lint frontend (next lint)
	cd $(FRONTEND_DIR) && npm run lint

.PHONY: format
format: format-backend format-frontend ## Run all formatters

.PHONY: format-backend
format-backend: ## Format backend (black + ruff)
	cd $(BACKEND_DIR) && black . && ruff check --fix .

.PHONY: format-frontend
format-frontend: ## Format frontend (prettier)
	cd $(FRONTEND_DIR) && npm run format

# ---------- Cleanup ----------------------------------------------------------
.PHONY: clean
clean: ## Remove caches and build artifacts
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
	rm -f backend/.coverage backend/htmlcov/index.html
	@echo "✨  Cleaned."
