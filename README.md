# AI-Driven Advanced Stock Portfolio Management and Risk Analysis System (QuantPulse AI)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Frontend: React Vite](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB.svg)](https://react.dev/)
[![Backend: Express](https://img.shields.io/badge/Backend-Node.js_%2B_Express-green.svg)](https://expressjs.com/)
[![Database: MongoDB](https://img.shields.io/badge/Database-MongoDB_%2B_Mongoose-47A248.svg)](https://www.mongodb.com/)
[![AI/ML: Python FastAPI](https://img.shields.io/badge/AI%2FML-FastAPI_%2B_PyTorch_%2B_XGBoost-009688.svg)](https://fastapi.tiangolo.com/)

An institutional-grade full-stack quantitative financial platform and 3rd-Year B.Tech CSE (AI & ML) Capstone Project. **QuantPulse AI** unifies real-time market data ingestion, time-series machine learning return forecasting, deep transformer natural language processing (FinBERT) for news sentiment classification, Modern Portfolio Theory (Markowitz Mean-Variance Optimization), and parametric portfolio risk analytics into a single responsive dark-themed dashboard.

---

## 1. Project Overview

QuantPulse AI bridges modern financial economics with artificial intelligence to deliver an end-to-end investment research and decision-support suite. Rather than making unsubstantiated claims regarding guaranteed price predictions, the system emphasizes **explainable time-series modeling**, **convex portfolio risk optimization**, and **sentiment polarity aggregation**.

### Key Highlights
- **Multi-Model Predictive Engine:** Linear Regression, Random Forest, and XGBoost regressors evaluated on strictly chronological out-of-sample data.
- **FinBERT NLP Intelligence:** Hugging Face Transformer (`ProsusAI/finbert`) specialized in financial phraseology to extract compound sentiment scores from live RSS streams.
- **Markowitz Modern Portfolio Theory:** Quadratic convex optimization (SciPy SLSQP) generating the Pareto-optimal Efficient Frontier, Tangency portfolio, and Minimum Volatility portfolio.
- **Comprehensive Risk Analytics:** Real-time calculation of Annualized Volatility ($\sigma$), Beta ($\beta$ vs S&P 500), Sharpe Ratio ($SR$), Maximum Peak-to-Trough Drawdown ($MDD$), and Parametric Value-at-Risk ($VaR_{95\%}$).

---

## 2. System Architecture

```
                                  [ Presentation Layer: React 18 + Vite ]
                                  (Tailwind CSS, Recharts, Lucide Icons)
                                                    │
                                                    ▼
                                  [ API Gateway: Express.js (Node.js) ]
                         (JWT Auth, Rate Limiting, Ownership Checks, Proxy Router)
                                   │                                 │
                                   ▼                                 ▼
                     [ Persistence: MongoDB ]           [ AI/ML Microservice: FastAPI ]
                  (Users, Portfolios, Holdings)       (scikit-learn, XGBoost, FinBERT, SciPy MPT)
```

---

## 3. Features Matrix

| Module | Core Functionality |
| :--- | :--- |
| **Authentication & Security** | JWT-based auth, bcrypt password hashing, input validation, and per-user portfolio ownership verification. |
| **Portfolio Management** | Multi-portfolio CRUD, multi-asset holdings tracking, transaction ledger, and real-time market valuation. |
| **Market Data Analytics** | Live stock quotes, interactive OHLCV candlestick charts, company metrics, and search autocomplete. |
| **Quantitative Risk** | Annualized volatility ($\sigma$), Beta ($\beta$), Sharpe ratio, max drawdown, and Pearson correlation heatmaps. |
| **Stock Trend AI/ML** | 10 engineered stationary technical indicators (RSI, SMA-20/50, Volatility, MACD, Momentum) with feature importance attribution. |
| **FinBERT Sentiment** | Live Yahoo Finance RSS parsing, headline cleaning, FinBERT transformer inference, and polarity distribution charts. |
| **MPT Optimization** | Quadratic programming solver for Max Sharpe, Min Volatility, and Balanced scenarios with customizable weight constraints ($w_{\min}, w_{\max}$). |
| **AI Insights Synthesis** | Cross-module factual intelligence synthesizing valuation, risk, diversification, ML benchmarks, and sentiment. |

---

## 4. Technology Stack

### Frontend
- **Framework:** React 18 (SPA with Vite)
- **Styling:** Vanilla Tailwind CSS with custom glassmorphism and institutional dark palette
- **Data Visualization:** Recharts (Area, Bar, Pie, Scatter, and Composed charts)
- **Icons & UI:** Lucide React, Toast Notifications, Skeleton Loaders

### Backend Gateway
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database ODM:** Mongoose (MongoDB)
- **Security:** JSON Web Tokens (JWT), bcrypt.js, CORS, Morgan

### AI/ML Microservice
- **Framework:** Python 3.11+ / FastAPI & Uvicorn
- **Machine Learning:** scikit-learn, XGBoost, NumPy, Pandas, Joblib
- **Deep Learning / NLP:** Hugging Face Transformers, PyTorch, FinBERT (`ProsusAI/finbert`)
- **Optimization:** SciPy (`scipy.optimize.minimize` SLSQP)
- **Data Sourcing:** `yfinance`

---

## 5. Directory Structure

```
stock market/
├── backend/                       # Node.js & Express API Gateway
│   ├── src/
│   │   ├── config/                # MongoDB database configuration
│   │   ├── controllers/           # Controllers (Auth, Portfolio, Market, AI, News, Optimization)
│   │   ├── middleware/            # JWT authentication & error handlers
│   │   ├── models/                # Mongoose Schemas (User, Portfolio, Holding, Transaction)
│   │   ├── routes/                # Express API route definitions
│   │   ├── services/              # External market data providers
│   │   ├── app.js                 # Express application entry
│   │   └── server.js              # Server bootstrapper (Port 5000)
│   ├── test_e2e_flow.js           # Automated end-to-end integration test suite
│   ├── test_optimization.js       # MPT optimization unit test suite
│   └── test_news.js               # FinBERT sentiment unit test suite
├── ml-service/                    # Python FastAPI AI/ML Microservice
│   ├── app/
│   │   ├── routers/               # FastAPI endpoints (ML, Sentiment, Optimization)
│   │   ├── services/              # Trainers, feature engineering, FinBERT, MPT optimizer
│   │   ├── saved_models/          # Persisted Joblib models
│   │   ├── config.py              # Service environment settings
│   │   └── main.py                # FastAPI app entry (Port 8000)
│   ├── run_server.py              # Microservice startup script
│   └── run_experiments.py         # Empirical ML benchmark generator
├── src/                           # React Frontend Application
│   ├── components/                # Reusable UI cards, tables, charts, toasts, loaders
│   ├── context/                   # React Authentication Context
│   ├── hooks/                     # Custom React hooks
│   ├── layouts/                   # Main, Auth, and Public application layouts
│   ├── pages/                     # 11 Page views (Dashboard, Portfolio, AI Insights, etc.)
│   ├── services/                  # Axios API bridges
│   ├── App.jsx                    # Root router & providers
│   └── main.jsx                   # React DOM entry (Port 5173)
├── RESEARCH_REPORT.md             # Academic research paper & benchmark tables
└── README.md                      # Project documentation
```

---

## 6. Environment Variables Configuration

Create a `.env` file in `backend/`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/quantpulse
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
AI_SERVICE_URL=http://127.0.0.1:8000/api
CORS_ORIGIN=http://localhost:5173
```

Create a `.env` file in `ml-service/`:
```env
HOST=127.0.0.1
PORT=8000
DEBUG=True
RISK_FREE_RATE=0.04
```

---

## 7. Installation & Quick Start Guide

### Step 1: Database Setup
Ensure MongoDB is running locally on port 27017 or use a cloud MongoDB Atlas connection URI:
```bash
# Verify MongoDB connection
mongosh --eval "db.adminCommand('ping')"
```

### Step 2: Python AI/ML Microservice Setup
```bash
cd ml-service
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python run_server.py
```
*Microservice starts at `http://127.0.0.1:8000` (Swagger docs at `/docs`).*

### Step 3: Node.js Backend Gateway Setup
```bash
cd backend
npm install
node src/server.js
```
*Backend API starts at `http://localhost:5000`.*

### Step 4: React Frontend Setup
```bash
# In the root project directory:
npm install
npm run dev
```
*Access web interface at `http://localhost:5173`.*

---

## 8. API Documentation Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new account and initialize starter portfolio | No |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT bearer token | No |
| `GET` | `/api/portfolios` | List all user portfolios | Yes |
| `POST` | `/api/portfolios/:id/holdings` | Add or update stock position in portfolio | Yes |
| `GET` | `/api/portfolios/:id/analytics` | Fetch real-time valuation, gain/loss, and weights | Yes |
| `GET` | `/api/portfolios/:id/risk` | Calculate volatility, Sharpe, Beta, and VaR 95% | Yes |
| `GET` | `/api/market/quote/:symbol` | Real-time market price quote | No |
| `GET` | `/api/news/:symbol` | Live news feed classified with FinBERT sentiment | No |
| `POST` | `/api/news/analyze` | Classify arbitrary financial text snippet | No |
| `POST` | `/api/ml/train` | Train Linear Regression, Random Forest, XGBoost | Yes |
| `GET` | `/api/ml/evaluation/:symbol` | Retrieve out-of-sample ML evaluation metrics | Yes |
| `POST` | `/api/optimization/analyze` | Calculate Markowitz MPT asset allocation scenarios | No |

---

## 9. Automated Testing & Verification

Run the automated test suites from the `backend/` directory:

```bash
# 1. Full End-to-End User Lifecycle (10 Steps)
node test_e2e_flow.js

# 2. Modern Portfolio Theory Optimization Test
node test_optimization.js

# 3. FinBERT Financial Sentiment Engine Test
node test_news.js

# 4. Generate Reproducible ML Benchmark Experiments
cd ../ml-service
python run_experiments.py
```

---

## 10. System Limitations & Academic Research Scope

1. **Stationarity Assumptions:** Financial market distributions are subject to macroeconomic regime shifts and non-Gaussian fat tails.
2. **Transaction Costs & Slippage:** Theoretical MPT rebalancing curves do not simulate execution slippage, bid-ask spreads, or tax burdens.
3. **Execution Latency:** Live financial RSS sentiment streams poll on 15–30 minute increments, suitable for swing and position analysis rather than ultra-low-latency high-frequency trading.

---

## 11. Disclaimer

> **Educational & Research Notice:** QuantPulse AI is an academic project developed for research and educational purposes. All machine learning predictions, FinBERT sentiment evaluations, risk analytics, and Modern Portfolio Theory optimization outputs represent historical statistical calculations and do not constitute financial advice, guaranteed investment returns, or trade execution mandates.
