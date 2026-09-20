import pandas as pd
import numpy as np
from .base import ForecasterBase

class PersistenceForecaster(ForecasterBase):
    """
    Persistence baseline implementation: "tomorrow looks like today".
    Simply returns the value from 24 hours ago as the forecast.
    """
    
    def __init__(self, lag_feature_col: str = 'GHI_lag_24'):
        self.lag_feature_col = lag_feature_col
        self.is_fitted = False
        
    def fit(self, X: pd.DataFrame, y: pd.Series):
        """
        Persistence model doesn't need actual training.
        """
        self.is_fitted = True
        return self
        
    def predict(self, X: pd.DataFrame) -> pd.Series:
        """
        Return the 24h lagged feature as the prediction.

        Returns a pd.Series aligned to X's index so boolean mask indexing
        (e.g. y_pred[mask]) is always label-safe rather than positional.
        """
        if not self.is_fitted:
            print("Warning: Model not explicitly fitted, but it's a persistence model.")

        if self.lag_feature_col not in X.columns:
            raise ValueError(f"Feature {self.lag_feature_col} missing in input DataFrame.")

        return X[self.lag_feature_col].rename("prediction")
        
    def save(self, filepath: str):
        """No-op: persistence model has no learnable state to persist."""
        pass

    def load(self, filepath: str):
        """No-op: no state to restore; marks model as ready to predict."""
        self.is_fitted = True
