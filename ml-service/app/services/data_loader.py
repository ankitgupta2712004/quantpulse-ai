import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime, timedelta

def load_stock_data(symbol: str, lookback_years: int = 2) -> pd.DataFrame:
    """
    Fetch and clean historical OHLCV data for a ticker symbol.
    """
    clean_symbol = symbol.strip().upper()
    end_date = datetime.now()
    start_date = end_date - timedelta(days=lookback_years * 365 + 60)

    ticker = yf.Ticker(clean_symbol)
    df = ticker.history(start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'), interval='1d')

    if df.empty or len(df) < 60:
        raise ValueError(f"Insufficient historical data returned for ticker '{clean_symbol}' (minimum 60 trading bars required).")

    df = df.reset_index()

    # Normalize Date column name
    if 'Date' in df.columns:
        date_col = 'Date'
    elif 'Datetime' in df.columns:
        date_col = 'Datetime'
    else:
        date_col = df.columns[0]

    dates = pd.to_datetime(df[date_col]).dt.tz_localize(None)

    # Ensure 1D float arrays
    clean_df = pd.DataFrame({
        'Date': dates,
        'Open': pd.to_numeric(df['Open'].squeeze(), errors='coerce').astype(np.float64),
        'High': pd.to_numeric(df['High'].squeeze(), errors='coerce').astype(np.float64),
        'Low': pd.to_numeric(df['Low'].squeeze(), errors='coerce').astype(np.float64),
        'Close': pd.to_numeric(df['Close'].squeeze(), errors='coerce').astype(np.float64),
        'Volume': pd.to_numeric(df['Volume'].squeeze(), errors='coerce').astype(np.float64),
    })

    clean_df = clean_df.dropna().sort_values('Date').reset_index(drop=True)
    return clean_df
