# APPLICATION_FLOW.md — Meridian Grid

## 1. System sequence (high level)

1. Ingestion/Poller refreshes NSRDB/GFS cache, polls Electricity Maps BD-zone, and updates the `carbon_snapshots` DB table daily.
2. Forecasting service produces the 6–24h solar + grid-stress forecast.
3. Dispatch agent solves the LP across the Industrial and Battery adapters against that forecast, logs the run to the `dispatch_runs` DB table, and produces the schedule.
4. Dashboard loads and renders forecast, dispatch schedule, KPI cards, and both adapter indicators.
5. User logs in, interacts with the copilot in their current role; copilot calls tools that re-read/re-run the relevant service live.
6. Any override is logged and folded into the next dispatch cycle.

## 2. Facility manager user journey (primary, live-demoed)

1. Facility manager logs into the Meridian Grid dashboard in the morning using their `facility_manager` credentials.
2. Sees the 6–24h solar + grid-stress forecast with a confidence band and stated accuracy.
3. The dispatch agent has already proposed today's schedule across flexible industrial processes + the facility's battery; KPI cards show projected $ and tCO2 savings vs. baseline.
4. Manager asks the copilot: *"What happens if solar drops 30% this afternoon?"*
5. Copilot calls `run_whatif` → re-runs forecast + dispatch under the perturbed scenario → returns a plain-language delta ("cost +$180, CO2 +0.4t, the afternoon shift moves 2h earlier") plus an updated chart.
6. Manager approves the plan, or overrides specific process/battery slots; the override is logged.
7. Through the day, KPI cards update as (simulated) telemetry comes in.
8. End of day: an auto-generated savings summary is ready.

## 3. Role-toggle demonstration (secondary persona, live proof point — not a separate build)

1. Presenter switches the dashboard's role toggle to "Grid Operator" on camera.
2. The same forecast and dispatch data re-renders with the technical view; the copilot's tone visibly shifts to numbers-first, terse, operator-style language for the same underlying question.
3. This ~20–30 second beat is the entire proof of the dual-track business model — same engine, same data, second audience — without needing a second live walkthrough.

## 4. Failure / edge cases

| Case | Behavior |
|---|---|
| Electricity Maps API down or rate-limited | Fall back to last cached reading, show a visible banner, disclose in provenance |
| Forecast confidence below threshold | Dispatch plan flagged "low confidence," user prompted to review manually |
| Copilot tool call fails or times out | Graceful chat error message; dashboard panels unaffected |
| Override conflicts with a hard constraint (e.g. impossible deadline) | Dispatch agent rejects the override with a specific reason, doesn't silently ignore it |
| User calls an unwired stub adapter (EU/US region, EV fleet) | Clear "architecture-ready, not live for this build" message — never silently fails or fakes data |

## 5. Demo video script (3–5 min — matches the required structure exactly)

| Time | Content |
|---|---|
| 0:00–0:40 | **Problem** — the facility manager's pain today: reacting by instinct, no forecast-to-action loop |
| 0:40–1:30 | **Solution walkthrough** — the three-layer engine, the two adapter axes, why that matters for global scalability |
| 1:30–3:00 | **Live demo** — real forecast, real dispatch KPIs, one live what-if question answered by the copilot with an updated number |
| 3:00–3:30 | **Role-toggle beat** — switch to Grid Operator mode on camera, show the tone shift, land the dual-track business model in one visual |
| 3:30–4:15 | **Team intro** — who built what |
| 4:15–4:30 | **Call to action / close** |

Keep it inside 5 minutes — judges only watch the first 7 regardless, and a tight cut reads as more confident.

## 6. Data flow diagram

```
NSRDB ------------\
NOAA GFS -----------> Ingestion -> Forecast -> Dispatch -> Dashboard <-> Copilot
Electricity Maps --/                                              ^
Synthetic facility+battery data --/                                |
                                                              user override / role toggle
```
