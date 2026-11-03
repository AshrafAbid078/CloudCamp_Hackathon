# Advanced feature scope

## Forecast display ranges

Solar estimates expose `solar_ghi_w_m2`, `solar_ghi_lower`, `solar_ghi_upper` and `uncertainty` metadata. The lower display scenario is expected GHI multiplied by 0.75; the upper scenario uses 1.18. These are fixed heuristic scenarios, not trained or calibrated P10/P50/P90 quantiles. The API declares `calibrated: false`, and the UI labels them as display ranges.

LightGBM remains an offline experiment disabled by default. Enabling a compatible artifact and calibrating uncertainty requires independent forecast validation. Historical timestamps are retained when using the archive.

## Custom machine workflow

`POST /dispatch/custom-asset` takes name, power, duration, deadline, earliest start, selected horizon and existing custom definitions. Up to ten custom machines are supported per plan. Operating windows and finite values are validated. Stable content-derived identifiers include the portfolio index, so duplicate machine names do not collide.

The endpoint re-solves the complete portfolio and returns the normal forecast/assumptions/plan schema plus a convenience custom-asset summary. The frontend replaces all asset schedules, battery windows and system KPIs with that response.

`POST /dispatch/runs` accepts `custom_assets` and saves the resulting complete plan and assumptions. Reload restores those definitions. Manual overrides carry custom definitions through the same portfolio solver. Unsaved custom plans must be saved before changing the horizon.

Custom definitions are part of saved plan snapshots. This is not a permanent equipment inventory, live telemetry adapter or physical control integration.

## Public website and English-only UI

The interface uses a static English copy helper. The former language toggle and persisted language store have been removed. Old browser language preferences do not affect the UI. The Copilot may still answer a user-written Bengali question; that does not change the interface language.

Home, `/about` and `/guide` are accessible without signing in. The public guide includes an interactive, keyboard-accessible workflow, source explanations, signed KPI conventions, architecture and workspace instructions. The admin-controlled `/docs` showcase remains separate and respects its publishing window.

## Regression checks

- `backend/dispatch/test_custom_workflow.py`: full preview, save, retrieval, duplicate identifiers, manual override and invalid windows.
- `backend/forecasting/test_live_sources.py`: uncertainty metadata and labelled source fallbacks.
- `frontend/scripts/project-regression.mjs`: anonymous public pages, interactive walkthrough, English-only UI, complete custom portfolio save/reload and responsive layout.

Measured facility savings, certified uncertainty bounds and hardware operation are not claimed.
