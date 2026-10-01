import api from './api';

export const marketService = {
  // Get live stock quote
  getQuote: async (symbol) => {
    try {
      const response = await api.get(`/market/quote/${symbol}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: `Market quote unavailable for ${symbol}` };
    }
  },

  // Get historical OHLCV chart data
  getHistory: async (symbol, range = '1y') => {
    try {
      const response = await api.get(`/market/history/${symbol}?range=${range}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: `Historical data unavailable for ${symbol}` };
    }
  },

  // Search ticker symbols and companies
  searchSymbols: async (query) => {
    try {
      const response = await api.get(`/market/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Ticker search failed' };
    }
  },

  // Get company statistics & fundamentals
  getCompanyStats: async (symbol) => {
    try {
      const response = await api.get(`/market/stats/${symbol}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: `Company statistics unavailable for ${symbol}` };
    }
  },
};
