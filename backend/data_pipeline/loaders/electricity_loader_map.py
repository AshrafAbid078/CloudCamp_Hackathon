from pathlib import Path
import pandas as pd


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[3]
CSV_DIR = PROJECT_ROOT / "data" / "raw"

OUTPUT_DIR = PROJECT_ROOT / "data" / "processed"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# COMMON CLEANING FUNCTION
# ============================================================

def clean_common(df):
    """
    Common cleaning for Electricity Maps datasets.
    """

    # Remove completely empty rows
    df = df.dropna(how="all")

    # Clean column names
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_", regex=False)
    )

    # Convert datetime columns to UTC
    for column in ["datetime", "updatedat"]:
        if column in df.columns:
            df[column] = pd.to_datetime(
                df[column],
                errors="coerce",
                utc=True
            )

    # Remove duplicate rows
    df = df.drop_duplicates()

    # Sort by datetime
    if "datetime" in df.columns:
        df = df.sort_values("datetime").reset_index(drop=True)

    return df


# ============================================================
# ELECTRICITY MIX LOADER
# ============================================================

def load_electricity_mix():
    """
    Load and clean Bangladesh Electricity Mix data.
    """

    file_path = CSV_DIR / "Bangladesh_Electricity_Mix.csv"

    print(f"Loading: {file_path.name}")

    df = pd.read_csv(file_path)

    print(f"Raw shape: {df.shape}")

    # Common cleaning
    df = clean_common(df)

    # --------------------------------------------------------
    # Handle isEstimated
    # --------------------------------------------------------

    if "isestimated" in df.columns:
        df["isestimated"] = df["isestimated"].astype("boolean")

    # --------------------------------------------------------
    # Handle estimationMethod
    # --------------------------------------------------------

    if "estimationmethod" in df.columns:
        df["estimationmethod"] = (
            df["estimationmethod"]
            .astype("string")
            .str.strip()
        )

    # --------------------------------------------------------
    # Convert electricity values to numeric
    # --------------------------------------------------------

    electricity_columns = [
        "nuclear",
        "geothermal",
        "biomass",
        "coal",
        "wind",
        "solar",
        "hydro",
        "gas",
        "oil",
        "unknown",
        "hydro_storage_charge",
        "hydro_storage_discharge",
        "battery_storage_charge",
        "battery_storage_discharge",
        "flows_exports",
        "flows_imports"
    ]

    for column in electricity_columns:
        if column in df.columns:
            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

    # --------------------------------------------------------
    # Handle completely empty columns
    #
    # EDA showed that these columns contain no values:
    # nuclear, geothermal, biomass,
    # hydro storage discharge,
    # battery storage discharge,
    # flows exports/imports
    #
    # For the pipeline we represent these unavailable
    # sources/flows as 0.
    # --------------------------------------------------------

    sparse_columns = [
        "nuclear",
        "geothermal",
        "biomass",
        "hydro_storage_discharge",
        "battery_storage_discharge",
        "flows_exports",
        "flows_imports"
    ]

    for column in sparse_columns:
        if column in df.columns and df[column].isna().all():
            df[column] = 0.0

    return df


# ============================================================
# ELECTRICITY MAPS LOADER
# ============================================================

def load_electricity_maps():
    """
    Load and clean Bangladesh Electricity Maps data.
    """

    file_path = CSV_DIR / "Bangladesh_Electricity_Maps.csv"

    print(f"Loading: {file_path.name}")

    df = pd.read_csv(file_path)

    print(f"Raw shape: {df.shape}")

    # Common cleaning
    df = clean_common(df)

    # --------------------------------------------------------
    # Handle estimationMethod
    # --------------------------------------------------------

    if "estimationmethod" in df.columns:
        df["estimationmethod"] = (
            df["estimationmethod"]
            .astype("string")
            .str.strip()
        )

    # --------------------------------------------------------
    # Convert electricity values to numeric
    # --------------------------------------------------------

    electricity_columns = [
        "nuclear",
        "geothermal",
        "biomass",
        "coal",
        "wind",
        "solar",
        "hydro",
        "gas",
        "oil",
        "unknown",
        "hydro_storage_charge",
        "hydro_storage_discharge",
        "battery_storage_charge",
        "battery_storage_discharge",
        "flows_charge",
        "flows_discharge"
    ]

    for column in electricity_columns:
        if column in df.columns:
            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

    # --------------------------------------------------------
    # Handle completely empty columns
    # --------------------------------------------------------

    sparse_columns = [
        "nuclear",
        "geothermal",
        "biomass",
        "hydro_storage_discharge",
        "battery_storage_discharge",
        "flows_charge",
        "flows_discharge"
    ]

    for column in sparse_columns:
        if column in df.columns and df[column].isna().all():
            df[column] = 0.0

    return df


# ============================================================
# CARBON INTENSITY LOADER
# ============================================================

def load_carbon_intensity():
    """
    Load and clean Bangladesh Carbon Intensity data.
    """

    file_path = CSV_DIR / "Bangladesh_Carbon_Intensity.csv"

    print(f"Loading: {file_path.name}")

    df = pd.read_csv(file_path)

    print(f"Raw shape: {df.shape}")

    # Common cleaning
    df = clean_common(df)

    # --------------------------------------------------------
    # Handle isEstimated
    # --------------------------------------------------------

    if "isestimated" in df.columns:
        df["isestimated"] = df["isestimated"].astype("boolean")

    # --------------------------------------------------------
    # Handle estimationMethod
    # --------------------------------------------------------

    if "estimationmethod" in df.columns:
        df["estimationmethod"] = (
            df["estimationmethod"]
            .astype("string")
            .str.strip()
        )

    # --------------------------------------------------------
    # Carbon intensity
    # --------------------------------------------------------

    if "carbon_intensity_gco2eq_kwh" in df.columns:
        df["carbon_intensity_gco2eq_kwh"] = pd.to_numeric(
            df["carbon_intensity_gco2eq_kwh"],
            errors="coerce"
        )

    return df


# ============================================================
# SAVE FUNCTIONS
# ============================================================

def save_all(
    electricity_mix=None,
    electricity_maps=None,
    carbon_intensity=None,
):
    """
    Save cleaned electricity DataFrames to Parquet.

    Each argument is optional — pass only the DataFrames you want saved.
    Defaults to OUTPUT_DIR for all output paths.

    Returns a dict of {dataset_name: output_path}.
    """
    saved = {}

    if electricity_mix is not None:
        path = OUTPUT_DIR / "bangladesh_electricity_mix_clean.parquet"
        electricity_mix.to_parquet(path, index=False)
        print(f"Saved electricity mix to: {path}")
        saved["electricity_mix"] = path

    if electricity_maps is not None:
        path = OUTPUT_DIR / "bangladesh_electricity_maps_clean.parquet"
        electricity_maps.to_parquet(path, index=False)
        print(f"Saved electricity maps to: {path}")
        saved["electricity_maps"] = path

    if carbon_intensity is not None:
        path = OUTPUT_DIR / "bangladesh_carbon_intensity_clean.parquet"
        carbon_intensity.to_parquet(path, index=False)
        print(f"Saved carbon intensity to: {path}")
        saved["carbon_intensity"] = path

    return saved


def run():
    """
    Full load-and-save pipeline for all electricity datasets.
    Importable by other scripts or an orchestrator without
    depending on __main__ being executed.

    Returns:
        Tuple of (electricity_mix, electricity_maps, carbon_intensity) DataFrames.
    """
    mix = load_electricity_mix()
    maps = load_electricity_maps()
    carbon = load_carbon_intensity()
    save_all(
        electricity_mix=mix,
        electricity_maps=maps,
        carbon_intensity=carbon,
    )
    return mix, maps, carbon


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    print("\n========================================")
    print("ELECTRICITY DATA LOADER")
    print("========================================\n")

    # Load datasets
    electricity_mix = load_electricity_mix()
    electricity_maps = load_electricity_maps()
    carbon_intensity = load_carbon_intensity()

    # --------------------------------------------------------
    # Print final information
    # --------------------------------------------------------

    print("\n========================================")
    print("FINAL DATASET INFORMATION")
    print("========================================")

    print("\nElectricity Mix:")
    print("Shape:", electricity_mix.shape)
    print("Missing values:")
    print(electricity_mix.isnull().sum())

    print("\nElectricity Maps:")
    print("Shape:", electricity_maps.shape)
    print("Missing values:")
    print(electricity_maps.isnull().sum())

    print("\nCarbon Intensity:")
    print("Shape:", carbon_intensity.shape)
    print("Missing values:")
    print(carbon_intensity.isnull().sum())

    # --------------------------------------------------------
    # Save as Parquet
    # --------------------------------------------------------

    mix_output = OUTPUT_DIR / "bangladesh_electricity_mix_clean.parquet"
    maps_output = OUTPUT_DIR / "bangladesh_electricity_maps_clean.parquet"
    carbon_output = OUTPUT_DIR / "bangladesh_carbon_intensity_clean.parquet"

    electricity_mix.to_parquet(
        mix_output,
        index=False
    )

    electricity_maps.to_parquet(
        maps_output,
        index=False
    )

    carbon_intensity.to_parquet(
        carbon_output,
        index=False
    )

    print("\n========================================")
    print("PARQUET FILES SAVED")
    print("========================================")

    print(f"Electricity Mix: {mix_output}")
    print(f"Electricity Maps: {maps_output}")
    print(f"Carbon Intensity: {carbon_output}")

    print("\nLoader completed successfully!")