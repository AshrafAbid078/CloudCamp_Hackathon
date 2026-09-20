import pandas as pd
from pathlib import Path
import json

PROJECT_ROOT = Path(__file__).resolve().parents[2]
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
SYNTHETIC_DIR = PROJECT_ROOT / "data" / "synthetic"

def check_dataframe(name, df, time_col=None):
    print(f"\n--- Checking {name} ---")
    print(f"Shape: {df.shape}")
    print("Data types:")
    print(df.dtypes)
    
    missing = df.isna().sum()
    if missing.sum() > 0:
        print("\nMissing values:")
        print(missing[missing > 0])
    else:
        print("\nNo missing values.")
        
    if time_col and time_col in df.columns:
        print(f"\nTime range: {df[time_col].min()} to {df[time_col].max()}")
        print(f"Is monotonic increasing? {df[time_col].is_monotonic_increasing}")
        dups = df[time_col].duplicated().sum()
        print(f"Duplicate timestamps: {dups}")
        
    print("\nSample (first 3 rows):")
    print(df.head(3))
    
def physical_sanity_checks():
    print("\n--- Physical Sanity Checks ---")
    
    # NSRDB checks
    nsrdb_path = PROCESSED_DIR / "bangladesh_nsrdb_clean.parquet"
    if nsrdb_path.exists():
        df = pd.read_parquet(nsrdb_path)
        ghi_min = df["GHI"].min()
        print(f"NSRDB: Min GHI >= 0: {ghi_min >= 0} (Value: {ghi_min})")
        if "Relative Humidity" in df.columns:
            rh_min = df["Relative Humidity"].min()
            rh_max = df["Relative Humidity"].max()
            print(f"NSRDB: RH between 0-100: {rh_min >= 0 and rh_max <= 100} (Range: {rh_min} to {rh_max})")
            
    # GFS checks
    gfs_path = PROCESSED_DIR / "bangladesh_gfs_clean.parquet"
    if gfs_path.exists():
        df = pd.read_parquet(gfs_path)
        if "relative_humidity_2m_percent" in df.columns:
            rh_min = df["relative_humidity_2m_percent"].min()
            rh_max = df["relative_humidity_2m_percent"].max()
            print(f"GFS: RH between 0-100: {rh_min >= 0 and rh_max <= 100} (Range: {rh_min} to {rh_max})")

def main():
    print("="*50)
    print("PIPELINE VALIDATION")
    print("="*50)
    
    files_to_check = [
        (PROCESSED_DIR / "bangladesh_nsrdb_clean.parquet", "timestamp"),
        (PROCESSED_DIR / "bangladesh_gfs_clean.parquet", "datetime"),
        (PROCESSED_DIR / "bangladesh_electricity_mix_clean.parquet", "datetime"),
        (PROCESSED_DIR / "bangladesh_electricity_maps_clean.parquet", "datetime"),
        (PROCESSED_DIR / "bangladesh_carbon_intensity_clean.parquet", "datetime"),
        (SYNTHETIC_DIR / "facilities.parquet", None),
        (SYNTHETIC_DIR / "batteries.parquet", None)
    ]
    
    for path, time_col in files_to_check:
        if path.exists():
            df = pd.read_parquet(path)
            check_dataframe(path.name, df, time_col)
        else:
            print(f"\n[WARNING] File not found: {path}")
            
    physical_sanity_checks()
    
    tariff_path = SYNTHETIC_DIR / "tariff_placeholder.json"
    if tariff_path.exists():
        with open(tariff_path, 'r') as f:
            data = json.load(f)
            print(f"\n--- Tariff Placeholder ---")
            print(f"Currency: {data.get('currency')} / {data.get('unit')}")
            print(f"Rates: {list(data.get('rates', {}).keys())}")
    else:
        print(f"\n[WARNING] Tariff placeholder not found.")

if __name__ == "__main__":
    main()
