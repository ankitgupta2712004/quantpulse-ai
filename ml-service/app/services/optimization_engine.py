import numpy as np
import pandas as pd
import scipy.optimize as sco
import yfinance as yf
from typing import List, Dict, Any, Optional, Tuple

RISK_FREE_RATE = 0.04  # 4% annual risk-free rate assumption

def fetch_portfolio_history(symbols: List[str], period: str = "1y") -> Tuple[pd.DataFrame, List[str]]:
    """
    Fetch historical adjusted close prices for the list of symbols.
    Cleans duplicates, validates ticker existence, and handles missing data.
    """
    # Deduplicate and uppercase
    unique_symbols = list(dict.fromkeys([s.strip().upper() for s in symbols if s and s.strip()]))
    
    if len(unique_symbols) < 2:
        raise ValueError("Modern Portfolio Theory requires at least 2 distinct stock symbols.")

    # Valid period check
    valid_periods = {"6mo", "1y", "2y", "3y", "5y", "max"}
    if period not in valid_periods:
        period = "1y"

    try:
        data = yf.download(unique_symbols, period=period, progress=False, auto_adjust=True)
    except Exception as e:
        raise ValueError(f"Failed to fetch market data: {str(e)}")

    if data.empty:
        raise ValueError("No historical price data returned for the requested symbols.")

    # Extract Close / Adj Close prices
    if "Close" in data.columns:
        price_df = data["Close"]
    else:
        price_df = data

    # If single column was returned as Series
    if isinstance(price_df, pd.Series):
        raise ValueError("Insufficient assets found. At least 2 valid stocks are required.")

    # Drop columns that are completely NaN or have fewer than 30 trading days
    price_df = price_df.dropna(how="all", axis=1)
    valid_cols = []
    for col in price_df.columns:
        valid_count = price_df[col].dropna().count()
        if valid_count >= 30:
            valid_cols.append(col)
        else:
            print(f"[MPT Warning] Symbol {col} has insufficient trading days ({valid_count}). Dropped.")

    price_df = price_df[valid_cols]

    if len(price_df.columns) < 2:
        raise ValueError(
            f"Insufficient historical data. Found only {len(price_df.columns)} valid stock(s) with adequate data: {list(price_df.columns)}. At least 2 are required."
        )

    # Forward fill then backward fill any minor gaps
    price_df = price_df.ffill().bfill().dropna()

    valid_symbols = list(price_df.columns)
    return price_df, valid_symbols


def calculate_portfolio_performance(
    weights: np.ndarray,
    mean_returns: pd.Series,
    cov_matrix: pd.DataFrame,
    risk_free_rate: float = RISK_FREE_RATE
) -> Tuple[float, float, float]:
    """
    Calculate annualized portfolio return, annualized volatility, and Sharpe ratio.
    """
    weights = np.array(weights)
    portfolio_return = float(np.sum(mean_returns * weights) * 252)
    portfolio_volatility = float(np.sqrt(np.dot(weights.T, np.dot(cov_matrix * 252, weights))))
    
    if portfolio_volatility > 1e-6:
        sharpe_ratio = float((portfolio_return - risk_free_rate) / portfolio_volatility)
    else:
        sharpe_ratio = 0.0

    return portfolio_return, portfolio_volatility, sharpe_ratio


def optimize_portfolio(
    symbols: List[str],
    period: str = "1y",
    risk_preference: str = "max_sharpe",
    min_weight: float = 0.0,
    max_weight: float = 1.0,
    current_weights: Optional[Dict[str, float]] = None,
    risk_free_rate: float = RISK_FREE_RATE
) -> Dict[str, Any]:
    """
    Execute Modern Portfolio Theory (MPT) Mean-Variance Optimization.
    Calculates:
      - Max Sharpe Ratio scenario (Tangency Portfolio)
      - Min Volatility scenario (Global Minimum Variance Portfolio)
      - Equal Weight baseline (1/N)
      - Current Allocation scenario (if provided)
      - Efficient Frontier curve points
      - Monte Carlo simulated points
    """
    # 1. Fetch & clean historical price matrix
    price_df, valid_symbols = fetch_portfolio_history(symbols, period)
    num_assets = len(valid_symbols)

    # Calculate daily percentage returns
    daily_returns = price_df.pct_change().dropna()
    mean_daily_returns = daily_returns.mean()
    cov_matrix = daily_returns.cov()

    # 2. Validate and adjust constraints
    min_w = max(0.0, float(min_weight))
    max_w = min(1.0, float(max_weight))
    
    # Safety check for feasibility: num_assets * min_w <= 1.0 and num_assets * max_w >= 1.0
    if num_assets * min_w > 1.0:
        min_w = 0.0
    if num_assets * max_w < 1.0:
        max_w = 1.0

    bounds = tuple((min_w, max_w) for _ in range(num_assets))
    sum_constraint = {"type": "eq", "fun": lambda w: np.sum(w) - 1.0}
    initial_weights = np.array(num_assets * [1.0 / num_assets])

    # -------------------------------------------------------------
    # Scenario A: Maximum Sharpe Ratio (Tangency Portfolio)
    # -------------------------------------------------------------
    def neg_sharpe_ratio(weights):
        p_ret, p_vol, p_sr = calculate_portfolio_performance(
            weights, mean_daily_returns, cov_matrix, risk_free_rate
        )
        return -p_sr

    res_max_sharpe = sco.minimize(
        neg_sharpe_ratio,
        initial_weights,
        method="SLSQP",
        bounds=bounds,
        constraints=[sum_constraint],
        options={"maxiter": 1000, "ftol": 1e-9}
    )

    if res_max_sharpe.success:
        max_sharpe_weights = np.round(res_max_sharpe.x, 4)
    else:
        max_sharpe_weights = initial_weights

    # Re-normalize to exactly 1.0
    max_sharpe_weights = max_sharpe_weights / np.sum(max_sharpe_weights)
    ret_ms, vol_ms, sr_ms = calculate_portfolio_performance(
        max_sharpe_weights, mean_daily_returns, cov_matrix, risk_free_rate
    )

    # -------------------------------------------------------------
    # Scenario B: Minimum Volatility (Global Min Variance)
    # -------------------------------------------------------------
    def portfolio_volatility(weights):
        _, p_vol, _ = calculate_portfolio_performance(
            weights, mean_daily_returns, cov_matrix, risk_free_rate
        )
        return p_vol

    res_min_vol = sco.minimize(
        portfolio_volatility,
        initial_weights,
        method="SLSQP",
        bounds=bounds,
        constraints=[sum_constraint],
        options={"maxiter": 1000, "ftol": 1e-9}
    )

    if res_min_vol.success:
        min_vol_weights = np.round(res_min_vol.x, 4)
    else:
        min_vol_weights = initial_weights

    min_vol_weights = min_vol_weights / np.sum(min_vol_weights)
    ret_mv, vol_mv, sr_mv = calculate_portfolio_performance(
        min_vol_weights, mean_daily_returns, cov_matrix, risk_free_rate
    )

    # -------------------------------------------------------------
    # Scenario C: Equal Weight Baseline (1/N)
    # -------------------------------------------------------------
    eq_weights = initial_weights
    ret_eq, vol_eq, sr_eq = calculate_portfolio_performance(
        eq_weights, mean_daily_returns, cov_matrix, risk_free_rate
    )

    # -------------------------------------------------------------
    # Scenario D: Current Weights (if provided)
    # -------------------------------------------------------------
    curr_weight_dict = {}
    if current_weights and isinstance(current_weights, dict):
        total_curr = sum(current_weights.get(s, 0.0) for s in valid_symbols)
        if total_curr > 0:
            for s in valid_symbols:
                curr_weight_dict[s] = round(current_weights.get(s, 0.0) / total_curr, 4)
        else:
            for s in valid_symbols:
                curr_weight_dict[s] = round(1.0 / num_assets, 4)
    else:
        for s in valid_symbols:
            curr_weight_dict[s] = round(1.0 / num_assets, 4)

    curr_weights_arr = np.array([curr_weight_dict[s] for s in valid_symbols])
    curr_weights_arr = curr_weights_arr / np.sum(curr_weights_arr)
    ret_curr, vol_curr, sr_curr = calculate_portfolio_performance(
        curr_weights_arr, mean_daily_returns, cov_matrix, risk_free_rate
    )

    # Select Primary Recommended Scenario based on user preference
    pref = risk_preference.lower().strip()
    if pref in ["min_volatility", "conservative", "low_risk"]:
        recommended_weights = min_vol_weights
        rec_ret, rec_vol, rec_sr = ret_mv, vol_mv, sr_mv
        scenario_name = "Minimum Volatility (Conservative Scenario)"
    elif pref in ["balanced", "moderate"]:
        # 50/50 blend between Max Sharpe and Min Volatility
        balanced_weights = 0.5 * max_sharpe_weights + 0.5 * min_vol_weights
        balanced_weights = balanced_weights / np.sum(balanced_weights)
        recommended_weights = balanced_weights
        rec_ret, rec_vol, rec_sr = calculate_portfolio_performance(
            recommended_weights, mean_daily_returns, cov_matrix, risk_free_rate
        )
        scenario_name = "Balanced Risk-Return Scenario"
    else:
        # Default: Max Sharpe Ratio
        recommended_weights = max_sharpe_weights
        rec_ret, rec_vol, rec_sr = ret_ms, vol_ms, sr_ms
        scenario_name = "Maximum Sharpe Ratio (Tangency Scenario)"

    # Format weights dictionaries
    def format_weights(weights_array):
        return {valid_symbols[i]: round(float(weights_array[i]), 4) for i in range(num_assets)}

    # -------------------------------------------------------------
    # Generate Efficient Frontier Curve Points
    # -------------------------------------------------------------
    frontier_points = []
    try:
        # Range of target returns between min vol return and max asset return
        min_possible_ret = min(ret_mv, ret_eq)
        max_possible_ret = max(mean_daily_returns) * 252
        
        target_returns = np.linspace(min_possible_ret, max_possible_ret, 30)

        for tr in target_returns:
            target_constraint = {"type": "eq", "fun": lambda w, t=tr: (np.sum(mean_daily_returns * w) * 252) - t}
            res_frontier = sco.minimize(
                portfolio_volatility,
                initial_weights,
                method="SLSQP",
                bounds=bounds,
                constraints=[sum_constraint, target_constraint],
                options={"maxiter": 300}
            )
            if res_frontier.success:
                f_ret, f_vol, f_sr = calculate_portfolio_performance(
                    res_frontier.x, mean_daily_returns, cov_matrix, risk_free_rate
                )
                frontier_points.append({
                    "volatility": round(f_vol * 100, 2),
                    "expected_return": round(f_ret * 100, 2),
                    "sharpe_ratio": round(f_sr, 3),
                })
    except Exception as e:
        print(f"[MPT] Frontier calculation note: {e}")

    # -------------------------------------------------------------
    # Monte Carlo Random Portfolio Simulations (for visual scatter)
    # -------------------------------------------------------------
    monte_carlo_samples = []
    np.random.seed(42)
    num_simulations = min(300, max(100, num_assets * 50))
    for _ in range(num_simulations):
        rnd_w = np.random.dirichlet(np.ones(num_assets))
        s_ret, s_vol, s_sr = calculate_portfolio_performance(
            rnd_w, mean_daily_returns, cov_matrix, risk_free_rate
        )
        monte_carlo_samples.append({
            "volatility": round(s_vol * 100, 2),
            "expected_return": round(s_ret * 100, 2),
            "sharpe_ratio": round(s_sr, 3),
        })

    # Asset Individual Statistics
    asset_statistics = []
    for i, sym in enumerate(valid_symbols):
        ann_ret = float(mean_daily_returns[sym] * 252)
        ann_vol = float(np.sqrt(cov_matrix.loc[sym, sym] * 252))
        asset_sr = float((ann_ret - risk_free_rate) / ann_vol) if ann_vol > 0 else 0.0
        asset_statistics.append({
            "symbol": sym,
            "annualized_return_pct": round(ann_ret * 100, 2),
            "annualized_volatility_pct": round(ann_vol * 100, 2),
            "sharpe_ratio": round(asset_sr, 3),
            "current_weight": curr_weight_dict.get(sym, 0.0),
            "recommended_weight": round(float(recommended_weights[i]), 4),
            "max_sharpe_weight": round(float(max_sharpe_weights[i]), 4),
            "min_vol_weight": round(float(min_vol_weights[i]), 4),
        })

    return {
        "success": True,
        "scenario_title": scenario_name,
        "symbols": valid_symbols,
        "num_assets": num_assets,
        "period": period,
        "risk_preference": risk_preference,
        "constraints": {
            "min_weight": min_w,
            "max_weight": max_w,
            "sum_to_one": True,
        },
        "recommended_weights": format_weights(recommended_weights),
        "expected_return": round(rec_ret * 100, 2),
        "expected_volatility": round(rec_vol * 100, 2),
        "sharpe_ratio": round(rec_sr, 3),
        "current_portfolio": {
            "weights": curr_weight_dict,
            "expected_return": round(ret_curr * 100, 2),
            "expected_volatility": round(vol_curr * 100, 2),
            "sharpe_ratio": round(sr_curr, 3),
        },
        "scenarios": {
            "max_sharpe": {
                "name": "Maximum Sharpe Ratio",
                "weights": format_weights(max_sharpe_weights),
                "expected_return": round(ret_ms * 100, 2),
                "expected_volatility": round(vol_ms * 100, 2),
                "sharpe_ratio": round(sr_ms, 3),
            },
            "min_volatility": {
                "name": "Minimum Volatility",
                "weights": format_weights(min_vol_weights),
                "expected_return": round(ret_mv * 100, 2),
                "expected_volatility": round(vol_mv * 100, 2),
                "sharpe_ratio": round(sr_mv, 3),
            },
            "equal_weight": {
                "name": "Equal Weighted (1/N)",
                "weights": format_weights(eq_weights),
                "expected_return": round(ret_eq * 100, 2),
                "expected_volatility": round(vol_eq * 100, 2),
                "sharpe_ratio": round(sr_eq, 3),
            },
        },
        "asset_statistics": asset_statistics,
        "efficient_frontier": frontier_points,
        "simulated_portfolios": monte_carlo_samples,
        "model_framework": "Modern Portfolio Theory (Markowitz Mean-Variance Optimization)",
        "disclaimer": "Model-generated allocation scenario. Modern Portfolio Theory is an analytical framework based on historical data and does not guarantee future performance or eliminate market risk.",
    }
