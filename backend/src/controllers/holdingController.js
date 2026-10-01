import Holding from '../models/Holding.js';
import Portfolio from '../models/Portfolio.js';
import Transaction from '../models/Transaction.js';

// @desc    Add a holding to portfolio (or update if already exists)
// @route   POST /api/portfolios/:id/holdings
// @access  Private
export const addHolding = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found',
      });
    }

    if (portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this portfolio',
      });
    }

    const { symbol, quantity, averageBuyPrice, buyPrice, avgBuyPrice, sector } = req.body;
    const priceVal = averageBuyPrice !== undefined ? averageBuyPrice : (buyPrice !== undefined ? buyPrice : avgBuyPrice);

    if (!symbol || quantity === undefined || priceVal === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide symbol, quantity, and averageBuyPrice',
      });
    }

    const numQty = parseFloat(quantity);
    const numPrice = parseFloat(priceVal);

    if (isNaN(numQty) || numQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number',
      });
    }

    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Average buy price cannot be negative',
      });
    }

    const upperSymbol = symbol.trim().toUpperCase();

    // Check if holding already exists in portfolio
    let holding = await Holding.findOne({
      portfolioId: portfolio._id,
      symbol: upperSymbol,
    });

    if (holding) {
      // Calculate weighted average cost basis
      const oldTotalCost = holding.quantity * holding.averageBuyPrice;
      const newTotalCost = numQty * numPrice;
      const combinedQty = holding.quantity + numQty;
      const weightedAvgPrice = (oldTotalCost + newTotalCost) / combinedQty;

      holding.quantity = combinedQty;
      holding.averageBuyPrice = parseFloat(weightedAvgPrice.toFixed(4));
      if (sector) holding.sector = sector.trim();
      await holding.save();
    } else {
      holding = await Holding.create({
        portfolioId: portfolio._id,
        symbol: upperSymbol,
        quantity: numQty,
        averageBuyPrice: numPrice,
        sector: sector ? sector.trim() : 'Technology',
      });
    }

    // Automatically record corresponding BUY transaction
    await Transaction.create({
      portfolioId: portfolio._id,
      symbol: upperSymbol,
      type: 'BUY',
      quantity: numQty,
      price: numPrice,
      transactionDate: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Holding added successfully and transaction recorded',
      data: holding,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all holdings for a portfolio
// @route   GET /api/portfolios/:id/holdings
// @access  Private
export const getHoldings = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found',
      });
    }

    if (portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this portfolio',
      });
    }

    const holdings = await Holding.find({ portfolioId: portfolio._id }).sort({ symbol: 1 });

    res.status(200).json({
      success: true,
      count: holdings.length,
      data: holdings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a specific holding
// @route   PUT /api/holdings/:id
// @access  Private
export const updateHolding = async (req, res, next) => {
  try {
    let holding = await Holding.findById(req.params.id);

    if (!holding) {
      return res.status(404).json({
        success: false,
        message: 'Holding not found',
      });
    }

    // Verify portfolio ownership
    const portfolio = await Portfolio.findById(holding.portfolioId);
    if (!portfolio || portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this portfolio holding',
      });
    }

    const { quantity, averageBuyPrice, sector } = req.body;

    if (quantity !== undefined) {
      const numQty = parseFloat(quantity);
      if (isNaN(numQty) || numQty < 0) {
        return res.status(400).json({ success: false, message: 'Invalid quantity' });
      }
      holding.quantity = numQty;
    }

    if (averageBuyPrice !== undefined) {
      const numPrice = parseFloat(averageBuyPrice);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ success: false, message: 'Invalid average buy price' });
      }
      holding.averageBuyPrice = numPrice;
    }

    if (sector !== undefined) {
      holding.sector = sector.trim();
    }

    await holding.save();

    res.status(200).json({
      success: true,
      message: 'Holding updated successfully',
      data: holding,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a specific holding
// @route   DELETE /api/holdings/:id
// @access  Private
export const deleteHolding = async (req, res, next) => {
  try {
    const holding = await Holding.findById(req.params.id);

    if (!holding) {
      return res.status(404).json({
        success: false,
        message: 'Holding not found',
      });
    }

    const portfolio = await Portfolio.findById(holding.portfolioId);
    if (!portfolio || portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this portfolio holding',
      });
    }

    await holding.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Holding removed from portfolio',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};
