# Academic Research Report & Empirical Benchmark Study

## Title: AI-Driven Advanced Stock Portfolio Management, FinBERT Sentiment Intelligence, and Markowitz Risk Optimization

**Project Level:** 3rd-Year B.Tech CSE (Artificial Intelligence & Machine Learning)  
**System Name:** QuantPulse AI  
**Repository State:** Full-Stack Integrated Platform (React + Express + MongoDB + FastAPI ML/NLP)  

---

## Executive Abstract
Financial market participants face multidimensional challenges in asset allocation, volatility exposure management, and sentiment noise filtration. This research presents **QuantPulse AI**, an integrated quantitative decision-support framework that unifies:
1. Supervised Machine Learning for chronological next-period trend modeling (Linear Regression, Random Forest, and XGBoost Regressors).
2. Deep Transformer-based Natural Language Processing using **FinBERT** (`ProsusAI/finbert`) for technical financial phrase classification.
3. Convex Quadratic Programming implementing **Markowitz Modern Portfolio Theory (MPT)** to generate the Pareto-optimal Efficient Frontier under boundary conditions.
4. Parametric and Historical Risk Analytics measuring Annualized Volatility ($\sigma$), Portfolio Beta ($\beta$), Sharpe Ratio ($SR$), Maximum Peak-to-Trough Drawdown ($MDD$), and Value-at-Risk ($VaR_{95\%}$).

All empirical evaluations adhere strictly to time-series chronological train/test splits, eliminating lookahead bias and data leakage.

---

## 1. Dataset Description & Preprocessing Pipeline

### 1.1 Market Data Sourcing
- **Data Source:** Real-time and historical Open-High-Low-Close-Volume (OHLCV) records sourced via institutional APIs (`yahoo-finance2` and `yfinance`).
- **Lookback Window:** 2 Calendar Years (521 trading sessions).
- **Sampling Frequency:** Daily adjusted trading frequency ($t \in \mathbb{Z}^+$).
- **Benchmark Index:** S&P 500 Index (`^GSPC`) as the market reference portfolio.

### 1.2 Feature Engineering Pipeline
To capture short-term trend dynamics, momentum, volatility, and volume signals without lookahead bias, the following 10 stationary and relative features were engineered:

$$\text{Daily Return}_t = \frac{P_t - P_{t-1}}{P_{t-1}}$$
$$\text{SMA}_{k, t} = \frac{1}{k} \sum_{i=0}^{k-1} P_{t-i}, \quad k \in \{20, 50\}$$
$$\text{Price to SMA Ratio}_t = \frac{P_t}{\text{SMA}_{20, t}}$$
$$\text{Rolling Volatility}_{20, t} = \sqrt{\frac{252}{19} \sum_{i=0}^{19} (R_{t-i} - \bar{R}_{20})^2}$$
$$\text{RSI}_{14, t} = 100 - \left( \frac{100}{1 + \frac{\text{EMA}_{14}(\text{Gains})}{\text{EMA}_{14}(\text{Losses})}} \right)$$
$$\text{Momentum}_{k, t} = \frac{P_t - P_{t-k}}{P_{t-k}}, \quad k \in \{5, 10\}$$
$$\text{MACD}_t = \text{EMA}_{12}(P_t) - \text{EMA}_{26}(P_t), \quad \text{Signal}_t = \text{EMA}_9(\text{MACD}_t)$$
$$\text{MACD Histogram}_t = \text{MACD}_t - \text{Signal}_t$$
$$\text{High-Low Spread}_t = \frac{\text{High}_t - \text{Low}_t}{\text{Close}_t}$$
$$\text{Volume to SMA Ratio}_t = \frac{\text{Volume}_t}{\text{SMA}_{20}(\text{Volume})}$$

Target Variable: Next-period daily return $y_t = \frac{P_{t+1} - P_t}{P_t}$.

---

## 2. Experimental Setup & Chronological Evaluation Protocol

### 2.1 Time-Series Split
Standard $k$-fold cross-validation is strictly avoided due to autocorrelation and lookahead bias. Instead, a strict **80/20 Chronological Split** is enforced:
- **Training Set (In-Sample):** First 80% chronological observations ($N_{\text{train}} = 416$ trading days).
- **Test Set (Out-of-Sample):** Final 20% chronological observations ($N_{\text{test}} = 105$ trading days).

### 2.2 Mathematical Evaluation Metrics
- **Mean Absolute Error (MAE):** $\text{MAE} = \frac{1}{N} \sum_{i=1}^N |y_i - \hat{y}_i|$
- **Root Mean Squared Error (RMSE):** $\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^N (y_i - \hat{y}_i)^2}$
- **Coefficient of Determination ($R^2$):** $R^2 = 1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}$
- **Directional Accuracy:** $\text{DA} = \frac{1}{N} \sum_{i=1}^N \mathbb{I}(\text{sgn}(y_i) == \text{sgn}(\hat{y}_i)) \times 100\%$

---

## 3. Empirical Machine Learning Benchmark Results

Empirical results across representative mega-cap assets evaluated on out-of-sample data:

| Asset | Model Architecture | Out-of-Sample MAE | Out-of-Sample RMSE | $R^2$ Score | Directional Hit Rate (%) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AAPL** | Linear Regression | 0.01308 | 0.01801 | -0.0334 | 47.62% |
| **AAPL** | Random Forest Regressor | 0.01309 | **0.01791** | -0.0215 | 52.38% |
| **AAPL** | XGBoost Regressor | 0.01349 | 0.01865 | -0.1083 | **54.29%** |
| **MSFT** | Linear Regression | 0.01676 | **0.02442** | -0.0032 | **54.29%** |
| **MSFT** | Random Forest Regressor | 0.01670 | 0.02485 | -0.0392 | 51.43% |
| **MSFT** | XGBoost Regressor | **0.01652** | 0.02500 | -0.0515 | 51.43% |
| **NVDA** | Linear Regression | 0.01966 | **0.02468** | **+0.0481** | **58.10%** |
| **NVDA** | Random Forest Regressor | **0.01962** | 0.02496 | +0.0264 | 47.62% |
| **NVDA** | XGBoost Regressor | 0.01979 | 0.02531 | -0.0009 | 52.38% |
| **GOOGL**| Linear Regression | 0.01643 | 0.02285 | -0.0092 | 46.67% |
| **GOOGL**| Random Forest Regressor | 0.01596 | **0.02233** | **+0.0360** | 53.33% |
| **GOOGL**| XGBoost Regressor | **0.01581** | 0.02247 | +0.0236 | **56.19%** |
| **AMZN** | Linear Regression | **0.01622** | **0.02383** | -0.0377 | **46.67%** |
| **AMZN** | Random Forest Regressor | 0.01685 | 0.02496 | -0.1380 | 44.76% |
| **AMZN** | XGBoost Regressor | 0.01790 | 0.02651 | -0.2839 | 45.71% |

### 3.1 Explainable Feature Attribution (XGBoost Gini Importance)
1. **Momentum & MACD Signals:** Across AAPL, NVDA, and GOOGL, `Momentum_5`, `Price_to_SMA20`, and `MACD_Hist` consistently accounted for $> 42\%$ of total tree split gain.
2. **Volume Multipliers:** `Volume_SMA_Ratio` demonstrated strong predictive contribution in breakout regimes ($11.9\%$ importance in MSFT).

---

## 4. Financial News NLP Sentiment Benchmark (FinBERT)

FinBERT (`ProsusAI/finbert`) was evaluated on a verified, labeled test corpus containing positive earnings beats, neutral regulatory disclosures, and negative risk disclosures:

| Sentiment Class | Precision | Recall | F1-Score | Support |
| :--- | :--- | :--- | :--- | :--- |
| **Positive (Bullish)** | **0.8000** | 0.6667 | **0.7273** | 6 |
| **Neutral (Informational)** | 0.5000 | **0.8333** | 0.6250 | 6 |
| **Negative (Bearish)** | **1.0000** | 0.5000 | 0.6667 | 6 |
| **Macro Average** | **0.7667** | **0.6667** | **0.6730** | 18 |

- **Overall Classification Accuracy:** **66.67%**
- **Compound Polarity Formula:**
  $$\text{Score} = P(\text{Positive}) - P(\text{Negative}), \quad -1.0 \le \text{Score} \le +1.0$$

---

## 5. Modern Portfolio Theory (MPT) & Markowitz Mean-Variance Study

### 5.1 Formulation
$$\min_{\vec{w}} \quad \frac{1}{2} \vec{w}^T \Sigma \vec{w} \quad \text{subject to} \quad \vec{w}^T \vec{\mu} = R_{\text{target}}, \quad \sum_{i=1}^N w_i = 1.0, \quad w_{\min} \le w_i \le w_{\max}$$

Where $\vec{\mu} \in \mathbb{R}^N$ is the annualized expected return vector and $\Sigma \in \mathbb{R}^{N \times N}$ is the annualized asset covariance matrix.

### 5.2 Scenario Comparison on Diversified Portfolio (`AAPL`, `MSFT`, `NVDA`, `GOOGL`, `AMZN`, `TSLA`)
- **Max Sharpe Scenario (Tangency Portfolio):** Expected Return = **39.35%**, Volatility = **27.77%**, Sharpe Ratio = **1.273**. Target allocations: GOOGL 65.9%, NVDA 22.2%, AAPL 11.8%, others 0%.
- **Minimum Volatility Scenario (GMV):** Expected Return = **23.95%**, Volatility = **22.02%**, Sharpe Ratio = **0.906**. Target allocations: MSFT 36.9%, AAPL 36.2%, GOOGL 25.6%, AMZN 0.9%, NVDA 0.4%.
- **Equal Weight Baseline (1/N):** Expected Return = **28.54%**, Volatility = **27.05%**, Sharpe Ratio = **0.907**. (16.67% each).

---

## 6. System Limitations & Threats to Validity

1. **Non-Stationarity of Financial Time Series:** Financial market returns exhibit regime switching, non-Gaussian fat tails, and structural breaks that challenge pure linear and stationary assumptions.
2. **Execution Slippage & Transaction Costs:** MPT rebalancing does not model bid-ask spread frictions or capital gains tax drag in theoretical simulations.
3. **Sentiment Feed Lag:** RSS feeds operate on 15–30 minute polling cycles; ultra-low-latency high-frequency events are outside the scope of this decision-support platform.
4. **Historical Covariance Stability:** Past covariance matrices ($\Sigma$) are imperfect predictors of future correlation spikes during liquidity crises.

---

## 7. Mandatory Academic & Analytical Disclaimer

> **Academic Notice:** QuantPulse AI is an educational and analytical research platform developed for academic evaluation. All predictions, risk analytics, FinBERT sentiment classifications, and Modern Portfolio Theory optimization outputs represent statistical modeling on historical data. They do not constitute financial advice, guaranteed investment returns, or trade execution mandates.
