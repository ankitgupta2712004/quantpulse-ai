import api from './api';

export const watchlistService = {
  // Get all tickers in user's watchlist
  getWatchlist: async () => {
    try {
      const response = await api.get('/watchlist');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch watchlist' };
    }
  },

  // Add symbol to watchlist
  addToWatchlist: async (symbol) => {
    try {
      const response = await api.post('/watchlist', { symbol });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add symbol to watchlist' };
    }
  },

  // Remove symbol from watchlist
  removeFromWatchlist: async (symbol) => {
    try {
      const response = await api.delete(`/watchlist/${symbol}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to remove symbol from watchlist' };
    }
  },
};
