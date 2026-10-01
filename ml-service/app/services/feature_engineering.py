import pandas as pd
import numpy as np

def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Calculate Relative Strength Index (RSI) without future lookahead."""
    delta = series.diff()
    gain = (delta.where(delta > 0, 0.0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0.0)).rolling(window=period).mean()
    
    rs = gain / (loss + 1e-9)
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return rsi

def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Construct quantitative technical features avoiding future-data leakage.
    Each feature at index t is computed strictly from data at or before t.
    """
    data = pd.DataFrame()
    data['Date'] = df['Date']
    data['Close'] = df['Close'].astype(np.float64)

    close = df['Close'].astype(np.float64)
    high = df['High'].astype(np.float64)
    low = df['Low'].astype(np.float64)
    volume = df['Volume'].astype(np.float64)

    # 1. Price Returns & Momentum
    data['Daily_Return'] = close.pct_change().astype(np.float64)
    data['Momentum_5'] = (close / close.shift(5) - 1.0).astype(np.float64)
    data['Momentum_10'] = (close / close.shift(10) - 1.0).astype(np.float64)

    # 2. Moving Averages & Trend
    data['SMA_5'] = close.rolling(window=5).mean().astype(np.float64)
    data['SMA_20'] = close.rolling(window=20).mean().astype(np.float64)
    data['SMA_50'] = close.rolling(window=50).mean().astype(np.float64)
    data['SMA_Ratio_5_20'] = (data['SMA_5'] / (data['SMA_20'] + 1e-9) - 1.0).astype(np.float64)
    data['Price_to_SMA20'] = (close / (data['SMA_20'] + 1e-9) - 1.0).astype(np.float64)

    # 3. Rolling Volatility
    data['Rolling_Vol_20'] = data['Daily_Return'].rolling(window=20).std().astype(np.float64)

    # 4. RSI (14-day)
    data['RSI_14'] = calculate_rsi(close, period=14).astype(np.float64)

    # 5. MACD & Signal
    ema_12 = close.ewm(span=12, adjust=False).mean()
    ema_26 = close.ewm(span=26, adjust=False).mean()
    data['MACD'] = (ema_12 - ema_26).astype(np.float64)
    data['MACD_Signal'] = data['MACD'].ewm(span=9, adjust=False).mean().astype(np.float64)
    data['MACD_Hist'] = (data['MACD'] - data['MACD_Signal']).astype(np.float64)

    # 6. Intraday Volatility & Volume Momentum
    data['High_Low_Spread'] = ((high - low) / (close + 1e-9)).astype(np.float64)
    data['Volume_Change'] = volume.pct_change().astype(np.float64)
    data['Volume_SMA_Ratio'] = (volume / (volume.rolling(window=20).mean() + 1e-9) - 1.0).astype(np.float64)

    # 7. Target Variable: Next-Period (1-Day Ahead) Return
    data['Target_Return'] = data['Daily_Return'].shift(-1).astype(np.float64)
    data['Target_Trend'] = (data['Target_Return'] > 0).astype(np.int32)

    return data

FEATURE_COLUMNS = [
    'Daily_Return',
    'Momentum_5',
    'Momentum_10',
    'SMA_Ratio_5_20',
    'Price_to_SMA20',
    'Rolling_Vol_20',
    'RSI_14',
    'MACD',
    'MACD_Hist',
    'High_Low_Spread',
    'Volume_Change',
    'Volume_SMA_Ratio',
]
