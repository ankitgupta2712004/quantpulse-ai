import api from './api';

export const optimizationService = {
  // Analyze portfolio optimization using Modern Portfolio Theory (MPT) Mean-Variance
  analyzePortfolio: async ({
    symbols,
    period = '1y',
    risk_preference = 'max_sharpe',
    min_weight = 0.0,
    max_weight = 1.0,
    current_weights = null,
  }) => {
    try {
      const response = await api.post('/optimization/analyze', {
        symbols,
        period,
        risk_preference,
        min_weight,
        max_weight,
        current_weights,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Portfolio optimization analysis failed.' };
    }
  },
};
