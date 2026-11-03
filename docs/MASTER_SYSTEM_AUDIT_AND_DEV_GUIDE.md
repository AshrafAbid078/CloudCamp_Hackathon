# Meridian Grid engineering guide

Meridian Grid is a Bangladesh-focused planning prototype. Next.js calls FastAPI for source-labelled forecasts, synthetic-portfolio optimization, account management and saved plan review. SQLite is used locally; Turso is optional for hosted persistence.

## Main flows

1. Forecast: regional Open-Meteo weather and Electricity Maps carbon when available, otherwise explicit archive/persistence fallback.
2. Planning: synthetic processes and batteries plus optional custom machines enter one PuLP portfolio solver.
3. Review: the UI shows signed modeled comparisons; saving persists the complete result and assumptions. Overrides save a new plan.
4. Copilot: local read-only tools serve guest requests. Authenticated users may use bounded Gemini native function calling.
5. Documentation: backend visibility/window controls authorize every public showcase response; unavailable/forbidden responses never reveal fallback content.

## Trust boundaries

JWT validation checks the current user, active flag, password version and role. Bootstrap accounts must change their password. Facility managers can access only their own saved plans; operators/admins have the documented broader scope. Public signup always creates facility managers.

Custom machine definitions and scenario inputs must remain bounded and validated. Never accept a client-provided KPI as a computed result. Negative savings and deltas retain their meaning. Forecast display multipliers must not be described as calibrated probabilities.

Copilot history and tool inputs are untrusted. Never pass application secrets to a model. Thread execution, request limits and the daily model-call budget protect the current single-process demo. Wider deployment requires shared quotas and load testing.

## Project layout

- `backend/auth`: passwords, JWTs, role dependencies and auth limits.
- `backend/db`: SQLite/Turso engine and saved payload models.
- `backend/forecasting`: regional source selection and labelled display ranges.
- `backend/dispatch`: joint solver, preview/save/scenario/override APIs.
- `backend/agent`: shared tools, Gemini exchange, request limits and stdio MCP server.
- `backend/showcase`: sanitized draft editing, publication versions and access windows.
- `frontend/src/lib/api`: the server-to-UI contract adapters.
- `frontend/scripts/project-regression.mjs`: isolated full-stack browser regression.

## Validation

Run backend pytest; frontend tests, lint and production build; then `npm run test:project` inside frontend. Backend test collection replaces credentials and database settings before importing application code. No production provider credentials should be needed.

The MCP test starts an actual stdio server and checks initialization, the catalog and tool calls. The browser regression starts temporary local services and checks docs revocation, public guides, custom plans and conversation history. The inactive `docs/architecture/github-actions-checks.yml.example` template runs the same gates once installed as `.github/workflows/checks.yml` using a token with workflow permission.

See [README](../README.md) for setup/deployment and [project rules](../AGENTS.md) for change requirements.

## Outstanding validation

Provider account permissions, hosted Linux/Turso behavior, real facility data, production load and physical controls require separate testing. The app reports modeled demo outcomes rather than measured impact.
