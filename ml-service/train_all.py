"""
QuantPulse AI - ML Model Training Script
=========================================
Trains Linear Regression, Random Forest, and XGBoost for all 5 demo portfolio symbols.
Uses chronological (time-series) train/test split (80/20).
Data is fetched live from Yahoo Finance via yfinance.

Usage:
  cd ml-service
  python train_all.py

Models are saved to: ml-service/saved_models/{SYMBOL}_models.joblib
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.model_trainer import train_models_for_symbol

SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA"]
LOOKBACK_YEARS = 2  # Uses 2 years of daily OHLCV data from Yahoo Finance

print("\n=== QuantPulse AI - ML Training ===")
print(f"Training {len(SYMBOLS)} models: {', '.join(SYMBOLS)}")
print(f"Data source: Yahoo Finance (yfinance) - live historical data")
print(f"Lookback: {LOOKBACK_YEARS} years daily OHLCV")
print(f"Split: 80% train (older) / 20% test (newer) - chronological, no shuffle")
print(f"Models: Linear Regression, Random Forest, XGBoost")
print(f"Target: Next-period (1-day ahead) return")
print("")

for symbol in SYMBOLS:
    print(f"Training {symbol}...")
    try:
        result = train_models_for_symbol(symbol, LOOKBACK_YEARS)
        print(f"  OK | train_samples={result['train_samples']} test_samples={result['test_samples']}")
        print(f"  Latest market date: {result['latest_market_date']}  Close: ${result['latest_close_price']:.2f}")
        for model_name, metrics in result["evaluations"].items():
            print(f"  {model_name}: MAE={metrics['mae']} RMSE={metrics['rmse']} R2={metrics['r2']} DirAcc={metrics['directional_accuracy_pct']}%")
    except Exception as e:
        print(f"  ERROR: {e}")
    print("")

print("=== Training complete ===")
print("Models saved to: ml-service/saved_models/")
print("NOTE: Predictions are model-generated analytical forecasts and do NOT guarantee future returns.")
