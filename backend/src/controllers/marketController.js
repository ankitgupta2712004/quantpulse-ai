import { marketDataService } from '../services/marketDataService.js';

// @desc    Get live stock quote
// @route   GET /api/market/quote/:symbol
// @access  Public
export const getQuote = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const quote = await marketDataService.getQuote(symbol);

    res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message || 'Market quote unavailable for the requested symbol',
    });
  }
};

// @desc    Get historical OHLCV chart data
// @route   GET /api/market/history/:symbol
// @access  Public
export const getHistory = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { range = '1y' } = req.query;

    const history = await marketDataService.getHistoricalData(symbol, range);

    res.status(200).json({
      success: true,
      count: history.length,
      symbol: symbol.toUpperCase(),
      range,
      data: history,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message || 'Historical data unavailable for the requested symbol',
    });
  }
};

// @desc    Search for ticker symbols & companies
// @route   GET /api/market/search
// @access  Public
export const searchSymbols = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const results = await marketDataService.searchSymbols(q);

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get company statistics & fundamentals
// @route   GET /api/market/stats/:symbol
// @access  Public
export const getCompanyStats = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const stats = await marketDataService.getCompanyStats(symbol);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message || 'Company fundamentals unavailable for the requested symbol',
    });
  }
};
