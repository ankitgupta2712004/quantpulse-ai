/**
 * Financial & Quantitative Mathematical Calculations
 * Pure mathematical functions for portfolio performance, risk analytics, and correlation.
 */

/**
 * Calculate array of daily returns from historical prices
 * R_t = (P_t - P_{t-1}) / P_{t-1}
 */
export const calculateDailyReturns = (prices = []) => {
  if (!prices || prices.length < 2) return [];
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1];
    const curr = prices[i];
    if (prev > 0) {
      returns.push((curr - prev) / prev);
    }
  }
  return returns;
};

/**
 * Calculate mean of an array
 */
export const calculateMean = (values = []) => {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
};

/**
 * Calculate sample variance of an array
 */
export const calculateVariance = (values = [], mean = null) => {
  if (!values || values.length < 2) return 0;
  const m = mean !== null ? mean : calculateMean(values);
  const sumSquaredDiffs = values.reduce((acc, val) => acc + Math.pow(val - m, 2), 0);
  return sumSquaredDiffs / (values.length - 1);
};

/**
 * Calculate standard deviation
 */
export const calculateStandardDeviation = (values = [], mean = null) => {
  return Math.sqrt(calculateVariance(values, mean));
};

/**
 * Calculate covariance between two aligned series
 */
export const calculateCovariance = (seriesA = [], seriesB = []) => {
  const n = Math.min(seriesA.length, seriesB.length);
  if (n < 2) return 0;

  const meanA = calculateMean(seriesA.slice(0, n));
  const meanB = calculateMean(seriesB.slice(0, n));

  let cov = 0;
  for (let i = 0; i < n; i++) {
    cov += (seriesA[i] - meanA) * (seriesB[i] - meanB);
  }
  return cov / (n - 1);
};

/**
 * Calculate Pearson correlation coefficient between two series:
 * rho = Cov(A, B) / (Std(A) * Std(B))
 */
export const calculateCorrelation = (seriesA = [], seriesB = []) => {
  const n = Math.min(seriesA.length, seriesB.length);
  if (n < 2) return 0;

  const a = seriesA.slice(0, n);
  const b = seriesB.slice(0, n);

  const stdA = calculateStandardDeviation(a);
  const stdB = calculateStandardDeviation(b);

  if (stdA === 0 || stdB === 0) return 0;

  const cov = calculateCovariance(a, b);
  const corr = cov / (stdA * stdB);

  // Bound to [-1, 1] for floating point rounding issues
  return Math.max(-1, Math.min(1, parseFloat(corr.toFixed(4))));
};

/**
 * Calculate Annualized Volatility:
 * Volatility = StdDev(daily_returns) * sqrt(252)
 */
export const calculateAnnualizedVolatility = (dailyReturns = []) => {
  if (!dailyReturns || dailyReturns.length < 2) return 0;
  const dailyStd = calculateStandardDeviation(dailyReturns);
  return dailyStd * Math.sqrt(252);
};

/**
 * Calculate Beta against benchmark returns:
 * Beta = Cov(portfolio_returns, benchmark_returns) / Var(benchmark_returns)
 */
export const calculateBeta = (portfolioReturns = [], benchmarkReturns = []) => {
  const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
  if (n < 2) return 1.0;

  const p = portfolioReturns.slice(0, n);
  const b = benchmarkReturns.slice(0, n);

  const varB = calculateVariance(b);
  if (varB === 0) return 1.0;

  const cov = calculateCovariance(p, b);
  const beta = cov / varB;
  return parseFloat(beta.toFixed(3));
};

/**
 * Calculate Annualized Sharpe Ratio:
 * Sharpe = (Annualized Return - Risk Free Rate) / Annualized Volatility
 * @param {number[]} dailyReturns
 * @param {number} riskFreeRate - e.g. 0.045 for 4.5%
 */
export const calculateSharpeRatio = (dailyReturns = [], riskFreeRate = 0.045) => {
  if (!dailyReturns || dailyReturns.length < 2) return 0;

  const meanDailyReturn = calculateMean(dailyReturns);
  const annualizedReturn = Math.pow(1 + meanDailyReturn, 252) - 1;
  const annualizedVol = calculateAnnualizedVolatility(dailyReturns);

  if (annualizedVol === 0) return 0;

  const sharpe = (annualizedReturn - riskFreeRate) / annualizedVol;
  return parseFloat(sharpe.toFixed(2));
};

/**
 * Calculate Maximum Drawdown (MDD) from price or cumulative wealth series:
 * MDD = max((Peak - Trough) / Peak)
 */
export const calculateMaxDrawdown = (cumulativeValues = []) => {
  if (!cumulativeValues || cumulativeValues.length < 2) return 0;

  let peak = cumulativeValues[0];
  let maxDrawdown = 0;

  for (let i = 0; i < cumulativeValues.length; i++) {
    const val = cumulativeValues[i];
    if (val > peak) {
      peak = val;
    }
    if (peak > 0) {
      const drawdown = (peak - val) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
  }

  return parseFloat((maxDrawdown * 100).toFixed(2)); // percentage
};

/**
 * Calculate Historical Value at Risk (VaR at alpha confidence level, e.g. 95%)
 */
export const calculateHistoricalVaR = (dailyReturns = [], confidenceLevel = 0.95) => {
  if (!dailyReturns || dailyReturns.length < 5) return 0;

  const sorted = [...dailyReturns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidenceLevel) * sorted.length);
  const varReturn = sorted[index] || 0;

  // Expressed as positive percentage representing potential downside loss
  return parseFloat((Math.abs(varReturn) * 100).toFixed(2));
};

/**
 * Construct asset-to-asset Correlation Matrix Heatmap
 * @param {Object} assetReturnsMap - { 'AAPL': [r1, r2, ...], 'MSFT': [r1, r2, ...] }
 */
export const buildCorrelationMatrix = (assetReturnsMap = {}) => {
  const symbols = Object.keys(assetReturnsMap);
  if (symbols.length === 0) return { symbols: [], matrix: [] };

  const matrix = [];

  for (let i = 0; i < symbols.length; i++) {
    const row = [];
    const symA = symbols[i];
    const returnsA = assetReturnsMap[symA] || [];

    for (let j = 0; j < symbols.length; j++) {
      const symB = symbols[j];
      if (i === j) {
        row.push(1.0);
      } else {
        const returnsB = assetReturnsMap[symB] || [];
        const corr = calculateCorrelation(returnsA, returnsB);
        row.push(corr);
      }
    }
    matrix.push(row);
  }

  return { symbols, matrix };
};
