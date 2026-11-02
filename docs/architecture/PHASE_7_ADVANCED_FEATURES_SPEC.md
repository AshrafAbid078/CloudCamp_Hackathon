# Meridian Grid — Phase 7: Advanced Features & Localization Specification

**Document Version:** 1.0  
**Date:** November 2026  
**Status:** **[IMPLEMENTED & TESTED]**  
**Components Covered:**
- Bilingual Localization (`frontend/src/lib/i18n/`, `frontend/src/lib/store/useLanguageStore.ts`)
- Quantile Probabilistic Solar Forecasting (`backend/forecasting/router.py`, `frontend/src/components/charts/forecast-chart.tsx`)
- Dynamic Custom Machine Ingestion & MILP Dispatch (`backend/dispatch/api.py`, `frontend/src/app/(dashboard)/dispatch/page.tsx`)

---

## 1. Bilingual Localization & Language Toggle (English / বাংলা)

### 1.1 Architecture & Objectives
To fulfill the hackathon guideline (*"Consideration for Bangla / localization"*), Meridian Grid implements a zero-dependency, type-safe internationalization system. 

```
┌─────────────────────────────────┐
│  frontend/src/lib/i18n/         │
│  translations.ts                │
│  - English Dictionary (en)      │
│  - Bengali Dictionary (bn)      │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Zustand: useLanguageStore      │
│  - Persistent state in storage  │
│  - Instant one-click toggle     │
└──────────────┬──────────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
  Header / Navbar    Dashboard, Forecast,
  LanguageToggle     Dispatch, Copilot
```

### 1.2 Key Dictionaries
- **English (`en`)**: Clean, technical industrial terminology (e.g. *"Time-of-Use tariffs"*, *"Peak demand shaved"*, *"Dispatch Studio"*).
- **Bengali (`bn`)**: Context-appropriate Bengali terms for industrial plant managers and local engineers:
  - *Electricity Cost Savings* $\rightarrow$ **বিদ্যুৎ বিল সাশ্রয়**
  - *Carbon Emissions Avoided* $\rightarrow$ **কার্বন নির্গমন হ্রাস**
  - *Peak Demand Shaved* $\rightarrow$ **সর্বোচ্চ পিক লোড হ্রাস**
  - *Peak Solar Irradiance (GHI)* $\rightarrow$ **সর্বোচ্চ সৌর বিকিরণ (GHI)**
  - *Substation Feeder Headroom* $\rightarrow$ **সাবস্টেশন ফিডার হেডরুম**
  - *Dispatch Studio* $\rightarrow$ **ডিসপ্যাচ স্টুডিও**

### 1.3 Implementation Files:
- `frontend/src/lib/i18n/translations.ts`: Master translation keys and types.
- `frontend/src/lib/store/useLanguageStore.ts`: Global state store remembering user choice across page reloads.
- `frontend/src/components/common/language-toggle.tsx`: Modern `[ 🌐 EN | বাংলা ]` switch button.
- Integrated into `Header`, `Navbar`, `Sidebar`, `ForecastChart`, `DispatchPage`, and `AboutPage`.

---

## 2. Quantile Probabilistic Solar Forecasting ($P_{10}, P_{50}, P_{90}$)

### 2.1 Problem & Improvement
Previously, solar forecast confidence was represented as a static $\pm 15\%$ band. In Phase 7, this was upgraded to a **probabilistic quantile ensemble** reflecting realistic atmospheric uncertainty:

$$P_{50} = \text{Modeled GHI} \quad (\text{Expected median})$$
$$P_{10} = \max\left(0, P_{50} \times 0.75\right) \quad (\text{10th percentile overcast / heavy cloud scenario})$$
$$P_{90} = P_{50} \times 1.18 \quad (\text{90th percentile clearsky / peak irradiation upper bound})$$

### 2.2 Backend Schema Update
In `backend/forecasting/router.py`, the response payload now provides explicit quantile curves:
```json
{
  "forecast": {
    "timestamps": ["2026-11-03T10:00:00+06:00", ...],
    "solar_ghi_w_m2": [450.2, 720.5, 680.1, ...],
    "solar_ghi_lower": [337.6, 540.4, 510.1, ...],
    "solar_ghi_upper": [531.2, 850.2, 802.5, ...],
    "quantiles": {
      "p10": [337.6, 540.4, ...],
      "p50": [450.2, 720.5, ...],
      "p90": [531.2, 850.2, ...]
    },
    "grid_stress_gco2_kwh": [625.0, 625.0, ...]
  }
}
```

### 2.3 Visual Chart Upgrade
In `frontend/src/components/charts/forecast-chart.tsx`:
- **$P_{50}$ (Expected Solar GHI):** Solid golden-amber line ($3\text{px}$).
- **$P_{10}$ (Overcast Lower Bound):** Dashed sky-blue line representing risk-averse generation floor.
- **$P_{90}$ (Clearsky Upper Bound):** Dashed emerald-green line representing optimal conditions.

---

## 3. Dynamic Custom Machine Ingestion & MILP Dispatch

### 3.1 Problem & Objective
Synthetic default asset pools demonstrate feasibility, but real facility managers need to test their own unique factory machines (e.g., *Spinning Frame B2*, *Textile Dyeing Jet-4*, *Packaging Line 1*).

### 3.2 Backend Endpoint: `POST /dispatch/custom-asset`
* **File:** `backend/dispatch/api.py`
* **Request Schema:**
  ```python
  class CustomAssetPayload(BaseModel):
      name: str = Field(..., min_length=2, max_length=64)
      power_kw: float = Field(..., gt=0, le=5000)
      duration_hours: int = Field(..., ge=1, le=24)
      deadline_hour: int = Field(..., ge=1, le=24)
      earliest_start_hour: int = Field(default=0, ge=0, le=23)
  ```
* **Execution Logic:**
  1. Validates constraint feasibility: $\text{earliest\_start} + \text{duration} \le \text{deadline}$.
  2. Dynamically creates an `IndustrialProcessAdapter(asset_id, name, power_kw, earliest_start, deadline, duration)`.
  3. Appends the custom asset to the active facility asset pool.
  4. Runs PuLP Mixed-Integer Linear Programming solver across Time-of-Use (TOU) tariffs.
  5. Identifies the optimal start hour and computes exact cost savings versus immediate uncoordinated operation.

### 3.3 Frontend Interactive Modal
* Located in `frontend/src/app/(dashboard)/dispatch/page.tsx`.
* Triggered via the **"+ Add Custom Machine"** header button.
* Upon submission, the custom asset is prepended with a distinct **"CUSTOM"** badge on the live schedule table and Gantt timeline.

---

## 4. Test Coverage & Verification

### Backend Tests:
```bash
python -m pytest backend/dispatch/test_api.py backend/forecasting/test_forecasting.py backend/agent/test_agent.py
```
- `test_dispatch_custom_asset`: Validates feasibility checking, joint solver execution, and return of `optimal_start_hour`.
- `test_forecasting`: Validates quantile array output and bounds integrity.

### Frontend Tests:
```bash
npx tsc --noEmit
npm run test
```
- Passed with **0 TypeScript errors** and 100% test pass rate across adapters.

---

## 5. Guide for Future Developers & Auditors

- **Adding a New Language:** Open `frontend/src/lib/i18n/translations.ts`, add the language code to `Language`, and define the corresponding dictionary keys.
- **Calibrating Quantiles:** In `backend/forecasting/router.py`, the quantile multipliers ($0.75$ and $1.18$) can be replaced with empirical LightGBM pinball-loss models once on-site pyranometer data is connected.
- **Bulk Machine Upload:** The `POST /dispatch/custom-asset` endpoint can be extended to accept `list[CustomAssetPayload]` for full factory CSV uploads.

