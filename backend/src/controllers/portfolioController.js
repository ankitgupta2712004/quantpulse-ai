import Portfolio from '../models/Portfolio.js';
import Holding from '../models/Holding.js';
import Transaction from '../models/Transaction.js';

// @desc    Create a new portfolio
// @route   POST /api/portfolios
// @access  Private
export const createPortfolio = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Portfolio name is required',
      });
    }

    const portfolio = await Portfolio.create({
      userId: req.user._id,
      name: name.trim(),
      description: description ? description.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: 'Portfolio created successfully',
      data: portfolio,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all portfolios for current user
// @route   GET /api/portfolios
// @access  Private
export const getPortfolios = async (req, res, next) => {
  try {
    const portfolios = await Portfolio.find({ userId: req.user._id }).sort({ createdAt: -1 });

    // Enhance each portfolio with its holdings summary
    const enhancedPortfolios = await Promise.all(
      portfolios.map(async (portfolio) => {
        const holdings = await Holding.find({ portfolioId: portfolio._id });
        const totalCostBasis = holdings.reduce(
          (sum, h) => sum + h.quantity * h.averageBuyPrice,
          0
        );
        return {
          ...portfolio.toObject(),
          holdingsCount: holdings.length,
          totalCostBasis,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enhancedPortfolios.length,
      data: enhancedPortfolios,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single portfolio with populated holdings and recent transactions
// @route   GET /api/portfolios/:id
// @access  Private
export const getPortfolioById = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found',
      });
    }

    // Ownership check
    if (portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this portfolio',
      });
    }

    const holdings = await Holding.find({ portfolioId: portfolio._id });
    const transactions = await Transaction.find({ portfolioId: portfolio._id }).sort({
      transactionDate: -1,
    });

    const totalCostBasis = holdings.reduce(
      (sum, h) => sum + h.quantity * h.averageBuyPrice,
      0
    );

    res.status(200).json({
      success: true,
      data: {
        ...portfolio.toObject(),
        holdings,
        transactions,
        totalCostBasis,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update portfolio details
// @route   PUT /api/portfolios/:id
// @access  Private
export const updatePortfolio = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    let portfolio = await Portfolio.findById(req.params.id);

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found',
      });
    }

    // Ownership check
    if (portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this portfolio',
      });
    }

    if (name) portfolio.name = name.trim();
    if (description !== undefined) portfolio.description = description.trim();

    portfolio = await portfolio.save();

    res.status(200).json({
      success: true,
      message: 'Portfolio updated successfully',
      data: portfolio,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete portfolio and all its child holdings and transactions
// @route   DELETE /api/portfolios/:id
// @access  Private
export const deletePortfolio = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found',
      });
    }

    // Ownership check
    if (portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this portfolio',
      });
    }

    // Cascade delete child entities
    await Holding.deleteMany({ portfolioId: portfolio._id });
    await Transaction.deleteMany({ portfolioId: portfolio._id });
    await portfolio.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Portfolio and related records deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};
