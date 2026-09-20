import pandas as pd
import numpy as np
from pathlib import Path

# Paths
PROJECT_ROOT = Path(__file__).resolve().parents[3]
OUTPUT_DIR = PROJECT_ROOT / "data" / "synthetic"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE = OUTPUT_DIR / "facilities.parquet"

def generate_facilities(n_facilities=20, seed=42):
    """
    Generate synthetic flexible industrial facilities with seeded random data.
    """
    np.random.seed(seed)
    
    # Types of facilities to sample names from
    facility_types = ["Cold Storage", "Water Pump", "Cement Kiln", "Textile Mill", "Data Center", "Aluminium Smelter"]
    
    facilities = []
    for i in range(n_facilities):
        ftype = np.random.choice(facility_types)
        name = f"{ftype} {i+1:02d}"
        power_kw = float(np.random.uniform(500, 5000)) # 500 kW to 5 MW
        
        # Earliest start is usually early morning
        earliest_start = int(np.random.uniform(0, 8))
        
        # Duration in hours
        duration = int(np.random.uniform(2, 12))
        
        # Deadline must be strictly after earliest_start + duration
        deadline = int(np.random.uniform(earliest_start + duration + 2, 24))
        if deadline > 23:
            deadline = 23
            
        facilities.append({
            "facility_id": f"F{i+1:03d}",
            "name": name,
            "power_kw": round(power_kw, 2),
            "earliest_start": earliest_start,
            "deadline": deadline,
            "duration": duration
        })
        
    df = pd.DataFrame(facilities)
    return df

if __name__ == "__main__":
    print("Generating synthetic facilities...")
    df = generate_facilities()
    
    print("Facilities generated:")
    print(df.head())
    
    df.to_parquet(OUTPUT_FILE, index=False)
    print(f"Saved to {OUTPUT_FILE}")
