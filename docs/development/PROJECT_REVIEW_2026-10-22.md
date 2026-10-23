# Meridian Grid project review

**Review date:** 22 October 2026
**Status:** Original review preserved below. Remediation progress as of 23 October 2026 is tracked in the next section.

## Remediation progress (23 October 2026)

The findings below describe the application as reviewed on 22 October. Fixes were applied to `frontend/` and `backend/`; the separate `frontend-v2/` prototype was later removed.

| Finding | Status | Current result |
| --- | --- | --- |
| 01 Public signup privileges | Fixed | Public signup assigns `facility_manager` on the server; escalation is covered by tests. |
| 02 Signing key and seed password | Partly fixed | Fresh installations generate a secret and random first-login admin credential, and the password-change gate is enforced. Previously exposed deployments still require their own secret rotation and credential review. |
| 03 Forecast and dispatch runtime | Partly fixed | PuLP is pinned to 3.3.0 and optimization tests pass. LightGBM 4.7.0 still crashes natively on the tested Python 3.14 environment, so the service uses a persistence forecast by default and reports degraded health. Portable model inference remains open. |
| 04 False override success | Fixed | The UI now surfaces API failures and only reports success after receiving the saved plan. |
| 05 Invalid overrides | Fixed | Asset, horizon, start, duration and original scheduling limits are validated; invalid requests return 4xx. |
| 06 Override workflow and persistence | Fixed for demo plans | Shift includes a reason and saves a complete plan that the UI renders. Approval and rejection are now separate recorded decisions on a saved run; rejection needs a reason and removes that plan from the latest active view. Neither action sends equipment commands. |
| 07 Invented positive improvements | Fixed | Signed values and legitimate zeroes are preserved; tests cover regressions. |
| 08 Tariff timezone | Fixed | Forecast timestamps are converted to Asia/Dhaka for tariff lookup. |
| 09 Short forecast alignment | Fixed | Six and twelve-hour results are prefixes of the aligned day-ahead window. |
| 10 Interruptible batch schedule | Fixed | Industrial processes are scheduled as contiguous blocks. |
| 11 Fabricated status, provenance, copilot and scenarios | Partly fixed | Unsupported live/provenance claims and artificial copilot responses were removed. A typed PV-capacity scenario now runs the real joint demo optimizer and returns signed changes. Live telemetry, measured provenance and a connected natural-language copilot remain open. |
| 12 Unsaved safety settings | Fixed in UI | Unsupported settings are visibly disabled; no safety interlock is implemented or claimed. |
| 13 UI auth fails open | Fixed | Login requires backend success, `/auth/me` validates restored sessions, protected routes redirect, and 401 clears auth state. |
| 14 Asset and accuracy contract | Partly fixed | Actual asset values, SOC, MAPE units, unavailable fields and midnight boundaries are rendered correctly. Shared generated API contracts remain open. |
| 15 Forecast query validation | Fixed | Horizon is limited to 1–24 hours, with predictable unsupported-region/error responses. |
| 16 Password and session lifecycle | Partly fixed | Bcrypt byte length is rejected, password changes revoke earlier tokens, malformed roles return 401, and login/signup have in-memory rate limits. A distributed rate-limit store remains necessary for multi-worker deployment. |
| 17 Read-triggered runs | Partly fixed | `GET /dispatch/plan` no longer writes history, and `POST /dispatch/runs` creates a saved complete plan. GET still computes a preview; saved results are fetched through `/dispatch/runs/latest`. |
| 18 Test coverage | Partly fixed | Backend regressions, frontend adapter tests, lint/type/build checks and a local Edge browser smoke script cover key flows. Broader browser, accessibility and deployment tests remain open. |

The optimizer now solves processes and batteries together against one grid import balance. Callers may provide a feeder import limit, fixed base load and installed PV capacity; PV production is only a capacity-scaled GHI estimate. Without measured facility inputs, the default plan has no feeder limit and assumes zero base load and PV. The app still has no real facility/asset ownership mapping, live equipment telemetry or control. Do not use it for real operational dispatch.

**Live API update (23 October):** The backend now prefers a current Open-Meteo regional weather forecast and labels the archived 2020 fallback. Electricity Maps carbon forecast and latest-reading polling use v4 when an API key is configured; without a key, carbon remains an explicitly labelled archived constant. Current weather is a modeled forecast, not measured facility telemetry. See [live data setup](LIVE_DATA_SETUP.md). The LightGBM artifact remains disabled; this integration does not repair it.

## Contents

- [Assessment](#assessment)
- [Validation results](#validation-results)
- [Priority findings](#priority-findings)
- [Architectural and product limitations](#architectural-and-product-limitations)
- [Endpoint coverage](#endpoint-coverage)
- [Recommended implementation order](#recommended-implementation-order)
- [Reproduction and evidence](#reproduction-and-evidence)
- [Scope limits](#scope-limits)

## Assessment

This is a substantial demonstration prototype with reusable backend components, but it is not ready for public deployment or real equipment control. The most urgent problems are unrestricted administrator signup, insecure default signing credentials, failing forecast/dispatch execution in the configured environment, and UI responses that turn failures into successful operational claims.

Application source was not changed. Review scripts, isolated databases, an isolated PuLP installation, and output logs are under logs/. Existing application databases were not used for mutation tests. Tests that create, change passwords, or deactivate accounts used newly created review databases. External carbon polling was disabled for the API tests. No real machinery was controlled.

## Validation results

1. Frontend production build: PASS, after allowing Next.js worker processes outside the sandbox. The initial spawn EPERM was an environment restriction. Ten application pages and the generated not-found page were built.

2. TypeScript: PASS, tsc --noEmit.

3. ESLint: FAIL, two errors and one warning. Errors are in data/page.tsx:43 and admin-console.tsx:48; the unused variable warning is in header.tsx:59.

4. Existing backend suite from backend/: 15 passed, 5 failed. Two API failures involve LightGBM inference; three solver failures involve PuLP compatibility.

5. Running pytest from the repository root: nine collection errors caused by top-level imports such as auth and dispatch. conftest.py does not fix this.

6. API sweep: all 14 OpenAPI application method/path pairs exercised, plus docs, schema, CORS, missing routes, roles, passwords, tokens and invalid inputs. 106 cases: 72 met the specified status expectation, 34 deviated in the installed runtime. These counts are status checks, not proof of correctness.

7. A separate diagnostic run used PuLP 3.3.0 from logs/review-deps and the application's persistence forecaster selected in memory by the test harness. No production code or global dependency was altered. The same 106 cases yielded 88 expected statuses and 18 deviations. This bypassed the two runtime blockers so downstream API defects could be reproduced; it is NOT evidence that the normal LightGBM application passes.

8. Frontend logic probes confirmed false override success, simulated login, incorrect percentages and MAPE units, and constant what-if outcomes.

9. Browser review covered /, /login, /signup, /dashboard, /forecast, /dispatch, /copilot, /data, /settings and /about in the in-app browser. Interactions included anonymous dashboard access, forecast horizon switching, invalid login, an unauthenticated override, and a suggested copilot question.

10. Data validation: seven datasets loaded; inspected time series have no duplicate timestamps; GHI and humidity bounds passed the supplied checks.

11. Alembic upgrade head and alembic check passed against an isolated database.

### Tested environment

The configured interpreter was D:/PythonProjects/.venv/Scripts/python.exe: Python 3.14.7, PuLP 4.0.1, LightGBM 4.7.0, scikit-learn 1.9.0, NumPy 2.4.6, pandas 3.0.5, FastAPI 0.141.1 and APScheduler 3.11.3. README advertises Python 3.11. A clean Python 3.11 install was not tested, so native-library failure findings are qualified to this environment.

## Priority findings

### 01 Public signup grants administrator privileges

**Severity:** Critical

**Source:** [backend/auth/router.py:214,232](../../backend/auth/router.py#L214); [backend/auth/schemas.py:26](../../backend/auth/schemas.py#L26)

POST /auth/signup accepts the same UserCreate schema as admin registration and writes role=body.role. A request with role="admin" returned 201 and a token that successfully called GET /auth/users (200). Public registration also allows unrestricted grid_operator access.

**Recommended fix:** use a dedicated public signup schema and assign the least privileged role on the server. Require admin approval for operator/admin access.

**Acceptance check:** anonymous users cannot create privileged accounts; add explicit public signup escalation regression tests.

### 02 Public signing key and seed password permit account compromise

**Severity:** Critical

**Source:** [backend/config.py:26](../../backend/config.py#L26); [backend/main.py:39](../../backend/main.py#L39); [backend/auth/utils.py:106](../../backend/auth/utils.py#L106)

The application accepts its hard-coded JWT secret. A token signed with the publicly documented default key and sub="admin" successfully listed users. A fresh database also receives admin/admin123. must_change_password is returned but never enforced, and the login UI always opens the dashboard.

**Recommended fix:** reject default/weak secrets outside explicit demo mode, generate or provision a unique initial admin credential, enforce password change before privileged use, and rotate secrets/tokens on any exposed deployment.

### 03 Forecast and dispatch fail in the configured runtime

**Severity:** High

**Source:** [backend/forecasting/models/lgbm.py:38](../../backend/forecasting/models/lgbm.py#L38); [backend/forecasting/router.py:35](../../backend/forecasting/router.py#L35); [backend/dispatch/solver.py:47,196](../../backend/dispatch/solver.py#L47); [backend/requirements.txt:26](../../backend/requirements.txt#L26)

The saved model loads, but prediction raises an access violation reading address zero. This was reproduced both inside and outside the sandbox. The fallback only covers a missing model file, not failed loading/inference. Separately, installed PuLP 4.0.1 rejects legacy LpVariable(cat=...) and LpVariable(lowBound=...) calls; requirements allow it via pulp>=2.8.0.

**Recommended fix:** lock a tested Python/native-library/solver environment, diagnose and regenerate a portable model artifact if needed, then run inference and optimization smoke checks on startup. Use the known working PuLP API version or migrate the solver deliberately. Return degraded readiness, not "ok". The precise native LightGBM root cause remains unconfirmed.

### 04 Failed overrides are reported as successful

**Severity:** High

**Source:** [frontend/src/lib/api/services.ts:367-399](../../frontend/src/lib/api/services.ts#L367)

Every override failure, including HTTP 401/403/500, returns success:true. In the browser, an anonymous override produced "Override registered ... MILP schedule re-converged" although there was no authenticated operation. A separate logic probe injected HTTP 401 and reproduced the same result.

**Recommended fix:** propagate errors and display an actionable error state; only show success after validating the server's applied schedule and run identifier.

### 05 Invalid overrides are accepted, clamped or silently drop assets

**Severity:** High

**Source:** [backend/dispatch/api.py:346-400](../../backend/dispatch/api.py#L346)

In the diagnostic run: unknown asset returned 200 with found=false; start=-99 and start=99 returned 200 after clamping; duration=0 fell back to the original duration; duration=25 returned 200 and removed the target from the 24-hour plan (industrial count fell from 20 to 19). Negative duration returned 500. Invalid horizon=0 was silently coerced. Overrides replace the original earliest-start/deadline constraints rather than validate them.

**Recommended fix:** validate bounded fields, asset existence and original operating limits before solving. Reject infeasible changes with 4xx; return actual applied values. Never declare an override successful if its asset is absent.

### 06 Override actions and results do not survive the UI workflow

**Severity:** High

**Source:** [frontend/src/lib/api/services.ts:367-390](../../frontend/src/lib/api/services.ts#L367); [frontend/src/app/(dashboard)/dispatch/page.tsx:106-110](../../frontend/src/app/(dashboard)/dispatch/page.tsx#L106); [backend/dispatch/api.py:380-442](../../backend/dispatch/api.py#L380); [backend/db/models.py:109](../../backend/db/models.py#L109)

Approve, Shift and Cancel/Reject all send the same forced-start payload. The requested end time, minutes, rejection reason and action type are discarded. Cancel/Reject can therefore schedule an asset instead of holding it idle. The server saves KPI totals only. The client discards the override response and immediately fetches a fresh unconstrained GET /dispatch/plan.

**Recommended fix:** model approve/shift/reject explicitly; preserve constraints and a full versioned plan; return and render the exact updated plan by run ID.

### 07 The frontend invents positive improvements when outcomes worsen

**Severity:** High

**Source:** [frontend/src/lib/api/adapters.ts:336-360](../../frontend/src/lib/api/adapters.ts#L336)

A real diagnostic solver run saved $8,086.84 but increased carbon by 1,684.36 kg and peak demand by 9,967.23 kW. The adapter preserved negative absolute values yet reported 28% carbon reduction and 22% peak reduction. It clamps negative percentages to zero, then replaces zero via || defaults.

**Recommended fix:** preserve signed results and legitimate zeroes. Display "increase" when appropriate, derive every percentage from the returned baseline, and validate consistency between absolute and percentage values.

### 08 Tariffs are applied in UTC instead of Bangladesh local time

**Severity:** High

**Source:** [backend/dispatch/api.py:217,377](../../backend/dispatch/api.py#L217)

Forecast timestamps are UTC, but .hour indexes the local TOU tariff without conversion. At 2020-12-31 18:00 UTC (2021-01-01 00:00 Asia/Dhaka), the code charges $0.20/kWh instead of the placeholder's $0.05 midnight rate. Both ordinary and override schedules are affected.

**Recommended fix:** make timezone part of the regional adapter and convert before tariff lookup. Keep explicit timestamp/slot mappings throughout the optimizer/UI.

### 09 Short forecasts are attached to the wrong future hours

**Severity:** High

**Source:** [backend/forecasting/router.py:123-146](../../backend/forecasting/router.py#L123); [backend/forecasting/test_forecasting.py:52](../../backend/forecasting/test_forecasting.py#L52)

The model is trained for a 24-hour shifted target. Inference takes the last N rows but labels outputs as the next N hours. For N=6 the first input's trained target is 18 hours later than its emitted timestamp; for N=12 the mismatch is 12 hours. N=24 aligns under the existing training convention.

**Recommended fix:** produce the aligned full day-ahead window and slice its prefix, or train a model with explicit forecast lead times. Test prefix consistency across 6/12/24-hour requests and validate timestamps independently.

### 10 Industrial batch scheduling permits interruptions

**Severity:** High

**Source:** [backend/dispatch/solver.py:47-75](../../backend/dispatch/solver.py#L47)

The model constrains only the total number of active slots. For a two-hour batch with prices [1,100,1,100], it schedules hours [0,2]. This conflicts with the UI's uninterruptible batch/thermal-process claims. The UI then renders min-to-max as a single continuous window, hiding the gap.

**Recommended fix:** distinguish interruptible loads from continuous batches. Use start variables/contiguity constraints for batches and render actual slot groups.

### 11 Health, provenance, copilot and what-if evidence is fabricated

**Severity:** High

**Source:** [frontend/src/lib/api/services.ts:425,536,559,683](../../frontend/src/lib/api/services.ts#L425); [frontend/src/lib/store/useRoleStore.ts:125](../../frontend/src/lib/store/useRoleStore.ts#L125)

Copilot responses are keyword-selected strings; their tool calls, durations and citations are hard-coded. A -10% and -90% solar scenario both returned cost 2776 and carbon 13880. Health always reports healthy services and made-up uptime/latency; provenance hashes and record counts are static. Browser pages claim live SCADA, 10-year data and cryptographic verification without implementations supporting those claims. The dashboard's cached/live flag is not driven by actual request results.

**Recommended fix:** label fixtures as demo data on every affected surface. Disable unbuilt controls or implement measured health/provenance and actual typed tool calls. Generate citations from real run IDs and inputs, and verify scenario outputs.

### 12 Safety interlock settings are not saved or enforced

**Severity:** High

**Source:** [frontend/src/app/(dashboard)/settings/page.tsx:57-60](../../frontend/src/app/(dashboard)/settings/page.tsx#L57)

Save only toggles a success message for four seconds. Values stay in React state and no settings endpoint or solver constraint consumes them. Claims about automatic shedding, C-rate protection and solar triggers are therefore misleading if the page is treated as an operational console.

**Recommended fix:** expose these as disabled demonstration controls until validated, versioned settings are persisted and applied to the optimization model.

### 13 UI authentication fails open and is not restored correctly

**Severity:** Medium

**Source:** [frontend/src/lib/api/client.ts:139-194,224-233](../../frontend/src/lib/api/client.ts#L139); [frontend/src/lib/store/useAuthStore.ts:43-76](../../frontend/src/lib/store/useAuthStore.ts#L43); [frontend/src/app/(dashboard)/layout.tsx:10](../../frontend/src/app/(dashboard)/layout.tsx#L10)

Network failures create a simulated login for arbitrary credentials and can report a password change that never happened. Dashboard routes have no auth guard; anonymous visitors see operational pages and fake successful actions. checkAuth is defined but not called by the application, trusts cached user data without validation, and retains authenticated state after validation errors. Backend auth still rejects unauthenticated protected requests; this UI defect alone does not bypass backend authorization.

**Recommended fix:** separate explicit demo mode from real authentication, validate /auth/me on hydration, handle 401 centrally, clear stale sessions and guard routes.

### 14 API/UI contract errors corrupt displayed asset and accuracy data

**Severity:** Medium

**Source:** [frontend/src/lib/api/adapters.ts:26-36,141-174,272-324,424](../../frontend/src/lib/api/adapters.ts#L26)

Backend battery energy is energy_kwh; frontend expects soc_kwh, so SOC falls back to 50%. Capacity is always 500 kWh. Industrial kW is invented from cost. Missing battery activity is replaced with fabricated charging windows. A MAPE fraction of 0.506 is displayed as 0.5%, instead of 50.6%. Persistence comparisons/uplifts are hard-coded; a displayed RMSE 122.3 versus 88.4 is still labelled 51.8% improvement. Training date becomes today's date. formatHourIndex clamps 24 to 23, corrupting midnight interval boundaries.

**Recommended fix:** explicit response schemas with real asset metadata, consistent units, generated/shared contracts, and contract tests using backend fixtures.

### 15 Forecast query validation is incomplete

**Severity:** Medium

**Source:** [backend/forecasting/router.py:165](../../backend/forecasting/router.py#L165)

horizon_hours has no bounds. In diagnostic mode zero returns 200 with inconsistent array lengths (iloc[-0:] selects the whole feature frame); negative input gives 500; 25 is accepted despite the stated 1-24-hour scope; a very large input returns 500. Unsupported region returns 501 on forecast and plan, but becomes 500 on override because of its broad catch.

**Recommended fix:** bound horizon to the supported range and use consistent domain error mappings. Do not expose arbitrary internal exception text to clients.

### 16 Password and session lifecycle needs hardening

**Severity:** Medium

**Source:** [backend/auth/utils.py:35,70-91](../../backend/auth/utils.py#L35); [backend/auth/router.py:104](../../backend/auth/router.py#L104)

Passwords are silently truncated at 72 UTF-8 bytes despite allowing 128 characters. Two passwords with the same 72-byte prefix but different suffixes both logged in. Password changes leave existing JWTs usable until expiry. An otherwise signed token with an invalid role causes an unhandled ValueError and HTTP 500. There is no login/signup throttling in the app.

**Recommended fix:** adopt a password scheme supporting accepted lengths or reject excess bytes explicitly; validate claims; define token revocation on credential change; add throttling. Existing-token revocation is a recommended security policy rather than a documented current API guarantee.

### 17 Reads trigger new optimization runs and history writes

**Severity:** Medium

**Source:** [backend/dispatch/api.py:168-261](../../backend/dispatch/api.py#L168); [frontend/src/app/(dashboard)/dashboard/page.tsx:64-69](../../frontend/src/app/(dashboard)/dashboard/page.tsx#L64)

GET /dispatch/plan runs every solver and inserts a database row. Loading the dashboard calls it separately for tracks and actions; history loads in parallel and can miss the just-created run. Horizon changes update the chart, but dashboard dispatch calls retain their default 24-hour horizon.

**Recommended fix:** POST creates a run with explicit inputs/idempotency, GET retrieves it. Fetch one result and derive tracks/actions/KPIs/history from the same run.

### 18 Test suite misses important failures

**Severity:** Medium

**Source:** [backend/forecasting/test_forecasting.py:114-128](../../backend/forecasting/test_forecasting.py#L114); [backend/conftest.py](../../backend/conftest.py)

test_router catches exceptions and only prints them, so a failed prediction is recorded as a passing test. Existing dispatch API tests bypass auth via dependency overrides and never exercise the public signup escalation. There are no maintained frontend test scripts in package.json.

**Recommended fix:** let forecast exceptions fail, assert shapes/time alignment/invariants, add full-app auth and override tests, and add a few browser journeys that explicitly verify failures remain failures. Standardize root test imports and gate builds on lint plus tests.

## Architectural and product limitations

- The optimizer solves each asset independently. There is no shared feeder capacity, base facility load, import/export restriction, demand-charge term, network flow constraint or peak-minimization objective. It can increase the coincident peak; this occurred in the diagnostic run. Model a joint energy balance and explicit operational constraints before promising grid relief.

- Solar GHI is not an optimizer input. There is no PV capacity/efficiency model converting W/m2 into usable kWh, yet the UI promises free solar charging and self-consumption. Irradiance integrated over time is energy per area, not total facility generation. Add a calibrated PV model and solar allocation.

- There is no facility ownership/tenant model. Every authenticated manager can plan or override any globally loaded synthetic facility. This is a deployment blocker for multiple real customers; add tenant/facility membership and apply object-level authorization to assets, runs and history.

- Assets and tariffs are fixed parquet/JSON files loaded at import time. There is no asset onboarding, editing, live SOC ingestion, dispatch acknowledgement, hardware control, or operational execution tracking. EU/US/EV adapters raise NotImplementedError. Keep these visibly scoped as planned capabilities.

- Forecast timestamps begin at the dataset tail, 2020-12-31 18:00 UTC, not now. NSRDB contains 26,304 hourly rows across 2018-2020. The joined feature table has only 8,778 rows starting in 2020 because missing GFS values eliminate earlier years; GFS has 135 records ending 2020-05-15 and is forward-filled through December. The UI's 10-year training description is unsupported.

- The forecast always uses archived carbon=625 even after the review inserted a fresh DB reading of 123. Polling does not feed inference/optimization. Add a timestamped, freshness-checked common data service with explicit source and estimated/stale flags.

- The confidence band is fixed +/-15%, not calibrated probability coverage. UI labels such as 90%/10%-90% are not supported by validation. Use quantile predictions or calibrated intervals and report empirical coverage.

- Backtest splitting uses shifted targets without a gap. The last training target is 2020-10-19 18:00 UTC while the first test feature timestamp is 2020-10-18 19:00 UTC. This fails a strict forecast-origin holdout. Evaluate with a lead-time embargo/rolling origins and compare a correctly aligned persistence baseline across multiple seasons, including dawn/dusk.

- SQLite and the in-process scheduler suit a small single-instance demo. Multiple workers each start a poller; deduplication is read-before-write without a unique region/reading-time constraint. Add a single scheduler, database uniqueness and workload-appropriate persistence before scaling.

- /health checks only that the HTTP app responds. Add readiness for the DB, model, solver and freshness; collect actual durations and structured errors.

- Forecasting rereads full parquet data and rebuilds all features for every request; optimization is synchronous and has no explicit solve deadline. Cache immutable inputs, bound work and use a job mechanism when scale needs it.

- Histories store totals and a username, not input snapshots, full schedules, solver status, parameter versions or override rationale. They cannot reproduce or audit a decision. Store a versioned run artifact with its inputs and output.

- Modal has aria-modal but no focus trap, accessible title reference or close button label. Several icon controls are unnamed; the copilot drawer has fixed width and the sidebar defaults open at narrow viewports. Add keyboard/focus tests, responsive layouts and clear labels. Comprehensive accessibility and multiple-browser testing were not performed.

- README still marks the implemented frontend as planned, omits frontend startup instructions, and contains submission/team/model/prompt placeholders. Reconcile documentation and claims with shipped behavior; maintain a clear demo/live capability matrix. CI/deployment/recovery instructions are also missing.

## Endpoint coverage

| Method | Endpoint | Checks performed |
| --- | --- | --- |
| `POST` | `/auth/login` | valid, wrong, missing, inactive, long passwords |
| `GET` | `/auth/me` | roles, anonymous, malformed/expired tokens |
| `PUT` | `/auth/me/password` | valid/invalid current password and old-token reuse |
| `POST` | `/auth/register` | admin/nonadmin, duplicate, invalid role |
| `GET` | `/auth/users` | role restrictions and privilege escalation proof |
| `DELETE` | `/auth/users/{user_id}` | roles, self-protection, absent ID, deactivation |
| `POST` | `/auth/signup` | default role, duplicate, validation, admin request |
| `GET` | `/forecast/{region}` | roles, horizon bounds, unsupported region |
| `GET` | `/dispatch/plan` | roles, valid/bad horizons, unsupported region |
| `GET` | `/dispatch/history` | roles and limit bounds |
| `POST` | `/dispatch/override` | authentication, valid/unknown asset, bounds, region |
| `GET` | `/health` | public response; dependency health not represented |
| `GET` | `/` | public route inventory |
| `GET` | `/data/carbon-snapshots` | empty-DB archive and populated-DB branches, limits |

Additional checks: /docs, /redoc, /openapi.json, unknown route, allowed/disallowed CORS origins. See the JSON files for per-request expectations and results.

## Recommended implementation order

1. Close signup escalation, require secure deployment credentials, enforce first-login password changes and separate demo mode from authentication.

2. Restore real inference/optimization in a locked environment; fail readiness when either is broken. Make lint and meaningful backend tests required gates.

3. Remove false-success handling and fabricated operational metrics. Fix schemas, units, signed deltas and confidence/source labels before further UI features.

4. Correct timestamps, timezone tariffs and forecast lead-time alignment.

5. Implement persistent plan versions, safe override actions, contiguous batches and shared grid constraints. Connect solar and fresh carbon consistently.

6. Add tenant ownership, reproducible audit history, real health metrics, bounded workloads, scheduler coordination and deployment/backup procedures.

7. Build a genuine copilot and scenario service only after the underlying tools return correct, traceable data. Add browser tests for both success and failure.

## Reproduction and evidence

These commands use the local interpreter and review scripts from the original review. The diagnostic sweep requires the isolated `logs/review-deps` PuLP installation. Evidence and scripts are local artifacts under the Git-ignored `logs/` directory; they are not included in this Markdown file or a fresh clone.

**Existing tests:**

```powershell
cd D:/CloudCamp/backend
D:/PythonProjects/.venv/Scripts/python.exe -m pytest -q
```

**Review API sweep (always uses a new logs/review-api-<uuid>.db):**

```powershell
cd D:/CloudCamp
D:/PythonProjects/.venv/Scripts/python.exe logs/review_api_probe.py
```

**Diagnostic sweep (PowerShell; separate from actual production validation):**

```powershell
$env:REVIEW_COMPAT='1'
D:/PythonProjects/.venv/Scripts/python.exe logs/review_api_probe.py
Remove-Item Env:REVIEW_COMPAT
```

**Frontend and time alignment probes:**

```powershell
node logs/review_frontend_probe.cjs
D:/PythonProjects/.venv/Scripts/python.exe logs/review_temporal_probe.py
```

### Evidence files

| Evidence | Description |
| --- | --- |
| [review-api-results.json](../../logs/review-api-results.json) | Installed-runtime 106-case sweep |
| [review-api-results-compat.json](../../logs/review-api-results-compat.json) | Diagnostic 106-case sweep and solver output |
| [review-frontend-results.json](../../logs/review-frontend-results.json) | Executed frontend adapter/service results |
| [review-temporal-results.json](../../logs/review-temporal-results.json) | Timestamp, split and tariff calculations |
| [review-pytest.txt](../../logs/review-pytest.txt) | Repository-root collection failures |
| [review-pytest-backend.txt](../../logs/review-pytest-backend.txt) | 15 passes / 5 failures and native traceback |
| [review-build.txt](../../logs/review-build.txt) | Successful production build |
| [review-lint.txt](../../logs/review-lint.txt) | Two errors and one warning |
| [review-typescript.txt](../../logs/review-typescript.txt) | Empty output from successful tsc check |
| [review-data-validation.txt](../../logs/review-data-validation.txt) | Dataset ranges, sizes and physical checks |

## Scope limits

No finite review can establish that every endpoint works perfectly. All existing API operations were exercised, but this was not an exhaustive fuzzing, load, race-condition, recovery, dependency-CVE, hardware-integration or multi-browser certification. Live Electricity Maps ingestion was not exercised against the external service. Browser coverage used anonymous navigation and selected interactions; privileged account mutations were tested through the isolated API harness. Full authenticated browser journeys and production deployment remain to be verified after the blocking defects are fixed.
