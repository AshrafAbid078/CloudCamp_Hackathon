# Meridian Grid project rules

- Read the affected API, frontend adapter and callers together before changing a response contract.
- Keep cost/emissions/peak changes signed. Never turn increases into savings with `abs()`.
- Distinguish live data, archived fallbacks, synthetic assets and measured outcomes in API metadata and UI text.
- Forecast multipliers are heuristic ranges, not calibrated probability quantiles. Do not invent savings, users, team profiles or events.
- Public `/docs` must respect the backend publishing decision, including OFF, date windows and upstream failure.
- Home, `/about` and `/guide` explain the product without login; keep the public guide independent of backend publishing and the interface English-only.
- Persist the complete plan that the user reviewed, including custom assets, assumptions and overrides.
- Use the existing auth validator for every protected path. Guest Copilot requests must not spend a paid model quota.
- Bound chat history, upstream requests and concurrent solver work. Keep blocking work off the async request loop.
- Never print, commit or copy `.env`, credentials, tokens or production database contents into tests or prompts.
- Tests use isolated SQLite databases and mocked upstream APIs. Do not use real Gemini/Turso/Electricity Maps credentials in automated tests.
- Add regression tests for incorrect results, permissions and persistence; run backend tests, frontend tests, lint and production build after relevant changes.
- Run MCP as the documented local stdio server. `/copilot/tools` is an HTTP catalog, not an MCP transport.
- Keep submission videos and private working documents ignored by Git. Read `frontend/AGENTS.md` and the installed Next.js guides for frontend work.
