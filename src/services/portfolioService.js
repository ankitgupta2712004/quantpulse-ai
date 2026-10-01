import api from './api';

export const portfolioService = {
  // Fetch all user portfolios
  getPortfolios: async () => {
    try {
      const response = await api.get('/portfolios');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch portfolios' };
    }
  },

  // Create new portfolio
  createPortfolio: async (portfolioData) => {
    try {
      const response = await api.post('/portfolios', portfolioData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create portfolio' };
    }
  },

  // Get single portfolio with holdings & transactions
  getPortfolioById: async (portfolioId) => {
    try {
      const response = await api.get(`/portfolios/${portfolioId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch portfolio details' };
    }
  },

  // Update portfolio details
  updatePortfolio: async (portfolioId, data) => {
    try {
      const response = await api.put(`/portfolios/${portfolioId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update portfolio' };
    }
  },

  // Delete portfolio
  deletePortfolio: async (portfolioId) => {
    try {
      const response = await api.delete(`/portfolios/${portfolioId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete portfolio' };
    }
  },

  // Get holdings for a portfolio
  getHoldings: async (portfolioId) => {
    try {
      const response = await api.get(`/portfolios/${portfolioId}/holdings`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch portfolio holdings' };
    }
  },

  // Add holding to portfolio
  addHolding: async (portfolioId, holdingData) => {
    try {
      const response = await api.post(`/portfolios/${portfolioId}/holdings`, holdingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add holding to portfolio' };
    }
  },

  // Update holding
  updateHolding: async (holdingId, data) => {
    try {
      const response = await api.put(`/holdings/${holdingId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update holding' };
    }
  },

  // Delete holding
  deleteHolding: async (holdingId) => {
    try {
      const response = await api.delete(`/holdings/${holdingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to remove holding' };
    }
  },

  // Get transactions for portfolio
  getTransactions: async (portfolioId) => {
    try {
      const response = await api.get(`/portfolios/${portfolioId}/transactions`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch portfolio transactions' };
    }
  },

  // Record a transaction (BUY / SELL)
  addTransaction: async (portfolioId, transactionData) => {
    try {
      const response = await api.post(`/portfolios/${portfolioId}/transactions`, transactionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to record transaction' };
    }
  },

  // Get live portfolio performance analytics, valuation & asset/sector allocation
  getPortfolioAnalytics: async (portfolioId) => {
    try {
      const response = await api.get(`/portfolios/${portfolioId}/analytics`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to compute portfolio analytics' };
    }
  },

  // Get quantitative risk analytics (Beta, Volatility, Sharpe, Drawdown, Correlation Matrix)
  getPortfolioRiskAnalytics: async (portfolioId) => {
    try {
      const response = await api.get(`/portfolios/${portfolioId}/risk`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to compute portfolio risk analytics' };
    }
  },
};
