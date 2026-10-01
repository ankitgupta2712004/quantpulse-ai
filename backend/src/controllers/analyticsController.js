import Portfolio from '../models/Portfolio.js';
import Holding from '../models/Holding.js';
import { marketDataService } from '../services/marketDataService.js';
import {
  calculateDailyReturns,
  calculateAnnualizedVolatility,
  calculateBeta,
  calculateSharpeRatio,
  calculateMaxDrawdown,
  calculateHistoricalVaR,
  buildCorrelationMatrix,
} from '../utils/financialCalculations.js';

// @desc    Get live portfolio performance analytics, valuation & asset/sector allocation
// @route   GET /api/portfolios/:id/analytics
// @access  Private
export const getPortfolioAnalytics = async (req, res, next) => {
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

    const holdings = await Holding.find({ portfolioId: portfolio._id });

    // Handle Empty Portfolio
    if (holdings.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          portfolioId: portfolio._id,
          name: portfolio.name,
          totalInvestment: 0,
          currentValue: 0,
          totalGain: 0,
          totalGainPercentage: 0,
          dailyGain: 0,
          dailyGainPercentage: 0,
          assetAllocation: [],
          sectorAllocation: [],
          holdingsWithLiveQuotes: [],
          performanceHistory: [],
          isEmpty: true,
        },
      });
    }

    const symbols = holdings.map((h) => h.symbol);
    const liveQuotes = await marketDataService.getMultipleQuotes(symbols);

    let totalInvestment = 0;
    let currentValue = 0;
    let dailyGain = 0;

    const sectorTotals = {};
    const holdingsWithLiveQuotes = holdings.map((h) => {
      const quote = liveQuotes[h.symbol] || {};
      const livePrice = quote.price !== null && quote.price !== undefined ? quote.price : h.averageBuyPrice;
      const costBasis = h.quantity * h.averageBuyPrice;
      const currentVal = h.quantity * livePrice;
      const pnl = currentVal - costBasis;
      const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
      const dayChange = (quote.change || 0) * h.quantity;

      totalInvestment += costBasis;
      currentValue += currentVal;
      dailyGain += dayChange;

      // Sector accumulation
      const sector = h.sector || 'General';
      sectorTotals[sector] = (sectorTotals[sector] || 0) + currentVal;

      return {
        id: h._id,
        symbol: h.symbol,
        companyName: quote.companyName || h.symbol,
        quantity: h.quantity,
        averageBuyPrice: h.averageBuyPrice,
        currentPrice: livePrice,
        dayChange: quote.change || 0,
        dayChangePercent: quote.changePercent || 0,
        costBasis: parseFloat(costBasis.toFixed(2)),
        currentValue: parseFloat(currentVal.toFixed(2)),
        unrealizedPnl: parseFloat(pnl.toFixed(2)),
        unrealizedPnlPercent: parseFloat(pnlPercent.toFixed(2)),
        sector,
      };
    });

    const totalGain = currentValue - totalInvestment;
    const totalGainPercentage = totalInvestment > 0 ? (totalGain / totalInvestment) * 100 : 0;
    const previousDayValue = currentValue - dailyGain;
    const dailyGainPercentage = previousDayValue > 0 ? (dailyGain / previousDayValue) * 100 : 0;

    // Asset Allocation (% weight)
    const assetAllocation = holdingsWithLiveQuotes.map((item) => ({
      symbol: item.symbol,
      companyName: item.companyName,
      value: item.currentValue,
      weightPercentage: currentValue > 0 ? parseFloat(((item.currentValue / currentValue) * 100).toFixed(2)) : 0,
    }));

    // Sector Allocation (% weight)
    const sectorAllocation = Object.keys(sectorTotals).map((sector) => ({
      sector,
      value: parseFloat(sectorTotals[sector].toFixed(2)),
      weightPercentage: currentValue > 0 ? parseFloat(((sectorTotals[sector] / currentValue) * 100).toFixed(2)) : 0,
    }));

    // Calculate Historical Performance Trajectory (Past 6 Months)
    let performanceHistory = [];
    try {
      const { dates, closesMap } = await marketDataService.getAlignedHistoricalCloses(symbols, '6mo');

      if (dates.length > 0) {
        performanceHistory = dates.map((date, idx) => {
          let dayVal = 0;
          holdings.forEach((h) => {
            const closes = closesMap[h.symbol] || [];
            const priceOnDay = closes[idx] !== undefined ? closes[idx] : h.averageBuyPrice;
            dayVal += h.quantity * priceOnDay;
          });

          return {
            date,
            portfolioValue: parseFloat(dayVal.toFixed(2)),
            costBasis: parseFloat(totalInvestment.toFixed(2)),
          };
        });
      }
    } catch (histError) {
      console.warn('[Analytics] Historical trajectory build fallback:', histError.message);
    }

    res.status(200).json({
      success: true,
      data: {
        portfolioId: portfolio._id,
        name: portfolio.name,
        totalInvestment: parseFloat(totalInvestment.toFixed(2)),
        currentValue: parseFloat(currentValue.toFixed(2)),
        totalGain: parseFloat(totalGain.toFixed(2)),
        totalGainPercentage: parseFloat(totalGainPercentage.toFixed(2)),
        dailyGain: parseFloat(dailyGain.toFixed(2)),
        dailyGainPercentage: parseFloat(dailyGainPercentage.toFixed(2)),
        assetAllocation,
        sectorAllocation,
        holdingsWithLiveQuotes,
        performanceHistory,
        isEmpty: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get quantitative risk analytics, Beta, Volatility, Sharpe, Drawdown & Correlation Matrix
// @route   GET /api/portfolios/:id/risk
// @access  Private
export const getPortfolioRiskAnalytics = async (req, res, next) => {
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

    const holdings = await Holding.find({ portfolioId: portfolio._id });

    if (holdings.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          volatility: 0,
          beta: 1.0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          var95: 0,
          var99: 0,
          correlationMatrix: { symbols: [], matrix: [] },
          riskTier: 'Neutral',
          isEmpty: true,
        },
      });
    }

    const symbols = holdings.map((h) => h.symbol);
    const benchmarkSymbol = '^GSPC'; // S&P 500 benchmark
    const allSymbols = [...symbols, benchmarkSymbol];

    const { dates, closesMap } = await marketDataService.getAlignedHistoricalCloses(allSymbols, '1y');

    if (dates.length < 5) {
      return res.status(200).json({
        success: true,
        data: {
          volatility: 0,
          beta: 1.0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          var95: 0,
          var99: 0,
          correlationMatrix: { symbols, matrix: symbols.map(() => symbols.map(() => 1.0)) },
          riskTier: 'Moderate',
          note: 'Insufficient historical data points for full risk regression.',
        },
      });
    }

    // Build portfolio aggregate value time series
    const portfolioValues = dates.map((d, idx) => {
      let val = 0;
      holdings.forEach((h) => {
        const prices = closesMap[h.symbol] || [];
        const p = prices[idx] || h.averageBuyPrice;
        val += h.quantity * p;
      });
      return val;
    });

    const benchmarkPrices = closesMap[benchmarkSymbol] || [];

    // Calculate Daily Returns
    const portfolioDailyReturns = calculateDailyReturns(portfolioValues);
    const benchmarkDailyReturns = calculateDailyReturns(benchmarkPrices);

    // Calculate individual asset returns for Correlation Matrix
    const assetReturnsMap = {};
    symbols.forEach((sym) => {
      const prices = closesMap[sym] || [];
      assetReturnsMap[sym] = calculateDailyReturns(prices);
    });

    // Quantitative Risk Metrics
    const volatility = calculateAnnualizedVolatility(portfolioDailyReturns);
    const beta = calculateBeta(portfolioDailyReturns, benchmarkDailyReturns);
    const sharpeRatio = calculateSharpeRatio(portfolioDailyReturns, 0.045); // 4.5% Risk Free Rate
    const maxDrawdown = calculateMaxDrawdown(portfolioValues);
    const var95 = calculateHistoricalVaR(portfolioDailyReturns, 0.95);
    const var99 = calculateHistoricalVaR(portfolioDailyReturns, 0.99);
    const correlationMatrix = buildCorrelationMatrix(assetReturnsMap);

    // Determine Risk Profile Tier
    let riskTier = 'Moderate';
    if (volatility < 0.12 && beta < 0.8) riskTier = 'Conservative';
    else if (volatility > 0.25 || beta > 1.3) riskTier = 'Aggressive';

    res.status(200).json({
      success: true,
      data: {
        portfolioId: portfolio._id,
        volatility: parseFloat((volatility * 100).toFixed(2)), // as percentage
        beta,
        sharpeRatio,
        maxDrawdown,
        var95,
        var99,
        correlationMatrix,
        riskTier,
        benchmark: 'S&P 500 (^GSPC)',
        historicalDataPoints: dates.length,
        disclaimer: 'Educational Decision-Support: Risk metrics are computed on historical series and do not guarantee future performance.',
      },
    });
  } catch (error) {
    next(error);
  }
};
