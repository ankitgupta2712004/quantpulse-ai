import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  Activity,
  Sliders,
  Play,
  HelpCircle,
  Cpu,
  RefreshCw,
  Layers,
  Info,
  Briefcase,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import RiskMetricCard from '../components/RiskMetricCard';
import ChartCard from '../components/ChartCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { portfolioService } from '../services/portfolioService';
import { useAuth } from '../hooks/useAuth';

const RiskAnalysisPage = () => {
  const { isAuthenticated } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [activePortfolio, setActivePortfolio] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Monte Carlo controls
  const [confidenceLevel, setConfidenceLevel] = useState('95%');
  const [timeHorizon, setTimeHorizon] = useState('30D');
  const [numSimulations, setNumSimulations] = useState('10,000');

  const fetchPortfoliosAndRisk = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const portRes = await portfolioService.getPortfolios();
      if (portRes.success && portRes.data) {
        setPortfolios(portRes.data);
        if (portRes.data.length > 0) {
          const current = activePortfolio
            ? portRes.data.find((p) => p._id === activePortfolio._id) || portRes.data[0]
            : portRes.data[0];
          setActivePortfolio(current);
          await loadRiskData(current._id);
        } else {
          setActivePortfolio(null);
          setRiskData(null);
        }
      }
    } catch (err) {
      console.error('Failed to load portfolio risk data:', err);
      setError(err.message || 'Failed to fetch quantitative risk data.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRiskData = async (portfolioId) => {
    try {
      const res = await portfolioService.getPortfolioRiskAnalytics(portfolioId);
      if (res.success && res.data) {
        setRiskData(res.data);
      }
    } catch (err) {
      console.error('Failed to load risk analytics:', err);
    }
  };

  useEffect(() => {
    fetchPortfoliosAndRisk();
  }, [isAuthenticated]);

  const handleRefresh = async () => {
    if (!activePortfolio) return;
    setIsRefreshing(true);
    await loadRiskData(activePortfolio._id);
    setIsRefreshing(false);
  };

  const handleSelectPortfolio = async (portfolio) => {
    setActivePortfolio(portfolio);
    setIsLoading(true);
    await loadRiskData(portfolio._id);
    setIsLoading(false);
  };

  // Helper for heatmap cell color
  const getCorrelationColor = (val, isDiagonal) => {
    if (isDiagonal) return 'bg-emerald-500/30 text-emerald-300 font-bold border-emerald-500/40';
    if (val >= 0.7) return 'bg-emerald-500/20 text-emerald-300 font-semibold border-emerald-500/30';
    if (val >= 0.3) return 'bg-cyan-500/15 text-cyan-300 font-medium border-cyan-500/20';
    if (val >= -0.3) return 'bg-slate-800 text-slate-300 border-slate-700/60';
    return 'bg-rose-500/20 text-rose-300 font-semibold border-rose-500/30';
  };

  if (isLoading) {
    return <LoadingState message="Running Quantitative Risk Regression..." subtext="Evaluating annualized volatility, beta vs S&P 500, Sharpe ratio, and asset correlations" />;
  }

  if (error && portfolios.length === 0) {
    return <ErrorState title="Risk Engine Error" message={error} onRetry={fetchPortfoliosAndRisk} />;
  }

  const corrMatrix = riskData?.correlationMatrix || { symbols: [], matrix: [] };
  const hasHoldings = corrMatrix.symbols && corrMatrix.symbols.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Quantitative Risk Engine &amp; Factor Analytics"
        subtitle="Downside tail risk, historical volatility regression, Sharpe ratios, and asset correlation matrix."
        badge={riskData?.benchmark ? `Benchmark: ${riskData.benchmark}` : 'Risk Core'}
        actionButton={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title="Recalculate Risk Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Portfolio Selector Tabs */}
      {portfolios.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2 shrink-0">
            Portfolio:
          </span>
          {portfolios.map((p) => (
            <button
              key={p._id}
              onClick={() => handleSelectPortfolio(p)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activePortfolio?._id === p._id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* 4 Quantitative Risk Metric Cards (Real Computed Values) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RiskMetricCard
          title="Annualized Volatility (σ)"
          value={riskData && !riskData.isEmpty ? `${riskData.volatility}%` : undefined}
          formula="σ_daily * sqrt(252)"
          status={riskData?.volatility > 25 ? 'high' : riskData?.volatility > 15 ? 'moderate' : 'safe'}
          interpretation="Standard deviation of daily portfolio returns scaled to 252 trading days."
          academicNote="Higher volatility indicates wider dispersion of expected returns."
        />

        <RiskMetricCard
          title="Beta (β) vs S&amp;P 500"
          value={riskData && !riskData.isEmpty ? `${riskData.beta}` : undefined}
          formula="Cov(R_p, R_m) / Var(R_m)"
          status={riskData?.beta > 1.2 ? 'high' : riskData?.beta < 0.8 ? 'safe' : 'moderate'}
          interpretation="Systematic risk relative to the broader market index benchmark."
          academicNote="β = 1.0 moves in lockstep with the market; β < 1.0 is defensive."
        />

        <RiskMetricCard
          title="Sharpe Ratio"
          value={riskData && !riskData.isEmpty ? `${riskData.sharpeRatio}` : undefined}
          formula="(R_p - R_f) / σ_p"
          status={riskData?.sharpeRatio >= 1.0 ? 'safe' : riskData?.sharpeRatio >= 0.5 ? 'moderate' : 'neutral'}
          interpretation="Excess return generated per unit of total risk (4.5% Risk-Free Rate)."
          academicNote="Sharpe > 1.0 indicates attractive risk-adjusted investment efficiency."
        />

        <RiskMetricCard
          title="Maximum Drawdown"
          value={riskData && !riskData.isEmpty ? `-${riskData.maxDrawdown}%` : undefined}
          formula="(Trough - Peak) / Peak"
          status={riskData?.maxDrawdown > 25 ? 'high' : riskData?.maxDrawdown > 15 ? 'moderate' : 'safe'}
          interpretation="Largest peak-to-trough decline observed in the historical return series."
          academicNote="Measures historical capital preservation under adverse market stress."
        />
      </div>

      {/* Value at Risk (VaR) Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Value at Risk (VaR 95% 1-Day)
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold font-mono">
              95% Confidence
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono mb-1">
            {riskData && !riskData.isEmpty ? `-${riskData.var95}%` : '--'}
          </div>
          <p className="text-xs text-slate-400">
            On 95 out of 100 trading days, the daily portfolio loss is not expected to exceed this threshold.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Value at Risk (VaR 99% 1-Day)
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold font-mono">
              99% Confidence
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono mb-1">
            {riskData && !riskData.isEmpty ? `-${riskData.var99}%` : '--'}
          </div>
          <p className="text-xs text-slate-400">
            Worst 1% extreme tail risk event threshold under historical return distribution.
          </p>
        </div>
      </div>

      {/* Cross-Asset Pearson Correlation Matrix Heatmap Table */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              Asset Cross-Correlation Matrix (Pearson ρ)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Quantifies linear co-movement between portfolio constituents over the past 1 year
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500/50" /> High Positive (&ge;0.7)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-cyan-500/20 border border-cyan-500/40" /> Moderate (0.3-0.7)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500/40" /> Negative (&lt;-0.3)</span>
          </div>
        </div>

        {!hasHoldings ? (
          <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-400">
            Add at least two asset holdings in your portfolio to compute the Pearson correlation matrix.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr>
                  <th className="p-3 text-left font-bold text-slate-400 uppercase tracking-wider bg-slate-900/60 rounded-tl-xl">
                    Ticker / Asset
                  </th>
                  {corrMatrix.symbols.map((sym) => (
                    <th key={sym} className="p-3 font-bold text-white font-mono bg-slate-900/60">
                      {sym}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {corrMatrix.symbols.map((rowSym, rowIdx) => (
                  <tr key={rowSym} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 text-left font-bold text-white font-mono bg-slate-900/40">
                      {rowSym}
                    </td>
                    {corrMatrix.matrix[rowIdx]?.map((val, colIdx) => {
                      const isDiag = rowIdx === colIdx;
                      return (
                        <td key={colIdx} className="p-2">
                          <div
                            className={`py-2 px-3 rounded-xl border transition-all text-xs font-mono inline-block min-w-[60px] ${getCorrelationColor(
                              val,
                              isDiag
                            )}`}
                            title={`Correlation between ${rowSym} and ${corrMatrix.symbols[colIdx]}: ${val}`}
                          >
                            {val.toFixed(2)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monte Carlo Simulation Control Panel */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Monte Carlo Geometric Brownian Motion Simulator
              </h3>
              <p className="text-xs text-slate-400">
                Simulate stochastic price paths using historical drift (μ) and variance (σ²)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Confidence Level
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['95%', '99%'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setConfidenceLevel(lvl)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                    confidenceLevel === lvl
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {lvl} Confidence
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Time Horizon
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['1D', '30D', '1Y'].map((hor) => (
                <button
                  key={hor}
                  onClick={() => setTimeHorizon(hor)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                    timeHorizon === hor
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {hor}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Simulated Paths
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['1,000', '10,000'].map((num) => (
                <button
                  key={num}
                  onClick={() => setNumSimulations(num)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                    numSimulations === num
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {num} Runs
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskAnalysisPage;
