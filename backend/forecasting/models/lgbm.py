import pandas as pd
import numpy as np
# pyrefly: ignore [missing-import]
import lightgbm as lgb
# pyrefly: ignore [missing-import]
import joblib
from .base import ForecasterBase

class GBMForecaster(ForecasterBase):
    """
    LightGBM model for solar forecasting.
    """
    
    def __init__(self, **kwargs):
        self.model = lgb.LGBMRegressor(**kwargs)
        self.is_fitted = False
        
    def fit(self, X: pd.DataFrame, y: pd.Series):
        """
        Train the LightGBM model.
        """
        # LightGBM handles pandas dataframes well, but we should make sure feature names don't have special chars
        # that LightGBM complains about. For now, we pass them as is.
        self.model.fit(X, y)
        self.is_fitted = True
        return self
        
    def predict(self, X: pd.DataFrame) -> pd.Series:
        """
        Predict using the trained model.

        Returns a pd.Series aligned to X's index so boolean mask indexing
        (e.g. y_pred[mask]) is always label-safe rather than positional.
        """
        if not self.is_fitted:
            raise ValueError("Model has not been trained yet. Call fit() first.")

        predictions = self.model.predict(X)
        return pd.Series(predictions, index=X.index, name="prediction")
        
    def save(self, filepath: str):
        if not self.is_fitted:
            raise ValueError("Model is not fitted, nothing to save.")
        joblib.dump(self.model, filepath)
        
    def load(self, filepath: str):
        self.model = joblib.load(filepath)
        self.is_fitted = True
