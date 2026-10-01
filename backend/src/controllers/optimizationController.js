import axios from 'axios';

const getAiServiceUrl = () => process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000/api';

// @desc    Calculate MPT portfolio optimization (weights, expected return, risk, Sharpe ratio)
// @route   POST /api/optimization/analyze
// @access  Public (or Private)
export const analyzePortfolioOptimization = async (req, res, next) => {
  try {
    const { symbols, period, risk_preference, min_weight, max_weight, current_weights } = req.body;

    if (!symbols || !Array.isArray(symbols) || symbols.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 stock symbols are required for portfolio diversification and optimization.',
      });
    }

    const aiUrl = `${getAiServiceUrl()}/optimization/analyze`;
    const response = await axios.post(
      aiUrl,
      {
        symbols,
        period: period || '1y',
        risk_preference: risk_preference || 'max_sharpe',
        min_weight: min_weight !== undefined ? Number(min_weight) : 0.0,
        max_weight: max_weight !== undefined ? Number(max_weight) : 1.0,
        current_weights: current_weights || null,
      },
      { timeout: 30000 }
    );

    const payload = response.data?.data || response.data;

    res.status(200).json({
      success: true,
      data: payload,
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Python Optimization Microservice is offline. Ensure Python service is running on port 8000.',
      });
    }

    const status = error.response?.status || 500;
    const detail = error.response?.data?.detail || error.response?.data?.message || error.message;

    res.status(status).json({
      success: false,
      message: detail,
    });
  }
};
