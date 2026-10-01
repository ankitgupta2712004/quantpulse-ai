import Transaction from '../models/Transaction.js';
import Portfolio from '../models/Portfolio.js';
import Holding from '../models/Holding.js';

// @desc    Add a buy/sell transaction to portfolio
// @route   POST /api/portfolios/:id/transactions
// @access  Private
export const addTransaction = async (req, res, next) => {
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

    const { symbol, type, quantity, price, transactionDate } = req.body;

    if (!symbol || !type || quantity === undefined || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide symbol, type (BUY/SELL), quantity, and price',
      });
    }

    const normalizedType = type.toUpperCase();
    if (!['BUY', 'SELL'].includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: 'Transaction type must be either BUY or SELL',
      });
    }

    const numQty = parseFloat(quantity);
    const numPrice = parseFloat(price);

    if (isNaN(numQty) || numQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Transaction quantity must be greater than 0',
      });
    }

    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Transaction price cannot be negative',
      });
    }

    const upperSymbol = symbol.trim().toUpperCase();

    // Adjust Holdings
    let holding = await Holding.findOne({
      portfolioId: portfolio._id,
      symbol: upperSymbol,
    });

    if (normalizedType === 'BUY') {
      if (holding) {
        const oldTotal = holding.quantity * holding.averageBuyPrice;
        const newTotal = numQty * numPrice;
        const totalQty = holding.quantity + numQty;
        holding.quantity = totalQty;
        holding.averageBuyPrice = parseFloat(((oldTotal + newTotal) / totalQty).toFixed(4));
        await holding.save();
      } else {
        holding = await Holding.create({
          portfolioId: portfolio._id,
          symbol: upperSymbol,
          quantity: numQty,
          averageBuyPrice: numPrice,
        });
      }
    } else if (normalizedType === 'SELL') {
      if (!holding || holding.quantity < numQty) {
        return res.status(400).json({
          success: false,
          message: `Cannot execute SELL: Insufficient shares. Current position has ${
            holding ? holding.quantity : 0
          } shares of ${upperSymbol}`,
        });
      }

      holding.quantity -= numQty;
      if (holding.quantity === 0) {
        await holding.deleteOne();
      } else {
        await holding.save();
      }
    }

    // Save transaction
    const transaction = await Transaction.create({
      portfolioId: portfolio._id,
      symbol: upperSymbol,
      type: normalizedType,
      quantity: numQty,
      price: numPrice,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
    });

    res.status(201).json({
      success: true,
      message: `${normalizedType} transaction executed successfully`,
      data: {
        transaction,
        updatedHolding: holding,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all transactions for a portfolio
// @route   GET /api/portfolios/:id/transactions
// @access  Private
export const getTransactions = async (req, res, next) => {
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

    const transactions = await Transaction.find({ portfolioId: portfolio._id }).sort({
      transactionDate: -1,
    });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};
