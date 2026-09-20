import pandas as pd
import numpy as np
from pathlib import Path

# Paths
PROJECT_ROOT = Path(__file__).resolve().parents[3]
OUTPUT_DIR = PROJECT_ROOT / "data" / "synthetic"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE = OUTPUT_DIR / "batteries.parquet"

def generate_batteries(n_batteries=5, seed=123):
    """
    Generate synthetic battery states with seeded random data.
    """
    np.random.seed(seed)
    
    batteries = []
    for i in range(n_batteries):
        # 1 MWh to 10 MWh
        capacity_kwh = float(np.random.uniform(1000, 10000))
        
        # Starting SoC between 10% and 90%
        current_soc = float(np.random.uniform(0.1, 0.9))
        
        # Charge/discharge rates (C-rate between 0.25 and 1.0)
        c_rate = float(np.random.uniform(0.25, 1.0))
        charge_rate_kw = capacity_kwh * c_rate
        discharge_rate_kw = capacity_kwh * c_rate
        
        batteries.append({
            "battery_id": f"B{i+1:03d}",
            "capacity_kwh": round(capacity_kwh, 2),
            "current_soc": round(current_soc, 3),
            "charge_rate_kw": round(charge_rate_kw, 2),
            "discharge_rate_kw": round(discharge_rate_kw, 2)
        })
        
    df = pd.DataFrame(batteries)
    return df

if __name__ == "__main__":
    print("Generating synthetic batteries...")
    df = generate_batteries()
    
    print("Batteries generated:")
    print(df.head())
    
    df.to_parquet(OUTPUT_FILE, index=False)
    print(f"Saved to {OUTPUT_FILE}")
