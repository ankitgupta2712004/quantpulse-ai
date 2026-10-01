from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from app.services.optimization_engine import optimize_portfolio
router = APIRouter(prefix="/api/optimization", tags=["Portfolio Optimization"])

class OptimizationRequest(BaseModel):
    symbols: List[str] = Field(..., description="List of stock ticker symbols")
    period: Optional[str] = Field("1y", description="Historical period: 6mo, 1y, 2y, 3y, 5y")
    risk_preference: Optional[str] = Field("max_sharpe", description="max_sharpe, min_volatility, balanced")
    min_weight: Optional[float] = Field(0.0, description="Minimum weight constraint per asset (0.0 - 1.0)")
    max_weight: Optional[float] = Field(1.0, description="Maximum weight constraint per asset (0.0 - 1.0)")
    current_weights: Optional[Dict[str, float]] = Field(None, description="Current portfolio asset weights")

@router.post("/analyze")
async def analyze_portfolio_optimization(req: OptimizationRequest):
    """
    Calculate optimal portfolio allocations using Modern Portfolio Theory (MPT) Mean-Variance Optimization.
    """
    try:
        result = optimize_portfolio(
            symbols=req.symbols,
            period=req.period,
            risk_preference=req.risk_preference,
            min_weight=req.min_weight,
            max_weight=req.max_weight,
            current_weights=req.current_weights,
        )
        return {
            "success": True,
            "data": result,
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portfolio optimization failed: {str(e)}")
