# QuantPulse AI - Data Population & Operations Reference
Generated: 2026-10-01

## 1. HISTORICAL DATASET
- Location: Not stored as CSV files.
- Source: Yahoo Finance (yfinance library) — fetched live at training time.
- The data_loader.py in ml-service/app/services/ downloads 2 years of daily OHLCV data
  directly from Yahoo Finance every time training is triggered.
- Columns used by the pipeline: Date, Open, High, Low, Close, Volume
- No CSV files are required or created.

## 2. DEMO SEED SCRIPT
- File: backend/seed.js
- Run: cd backend && node seed.js
- Also available as: cd backend && node -e "" (or npm run seed after package.json update)
- Idempotent: safe to re-run, will skip existing records.

## 3. DEMO CREDENTIALS
- Name: Demo User
- Email: demo@quantpulse.ai
- Password: Demo@12345
- Portfolio: "Demo Portfolio - Tech Growth"

## 4. DEMO PORTFOLIO HOLDINGS (DEMO/HISTORICAL DATA)
Symbol | Qty | Avg Buy Price | Sector              | Cost Basis
AAPL   |  50 |    $155.00   | Technology          |  $7,750.00
MSFT   |  30 |    $310.00   | Technology          |  $9,300.00
GOOGL  |  40 |    $130.00   | Communication Svcs  |  $5,200.00
AMZN   |  35 |    $145.00   | Consumer Discret.   |  $5,075.00
NVDA   |  25 |    $420.00   | Technology          | $10,500.00
                              TOTAL COST BASIS:    $37,825.00
NOTE: averageBuyPrice values are approximate historical cost-basis figures (2022-2024).
      They are DEMO data and NOT live or guaranteed future prices.

## 5. COMMANDS REFERENCE

### Start Backend (Node.js/Express, port 5000)
cd backend
node src/server.js
# or: nodemon src/server.js (for auto-reload)

### Seed MongoDB
cd backend
node seed.js
# or: npm run seed

### Start ML/FastAPI Service (port 8000)
cd ml-service
python run_server.py

### Train All Models
cd ml-service
python train_all.py

### Start Frontend (Vite, port 5173)
# From project root:
node node_modules/vite/bin/vite.js --port 5173

## 6. ML MODEL DETAILS
- Models saved to: ml-service/saved_models/
- Files: AAPL_models.joblib, MSFT_models.joblib, GOOGL_models.joblib,
         AMZN_models.joblib, NVDA_models.joblib
- Each file contains: LinearRegression, RandomForestRegressor, XGBRegressor
- Training split: 80% older data (train), 20% newer data (test) - CHRONOLOGICAL
- Features (12 total): Daily_Return, Momentum_5, Momentum_10, SMA_Ratio_5_20,
  Price_to_SMA20, Rolling_Vol_20, RSI_14, MACD, MACD_Hist, High_Low_Spread,
  Volume_Change, Volume_SMA_Ratio
- Target: Next 1-day return (regression)
- Evaluation metrics: MAE, RMSE, R2, Directional Accuracy %

## 7. API VERIFICATION ENDPOINTS
GET  http://localhost:5000/api/health                  — Backend health
GET  http://localhost:8000/api/ml/models               — List trained models
GET  http://localhost:8000/api/ml/evaluation/AAPL     — Model metrics
POST http://localhost:8000/api/ml/train                — Train model {symbol, lookback_years}
POST http://localhost:8000/api/ml/predict              — Predict {symbol}
GET  http://localhost:8000/api/sentiment/news/AAPL    — News + FinBERT sentiment
POST http://localhost:8000/api/optimization/analyze   — Portfolio optimization

## 8. DATA CLASSIFICATION
REAL / LIVE DATA:
- Current stock prices (fetched live from Yahoo Finance via yfinance/yahoo-finance2)
- Financial news articles (fetched live from Yahoo Finance RSS feeds)
- ML training data (fetched live from Yahoo Finance at training time)
- Portfolio optimization historical prices (fetched live from Yahoo Finance)
- Risk analytics historical prices (fetched live from Yahoo Finance)

DEMO / HISTORICAL DATA:
- Demo user (demo@quantpulse.ai) — seeded
- Demo portfolio holdings — seeded with approximate historical cost-basis prices
- averageBuyPrice values are approximate 2022-2024 historical figures
- These are clearly labeled as DEMO data in the portfolio description

## 9. API KEYS REQUIRED
- Yahoo Finance RSS / yfinance: NO API KEY REQUIRED (public data)
- FinBERT model (ProsusAI/finbert): downloads from HuggingFace on first use (no key needed)
  - Falls back to Financial NLP Classifier if HuggingFace is offline
- MongoDB: local installation, no cloud credentials needed
- News API: NOT USED — uses Yahoo Finance RSS feeds directly

## 10. E2E TEST RESULTS (2026-10-01)
Step  1 - Login:                   PASS
Step  2 - Load portfolios:         PASS (1 portfolio, 5 holdings)
Step  3 - Verify holdings:         PASS (AAPL, MSFT, GOOGL, AMZN, NVDA)
Step  4 - Add holding (TSLA):      PASS
Step  5 - Verify TSLA added:       PASS
Step  6 - Edit holding:            PASS
Step  7 - Delete holding:          PASS
Step  8 - Back to 5 holdings:      PASS
Step  9 - Portfolio Analytics:     PASS (live prices, P&L, sector allocation, 126 hist. pts)
Step 10 - Risk Analytics:          PASS (Vol=19.33%, Beta=1.147, Sharpe=0.88, VaR95=1.84%)
Step 11 - ML Prediction (AAPL):    PASS (3 models, all Bullish, labeled as experimental)
Step 12 - Model Evaluation:        PASS (MAE/RMSE/R2/DirAcc returned for 3 models)
Step 13 - News/Sentiment (MSFT):   PASS (16 real articles, FinBERT sentiment scored)
Step 14 - Portfolio Optimization:  PASS (Sharpe=1.465, weights sum=100%)
Step 15 - Logout + Re-login:       PASS
Step 16 - Data persistence:        PASS (5 holdings intact after re-login)

OVERALL: 16/16 PASS
