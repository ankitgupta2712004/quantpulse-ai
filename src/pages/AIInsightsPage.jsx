import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Cpu,
  TrendingUp,
  RefreshCw,
  Sliders,
  ShieldAlert,
  Shield,
  PieChart as PieIcon,
  Newspaper,
  BookOpen,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DashboardCard from '../components/DashboardCard';
import ErrorState from '../components/ErrorState';
import { SkeletonCard, SkeletonChart } from '../components/SkeletonLoader';
import { formatCurrency } from '../utils/formatters';
import { portfolioService } from '../services/portfolioService';
import { aiService } from '../services/aiService';
import { newsService } from '../services/newsService';
import { optimizationService } from '../services/optimizationService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';

const AIInsightsPage = () => {
  const { isAuthenticated } = useAuth();
  const { showSuccess } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Analytical data states across all modules
  const [portfolioAnalytics, setPortfolioAnalytics] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [mlData, setMlData] = useState(null);
  const [sentimentData, setSentimentData] = useState(null);
  const [optimizationData, setOptimizationData] = useState(null);

  const [activeStock, setActiveStock] = useState('AAPL');
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'models' | 'explainability'

  const loadAllIntelligence = async (stock = activeStock) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch user portfolio & risk metrics
      let symbolsForAnalysis = ['AAPL', 'MSFT', 'NVDA', 'GOOGL'];
      let primaryPortId = null;

      try {
        const portRes = await portfolioService.getPortfolios();
        if (portRes.success && portRes.data && portRes.data.length > 0) {
          primaryPortId = portRes.data[0]._id;
          const [anRes, rkRes] = await Promise.all([
            portfolioService.getPortfolioAnalytics(primaryPortId).catch(() => null),
            portfolioService.getPortfolioRiskAnalytics(primaryPortId).catch(() => null),
          ]);
          if (anRes && anRes.success) setPortfolioAnalytics(anRes.data);
          if (rkRes && rkRes.success) setRiskData(rkRes.data);

          if (anRes?.data?.holdings && anRes.data.holdings.length >= 2) {
            symbolsForAnalysis = anRes.data.holdings.map((h) => h.symbol);
          }
        }
      } catch (e) {
        console.warn('Portfolio sync note:', e.message);
      }

      // 2. Fetch ML evaluation for active stock
      // 3. Fetch News sentiment for active stock
      // 4. Fetch MPT Optimization for portfolio symbols
      const [mlRes, newsRes, optRes] = await Promise.all([
        aiService.getEvaluation(stock).catch(() => null),
        newsService.getNewsSentiment(stock).catch(() => null),
        optimizationService.analyzePortfolio({ symbols: symbolsForAnalysis }).catch(() => null),
      ]);

      if (mlRes && mlRes.success) setMlData(mlRes.data);
      if (newsRes && (newsRes.success || newsRes.data)) setSentimentData(newsRes.data || newsRes);
      if (optRes && optRes.success) setOptimizationData(optRes.data);

    } catch (err) {
      console.error('Failed to load multi-module intelligence:', err);
      setError(err.message || 'Failed to synthesize cross-module analytical insights.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllIntelligence(activeStock);
  }, [isAuthenticated, activeStock]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAllIntelligence(activeStock);
    showSuccess('Refreshed all cross-module analytical data');
  };

  // Generate factual, explainable insights derived strictly from calculated metrics
  const generatedInsights = [];

  // 1. Performance Insight
  if (portfolioAnalytics && !portfolioAnalytics.isEmpty) {
    const isGain = (portfolioAnalytics.totalGain || 0) >= 0;
    const gainPct = portfolioAnalytics.totalGainPercentage || 0;
    generatedInsights.push({
      id: 'perf-1',
      category: 'Portfolio Performance',
      icon: TrendingUp,
      color: isGain ? 'emerald' : 'rose',
      title: `Portfolio Valuation & Net Return`,
      description: `The active portfolio currently holds a total valuation of ${formatCurrency(portfolioAnalytics.currentValue)} with a net ${isGain ? 'unrealized gain' : 'unrealized loss'} of ${formatCurrency(Math.abs(portfolioAnalytics.totalGain || 0))} (${isGain ? '+' : ''}${gainPct.toFixed(2)}%).`,
      metricLabel: 'Net Return',
      metricValue: `${isGain ? '+' : ''}${gainPct.toFixed(2)}%`,
    });
  }

  // 2. Risk Metric Insight
  if (riskData) {
    const vol = riskData.annualizedVolatility || 0;
    const sr = riskData.sharpeRatio || 0;
    const beta = riskData.beta || 1.0;

    let riskDesc = `Annualized volatility is measured at ${vol.toFixed(1)}% with a portfolio Beta of ${beta.toFixed(2)} relative to the S&P 500 benchmark. `;
    if (sr > 1.0) {
      riskDesc += `The calculated Sharpe ratio of ${sr.toFixed(2)} reflects positive historical excess return relative to risk-free rate.`;
    } else if (sr > 0) {
      riskDesc += `The Sharpe ratio of ${sr.toFixed(2)} indicates moderate risk-adjusted returns.`;
    } else {
      riskDesc += `The Sharpe ratio is negative (${sr.toFixed(2)}), reflecting returns below the risk-free baseline during this window.`;
    }

    generatedInsights.push({
      id: 'risk-1',
      category: 'Risk & Volatility Analysis',
      icon: Shield,
      color: vol > 25 ? 'amber' : 'cyan',
      title: `Market Risk Exposure & Sharpe Ratio`,
      description: riskDesc,
      metricLabel: 'Sharpe Ratio',
      metricValue: sr.toFixed(2),
    });

    if (riskData.maxDrawdown) {
      generatedInsights.push({
        id: 'risk-2',
        category: 'Drawdown & Tail Risk',
        icon: AlertTriangle,
        color: 'rose',
        title: `Maximum Peak-to-Trough Drawdown`,
        description: `Historical maximum drawdown recorded is ${Math.abs(riskData.maxDrawdown).toFixed(1)}%. Parametric Value at Risk (VaR 95%) is estimated at ${(riskData.valueAtRisk95 || 0).toFixed(1)}% over standard holding periods.`,
        metricLabel: 'Max Drawdown',
        metricValue: `-${Math.abs(riskData.maxDrawdown).toFixed(1)}%`,
      });
    }
  }

  // 3. Diversification Insight
  if (portfolioAnalytics?.assetAllocation && portfolioAnalytics.assetAllocation.length > 0) {
    const alloc = portfolioAnalytics.assetAllocation;
    const topAsset = [...alloc].sort((a, b) => b.weightPercentage - a.weightPercentage)[0];

    if (topAsset && topAsset.weightPercentage > 40) {
      generatedInsights.push({
        id: 'div-1',
        category: 'Asset Concentration',
        icon: PieIcon,
        color: 'amber',
        title: `High Single-Asset Concentration`,
        description: `The largest single holding (${topAsset.symbol}) represents ${topAsset.weightPercentage.toFixed(1)}% of total portfolio value, exceeding the typical 25% single-asset threshold.`,
        metricLabel: 'Top Holding',
        metricValue: `${topAsset.symbol} (${topAsset.weightPercentage.toFixed(1)}%)`,
      });
    } else {
      generatedInsights.push({
        id: 'div-2',
        category: 'Asset Allocation',
        icon: PieIcon,
        color: 'indigo',
        title: `Balanced Multi-Asset Distribution`,
        description: `Assets are distributed across ${alloc.length} constituents with largest weight being ${topAsset.symbol} at ${topAsset.weightPercentage.toFixed(1)}%.`,
        metricLabel: 'Constituents',
        metricValue: `${alloc.length} Assets`,
      });
    }
  }

  // 4. Stock ML Model Insight
  if (mlData?.evaluations) {
    const evals = mlData.evaluations;
    const xgb = evals.xgboost || {};
    const rf = evals.random_forest || {};
    const lr = evals.linear_regression || {};

    const lowestRmseModel = Object.entries(evals).sort((a, b) => (a[1].rmse || 999) - (b[1].rmse || 999))[0];
    const topModelName = lowestRmseModel ? (lowestRmseModel[0] === 'xgboost' ? 'XGBoost Regressor' : lowestRmseModel[0] === 'random_forest' ? 'Random Forest' : 'Linear Regression') : 'XGBoost';

    generatedInsights.push({
      id: 'ml-1',
      category: 'Machine Learning Model Performance',
      icon: Cpu,
      color: 'purple',
      title: `${activeStock} Model Benchmark: ${topModelName}`,
      description: `Comparative chronological test evaluation shows ${topModelName} achieved lowest test RMSE (${(lowestRmseModel?.[1]?.rmse || 0).toFixed(4)}) and ${(lowestRmseModel?.[1]?.directional_accuracy || 0).toFixed(1)}% directional accuracy on out-of-sample data.`,
      metricLabel: 'Directional Accuracy',
      metricValue: `${(lowestRmseModel?.[1]?.directional_accuracy || 0).toFixed(1)}%`,
    });
  }

  // 5. News Sentiment Insight
  if (sentimentData) {
    const overallTone = sentimentData.overall_sentiment || 'Neutral';
    const score = sentimentData.overall_sentiment_score ?? sentimentData.overall_score ?? 0;
    const dist = sentimentData.sentiment_distribution || sentimentData.distribution || {};
    const count = sentimentData.articles_count || sentimentData.articles?.length || 0;

    generatedInsights.push({
      id: 'sent-1',
      category: 'FinBERT News Sentiment',
      icon: Newspaper,
      color: overallTone.toLowerCase().includes('bullish') ? 'emerald' : overallTone.toLowerCase().includes('bearish') ? 'rose' : 'slate',
      title: `${activeStock} Financial News Tone: ${overallTone}`,
      description: `FinBERT transformer analyzed ${count} recent financial articles for ${activeStock}. The aggregated compound polarity score is ${score >= 0 ? '+' : ''}${score} (${dist.positive_pct || 0}% positive, ${dist.neutral_pct || 0}% neutral, ${dist.negative_pct || 0}% negative).`,
      metricLabel: 'Compound Score',
      metricValue: `${score >= 0 ? '+' : ''}${score}`,
    });
  }

  // 6. Portfolio Optimization Insight
  if (optimizationData) {
    const optRet = optimizationData.expected_return || 0;
    const optVol = optimizationData.expected_volatility || 0;
    const optSr = optimizationData.sharpe_ratio || 0;

    generatedInsights.push({
      id: 'opt-1',
      category: 'Modern Portfolio Theory (MPT)',
      icon: Sliders,
      color: 'emerald',
      title: `Model-Generated Allocation Scenario`,
      description: `Markowitz mean-variance convex quadratic optimization solved a target allocation scenario yielding an expected annualized return of ${optRet}% at an annualized volatility of ${optVol}% (Sharpe ratio: ${optSr}).`,
      metricLabel: 'Model Sharpe',
      metricValue: optSr.toFixed(2),
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Insights & Cross-Module Intelligence Synthesis"
        subtitle="Unified analytical report synthesizing portfolio performance, risk analytics, diversification, predictive ML models, FinBERT sentiment, and MPT optimization."
        badge="Multi-Model Engine"
        actionButton={
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh Intelligence</span>
          </button>
        }
      />

      {/* Stock Context Selector */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Active Asset Focus:
          </span>
          {['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'].map((sym) => (
            <button
              key={sym}
              onClick={() => setActiveStock(sym)}
              className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition-all ${
                activeStock === sym
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          {[
            { id: 'insights', label: 'Synthesized Insights' },
            { id: 'models', label: 'Model Benchmarks' },
            { id: 'explainability', label: 'Academic Explainability' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonChart />
        </div>
      ) : error ? (
        <ErrorState
          title="Analytical Synthesis Error"
          message={error}
          onRetry={() => loadAllIntelligence(activeStock)}
        />
      ) : (
        <>
          {/* Executive Synthesis Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardCard
              title="Portfolio Valuation"
              value={portfolioAnalytics ? formatCurrency(portfolioAnalytics.currentValue) : '--'}
              change={portfolioAnalytics ? `${(portfolioAnalytics.totalGainPercentage || 0) >= 0 ? '+' : ''}${(portfolioAnalytics.totalGainPercentage || 0).toFixed(2)}%` : 'No portfolio'}
              changeType={(portfolioAnalytics?.totalGainPercentage || 0) >= 0 ? 'positive' : 'negative'}
              changeLabel="net return"
              icon={TrendingUp}
              iconColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            />

            <DashboardCard
              title="Sharpe Ratio (Annualized)"
              value={riskData ? riskData.sharpeRatio.toFixed(2) : '--'}
              change={riskData ? `${riskData.annualizedVolatility.toFixed(1)}% vol` : '--'}
              changeType={(riskData?.sharpeRatio || 0) > 0.8 ? 'positive' : 'neutral'}
              changeLabel="risk-adjusted"
              icon={Shield}
              iconColor="text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
            />

            <DashboardCard
              title={`${activeStock} FinBERT Sentiment`}
              value={sentimentData?.overall_sentiment || 'Neutral'}
              change={sentimentData ? `${sentimentData.overall_sentiment_score >= 0 ? '+' : ''}${sentimentData.overall_sentiment_score}` : '--'}
              changeType={sentimentData?.overall_sentiment?.toLowerCase().includes('bullish') ? 'positive' : sentimentData?.overall_sentiment?.toLowerCase().includes('bearish') ? 'negative' : 'neutral'}
              changeLabel="compound tone"
              icon={Newspaper}
              iconColor="text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
            />

            <DashboardCard
              title="Optimization Scenario"
              value={optimizationData ? `${optimizationData.expected_return}%` : '--'}
              change={optimizationData ? `Sharpe ${optimizationData.sharpe_ratio}` : '--'}
              changeType="positive"
              changeLabel="expected return"
              icon={Sliders}
              iconColor="text-purple-400 bg-purple-500/10 border-purple-500/20"
            />
          </div>

          {/* TAB 1: Synthesized Factual Insights */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedInsights.map((insight) => {
                  const Icon = insight.icon;
                  const borderClass =
                    insight.color === 'emerald'
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : insight.color === 'rose'
                      ? 'border-rose-500/30 bg-rose-500/5'
                      : insight.color === 'amber'
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : insight.color === 'purple'
                      ? 'border-purple-500/30 bg-purple-500/5'
                      : 'border-slate-800 bg-slate-900/60';

                  const badgeClass =
                    insight.color === 'emerald'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : insight.color === 'rose'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : insight.color === 'amber'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : insight.color === 'purple'
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';

                  return (
                    <div
                      key={insight.id}
                      className={`p-5 rounded-2xl border transition-all hover:border-slate-700 flex flex-col justify-between ${borderClass}`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${badgeClass}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {insight.category}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-400">
                            {insight.metricLabel}: <span className="text-white">{insight.metricValue}</span>
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white">
                          {insight.title}
                        </h4>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {insight.description}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Factual calculation</span>
                        <span className="font-mono">Zero lookahead bias</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Model Benchmarks & Comparison */}
          {activeTab === 'models' && mlData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {Object.entries(mlData.evaluations || {}).map(([mType, ev]) => {
                  const mName = mType === 'xgboost' ? 'XGBoost Regressor' : mType === 'random_forest' ? 'Random Forest Regressor' : 'Linear Regression';
                  const pred = mlData.predictions?.[mType] || {};

                  return (
                    <div key={mType} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-indigo-400" />
                          {mName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                          pred.predicted_direction === 'UP' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          Next Return: {pred.predicted_direction}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                          <span className="text-slate-400">Test RMSE:</span>
                          <span className="font-mono font-bold text-white">{ev.rmse}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                          <span className="text-slate-400">Test MAE:</span>
                          <span className="font-mono font-bold text-white">{ev.mae}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                          <span className="text-slate-400">R-Squared (R²):</span>
                          <span className="font-mono font-bold text-indigo-400">{ev.r2}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                          <span className="text-slate-400">Directional Accuracy:</span>
                          <span className="font-mono font-bold text-emerald-400">{ev.directional_accuracy}%</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                        {pred.disclaimer || 'Experimental trend direction.'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Academic Explainability & Metadata */}
          {activeTab === 'explainability' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold text-white">
                    Research Methodology &amp; Mathematical Specifications
                  </h3>
                </div>

                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <span className="font-bold text-white uppercase text-[11px] tracking-wider block">
                      1. Time-Series Chronological Train/Test Split
                    </span>
                    <p className="text-slate-400">
                      Standard 80/20 chronological time-series split with strict chronological preservation (zero k-fold leakage or lookahead bias).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <span className="font-bold text-white uppercase text-[11px] tracking-wider block">
                      2. Feature Engineering Pipeline
                    </span>
                    <p className="text-slate-400">
                      Engineered variables: Daily Return, SMA-20, SMA-50, 20-Day Rolling Volatility, 14-Day RSI, and 10-Day Price Momentum.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <span className="font-bold text-white uppercase text-[11px] tracking-wider block">
                      3. Modern Portfolio Theory (Markowitz 1952)
                    </span>
                    <p className="text-slate-400">
                      Mean-variance convex quadratic programming solved via SciPy SLSQP with Karush-Kuhn-Tucker (KKT) equality and boundary constraints.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-bold text-white">
                    Model Provenance &amp; Verification Card
                  </h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">ML Framework:</span>
                    <span className="font-mono font-bold text-white">scikit-learn + XGBoost</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">NLP Architecture:</span>
                    <span className="font-mono font-bold text-white">FinBERT (`ProsusAI/finbert`)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Optimization Solver:</span>
                    <span className="font-mono font-bold text-white">SciPy SLSQP Quadratic Solver</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Analysis Lookback:</span>
                    <span className="font-mono font-bold text-indigo-400">1 Year - 2 Years Daily OHLCV</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Calculation Timestamp:</span>
                    <span className="font-mono font-bold text-slate-300">{new Date().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Academic Disclaimer */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Academic &amp; Research Disclaimer
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                AI Insights are algorithmic and statistical summaries generated from historical market data and machine learning models for educational decision-support. They do not constitute financial advice, guaranteed predictions, or investment recommendations.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIInsightsPage;
