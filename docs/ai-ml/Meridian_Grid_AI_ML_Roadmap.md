# Meridian_Grid — AI/ML + Dataset Usage Roadmap

> **Implementation Status**: The core forecasting models (LightGBM) and data pipelines (NSRDB, GFS, Electricity Maps) described here are **[IMPLEMENTED]** in `backend/forecasting/` and `backend/data_pipeline/`. Deep Learning stretch goals remain **[PLANNED / FUTURE]**.This document combines the AI/ML roadmap with a practical map of **which dataset, which columns/features, and which project component uses them**.

The project pipeline is:

```text
Raw Data
   ↓
Data Preparation / Cleaning
   ↓
Model-Ready Joined Data
   ↓
Solar Forecast + Grid Signal
   ↓
Dispatch Optimization
   ↓
KPI Calculation
   ↓
Copilot / What-if
```

---

# 1. Dataset-to-Project Map

## 1.1 Priority summary

| Dataset | Main project role | Priority | Used in MVP? |
|---|---|---:|---:|
| `Bangladesh_2018_NSRDB_986494_OneAxis.csv` | Historical solar/weather time series | Core | ✅ |
| `Bangladesh_2019_NSRDB_986494_OneAxis.csv` | Historical solar/weather time series | Core | ✅ |
| `Bangladesh_2020_NSRDB_986494_OneAxis.csv` | Solar/weather time series overlapping GFS period | Core | ✅ |
| `Bangladesh_GFS_2020_01.csv` … `_04.csv` | Cloud/atmospheric forecast features | Core | ✅ |
| `Bangladesh_Carbon_Intensity.csv` | Historical grid carbon signal | Core/supporting | ✅ |
| `Bangladesh_Electricity_Mix.csv` | Historical generation-mix context | Supporting | ✅ |
| `Bangladesh_Electricity_Maps.csv` | Current/live grid CO2 + power mix | Core | ✅ |
| `time_series_15min_singleindex.csv` | External reference/time-series experiments | Secondary | ❌ initially |
| `time_series_30min_singleindex.csv` | External reference/time-series experiments | Secondary | ❌ initially |
| `time_series_60min_singleindex.csv` | External reference/time-series experiments | Secondary | ❌ initially |
| Synthetic facility data | Industrial process constraints for optimization | Core | ✅ |
| Synthetic battery data | Battery state/constraints for optimization | Core | ✅ |

The project documents define Bangladesh as the live region using **NSRDB + NOAA GFS + Electricity Maps**, while the other regional datasets are not the live Bangladesh pipeline.

---

# 2. NSRDB — 2018, 2019, 2020

## What these files actually are

The loaded NSRDB files have an hourly time-series structure:

```text
2018 → 8,760 rows × 2,034 columns
2019 → 8,760 rows × 2,034 columns
2020 → 8,784 rows × 2,034 columns
```

The 2020 notebook output shows the time fields and major solar/weather fields, including:

```text
Year
Month
Day
Hour
Minute
Temperature
Clearsky DHI
Clearsky DNI
Clearsky GHI
Cloud Type
Dew Point
DHI
DNI
Fill Flag
GHI
Relative Humidity
Solar Zenith Angle
Surface Albedo
Pressure
Precipitable Water
Wind Direction
Wind Speed
Solar Azimuth Angle
Panel Tilt
Panel Azimuth Angle
```

There are also many wavelength/spectral columns such as:

```text
0.2800 um
0.2805 um
...
```

and technology-related spectral-response columns such as:

```text
Si (BPR)
Si (Wacker)
Si (Eurosil)
GaAs (...)
CdTe
...
```

## 2.1 Exact NSRDB columns to use for the MVP

### A. Main target

```text
GHI
```

Use GHI as the primary solar-irradiance target for the first forecasting model.

### B. Solar predictors

```text
DNI
DHI
Clearsky GHI
Clearsky DNI
Clearsky DHI
```

Recommended usage:

- `GHI` → primary target
- `DNI`, `DHI` → additional solar predictors
- `Clearsky GHI/DNI/DHI` → optional solar baseline/context features

### C. Weather predictors

```text
Temperature
Relative Humidity
Pressure
Wind Speed
Wind Direction
Dew Point
Precipitable Water
```

These are candidate weather features for the forecasting model.

### D. Solar-position predictors

```text
Solar Zenith Angle
Solar Azimuth Angle
```

These help the model understand sun position and day/night behavior.

### E. Data-quality / physical-state fields

```text
Cloud Type
Fill Flag
Surface Albedo
```

Keep these available for cleaning, diagnostics, or later feature experiments. They do not all need to enter the first model.

## 2.2 NSRDB columns NOT to use initially

Do not feed the hundreds of wavelength/spectral columns into the first GBM model:

```text
0.2800 um
0.2805 um
...
4.0000 um
...
```

Also do not start with all specialized spectral-response columns.

Reason:

```text
2,034 columns
    ↓
very high dimensionality
    ↓
more preprocessing
    ↓
more noise / overfitting risk
    ↓
less transparent MVP
```

These can remain available for a later experiment.

## 2.3 How to use the three NSRDB years

Use them as historical solar/weather records:

```text
2018 ── historical solar behavior
2019 ── historical solar behavior
2020 ── historical solar behavior + GFS overlap
```

The 2020 dataset is especially important because the available GFS files are from 2020 and the joined training window must be based on the actual overlap between NSRDB and GFS.

Important: **do not assume the whole 2018–2020 period can be joined to GFS**. First calculate the real overlap window.

---

# 3. NOAA GFS — 2020-01 to 2020-04

## Main role

GFS is the **future weather / cloud information source** for solar forecasting.

The project architecture specifically assigns NOAA GFS to cloud-cover/atmospheric features that feed the solar forecast.

## Use

The first model should select the GFS variables that represent:

```text
cloud conditions
temperature
humidity / atmospheric moisture
pressure
wind
other relevant atmospheric forecast variables
```

### Most important concept

```text
NSRDB
Historical solar behavior
        +
GFS
Future atmospheric/cloud condition
        ↓
Solar forecast
```

## Important implementation rule

Do not invent a list of GFS columns before inspecting the actual GFS files.

First print:

```python
gfs.columns.tolist()
```

Then create the final GFS schema using the actual available field names.

The project plan explicitly calls for a separate `gfs_loader.py` to load, clean, normalize timezone/units, and produce a model-ready output.

---

# 4. Bangladesh Carbon Intensity

## Main role

This dataset provides a **historical grid-emissions signal**.

Use it for:

```text
historical carbon intensity
grid-emissions context
grid-stress/carbon analysis
backtesting/explanation of grid conditions
```

It is NOT the solar target.

The important conceptual variable is:

```text
carbon_intensity
```

Again, use the actual column name from the CSV after inspecting:

```python
df.columns.tolist()
```

Then normalize it to a stable internal name such as:

```text
carbon_intensity
```

---

# 5. Bangladesh Electricity Mix

## Main role

Electricity Mix provides **generation-mix context** for the Bangladesh grid.

Use it for:

```text
generation mix analysis
fossil vs renewable context
carbon explanation
dashboard context
```

Conceptually:

```text
Electricity Mix
      ↓
What sources are serving the grid?
      ↓
Context for carbon intensity
```

Do not automatically treat every generation-mix field as an ML feature.

Initially, keep the mix variables mainly for:

```text
analysis
explanation
visualization
```

and use the actual carbon-intensity signal for optimization/emissions calculations.

Before coding the loader, inspect the real column names:

```python
df.columns.tolist()
```

---

# 6. Bangladesh Electricity Maps

## Main role

Electricity Maps is the **live/current Bangladesh grid signal**.

The project architecture assigns it:

```text
CO2 intensity
+
power mix
```

Use these fields/concepts:

```text
timestamp
carbon / CO2 intensity
power mix
isEstimated
estimationMethod
```

The loader should preserve the estimation metadata.

Important:

```text
isEstimated
estimationMethod
```

should NOT be thrown away because the Bangladesh data quality/tier is explicitly something the project must disclose.

## How it enters the system

```text
Electricity Maps
      ↓
Current grid signal
      ↓
Grid-stress / carbon forecast
      ↓
Optimizer
```

For the MVP, the grid-stress forecast is deliberately simple:

```text
recent Electricity Maps signal
        ↓
short-horizon extrapolation
```

Do not oversell this as a complex ML forecast.

---

# 7. 15-Minute SingleIndex Dataset

## Basic role

This is a high-frequency external/reference dataset, not the core Bangladesh live data source.

The actual columns include European country/region variables such as:

```text
utc_timestamp
cet_cest_timestamp
AT_load_actual_entsoe_transparency
AT_load_forecast_entsoe_transparency
AT_price_day_ahead
AT_solar_generation_actual
AT_wind_onshore_generation_actual
BE_load_actual_entsoe_transparency
...
DE_load_actual_entsoe_transparency
DE_solar_generation_actual
DE_wind_generation_actual
...
NL_solar_generation_actual
NL_wind_generation_actual
...
```

## What parts are useful?

### Time

```text
utc_timestamp
```

Use for time-series processing.

### Load

Examples:

```text
*_load_actual_entsoe_transparency
*_load_forecast_entsoe_transparency
```

Useful for:

```text
load forecasting experiments
time-series feature engineering
```

### Solar

Examples:

```text
*_solar_generation_actual
*_solar_capacity
*_solar_profile
```

Useful for:

```text
renewable-generation experiments
forecasting experiments
```

### Wind

Examples:

```text
*_wind_generation_actual
*_wind_capacity
*_wind_profile
*_wind_offshore_generation_actual
*_wind_onshore_generation_actual
```

Useful for:

```text
renewable-generation experiments
```

### Price

Examples:

```text
AT_price_day_ahead
```

Useful conceptually for:

```text
cost-aware optimization experiments
```

But this is not Bangladesh tariff data, so it should **not** be used as the Bangladesh facility's actual electricity price.

## MVP decision

```text
Do not use as a production Bangladesh feature table initially.
```

Keep it for:

```text
reference experiments
forecasting pipeline testing
future EU/OPSD-style adapter work
```

---

# 8. 30-Minute SingleIndex Dataset

This dataset is also a European/reference time series.

It uses:

```text
utc_timestamp
cet_cest_timestamp
```

plus country/region fields for:

```text
load
solar generation
wind generation
capacity
profiles
day-ahead price
```

The EDA established:

```text
100,802 rows
41 columns
30-minute resolution
```

## Useful parts

```text
utc_timestamp
*_load_actual_entsoe_transparency
*_load_forecast_entsoe_transparency
*_solar_generation_actual
*_solar_capacity
*_wind_generation_actual
*_wind_capacity
*_price_day_ahead
```

## Project use

```text
reference time-series dataset
feature engineering experiments
forecasting pipeline testing
possible future European region adapter
```

Not the live Bangladesh training table.

---

# 9. 60-Minute SingleIndex Dataset

This dataset is hourly and also contains European/reference energy variables.

EDA established:

```text
50,401 rows
300 columns
hourly resolution
```

Useful column families include:

```text
utc_timestamp
*_load_actual_entsoe_transparency
*_load_forecast_entsoe_transparency
*_solar_generation_actual
*_solar_capacity
*_solar_profile
*_wind_generation_actual
*_wind_capacity
*_wind_profile
*_price_day_ahead
```

## Project use

Best uses:

```text
hourly forecasting experiments
feature selection experiments
time-series pipeline validation
future European adapter/reference
```

Again:

```text
Not part of the core Bangladesh MVP training table.
```

---

# 10. Synthetic Facility Dataset

Real facility/machine-level data is not available for the MVP, so facility data is generated synthetically.

Each industrial process should contain:

```text
name
power_kw
earliest_start
deadline
duration
```

Example:

```text
Garment Washing
power_kw = 200
earliest_start = 10:00
deadline = 18:00
duration = 2 hours
```

This dataset is NOT for ML forecasting.

It is an input to:

```text
Dispatch Optimization
```

---

# 11. Synthetic Battery Dataset

Battery data should contain:

```text
capacity_kwh
current_soc
charge_rate
discharge_rate
```

Again, this is not a forecasting target.

It is an optimization constraint/state input.

Conceptually:

```text
Solar forecast
+
Grid carbon forecast
+
Battery state
        ↓
Optimizer
        ↓
Charge / discharge schedule
```

---

# 12. Final Model-Ready Solar Feature Set

For the first solar forecasting model, start with:

## Target

```text
GHI
```

## NSRDB features

```text
DNI
DHI
Clearsky GHI
Clearsky DNI
Clearsky DHI
Temperature
Relative Humidity
Pressure
Wind Speed
Wind Direction
Dew Point
Precipitable Water
Solar Zenith Angle
Solar Azimuth Angle
Cloud Type
Surface Albedo
```

Not all of these must remain after feature selection, but these are the sensible candidate fields available from the NSRDB schema.

## Time features created by us

```text
hour
day_of_week
day_of_year
month
```

## Lag features created by us

```text
GHI_lag_1
GHI_lag_3
GHI_lag_6
GHI_lag_12
GHI_lag_24
```

## Rolling features created by us

```text
GHI_rolling_mean_3
GHI_rolling_mean_6
GHI_rolling_mean_24
```

## GFS features

Select actual cloud/atmospheric forecast columns after inspecting the GFS schema.

---

# 13. Final Grid Feature Set

The grid side is separate from the solar target.

Candidate inputs:

```text
historical carbon intensity
current Electricity Maps carbon intensity
Electricity Maps power mix
isEstimated
estimationMethod
timestamp
```

The main normalized signal should be something like:

```text
carbon_intensity
```

Then:

```text
Historical/current grid signal
        ↓
Short-horizon grid/carbon forecast
```

---

# 14. Final Joined Table

The ultimate forecasting/decision table should look conceptually like:

| timestamp | GHI | DNI | DHI | temperature | humidity | pressure | wind_speed | cloud_cover | carbon_intensity |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

Then derived features are added:

```text
hour
day_of_week
day_of_year
GHI_lag_1
GHI_lag_6
GHI_lag_24
GHI_rolling_mean_6
GHI_rolling_mean_24
```

This becomes the input layer for forecasting.

---

# 15. Critical Data-Join Rule

Do not join all datasets just because they exist.

The core live Bangladesh data flow should be:

```text
NSRDB
   +
GFS
   +
Electricity Maps / carbon data
   ↓
Shared timestamp
   ↓
Joined Bangladesh dataset
```

First calculate:

```text
NSRDB start/end
GFS start/end
Grid data start/end
```

Then determine the actual common overlap.

The project build plan specifically requires finding the real NSRDB/GFS overlap window before model training.

Because GFS files currently cover only a subset of 2020, the entire 2018–2020 NSRDB period should not automatically be treated as a joined NSRDB+GFS training set.

---

# 16. AI/ML Pipeline

## Step 1 — Data Preparation

```text
Raw CSV
   ↓
Load
   ↓
Select project columns
   ↓
Rename / normalize
   ↓
Create timestamp
   ↓
UTC normalization
   ↓
Missing-value handling
   ↓
Physical sanity checks
```

## Step 2 — Join

```text
NSRDB + GFS + Grid signal
          ↓
shared UTC timestamp
          ↓
model-ready DataFrame
```

## Step 3 — Target

```text
Future GHI / solar output
```

## Step 4 — Features

```text
calendar
+
lags
+
rolling features
+
NSRDB weather/solar
+
GFS atmospheric/cloud features
```

## Step 5 — Time split

```text
TRAIN → earlier timestamps
VALID/TEST → later timestamps
```

Never use a random train/test split for the time-series forecasting task.

---

# 17. Persistence Baseline

Before ML:

```text
Persistence forecast
```

Basic idea:

```text
recent/comparable solar behavior
        ↓
future solar estimate
```

Evaluate with:

```text
MAE
RMSE
MAPE
```

The ML model must beat or meaningfully improve upon this baseline.

---

# 18. GBM / LightGBM

After baseline:

```text
Time features
+
Lag features
+
Weather
+
Solar features
+
GFS
        ↓
GBM / LightGBM
        ↓
6–24h solar forecast
```

The MVP model should remain simpler than the stretch models.

---

# 19. Backtesting

Use a genuine future/held-out time window.

Compare:

```text
Persistence
vs.
GBM / LightGBM
```

Report:

```text
MAE
RMSE
MAPE
```

Do not report training accuracy as forecasting accuracy.

---

# 20. Confidence Band

The forecasting service should expose:

```text
forecast
+
confidence band
+
backtested accuracy
```

The dashboard should make the forecast uncertainty visible.

---

# 21. Grid-Stress / Carbon Forecast

For MVP:

```text
Electricity Maps signal
        ↓
simple short-horizon extrapolation
        ↓
grid-stress / carbon forecast
```

Keep this deliberately simple and transparent.

---

# 22. Dispatch Optimization

Inputs:

```text
Solar forecast
Grid/carbon forecast
Facility process constraints
Battery state
Electricity tariff
```

Objective:

```text
minimize(
    w1 * cost
    +
    w2 * emissions
)
```

Important project gap:

```text
Electricity tariff/pricing data is still missing.
```

The build plan explicitly identifies tariff/pricing as a required input that has not yet been sourced.

---

# 23. Industrial Optimization

Input:

```text
power_kw
earliest_start
deadline
duration
```

Constraint:

```text
run process within allowed window
```

Decision:

```text
Which hours should the process run?
```

Preferred window:

```text
low cost
+
low carbon
+
high solar availability
```

---

# 24. Battery Optimization

Input:

```text
capacity_kwh
current_soc
charge_rate
discharge_rate
```

Constraints:

```text
SoC limits
capacity
charge-rate limit
discharge-rate limit
```

Decision:

```text
when to charge
when to discharge
```

---

# 25. KPI Calculation

Compare:

```text
Naive baseline
vs.
Optimized dispatch
```

Output:

```text
$ saved
tCO2 avoided
peak kW shaved
```

These are the main business-value KPIs for the live demo.

---

# 26. Copilot / Agent

The copilot sits above the forecasting and optimization services.

Tools:

```text
get_forecast
get_dispatch_plan
run_whatif
explain_decision
```

Flow:

```text
User
 ↓
Copilot
 ↓
Tool call
 ↓
Real forecast/optimization result
 ↓
Explanation
```

Numeric answers must come from actual tool results.

---

# 27. What-if

Example:

```text
What happens if solar drops 30% tomorrow?
```

Flow:

```text
Current scenario
      ↓
Apply perturbation
      ↓
Re-run relevant forecast/optimization
      ↓
Compare old vs new result
      ↓
Explain the difference
```

---

# 28. What Is Actually Needed Right Now?

After EDA, do this in order:

```text
1. Inspect exact columns of NSRDB
2. Inspect exact columns of each GFS file
3. Inspect exact columns of Carbon Intensity
4. Inspect exact columns of Electricity Mix
5. Inspect exact columns of Electricity Maps
6. Decide final selected fields
7. Build nsrdb_loader.py
8. Build gfs_loader.py
9. Build electricity_maps_loader.py
10. Normalize timestamps to UTC
11. Find actual NSRDB/GFS overlap
12. Join into model-ready data
13. Validate the joined data
14. Create target + features
15. Build persistence baseline
16. Train/test GBM
17. Backtest
18. Build optimization
19. Build copilot
```

---

# 29. One-Screen Decision Guide

```text
NSRDB 2018
└─ Historical solar/weather
   └─ GHI, DNI, DHI, weather, solar angles
      └─ Forecasting

NSRDB 2019
└─ Historical solar/weather
   └─ GHI, DNI, DHI, weather, solar angles
      └─ Forecasting

NSRDB 2020
└─ Solar/weather + GFS overlap
   └─ GHI, DNI, DHI, weather, solar angles
      └─ Forecasting

GFS 2020
└─ Cloud/atmospheric future information
   └─ Solar forecast features

Carbon Intensity
└─ Historical grid emissions
   └─ Grid/carbon signal

Electricity Mix
└─ Grid generation composition
   └─ Context / explanation / analysis

Electricity Maps
└─ Live grid condition
   └─ Current CO2 intensity + power mix
      └─ Grid forecast / optimization

SingleIndex 15m
└─ European/reference time series
   └─ Experiments / future adapter

SingleIndex 30m
└─ European/reference time series
   └─ Experiments / future adapter

SingleIndex 60m
└─ European/reference time series
   └─ Hourly experiments / future adapter

Synthetic Facility
└─ Flexible industrial process constraints
   └─ Optimization

Synthetic Battery
└─ Battery state/constraints
   └─ Optimization
```

---

# 30. Immediate Next Deliverable

The next concrete output should be:

```text
data/processed/bangladesh_model_ready.parquet
```

containing:

```text
timestamp
GHI
DNI
DHI
temperature
humidity
pressure
wind_speed
cloud/weather features
carbon_intensity
```

plus engineered:

```text
hour
day_of_week
day_of_year
lags
rolling statistics
```

Only after this table is verified should model training begin.
