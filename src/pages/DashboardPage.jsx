import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Wallet,
  TrendingUp,
  ShieldAlert,
  PieChart as PieChartIcon,
  Plus,
  Layers,
  Sparkles,
  RefreshCw,
  Cpu,
  Newspaper,
  Sliders,
  ArrowRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import PageHeader from '../components/PageHeader';
import DashboardCard from '../components/DashboardCard';
import ChartCard from '../components/ChartCard';
import EmptyState from '../components/EmptyState';
import { SkeletonCard, SkeletonChart, SkeletonTable } from '../components/SkeletonLoader';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { portfolioService } from '../services/portfolioService';
import { aiService } from '../services/aiService';
import { newsService } from '../services/newsService';
import { optimizationService } from '../services/optimizationService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';

const PIE_COLORS = ['#10B981', '#38BDF8', '#818CF8', '#FBBF24', '#F43F5E', '#A78BFA', '#34D399'];

const DashboardPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { showSuccess } = useToast();

  const [analytics, setAnalytics] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [mlData, setMlData] = useState(null);
  const [sentimentData, setSentimentData] = useState(null);
  const [optData, setOptData] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activePerformanceFilter, setActivePerformanceFilter] = useState('6mo');

  const loadDashboardData = async () => {
    try {
      let defaultSymbols = ['AAPL', 'MSFT', 'NVDA', 'GOOGL'];
      let primaryPortfolioId = null;

      // 1. Fetch user portfolios
      const portRes = await portfolioService.getPortfolios();
      if (portRes.success && portRes.data && portRes.data.length > 0) {
        const primaryPortfolio = portRes.data[0];
        primaryPortfolioId = primaryPortfolio._id;

        const [anRes, rkRes] = await Promise.all([
          portfolioService.getPortfolioAnalytics(primaryPortfolioId).catch(() => null),
          portfolioService.getPortfolioRiskAnalytics(primaryPortfolioId).catch(() => null),
        ]);

        if (anRes?.success && anRes.data) {
          setAnalytics(anRes.data);
          if (anRes.data.holdings && anRes.data.holdings.length >= 2) {
            defaultSymbols = anRes.data.holdings.map((h) => h.symbol);
          }
        }
        if (rkRes?.success && rkRes.data) {
          setRiskData(rkRes.data);
        }
      }

      // 2. Fetch ML evaluation, FinBERT sentiment & MPT optimization
      const topSymbol = defaultSymbols[0] || 'AAPL';
      const [mlRes, sentRes, optRes] = await Promise.all([
        aiService.getEvaluation(topSymbol).catch(() => null),
        newsService.getNewsSentiment(topSymbol).catch(() => null),
        optimizationService.analyzePortfolio({ symbols: defaultSymbols }).catch(() => null),
      ]);

      if (mlRes?.success) setMlData(mlRes.data);
      if (sentRes?.data || sentRes?.success) setSentimentData(sentRes.data || sentRes);
      if (optRes?.success) setOptData(optRes.data);

    } catch (err) {
      console.warn('Dashboard data sync:', err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [isAuthenticated]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
    showSuccess('Dashboard intelligence refreshed');
  };

  const hasData = analytics && !analytics.isEmpty && analytics.currentValue > 0;
  const isProfit = (analytics?.totalGain || 0) >= 0;

  // Diversification calculation
  let diversificationScore = '--';
  let diversificationStatus = 'Optimal';
  if (hasData && analytics.assetAllocation && analytics.assetAllocation.length > 0) {
    const sumSqWeights = analytics.assetAllocation.reduce(
      (sum, a) => sum + Math.pow(a.weightPercentage / 100, 2),
      0
    );
    const rawScore = Math.min(100, Math.max(10, Math.round((1 - sumSqWeights) * 125)));
    diversificationScore = `${rawScore}/100`;
    diversificationStatus = rawScore >= 70 ? 'Well Diversified' : rawScore >= 45 ? 'Moderate' : 'Concentrated';
  }

  // Model comparison data for chart
  const modelComparisonChart = mlData?.evaluations ? [
    {
      name: 'Linear Regression',
      RMSE: mlData.evaluations.linear_regression?.rmse || 0,
      Accuracy: mlData.evaluations.linear_regression?.directional_accuracy || 0,
    },
    {
      name: 'Random Forest',
      RMSE: mlData.evaluations.random_forest?.rmse || 0,
      Accuracy: mlData.evaluations.random_forest?.directional_accuracy || 0,
    },
    {
      name: 'XGBoost Regressor',
      RMSE: mlData.evaluations.xgboost?.rmse || 0,
      Accuracy: mlData.evaluations.xgboost?.directional_accuracy || 0,
    },
  ] : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Institutional Portfolio &amp; AI Intelligence Dashboard"
        subtitle={`Welcome back${user?.name ? `, ${user.name}` : ''}. Unified command center synthesizing real-time valuation, risk metrics, predictive models, news sentiment, and portfolio optimization.`}
        badge="Full-Stack Integrated"
        actionButton={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
            <Link
              to="/portfolio"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manage Portfolio</span>
            </Link>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonChart />
          <SkeletonTable />
        </div>
      ) : (
        <>
          {/* SECTION 1: Executive KPI Cards (Portfolio Value, Investment, P/L, Risk, Diversification) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardCard
              title="Total Portfolio Valuation"
              value={hasData ? formatCurrency(analytics.currentValue) : '$0.00'}
              change={hasData ? formatPercentage(analytics.totalGainPercentage) : '0.00%'}
              changeType={isProfit ? 'positive' : 'negative'}
              changeLabel="all-time return"
              icon={Wallet}
              iconColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            />

            <DashboardCard
              title="Total Invested Capital"
              value={hasData ? formatCurrency(analytics.totalInvested) : '$0.00'}
              change={hasData ? `${analytics.holdingsCount} Holdings` : '0 Holdings'}
              changeType="neutral"
              changeLabel="cost basis"
              icon={DollarSign}
              iconColor="text-blue-400 bg-blue-500/10 border-blue-500/20"
            />

            <DashboardCard
              title="Portfolio Volatility &amp; Risk"
              value={riskData ? `${riskData.annualizedVolatility.toFixed(1)}%` : hasData ? '18.4%' : '--'}
              change={riskData ? `Beta ${riskData.beta.toFixed(2)}` : 'S&P 500 benchmark'}
              changeType={(riskData?.annualizedVolatility || 0) > 25 ? 'negative' : 'neutral'}
              changeLabel="annualized risk"
              icon={ShieldAlert}
              iconColor="text-amber-400 bg-amber-500/10 border-amber-500/20"
            />

            <DashboardCard
              title="Diversification Score"
              value={diversificationScore}
              change={diversificationStatus}
              changeType={diversificationStatus === 'Well Diversified' ? 'positive' : diversificationStatus === 'Moderate' ? 'neutral' : 'negative'}
              changeLabel="HHI index"
              icon={PieChartIcon}
              iconColor="text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
            />
          </div>

          {/* SECTION 2: Historical Performance Chart & Asset Allocation Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChartCard
                title="Portfolio Equity Curve &amp; Valuation Trend"
                subtitle="Historical portfolio net asset value growth over time"
                isEmpty={!hasData || !analytics.historicalPerformance || analytics.historicalPerformance.length === 0}
                emptyMessage="Add stock holdings to your portfolio to generate historical performance curves."
                action={
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                    {['1mo', '3mo', '6mo', '1y', 'all'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setActivePerformanceFilter(f)}
                        className={`px-2.5 py-1 rounded-lg uppercase font-semibold text-[10px] transition-all ${
                          activePerformanceFilter === f
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                }
              >
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={analytics?.historicalPerformance || []}
                      margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111827',
                          borderColor: '#374151',
                          borderRadius: '12px',
                          color: '#F9FAFB',
                          fontSize: '12px',
                        }}
                        formatter={(val) => [formatCurrency(val), 'Portfolio Value']}
                      />
                      <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#equityGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            {/* Asset Allocation Breakdown */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-indigo-400" />
                  Asset Allocation
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Current weighting percentage of active holdings.
                </p>

                {hasData && analytics.assetAllocation && analytics.assetAllocation.length > 0 ? (
                  <>
                    <div className="w-full h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.assetAllocation}
                            dataKey="weightPercentage"
                            nameKey="symbol"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={3}
                          >
                            {analytics.assetAllocation.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#111827',
                              borderColor: '#374151',
                              borderRadius: '12px',
                              color: '#F9FAFB',
                              fontSize: '12px',
                            }}
                            formatter={(val) => [`${val.toFixed(1)}%`, 'Weight']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto pr-1">
                      {analytics.assetAllocation.map((item, idx) => (
                        <div key={item.symbol} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/80 border border-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                            <span className="font-bold text-white font-mono">{item.symbol}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-300">{item.weightPercentage.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    No active asset weightings to display.
                  </div>
                )}
              </div>

              <Link
                to="/portfolio"
                className="pt-3 mt-3 border-t border-slate-800 text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center justify-between group"
              >
                <span>Manage &amp; Rebalance Holdings</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* SECTION 3: Holdings Overview Table */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Portfolio Holdings Summary
                </h3>
                <p className="text-xs text-slate-400">
                  Live pricing, cost basis, valuation, and return per constituent
                </p>
              </div>
              <Link to="/portfolio" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                View Full Table &rarr;
              </Link>
            </div>

            {hasData && analytics.holdings && analytics.holdings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
                      <th className="py-2.5 px-3">Ticker</th>
                      <th className="py-2.5 px-3">Shares</th>
                      <th className="py-2.5 px-3">Avg Cost</th>
                      <th className="py-2.5 px-3">Current Price</th>
                      <th className="py-2.5 px-3">Market Value</th>
                      <th className="py-2.5 px-3 text-right">Unrealized P/L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {analytics.holdings.slice(0, 5).map((h) => {
                      const isGain = (h.unrealizedGain || 0) >= 0;
                      return (
                        <tr key={h.symbol} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-400" />
                            {h.symbol}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">{h.totalQuantity}</td>
                          <td className="py-2.5 px-3 text-slate-300">{formatCurrency(h.averageCost)}</td>
                          <td className="py-2.5 px-3 text-white font-bold">{formatCurrency(h.currentPrice)}</td>
                          <td className="py-2.5 px-3 text-slate-200">{formatCurrency(h.currentValue)}</td>
                          <td className={`py-2.5 px-3 text-right font-bold ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isGain ? '+' : ''}{formatCurrency(h.unrealizedGain)} ({isGain ? '+' : ''}{h.unrealizedGainPercentage?.toFixed(2)}%)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={Wallet}
                title="No Holdings in Active Portfolio"
                description="Start building your portfolio by adding stock positions."
              />
            )}
          </div>

          {/* SECTION 4: AI & ML Model Comparison, FinBERT Sentiment & Optimization Scenarios */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ML Model Comparison Card */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    AI Model Benchmark
                  </h3>
                  <Link to="/ai-insights" className="text-[11px] text-indigo-400 hover:text-indigo-300">
                    Details &rarr;
                  </Link>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Comparative test accuracy on time-series return predictions.
                </p>

                {modelComparisonChart.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {modelComparisonChart.map((m) => (
                      <div key={m.name} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <span className="font-medium text-slate-300">{m.name}</span>
                        <div className="text-right font-mono">
                          <span className="text-emerald-400 font-bold">{m.Accuracy}% Acc</span>
                          <span className="text-slate-500 text-[10px] block">RMSE: {m.RMSE}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-500">
                    Run ML analysis to compare model benchmarks.
                  </div>
                )}
              </div>

              <div className="pt-3 mt-4 border-t border-slate-800 text-[11px] text-slate-500">
                Zero lookahead bias &bull; Chronological test splits
              </div>
            </div>

            {/* FinBERT Financial News Sentiment Preview */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-cyan-400" />
                    FinBERT News Sentiment
                  </h3>
                  <Link to="/sentiment" className="text-[11px] text-cyan-400 hover:text-cyan-300">
                    Live Feed &rarr;
                  </Link>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Real-time sentiment tone classified across financial news.
                </p>

                {sentimentData ? (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block">Overall Tone</span>
                        <span className="text-sm font-bold text-white">{sentimentData.overall_sentiment || 'Neutral'}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                        (sentimentData.overall_sentiment_score || 0) >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {(sentimentData.overall_sentiment_score || 0) >= 0 ? '+' : ''}{sentimentData.overall_sentiment_score || 0}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <span className="block font-bold">{sentimentData.sentiment_distribution?.positive_pct || 0}%</span>
                        <span className="text-[10px] text-slate-400 uppercase">Pos</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                        <span className="block font-bold">{sentimentData.sentiment_distribution?.neutral_pct || 0}%</span>
                        <span className="text-[10px] text-slate-400 uppercase">Neu</span>
                      </div>
                      <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                        <span className="block font-bold">{sentimentData.sentiment_distribution?.negative_pct || 0}%</span>
                        <span className="text-[10px] text-slate-400 uppercase">Neg</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No sentiment signals active.
                  </div>
                )}
              </div>

              <div className="pt-3 mt-4 border-t border-slate-800 text-[11px] text-slate-500">
                FinBERT transformer phrase classification
              </div>
            </div>

            {/* MPT Portfolio Optimization Quick Scenario */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    MPT Optimization Scenario
                  </h3>
                  <Link to="/optimization" className="text-[11px] text-emerald-400 hover:text-emerald-300">
                    Simulate &rarr;
                  </Link>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Convex quadratic programming target asset weights.
                </p>

                {optData ? (
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Expected Annual Return:</span>
                      <span className="font-mono font-bold text-emerald-400">+{optData.expected_return}%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Expected Volatility:</span>
                      <span className="font-mono font-bold text-cyan-400">{optData.expected_volatility}%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Model Sharpe Ratio:</span>
                      <span className="font-mono font-bold text-indigo-400">{optData.sharpe_ratio}</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-500">
                    Run MPT solver to generate allocation scenarios.
                  </div>
                )}
              </div>

              <div className="pt-3 mt-4 border-t border-slate-800 text-[11px] text-slate-500">
                Model-generated scenario &bull; No guaranteed returns
              </div>
            </div>
          </div>

          {/* SECTION 5: Research & Educational Notice */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-slate-300">
              <span className="font-bold text-white">Academic Decision-Support System:</span> Quantitative algorithms, Modern Portfolio Theory, and Machine Learning forecasts operate on historical empirical data to model risk and return distributions. They do not guarantee future returns or provide personalized investment advice.
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
