import axios from 'axios';

const getAiServiceUrl = () => process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000/api';

// @desc    Get financial news with FinBERT sentiment classifications
// @route   GET /api/news/:symbol
// @access  Public (or Private)
export const getNewsSentiment = async (req, res, next) => {
  try {
    const { symbol } = req.params;

    if (!symbol || !symbol.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Stock ticker symbol is required',
      });
    }

    const aiUrl = `${getAiServiceUrl()}/sentiment/news/${encodeURIComponent(symbol.toUpperCase())}`;
    const response = await axios.get(aiUrl, { timeout: 60000 });
    const payload = response.data?.data || response.data;

    // Normalize article structure to match prompt specification
    const normalizedArticles = (payload.articles || []).map((art) => ({
      headline: art.title || art.headline,
      source: art.publisher || art.source || 'Financial Media',
      publication_date: art.published_at || art.publication_date || new Date().toISOString(),
      sentiment: art.sentiment,
      sentiment_score: typeof art.compound_score === 'number' ? art.compound_score : (art.sentiment_score ?? 0),
      confidence: art.confidence,
      scores: art.scores,
      url: art.link || art.url || '#',
      summary: art.summary || '',
    }));

    res.status(200).json({
      success: true,
      symbol: (symbol || '').toUpperCase(),
      articles_count: normalizedArticles.length,
      overall_sentiment: payload.overall_sentiment || 'Neutral',
      overall_sentiment_score: payload.overall_score ?? 0,
      sentiment_distribution: payload.distribution || {
        positive_pct: 0,
        neutral_pct: 100,
        negative_pct: 0,
      },
      sentiment_counts: payload.counts || {
        positive: 0,
        neutral: 0,
        negative: 0,
        total: 0,
      },
      model: payload.model || 'ProsusAI/finbert',
      disclaimer: 'News sentiment is an analytical signal and should not be treated as guaranteed investment advice.',
      articles: normalizedArticles,
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Python FinBERT Sentiment Microservice is offline. Ensure Python service is running on port 8000.',
      });
    }
    res.status(error.response?.status || 500).json(
      error.response?.data || { success: false, message: error.message }
    );
  }
};

// @desc    Analyze arbitrary financial text with FinBERT
// @route   POST /api/news/analyze
// @access  Public (or Private)
export const analyzeTextSentiment = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Text is required for sentiment analysis',
      });
    }

    const aiUrl = `${getAiServiceUrl()}/sentiment/analyze-text`;
    const response = await axios.post(aiUrl, { text }, { timeout: 30000 });
    const payload = response.data?.data || response.data;

    res.status(200).json({
      success: true,
      text,
      sentiment: payload.sentiment,
      sentiment_score: payload.compound_score ?? 0,
      confidence: payload.confidence ?? 0,
      probabilities: payload.scores || {},
      disclaimer: 'News sentiment is an analytical signal and should not be treated as guaranteed investment advice.',
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Python FinBERT Sentiment Microservice is offline.',
      });
    }
    res.status(error.response?.status || 500).json(
      error.response?.data || { success: false, message: error.message }
    );
  }
};
