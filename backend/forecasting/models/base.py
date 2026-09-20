from abc import ABC, abstractmethod
import pandas as pd
import numpy as np

class ForecasterBase(ABC):
    """
    Stable interface for forecasting models as per system-arch.md §2.2.
    Ensures that we can swap a LightGBM model for an LSTM seamlessly.
    """

    @abstractmethod
    def fit(self, X: pd.DataFrame, y: pd.Series):
        """
        Train the model on the provided features (X) and target (y).
        """
        pass

    @abstractmethod
    def predict(self, X: pd.DataFrame) -> pd.Series:
        """
        Predict the target for the given features (X).
        Returns a pd.Series with the same index as X so boolean
        mask indexing is always label-safe.
        """
        pass

    @abstractmethod
    def save(self, filepath: str):
        """
        Save the trained model to disk.
        """
        pass

    @abstractmethod
    def load(self, filepath: str):
        """
        Load a trained model from disk.
        """
        pass
