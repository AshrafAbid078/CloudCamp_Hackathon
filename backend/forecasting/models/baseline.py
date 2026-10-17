import pandas as pd
import numpy as np
from .base import ForecasterBase

class PersistenceForecaster(ForecasterBase):
    """
    Persistence baseline implementation: "tomorrow looks like today".
    Each feature row at t predicts t+24h using the observed GHI at t.
    """
    
    def __init__(self, lag_feature_col: str = 'GHI'):
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
        Return the observation at the forecast origin (24h before the target).

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
