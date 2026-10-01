import api from './api';

export const aiService = {
  // Train Linear Regression, Random Forest and XGBoost on a stock symbol
  trainModel: async (symbol, lookback_years = 2) => {
    try {
      const response = await api.post('/ml/train', { symbol, lookback_years });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to train machine learning models' };
    }
  },

  // Get next-period return prediction & trend direction
  predict: async (symbol) => {
    try {
      const response = await api.post('/ml/predict', { symbol });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to generate trend predictions' };
    }
  },

  // Get model comparison evaluation metrics & feature importance
  getEvaluation: async (symbol) => {
    try {
      const response = await api.get(`/ml/evaluation/${encodeURIComponent(symbol)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch model evaluation metrics' };
    }
  },

  // List saved models
  listModels: async () => {
    try {
      const response = await api.get('/ml/models');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to list models' };
    }
  },
};
