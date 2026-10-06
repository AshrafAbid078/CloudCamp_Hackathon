# Contributing to Meridian Grid

Welcome to the Meridian Grid project! This document outlines the contribution guidelines, project structure, and workflow for the repository.

## Project Structure

The repository is organized to clearly separate concerns:

- `backend/`: **[IMPLEMENTED]** FastAPI services, data pipelines, optimization solver, and polling routines.
- `agent/`: **[PLANNED]** Copilot function-calling service (role-aware).
- `frontend/`: **[PLANNED]** Next.js dashboard (to be built here).
- `data/`: **[IMPLEMENTED]** Contains raw CSVs, processed data, and synthetic datasets.
- `notebooks/eda/`: **[IMPLEMENTED]** Jupyter notebooks for exploratory data analysis and prototyping.
- `docs/`: **[IMPLEMENTED]** Comprehensive project documentation organized by architecture, product, development, and team.
- `scripts/`: **[PLANNED]** Useful project automation scripts (folder not created yet).

## Where Work Happens

- **Backend Work:** All backend logic (API, database, data ingestion, forecasting, dispatch algorithms, poller) should be placed in `backend/`.
- **AI/ML Work:** Prototyping happens in `notebooks/eda/`. Finalized models and features should be implemented in `backend/forecasting/`.
- **Data Work:** Managing datasets happens in `data/`. The data pipelines exist in `backend/data_pipeline/`. Do not commit large generated files unless approved. Raw CSVs are stored in `data/raw/`.
- **Frontend Work:** Next.js and React code will reside in `frontend/`.

## Workflow Guidelines

1. **Branch Workflow:**
   - Create a feature branch from `main`: `git checkout -b feature/your-feature-name`
   - Use descriptive branch names.
   
2. **Pull Request Workflow:**
   - Commit your changes with clear, descriptive commit messages.
   - Push your branch to GitHub and open a Pull Request against `main`.
   - Ensure PRs are reviewed before merging. Do not merge your own PRs without review.

3. **Testing Before PR:**
   - Run tests before creating a PR:
     ```bash
     cd backend
     pytest
     ```
   - Ensure the backend compiles properly without syntax errors.
   - Start the backend locally to verify no broken imports or paths.

## Environment Setup

1. **Clone the repo:**
   ```bash
   git clone <repo-url>
   cd CloudCamp
   ```

2. **Configure Environment:**
   - Copy the `.env.example` file to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Add your Electricity Maps API key (optional — without it the live poller is skipped and the cached data is used). The backend reads `.env` from the repo root or from `backend/`.

3. **Backend Setup:**
   - We recommend using a Python virtual environment (venv or conda).
   - Install dependencies:
     ```bash
     cd backend
     pip install -r requirements.txt
     ```
   - Start the server:
     ```bash
     uvicorn main:app --reload
     ```

## What Should Not Be Committed

- **Cache & Generated Files:** Do not commit `__pycache__`, `*.pyc`, `.pytest_cache`, `.venv`, or `node_modules`.
- **Secrets:** Never commit `.env` files, API keys, passwords, or personal credentials.
- **Local DBs:** Avoid committing local development SQLite databases unless seeded for a specific purpose.
- **Docker files:** This project currently does NOT use Docker. Do not introduce Dockerfiles or docker-compose files.
