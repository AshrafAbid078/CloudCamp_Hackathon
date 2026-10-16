import pandas as pd
import numpy as np
# pyrefly: ignore [missing-import]
import sklearn.metrics  # Ensures OpenMP runtime is initialized on Windows before LightGBM C library loads
# pyrefly: ignore [missing-import]
import lightgbm as lgb
from .base import ForecasterBase


class GBMForecaster(ForecasterBase):
    """
    LightGBM model for solar forecasting.

    Save / load strategy:
        Uses LightGBM's own text-format serialisation (save_model / Booster)
        instead of joblib pickling.  Joblib-pickled LGBMRegressor objects
        contain a C Booster handle that is NOT guaranteed to deserialise
        correctly across LightGBM versions or Python minor versions (e.g.
        Python 3.14 + LightGBM 4.7.0 produces a null C handle on load,
        causing an immediate access-violation on the first predict call).
        LightGBM's own format is stable and version-tolerant.
    """

    def __init__(self, **kwargs):
        self._sklearn_model = lgb.LGBMRegressor(**kwargs)
        self._booster: lgb.Booster | None = None   # set after fit or load
        self.is_fitted = False

    # ------------------------------------------------------------------
    # Backwards-compat alias so external code that reads `.model` still
    # works (e.g.  `forecaster.model.booster_`).
    # ------------------------------------------------------------------
    @property
    def model(self) -> lgb.LGBMRegressor:
        return self._sklearn_model

    def fit(self, X: pd.DataFrame, y: pd.Series):
        """
        Train the LightGBM model.
        Stores the underlying lgb.Booster directly after fitting so that
        predict() never has to go through joblib-deserialized state.
        """
        self._sklearn_model.fit(X, y)
        self._booster = self._sklearn_model.booster_
        self.is_fitted = True
        return self

    def predict(self, X: pd.DataFrame) -> pd.Series:
        """
        Predict using the trained model.

        Returns a pd.Series aligned to X's index so boolean mask indexing
        (e.g. y_pred[mask]) is always label-safe rather than positional.

        Implementation notes:
        - NumPy 2.x: input is forced to a C-contiguous float64 array so
          LightGBM's native C layer receives a valid data pointer.
        - Joblib cross-version bug: After joblib.load() the LGBMRegressor's
          C Booster handle can be null on Python 3.14 / LightGBM 4.7.0,
          causing an access violation on the first predict call.  We now
          save/load via LightGBM's own text format, which always produces a
          properly-initialised lgb.Booster, and call predict() on that
          Booster directly — bypassing all sklearn validation entirely.
        """
        if not self.is_fitted or self._booster is None:
            raise ValueError("Model has not been trained yet. Call fit() first.")

        # Force C-contiguous float64 — required for safe native interop
        # with LightGBM's C library under NumPy 2.x.
        X_np = np.ascontiguousarray(X.to_numpy(dtype=np.float64))

        # Call the native Booster directly — bypasses sklearn's
        # feature-name validation and any joblib reconstruction issues.
        predictions = self._booster.predict(X_np, validate_features=False)
        return pd.Series(predictions, index=X.index, name="prediction")

    def save(self, filepath: str):
        """
        Persist the model using LightGBM's native text format.
        This is more robust than joblib across LightGBM / Python versions.
        """
        if not self.is_fitted or self._booster is None:
            raise ValueError("Model is not fitted, nothing to save.")
        self._booster.save_model(filepath)

    def load(self, filepath: str):
        """
        Load a model previously saved with save().
        Uses lgb.Booster(model_file=...) which properly reconstructs the
        C handle regardless of LightGBM / Python version differences.
        """
        self._booster = lgb.Booster(model_file=filepath)
        self.is_fitted = True
