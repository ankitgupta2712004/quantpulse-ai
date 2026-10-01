import api from './api';

export const newsService = {
  // Get financial news and FinBERT sentiment classifications for a symbol
  getNewsSentiment: async (symbol) => {
    try {
      const response = await api.get(`/news/${encodeURIComponent(symbol)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: `Failed to fetch news sentiment for ${symbol}` };
    }
  },

  // Analyze custom financial text
  analyzeText: async (text) => {
    try {
      const response = await api.post('/news/analyze', { text });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to analyze text sentiment' };
    }
  },
};
