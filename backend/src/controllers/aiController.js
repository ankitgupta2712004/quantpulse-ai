import axios from 'axios';

const getAiServiceUrl = () => process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000/api';

// @desc    Train Linear Regression, Random Forest and XGBoost on a stock symbol
// @route   POST /api/ml/train
// @access  Private
export const trainModel = async (req, res, next) => {
  try {
    const { symbol, lookback_years = 2 } = req.body;

    if (!symbol || !symbol.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Stock ticker symbol is required for model training',
      });
    }

    const aiUrl = `${getAiServiceUrl()}/ml/train`;
    const response = await axios.post(
      aiUrl,
      { symbol: symbol.trim().toUpperCase(), lookback_years },
      { timeout: 60000 }
    );

    res.status(200).json(response.data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Python AI/ML Microservice is offline. Ensure FastAPI service is running on port 8000.',
      });
    }
    res.status(error.response?.status || 400).json(
      error.response?.data || { success: false, message: error.message }
    );
  }
};

// @desc    Get next-period return prediction & trend direction
// @route   POST /api/ml/predict
// @access  Private
export const predict = async (req, res, next) => {
  try {
    const { symbol } = req.body;

    if (!symbol || !symbol.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Stock ticker symbol is required for prediction',
      });
    }

    const aiUrl = `${getAiServiceUrl()}/ml/predict`;
    const response = await axios.post(
      aiUrl,
      { symbol: symbol.trim().toUpperCase() },
      { timeout: 60000 }
    );

    res.status(200).json(response.data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Python AI/ML Microservice is offline.',
      });
    }
    res.status(error.response?.status || 400).json(
      error.response?.data || { success: false, message: error.message }
    );
  }
};

// @desc    Get model comparison evaluation & feature importances
// @route   GET /api/ml/evaluation/:symbol
// @access  Private
export const getEvaluation = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const aiUrl = `${getAiServiceUrl()}/ml/evaluation/${encodeURIComponent(symbol.toUpperCase())}`;

    const response = await axios.get(aiUrl, { timeout: 60000 });
    res.status(200).json(response.data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Python AI/ML Microservice is offline.',
      });
    }
    res.status(error.response?.status || 400).json(
      error.response?.data || { success: false, message: error.message }
    );
  }
};

// @desc    List saved ML models
// @route   GET /api/ml/models
// @access  Private
export const listModels = async (req, res, next) => {
  try {
    const aiUrl = `${getAiServiceUrl()}/ml/models`;
    const response = await axios.get(aiUrl, { timeout: 10000 });
    res.status(200).json(response.data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Python AI/ML Microservice is offline.',
      });
    }
    res.status(error.response?.status || 400).json(
      error.response?.data || { success: false, message: error.message }
    );
  }
};
