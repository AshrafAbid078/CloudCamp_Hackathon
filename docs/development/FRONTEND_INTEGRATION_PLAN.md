# Meridian Grid — Frontend Integration Plan

Prepared: 17 October 2026.

Status: Planning only. Frontend implementation has not started under this plan.

This plan follows the frontend source review and the backend repairs recorded in the [backend audit and repair checklist](D:/CloudCamp/docs/development/BACKEND_AUDIT_2026-10-17.md). Keep the existing pages, theme, and reusable components. Prioritize replacing mock behavior, correcting data interpretation, and completing authentication.

The frontend was reviewed from source; browser behavior and the frontend production build still need verification during implementation.

1. **Connect the API and implement real authentication**

   Primary files: [API client](D:/CloudCamp/frontend/src/lib/api/client.ts), [services](D:/CloudCamp/frontend/src/lib/api/services.ts), [login page](D:/CloudCamp/frontend/src/app/(auth)/login/page.tsx), [auth types](D:/CloudCamp/frontend/src/lib/types/auth.ts), [dashboard layout](D:/CloudCamp/frontend/src/app/(dashboard)/layout.tsx), and the existing Zustand stores.

   - [ ] Configure the backend address and centralize authenticated requests. The local backend runs at `http://localhost:8000`.
   - [ ] Replace the fabricated login token with JSON `POST /auth/login`, sending `username` and `password`.
   - [ ] Load the account through `GET /auth/me`. Match the backend profile: numeric ID, username, role, active status, password-change flag, and creation time. Do not require email or organization fields that the backend does not provide.
   - [ ] Support `admin`, `grid_operator`, and `facility_manager` throughout types, navigation, and permission checks.
   - [ ] Add the mandatory password-change screen. When `must_change_password` is true, allow profile/password actions and direct the user to change their password before accessing other protected operations.
   - [ ] Send `current_password` and `new_password` to `PUT /auth/me/password`. Require login again afterward because previous tokens are revoked.
   - [ ] Protect dashboard routes and handle expired sessions. Clear session-specific account, forecast, plan, and chat state on logout.
   - [ ] Consolidate duplicated role state. Read authorization from the authenticated account; a visual persona toggle must never grant permissions.
   - [ ] Create separate types for backend responses and display data, with shared conversion functions instead of conversions scattered across pages.
   - [ ] Handle backend error details consistently: unauthenticated/expired sessions, insufficient permissions, validation errors, and unavailable data.

   **Completion gate:** Real credentials work, invalid credentials fail, protected pages require authentication, mandatory password changes are enforced, and each account receives only its permitted actions.

2. **Connect forecasts and correct the charts**

   Primary files: [forecast page](D:/CloudCamp/frontend/src/app/(dashboard)/forecast/page.tsx), [forecast services](D:/CloudCamp/frontend/src/lib/api/services.ts), [forecast types](D:/CloudCamp/frontend/src/lib/types/forecast.ts), [forecast chart](D:/CloudCamp/frontend/src/components/charts/forecast-chart.tsx), and [formatters](D:/CloudCamp/frontend/src/lib/utils/formatters.ts).

   - [ ] Replace generated solar data with `GET /forecast/bd?horizon_hours=...`.
   - [ ] Keep the existing 6h/12h/24h controls. The backend accepts integer horizons from 1 through 24.
   - [ ] Convert the parallel response arrays into chart rows while preserving full ISO timestamps.
   - [ ] Display dates and times explicitly in `Asia/Dhaka`, including midnight crossings. Label the forecast as a historical scenario rather than “today.”
   - [ ] Replace the invented 0–100 grid-stress index with carbon intensity in `gCO2eq/kWh`. Use a correctly labeled scale or a separate carbon chart.
   - [ ] Draw the shaded region between the returned lower and upper bounds. Label it “±15% heuristic band,” replacing the current percentile-confidence claim.
   - [ ] Read the active model, training date, RMSE, MAE, MAPE, and persistence comparison from the response. Convert MAPE fractions into percentages and allow a model to perform worse on an individual metric.
   - [ ] Show carbon source time, freshness, estimated status, fallback reason, and weather availability from `data_quality`.
   - [ ] Display the solar scenario date and carbon reading date separately. They do not necessarily describe the same period.
   - [ ] Hide unsupported actual-GHI, DNI/DHI, cloud, temperature, and solar-kWh panels until their data is available. Irradiance alone does not establish facility energy generation.
   - [ ] Use the same forecast data and formatting on Dashboard and Forecast Detail. Remove hard-coded model versions and location claims.

   **Completion gate:** Chart values match the API, shorter horizons match the corresponding full-day values, units and dates are correct, and unavailable data appears as unavailable rather than zero or invented measurements.

3. **Build real dispatch, dashboard KPIs, and history**

   Primary files: [dispatch page](D:/CloudCamp/frontend/src/app/(dashboard)/dispatch/page.tsx), [dashboard](D:/CloudCamp/frontend/src/app/(dashboard)/dashboard/page.tsx), [timeline](D:/CloudCamp/frontend/src/components/charts/dispatch-gantt.tsx), [dispatch types](D:/CloudCamp/frontend/src/lib/types/dispatch.ts), and [KPI card](D:/CloudCamp/frontend/src/components/features/kpi-card.tsx).

   - [ ] Make “Generate plan” / “Re-solve” an explicit action. Every `GET /dispatch/plan` request creates a history record; navigation, automatic retries, and background refresh must not silently generate additional runs.
   - [ ] Prevent duplicate submissions while generation is in progress. If the connection fails after submission, do not claim the run definitely failed or automatically create another run.
   - [ ] Share the generated plan between Dashboard and Dispatch so schedules and KPIs describe the same run and horizon.
   - [ ] Show a clear “No plan generated” state before the first run. After a full reload without a retained plan, offer explicit generation; do not pretend history summaries contain a full schedule.
   - [ ] Build the timeline from `forecast_used.timestamps`. Replace fixed time labels and hard-coded bar positions.
   - [ ] Convert zero-based slot indices into actual displayed intervals. Render separate blocks for interrupted industrial schedules; a single bar spanning the first and last selected hour would incorrectly show operation during gaps.
   - [ ] Support the returned battery array, including all five demo batteries, with separate charging, discharging, and energy/SOC displays. Respect separate charge and discharge rate limits.
   - [ ] Show returned asset constraints, interruptibility, and excluded process IDs with their explanation.
   - [ ] Use backend KPI values directly. Preserve negative savings, convert kilograms to tonnes correctly, and show unavailable percentages when the baseline is zero.
   - [ ] Connect `GET /dispatch/history` for operators and admins only. History contains summaries and cannot reopen a complete historical schedule.
   - [ ] Replace free-rooftop-solar, export-income, and guaranteed-improvement explanations with `plan.assumptions`. The current optimizer uses tariffs and carbon, disallows battery exports, and does not apply solar-generation offsets.
   - [ ] Present the returned baseline and optimized grid-import profiles where helpful for explaining peak changes.

   **Completion gate:** One explicit generation produces one history record, dashboard totals match that run, every displayed schedule block matches backend slots, and role restrictions apply to history.

4. **Finish supported pages, improve usability, and verify**

   Primary files: [settings page](D:/CloudCamp/frontend/src/app/(dashboard)/settings/page.tsx), [data page](D:/CloudCamp/frontend/src/app/(dashboard)/data/page.tsx), layout components, shared UI components, and page loading/error states.

   - [ ] Connect Settings to real profile and password-change operations. Add admin-only user creation, listing, and deactivation using the existing backend endpoints.
   - [ ] Use `/health` for API availability. It does not establish live weather, SCADA connectivity, uptime, or source readiness.
   - [ ] Replace fabricated provenance, hashes, accuracy scores, and telemetry claims with [verified data documentation](D:/CloudCamp/data/DATA_PROVENANCE.md) and response metadata. Clearly distinguish documented static provenance from current runtime metadata.
   - [ ] Mark copilot, what-if, manual overrides, approval, and SCADA settings as unavailable or clearly separate demonstrations. Remove success messages that imply unsupported backend operations occurred.
   - [ ] Keep EU/US regions and EV fleets visibly unavailable. Asset editing and facility ownership also require future backend work.
   - [ ] Review landing/about copy and shared status badges so they distinguish implemented capabilities, synthetic assets, historical solar, and planned features.
   - [ ] Add consistent loading, empty, error, retry, and permission-denied states. Handle failures in asynchronous page requests instead of relying only on `finally` blocks or route error boundaries.
   - [ ] Cancel or ignore outdated requests when filters change so older responses cannot overwrite the latest selection.
   - [ ] Improve mobile navigation, table/timeline scrolling, modal keyboard focus, accessible button labels, and readable chart legends. Keep the existing visual theme.
   - [ ] Read the installed Next.js guides required by [frontend project instructions](D:/CloudCamp/frontend/AGENTS.md) before implementation. Reconcile architecture documentation with the dependencies actually installed rather than assuming planned libraries are available.
   - [ ] Run lint, TypeScript checks, the production build, and browser tests against the backend.

   **Verification checklist:**

   - [ ] Login, logout, invalid credentials, expired tokens, and forced password changes.
   - [ ] All three roles, including forbidden history/user-management requests.
   - [ ] Forecast horizons 6/12/24, rapid horizon switching, missing data, stale carbon, and persistence fallback.
   - [ ] Explicit dispatch generation, duplicate-click prevention, and no extra runs on navigation or automatic refresh.
   - [ ] Interrupted process schedules, multiple batteries, empty industrial selections, and midnight/date transitions.
   - [ ] Positive, zero, and negative KPI changes, including zero baselines.
   - [ ] Backend unavailable, validation failures, and recovery through an appropriate retry action.
   - [ ] Desktop/mobile layouts and keyboard navigation.
   - [ ] No mock values or unsupported success messages presented as real operations.

   **Completion gate:** The supported workflow works end to end on desktop and mobile, and every visible action either performs a real operation or clearly explains its availability.

The first implementation milestone is **real login → required password change → authenticated forecast**. Complete dispatch and shared dashboard results next, followed by supported settings, provenance, and final verification.

Reference: [current frontend/backend contract notes](D:/CloudCamp/docs/architecture/FRONTEND_ARCHITECTURE.md). Copilot, what-if, overrides, approval persistence, live solar/weather ingestion, asset editing, and facility ownership remain separate backend-dependent work.
