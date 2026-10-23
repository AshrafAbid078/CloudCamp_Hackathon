# Current data setup

The running backend prefers a current regional Open-Meteo weather forecast. The
forecast point defaults to 23.81, 90.41 (near Dhaka). This is a weather-model
prediction, not on-site irradiance telemetry. If the service is unavailable,
the API falls back to its archived 2020 sample and labels that fallback.

1. Copy `.env.example` to `.env` in the repository root. The local `.env` is
   ignored by Git. `LIVE_WEATHER_ENABLED=true` and the forecast coordinates are
   already configured for the demo. Open-Meteo's free API is limited to
   non-commercial use; check its terms before commercial deployment.
2. For carbon data, [create an Electricity Maps account or trial](https://app.electricitymaps.com/auth/signup).
   After signing in, [view your API key](https://app.electricitymaps.com/docs/quickstart/authorization)
   and place it after `ELECTRICITY_MAPS_API_KEY=` in `.env`. Restart the backend.
   Check that your plan includes the `BD` zone and carbon-intensity forecast.
3. Inspect `GET /health` for `forecast_sources`, or sign in and open Forecast.
   `solar` reports the Open-Meteo source or archived fallback. `carbon` reports
   an Electricity Maps v4 forecast, a recent reading held constant, or an
   archived constant. A recent reading held constant is **not** a future
   carbon forecast.

The backend caches upstream responses for 15 minutes by default. The carbon
poller also stores the latest Electricity Maps v4 reading when a key is set.
The optimizer uses the current forecast timeline and carbon signal; its default
demo plan still has zero installed PV and no measured facility load. Real site
dispatch requires facility ownership mapping, metering, asset constraints,
tariff contracts, safety controls, and equipment integration.

BPDB tariff publications are documents rather than a streaming API. The demo
continues to use its placeholder tariff until a verified tariff schedule for a
specific facility is imported. The frontend never receives an API secret.
