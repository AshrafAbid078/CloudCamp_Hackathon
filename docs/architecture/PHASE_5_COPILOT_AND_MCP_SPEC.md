# Copilot and MCP implementation

The HTTP Copilot uses Gemini native function calling when enabled. A separate FastMCP stdio server exposes the same Python tools. Sharing implementations does not make the HTTP catalog an MCP transport.

## Tools and evidence

- `get_solar_forecast`: reads the actual forecast arrays and source metadata; reports archived, persistence or forecast carbon accurately.
- `get_dispatch_schedule`: computes an unsaved synthetic-portfolio preview. It does not load the signed-in user's private saved plan.
- `simulate_whatif`: accepts explicit PV capacity, base load, feeder limit and horizon; compares optimized results against zero PV. Negative changes mean reductions.
- `explain_decision`: looks up a real demo asset and returns its scheduled slots. Unknown assets return an error instead of an invented explanation.

## Request controls

`POST /copilot/chat` accepts a message of at most 1,000 characters and six history turns of at most 2,000 characters each. History roles are restricted to `user` and `model`.

Bearer tokens use the existing user/password-version/role validator. Invalid tokens are rejected rather than silently treated as anonymous. Admin perspective requires an admin account. Guest requests never call Gemini.

Guest requests are limited to six per minute per IP; accounts to twenty per minute. Two Copilot requests may execute concurrently. Limits are bounded in-memory single-process guards and reset on restart.

`COPILOT_DAILY_MODEL_CALLS` caps actual upstream model HTTP requests per UTC day and API process, including follow-up turns. The default is 100. Set zero to disable model calls. Use provider quotas as an additional guard; a shared persistent limiter is required before multi-worker deployment.

## Model exchange

`GEMINI_API_KEY` is sent in an HTTP header, not the URL. Responses and exceptions are not logged with credentials or user history. The service supports up to three model turns and four tool calls, handles multiple calls in one response, and returns tool results with the user-role function-response format.

Tool execution and local fallback run in the thread pool. Solver processes have a 15-second limit. Model/network failures and exhausted budget use an explicitly labelled local-tool response. Fixed recommendations and invented scenario capacities are not used. This reduces unsupported claims; an LLM answer still requires review.

## MCP setup

Install the backend requirements, then run `python backend/run_mcp.py` from the repository root. The transport is stdio. The four tools advertise read-only annotations and never persist plans or control equipment. They may read regional APIs and use labelled archives.

`.mcp.json.example` is portable host configuration. Local `.mcp.json` uses absolute paths and is ignored by Git. Do not place secrets in shared MCP configuration. An HTTP MCP listener is not enabled.

## Verification

`backend/agent/test_agent.py` checks exact tool values, signed deltas, request limits, session validation, history limits, daily model budget, thread execution and a mocked multi-tool Gemini exchange. `backend/agent/test_mcp.py` initializes the actual stdio server, lists its tools and invokes a forecast tool, including an invalid-horizon check.

Real provider account permissions, model availability and production load require separate deployment validation.
