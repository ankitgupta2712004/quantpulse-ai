from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os

from ..services.model_trainer import (
    train_models_for_symbol,
    get_saved_model_evaluation,
)
from ..config import SAVED_MODELS_DIR

router = APIRouter(prefix="/api/ml", tags=["Machine Learning"])

class TrainRequest(BaseModel):
    symbol: str
    lookback_years: Optional[int] = 2

class PredictRequest(BaseModel):
    symbol: str

@router.post("/train")
async def train_model_endpoint(req: TrainRequest):
    """
    Train Linear Regression, Random Forest, and XGBoost models on chronological stock data.
    """
    try:
        result = train_models_for_symbol(req.symbol, req.lookback_years or 2)
        return {
            "success": True,
            "message": f"Successfully trained 3 quantitative models for {req.symbol.upper()}",
            "data": result,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/predict")
async def predict_endpoint(req: PredictRequest):
    """
    Generate next-period expected return and directional tendency.
    """
    try:
        eval_data = get_saved_model_evaluation(req.symbol)
        return {
            "success": True,
            "symbol": req.symbol.upper(),
            "data": {
                "latest_market_date": eval_data.get("latest_market_date"),
                "latest_close_price": eval_data.get("latest_close_price"),
                "predictions": eval_data.get("predictions", {}),
                "disclaimer": eval_data.get("disclaimer"),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/evaluation/{symbol}")
async def get_evaluation_endpoint(symbol: str):
    """
    Retrieve objective model comparison (MAE, RMSE, R², Directional Accuracy)
    and feature importance attributions for Random Forest and XGBoost.
    """
    try:
        eval_data = get_saved_model_evaluation(symbol)
        return {
            "success": True,
            "symbol": symbol.upper(),
            "data": eval_data,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/models")
async def list_models_endpoint():
    """
    List all trained model artifacts saved on disk.
    """
    try:
        saved_files = list(SAVED_MODELS_DIR.glob("*_models.joblib"))
        models_list = []

        for f in saved_files:
            sym = f.stem.replace("_models", "")
            models_list.append({
                "symbol": sym,
                "file_name": f.name,
                "file_size_bytes": f.stat().st_size,
                "supported_algorithms": [
                    "Linear Regression (OLS)",
                    "Random Forest Regressor",
                    "XGBoost Regressor (Extreme Gradient Boosting)",
                ]
            })

        return {
            "success": True,
            "count": len(models_list),
            "data": models_list,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
