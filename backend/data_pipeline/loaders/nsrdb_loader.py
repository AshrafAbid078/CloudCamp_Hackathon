"""
NSRDB Data Loader Pipeline

This script loads raw NSRDB CSV files, processes timestamps, filters required columns,
cleans the data, and saves it as a Parquet file for downstream processing.
"""

import logging
from pathlib import Path
import pandas as pd
# pyrefly: ignore [missing-import]
import numpy as np


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------

# Dynamically resolve paths relative to this file's location.
# Actual path: Meridian_Grid/backend/data_pipeline/loaders/nsrdb_loader.py
# parents[0] = loaders/   parents[1] = data_pipeline/
# parents[2] = backend/   parents[3] = Meridian_Grid/  (PROJECT_ROOT)
LOADER_DIR = Path(__file__).resolve().parent            # loaders/
BACKEND_DATA_DIR = LOADER_DIR.parent                    # data_pipeline/
BACKEND_DIR = BACKEND_DATA_DIR.parent                   # backend/
PROJECT_ROOT = BACKEND_DIR.parent                       # CloudCamp/

# Input/Output directories
CSV_DIR = PROJECT_ROOT / "data" / "raw"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"

INPUT_FILES = sorted(CSV_DIR.glob("Bangladesh_*_NSRDB_986494_OneAxis.csv"))
OUTPUT_FILE = PROCESSED_DIR / "bangladesh_nsrdb_clean.parquet"


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

SELECTED_COLUMNS = [
    "Temperature",
    "Clearsky DHI",
    "Clearsky DNI",
    "Clearsky GHI",
    "DHI",
    "DNI",
    "GHI",
    "Relative Humidity",
    "Solar Zenith Angle",
    "Solar Azimuth Angle",
    "Pressure",
    "Wind Direction",
    "Wind Speed",
    "Dew Point",
    "Precipitable Water",
    "Cloud Type",
    "Surface Albedo",
    "Fill Flag",
]


class NSRDBLoader:
    """Pipeline for loading, cleaning, and saving NSRDB solar data."""

    def __init__(self, input_files: list[Path], output_file: Path):
        self.input_files = input_files
        self.output_file = output_file
        
        if not self.input_files:
            raise FileNotFoundError(f"No NSRDB files found in {CSV_DIR}")

    def load_data(self) -> pd.DataFrame:
        """Load and combine all raw NSRDB CSVs."""
        frames = []
        for file_path in self.input_files:
            logger.info(f"Loading {file_path.name}...")
            df = pd.read_csv(file_path, skiprows=2, low_memory=False)
            frames.append(df)
            
        df = pd.concat(frames, ignore_index=True)
        logger.info(f"Loaded a total of {len(df)} rows.")
        return df

    def create_timestamp(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create a UTC timestamp from NSRDB date/time columns."""
        required = ["Year", "Month", "Day", "Hour", "Minute"]
        missing = [col for col in required if col not in df.columns]

        if missing:
            raise ValueError(f"Missing timestamp columns: {missing}")

        df = df.copy()
        
        logger.info("Converting date/time columns to UTC timestamp...")
        df["timestamp"] = pd.to_datetime(
            {
                "year": df["Year"],
                "month": df["Month"],
                "day": df["Day"],
                "hour": df["Hour"],
                "minute": df["Minute"],
            },
            errors="coerce",
        )
        
        # NSRDB data is in local time. Bangladesh is UTC+6 (Asia/Dhaka)
        df["timestamp"] = df["timestamp"].dt.tz_localize("Asia/Dhaka").dt.tz_convert("UTC")  # type: ignore

        return df

    def select_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Keep only columns required for the MVP."""
        available_columns = [col for col in SELECTED_COLUMNS if col in df.columns]
        missing_columns = [col for col in SELECTED_COLUMNS if col not in df.columns]

        if missing_columns:
            logger.warning(f"Missing MVP columns: {missing_columns}")

        columns = ["timestamp"] + available_columns
        return df[columns].copy()

    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and validate the NSRDB data."""
        logger.info("Cleaning data (numeric conversion, duplicates, sanity checks)...")
        df = df.copy()

        # Convert numeric columns
        for column in df.columns:
            if column != "timestamp":
                df[column] = pd.to_numeric(df[column], errors="coerce")

        # Remove invalid timestamps and sort
        df = df.dropna(subset=["timestamp"]).sort_values("timestamp")

        # Remove duplicate timestamps
        df = df.drop_duplicates(subset=["timestamp"], keep="first")

        # Solar irradiance cannot be negative
        for column in ["GHI", "DNI", "DHI"]:
            if column in df.columns:
                df.loc[df[column] < 0, column] = np.nan

        # Relative humidity must be 0-100
        if "Relative Humidity" in df.columns:
            df.loc[(df["Relative Humidity"] < 0) | (df["Relative Humidity"] > 100), "Relative Humidity"] = np.nan

        return df.reset_index(drop=True)

    def save_data(self, df: pd.DataFrame) -> None:
        """Save cleaned data as Parquet."""
        self.output_file.parent.mkdir(parents=True, exist_ok=True)
        df.to_parquet(self.output_file, index=False)
        logger.info(f"Saved cleaned dataset to: {self.output_file}")

    def run(self) -> None:
        """Execute the full data pipeline."""
        logger.info("Starting NSRDB data pipeline...")
        
        df = self.load_data()
        logger.info(f"Raw shape: {df.shape}")

        df = self.create_timestamp(df)
        df = self.select_columns(df)
        df = self.clean_data(df)

        logger.info(f"Final shape: {df.shape}")
        logger.info(f"Date range: {df['timestamp'].min()} -> {df['timestamp'].max()}")
        logger.info(f"Duplicate timestamps: {df['timestamp'].duplicated().sum()}")
        
        missing_vals = df.isna().sum()
        missing_vals = missing_vals[missing_vals > 0]
        if not missing_vals.empty:
            logger.info(f"Missing values:\n{missing_vals}")
        else:
            logger.info("No missing values found.")

        self.save_data(df)
        logger.info("Pipeline completed successfully.")


def main() -> None:
    try:
        pipeline = NSRDBLoader(INPUT_FILES, OUTPUT_FILE)
        pipeline.run()
    except Exception as e:
        logger.error(f"Pipeline failed: {e}", exc_info=True)


if __name__ == "__main__":
    main()