# System showcase and operations

Meridian Grid helps a manager compare flexible process and battery schedules against a baseline. The prototype targets Bangladesh, using regional data around Dhaka and synthetic facility equipment. No customer pilots or measured savings are claimed.

## Public documentation

Frontend `/docs` loads only the backend's authorized published payload. Admin controls at `/docs-admin` support drafts, publish/version history, ON/OFF, dates and duration. The default availability window is June 10–14, 2027, Asia/Dhaka. Team profiles stay empty until an admin supplies verified details.

An OFF or out-of-window response shows Not Available. Backend failure shows temporary unavailability without publishing static content. An already open page rechecks access every ten seconds. This cannot retract copies already downloaded while publication was authorized.

## Planning and provenance

Check the solar/carbon source badges before interpreting results. Archived 2020 forecasts retain their historical dates. GHI is irradiance, not measured site generation. Display ranges are fixed heuristic scenarios.

Custom machines re-solve the entire portfolio. Save before changing horizons. Saved custom definitions survive reload and manual overrides. Review signed cost/carbon/peak comparisons; increases are possible. Decisions are stored records and do not send equipment commands.

Tariff values in `data/synthetic/tariff_placeholder.json` are synthetic examples, not verified Bangladesh utility prices. Planning results must not be advertised as actual facility ROI.

## Copilot

Guest mode uses read-only local demo tools. Authenticated sessions may use Gemini when configured and within the per-process daily budget. Responses identify local-tool versus Gemini mode and expose tool evidence. A separate local stdio MCP server uses the same tools; the HTTP tool catalog is not a transport.

## Deployment checks

Use Vercel for the frontend, Render for FastAPI and Turso for hosted persistence. See [README](../../README.md) for exact variables and commands. Keep API keys only on the backend. Render Free cold starts and sleeping affect latency and in-process polling.

After deployment, test login/password change, a custom plan save, restart/read-back, a source-labelled Copilot answer and docs OFF/ON/revocation. Verify provider permissions without exposing keys. Automated local regressions do not replace hosted account or load validation.
