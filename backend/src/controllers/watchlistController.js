import Watchlist from '../models/Watchlist.js';

// @desc    Add symbol to user watchlist
// @route   POST /api/watchlist
// @access  Private
export const addToWatchlist = async (req, res, next) => {
  try {
    const { symbol } = req.body;

    if (!symbol || !symbol.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Stock ticker symbol is required',
      });
    }

    const upperSymbol = symbol.trim().toUpperCase();

    // Check if already in watchlist
    const existing = await Watchlist.findOne({
      userId: req.user._id,
      symbol: upperSymbol,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `${upperSymbol} is already in your watchlist`,
      });
    }

    const watchlistItem = await Watchlist.create({
      userId: req.user._id,
      symbol: upperSymbol,
    });

    res.status(201).json({
      success: true,
      message: `${upperSymbol} added to watchlist`,
      data: watchlistItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's watchlist
// @route   GET /api/watchlist
// @access  Private
export const getWatchlist = async (req, res, next) => {
  try {
    const watchlist = await Watchlist.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: watchlist.length,
      data: watchlist,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove symbol from watchlist
// @route   DELETE /api/watchlist/:symbol
// @access  Private
export const removeFromWatchlist = async (req, res, next) => {
  try {
    const symbol = req.params.symbol.trim().toUpperCase();

    const result = await Watchlist.findOneAndDelete({
      userId: req.user._id,
      symbol,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: `${symbol} was not found in your watchlist`,
      });
    }

    res.status(200).json({
      success: true,
      message: `${symbol} removed from watchlist`,
      data: { symbol },
    });
  } catch (error) {
    next(error);
  }
};
