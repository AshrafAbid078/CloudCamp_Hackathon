import pandas as pd
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

# Project root = Project root folder
PROJECT_ROOT = Path(__file__).resolve().parents[3]

# Folder for CSV files
CSV_DIR = PROJECT_ROOT / "data" / "raw"

# Raw GFS CSV files
GFS_FILES = sorted(
    CSV_DIR.glob("Bangladesh_GFS_2020_*.csv")
)

# Folder for cleaned output
OUTPUT_DIR = PROJECT_ROOT / "data" / "processed"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# GFS LOADER FUNCTION
# ============================================================

def load_gfs(file_path):
    """
    Load and clean one GFS CSV file.
    """

    print(f"Loading: {file_path.name}")

    # --------------------------------------------------------
    # 1. Read raw CSV
    # --------------------------------------------------------

    df = pd.read_csv(file_path)

    # --------------------------------------------------------
    # 2. Remove completely empty rows
    # --------------------------------------------------------

    df = df.dropna(how="all")

    # --------------------------------------------------------
    # 3. Clean column names
    # --------------------------------------------------------

    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
    )

    # --------------------------------------------------------
    # 4. Convert datetime
    # --------------------------------------------------------

    if "datetime" in df.columns:

        df["datetime"] = pd.to_datetime(
            df["datetime"],
            errors="coerce",
            utc=True
        )

    # --------------------------------------------------------
    # 5. Convert numerical columns
    # --------------------------------------------------------

    numeric_columns = [
        "latitude",
        "longitude",
        "temperature_2m_k",
        "relative_humidity_2m_percent",
        "specific_humidity_2m",
        "wind_u_10m",
        "wind_v_10m",
        "wind_gust",
        "precipitation_rate",
        "sunshine_duration",
        "cloud_cover_max_isobaric"
    ]

    for column in numeric_columns:

        if column in df.columns:

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

    # --------------------------------------------------------
    # 6. Remove duplicate rows
    # --------------------------------------------------------

    df = df.drop_duplicates()

    # --------------------------------------------------------
    # 7. Sort by datetime
    # --------------------------------------------------------

    if "datetime" in df.columns:

        df = df.sort_values(
            by="datetime"
        )

    return df


# ============================================================
# LOAD ALL GFS FILES
# ============================================================

def load_all_gfs():
    """
    Load all Bangladesh GFS CSV files
    and combine them into one DataFrame.
    """

    if not GFS_FILES:

        raise FileNotFoundError(
            "No Bangladesh GFS CSV files were found."
        )

    frames = []

    for file in GFS_FILES:

        cleaned_df = load_gfs(file)

        frames.append(cleaned_df)

    # Combine all monthly files
    combined_df = pd.concat(
        frames,
        ignore_index=True
    )

    # --------------------------------------------------------
    # Drop invalid datetimes and aggregate spatial grid
    # --------------------------------------------------------

    if "datetime" in combined_df.columns:
        combined_df = combined_df.dropna(subset=["datetime"])
        
        # Aggregate across latitude/longitude to create a single time series
        numeric_cols = combined_df.select_dtypes(include='number').columns.tolist()
        combined_df = combined_df.groupby("datetime", as_index=False)[numeric_cols].mean()
        
        # Interpolate/fill any single missing steps
        combined_df = combined_df.ffill().bfill()

    # --------------------------------------------------------
    # Sort complete dataset by datetime
    # --------------------------------------------------------

    if "datetime" in combined_df.columns:
        combined_df = combined_df.sort_values(
            by="datetime"
        ).reset_index(drop=True)

    return combined_df


# ============================================================
# SAVE FUNCTION
# ============================================================

def save_gfs(
    df,
    output_path=None,
):
    """
    Save a cleaned GFS DataFrame to Parquet.

    Args:
        df:           Cleaned GFS DataFrame from load_all_gfs().
        output_path:  Optional explicit Path. Defaults to
                      OUTPUT_DIR / 'bangladesh_gfs_clean.parquet'.
    """
    if output_path is None:
        output_path = OUTPUT_DIR / "bangladesh_gfs_clean.parquet"

    df.to_parquet(output_path, index=False)
    print(f"Saved cleaned GFS data to: {output_path}")
    return output_path


def run():
    """
    Full load-and-save pipeline. Importable by other scripts
    (e.g. an orchestrator or test harness) without depending on
    __main__ being executed.
    """
    df = load_all_gfs()
    path = save_gfs(df)
    return df, path

if __name__ == "__main__":

    print("=" * 60)
    print("GFS DATA LOADER")
    print("=" * 60)

    print(f"\nFound {len(GFS_FILES)} GFS files.")

    # Load all files
    gfs_df = load_all_gfs()

    # --------------------------------------------------------
    # Final information
    # --------------------------------------------------------

    print("\n" + "=" * 60)
    print("CLEANING COMPLETE")
    print("=" * 60)

    print("\nFinal shape:")
    print(gfs_df.shape)

    print("\nData types:")
    print(gfs_df.dtypes)

    print("\nMissing values:")
    print(gfs_df.isnull().sum())

    print("\nDuplicate rows:")
    print(gfs_df.duplicated().sum())

    # --------------------------------------------------------
    # Save as Parquet
    # --------------------------------------------------------

    output_file = (
        OUTPUT_DIR /
        "bangladesh_gfs_clean.parquet"
    )

    gfs_df.to_parquet(
        output_file,
        index=False
    )

    print("\nSaved cleaned GFS data to:")
    print(output_file)