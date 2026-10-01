from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.services.news_fetcher import fetch_stock_news
from app.services.sentiment_engine import process_news_sentiment, analyze_headline_sentiment
router = APIRouter(prefix="/api/sentiment", tags=["FinBERT Sentiment"])

class TextAnalyzeRequest(BaseModel):
    text: str

@router.get("/news/{symbol}")
async def get_stock_news_sentiment(symbol: str):
    """
    Fetch real financial news for a stock symbol and classify using FinBERT.
    """
    try:
        articles = fetch_stock_news(symbol)
        result = process_news_sentiment(articles)
        result["symbol"] = symbol.upper()
        return {
            "success": True,
            "data": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-text")
async def analyze_text_sentiment(req: TextAnalyzeRequest):
    """
    Analyze arbitrary financial text or press release with FinBERT.
    """
    try:
        analysis = analyze_headline_sentiment(req.text)
        return {
            "success": True,
            "data": analysis,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
