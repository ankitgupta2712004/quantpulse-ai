import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from .data_loader import load_stock_data
from .feature_engineering import build_features, FEATURE_COLUMNS
from ..config import SAVED_MODELS_DIR

def evaluate_predictions(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Calculate regression and directional trend accuracy metrics."""
    mae = float(mean_absolute_error(y_true, y_pred))
    mse = float(mean_squared_error(y_true, y_pred))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_true, y_pred))

    # Directional Accuracy (percentage of times predicted sign matches true sign)
    true_dir = np.sign(y_true)
    pred_dir = np.sign(y_pred)
    dir_acc = float(np.mean(true_dir == pred_dir) * 100.0)

    return {
        "mae": round(mae, 5),
        "rmse": round(rmse, 5),
        "r2": round(r2, 4),
        "directional_accuracy_pct": round(dir_acc, 2),
    }

def train_models_for_symbol(symbol: str, lookback_years: int = 2) -> Dict[str, Any]:
    """
    Train Linear Regression, Random Forest, and XGBoost on chronological stock data.
    """
    clean_symbol = symbol.strip().upper()

    # 1. Load Data
    raw_df = load_stock_data(clean_symbol, lookback_years)

    # 2. Build Features
    feat_df = build_features(raw_df)

    # Ensure all feature columns are explicitly float64
    for col in FEATURE_COLUMNS:
        feat_df[col] = pd.to_numeric(feat_df[col], errors='coerce').astype(np.float64)

    # Drop NaNs from feature rolling windows
    clean_data = feat_df.dropna(subset=FEATURE_COLUMNS).reset_index(drop=True)

    if len(clean_data) < 40:
        raise ValueError(f"Not enough data points after feature engineering for {clean_symbol}.")

    # Latest row for live forward inference
    latest_row = clean_data.iloc[-1]
    latest_date = str(latest_row['Date']).split(' ')[0]
    latest_close = float(latest_row['Close'])

    # Explicit 2D float64 DataFrame for prediction
    latest_features_df = pd.DataFrame(
        [clean_data.iloc[-1][FEATURE_COLUMNS].values.astype(np.float64)],
        columns=FEATURE_COLUMNS
    )

    # Training data (rows that have known Target_Return)
    train_pool = clean_data.dropna(subset=['Target_Return']).reset_index(drop=True)

    X = pd.DataFrame(train_pool[FEATURE_COLUMNS].values.astype(np.float64), columns=FEATURE_COLUMNS)
    y = np.asarray(train_pool['Target_Return'].values, dtype=np.float64)

    # 3. Chronological Time-Series Split (80% Train, 20% Test)
    split_idx = int(len(train_pool) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    # 4. Model Definitions
    models = {
        "linear_regression": LinearRegression(),
        "random_forest": RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42, n_jobs=-1),
        "xgboost": XGBRegressor(n_estimators=100, max_depth=4, learning_rate=0.05, random_state=42, n_jobs=-1),
    }

    evaluations = {}
    predictions = {}
    feature_importances = {}
    trained_model_objs = {}

    # 5. Train & Evaluate Each Model
    for name, model in models.items():
        model.fit(X_train, y_train)
        y_test_pred = model.predict(X_test)

        # Evaluation on Out-of-Sample Test Set
        eval_metrics = evaluate_predictions(y_test, y_test_pred)
        evaluations[name] = eval_metrics
        trained_model_objs[name] = model

        # Next-Period Live Forward Prediction
        next_pred_return = float(model.predict(latest_features_df)[0])
        trend_direction = "Bullish (Up)" if next_pred_return > 0 else "Bearish (Down)" if next_pred_return < 0 else "Neutral"

        predictions[name] = {
            "predicted_next_return_pct": round(next_pred_return * 100.0, 3),
            "trend_direction": trend_direction,
            "confidence": "Experimental Decision Support",
        }

        # Feature Importance / Attribution
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            feature_importances[name] = [
                {"feature": col, "importance": round(float(imp), 4)}
                for col, imp in sorted(zip(FEATURE_COLUMNS, importances), key=lambda x: x[1], reverse=True)
            ]
        elif hasattr(model, "coef_"):
            abs_coefs = np.abs(model.coef_)
            total_coef = np.sum(abs_coefs) + 1e-9
            norm_coefs = abs_coefs / total_coef
            feature_importances[name] = [
                {"feature": col, "importance": round(float(imp), 4)}
                for col, imp in sorted(zip(FEATURE_COLUMNS, norm_coefs), key=lambda x: x[1], reverse=True)
            ]

    # 6. Save Trained Artifacts to Disk via joblib
    save_payload = {
        "symbol": clean_symbol,
        "trained_date": pd.Timestamp.now().isoformat(),
        "models": trained_model_objs,
        "feature_columns": FEATURE_COLUMNS,
        "evaluations": evaluations,
        "feature_importances": feature_importances,
        "predictions": predictions,
        "latest_date": latest_date,
        "latest_close": latest_close,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
    }

    save_path = SAVED_MODELS_DIR / f"{clean_symbol}_models.joblib"
    joblib.dump(save_payload, save_path)

    return {
        "symbol": clean_symbol,
        "trained_date": save_payload["trained_date"],
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "latest_market_date": latest_date,
        "latest_close_price": latest_close,
        "evaluations": evaluations,
        "predictions": predictions,
        "feature_importances": feature_importances,
        "features_used": FEATURE_COLUMNS,
        "disclaimer": "Educational Decision-Support: Machine learning models predict short-term statistical tendencies on historical features and DO NOT guarantee future returns.",
    }

def get_saved_model_evaluation(symbol: str) -> Dict[str, Any]:
    """Retrieve saved evaluation and feature importance for a symbol."""
    clean_symbol = symbol.strip().upper()
    save_path = SAVED_MODELS_DIR / f"{clean_symbol}_models.joblib"

    if not save_path.exists():
        # Train on the fly if not yet cached
        return train_models_for_symbol(clean_symbol)

    payload = joblib.load(save_path)
    return {
        "symbol": payload["symbol"],
        "trained_date": payload["trained_date"],
        "train_samples": payload["train_samples"],
        "test_samples": payload["test_samples"],
        "latest_market_date": payload["latest_date"],
        "latest_close_price": payload["latest_close"],
        "evaluations": payload["evaluations"],
        "predictions": payload.get("predictions", {}),
        "feature_importances": payload["feature_importances"],
        "features_used": payload["feature_columns"],
        "disclaimer": "Educational Decision-Support: Machine learning models predict statistical tendencies and DO NOT guarantee future returns.",
    }
