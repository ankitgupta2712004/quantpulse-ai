from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import ml_router, sentiment_router, optimization_router

app = FastAPI(
    title="QuantPulse AI - Quantitative Machine Learning & FinBERT Microservice",
    description="Python FastAPI service for stock trend analysis, model training, explainability, FinBERT sentiment, and MPT portfolio optimization.",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "service": "QuantPulse AI Python ML, FinBERT & Optimization Service",
        "engine": "FastAPI + SciPy + NumPy + scikit-learn + XGBoost + Transformers FinBERT",
        "frameworks": ["LinearRegression", "RandomForestRegressor", "XGBRegressor", "FinBERT NLP", "MPT Mean-Variance Optimization"],
    }

# Include Routers
app.include_router(ml_router.router)
app.include_router(sentiment_router.router)
app.include_router(optimization_router.router)

if __name__ == "__main__":
    import uvicorn
    from .config import HOST, PORT, DEBUG
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=DEBUG)
