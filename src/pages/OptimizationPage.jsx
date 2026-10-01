import React, { useState, useEffect } from 'react';
import {
  Sliders,
  TrendingUp,
  Shield,
  Zap,
  Play,
  CheckCircle2,
  PieChart as PieIcon,
  ScatterChart as ScatterIcon,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  Legend,
} from 'recharts';
import PageHeader from '../components/PageHeader';
import ChartCard from '../components/ChartCard';
import DashboardCard from '../components/DashboardCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { optimizationService } from '../services/optimizationService';

const PRESET_BASKETS = [
  { name: 'Tech Leaders', symbols: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN'] },
  { name: 'Mega-Cap 3-Stock', symbols: ['AAPL', 'MSFT', 'NVDA'] },
  { name: 'Dual Asset Baseline', symbols: ['AAPL', 'MSFT'] },
  { name: 'Diversified Multi-Sector', symbols: ['AAPL', 'JPM', 'JNJ', 'XOM', 'PG'] },
  { name: 'High-Beta Growth', symbols: ['NVDA', 'TSLA', 'AMD', 'META'] },
];

const COLORS = ['#10B981', '#6366F1', '#38BDF8', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6', '#F43F5E'];

const OptimizationPage = () => {
  const [symbolsInput, setSymbolsInput] = useState('AAPL, MSFT, NVDA, GOOGL');
  const [symbolList, setSymbolList] = useState(['AAPL', 'MSFT', 'NVDA', 'GOOGL']);
  const [period, setPeriod] = useState('1y');
  const [riskPreference, setRiskPreference] = useState('max_sharpe'); // max_sharpe | min_volatility | balanced
  const [minWeight, setMinWeight] = useState(0.0);
  const [maxWeight, setMaxWeight] = useState(1.0);
  
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState(null);
  const [optimizationResult, setOptimizationResult] = useState(null);

  const handleOptimize = async (symbolsToRun = symbolList) => {
    if (!symbolsToRun || symbolsToRun.length < 2) {
      setError('Please provide at least 2 distinct stock symbols for portfolio optimization.');
      return;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      const res = await optimizationService.analyzePortfolio({
        symbols: symbolsToRun,
        period,
        risk_preference: riskPreference,
        min_weight: minWeight,
        max_weight: maxWeight,
      });

      if (res.success && res.data) {
        setOptimizationResult(res.data);
      } else {
        throw new Error(res.message || 'Optimization failed');
      }
    } catch (err) {
      console.error('Optimization error:', err);
      setError(err.message || 'Failed to compute portfolio optimization. Please verify stock symbols and try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Initial load
  useEffect(() => {
    handleOptimize(['AAPL', 'MSFT', 'NVDA', 'GOOGL']);
  }, []);

  const handleApplyPreset = (presetSymbols) => {
    setSymbolList(presetSymbols);
    setSymbolsInput(presetSymbols.join(', '));
    handleOptimize(presetSymbols);
  };

  const handleSymbolsSubmit = (e) => {
    e.preventDefault();
    const parsed = symbolsInput
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);
    
    // Deduplicate
    const unique = [...new Set(parsed)];
    if (unique.length < 2) {
      setError('Please enter at least 2 unique stock ticker symbols (e.g. AAPL, MSFT, NVDA).');
      return;
    }
    setSymbolList(unique);
    setSymbolsInput(unique.join(', '));
    handleOptimize(unique);
  };

  const handleRemoveTicker = (ticker) => {
    if (symbolList.length <= 2) {
      setError('At least 2 symbols are required for MPT optimization.');
      return;
    }
    const next = symbolList.filter((s) => s !== ticker);
    setSymbolList(next);
    setSymbolsInput(next.join(', '));
    handleOptimize(next);
  };

  // Prepare Chart Data
  const recommendedWeights = optimizationResult?.recommended_weights || {};
  const currentWeights = optimizationResult?.current_portfolio?.weights || {};
  const assetStats = optimizationResult?.asset_statistics || [];

  const comparisonChartData = (optimizationResult?.symbols || symbolList).map((sym) => ({
    symbol: sym,
    'Current %': Math.round((currentWeights[sym] || (1 / symbolList.length)) * 1000) / 10,
    'Optimized Scenario %': Math.round((recommendedWeights[sym] || 0) * 1000) / 10,
  }));

  const pieData = Object.entries(recommendedWeights)
    .filter(([, w]) => w > 0.005)
    .map(([sym, w], index) => ({
      name: sym,
      value: Math.round(w * 1000) / 10,
      color: COLORS[index % COLORS.length],
    }));

  const frontierPoints = (optimizationResult?.efficient_frontier || []).map((p) => ({
    x: p.volatility,
    y: p.expected_return,
    sharpe: p.sharpe_ratio,
  }));

  const simulatedPoints = (optimizationResult?.simulated_portfolios || []).map((p) => ({
    x: p.volatility,
    y: p.expected_return,
    sharpe: p.sharpe_ratio,
  }));

  const optPoint = optimizationResult ? [{
    x: optimizationResult.expected_volatility,
    y: optimizationResult.expected_return,
    name: 'Optimized Scenario',
  }] : [];

  const currPoint = optimizationResult?.current_portfolio ? [{
    x: optimizationResult.current_portfolio.expected_volatility,
    y: optimizationResult.current_portfolio.expected_return,
    name: 'Current Portfolio',
  }] : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Modern Portfolio Theory (MPT) Optimization"
        subtitle="Mathematical mean-variance convex quadratic programming to model risk-adjusted asset allocations along the Efficient Frontier."
        badge="Markowitz MPT Core"
        actionButton={
          <button
            onClick={() => handleOptimize(symbolList)}
            disabled={isOptimizing}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
          >
            <Play className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Computing Solvers...' : 'Run Optimization'}</span>
          </button>
        }
      />

      {/* Preset Baskets & Custom Input */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Preset Asset Baskets:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_BASKETS.map((b) => (
                <button
                  key={b.name}
                  onClick={() => handleApplyPreset(b.symbols)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>{b.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({b.symbols.length})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Symbols Form */}
          <form onSubmit={handleSymbolsSubmit} className="w-full lg:w-96">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Customize Stock Universe (Comma-Separated):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={symbolsInput}
                onChange={(e) => setSymbolsInput(e.target.value)}
                placeholder="e.g. AAPL, MSFT, NVDA, AMZN"
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              <button
                type="submit"
                disabled={isOptimizing}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
              >
                Apply
              </button>
            </div>
          </form>
        </div>

        {/* Selected Ticker Badges */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Selected Assets ({symbolList.length}):</span>
          {symbolList.map((sym) => (
            <span
              key={sym}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold font-mono"
            >
              {sym}
              <button
                onClick={() => handleRemoveTicker(sym)}
                className="text-slate-400 hover:text-rose-400 transition-colors"
                title="Remove"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Constraints & Strategy Selector */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
        <div>
          <h3 className="text-base font-bold text-white mb-1">
            Optimization Objective &amp; Convex Solver Constraints
          </h3>
          <p className="text-xs text-slate-400">
            Define risk preference and portfolio allocation boundary conditions ($w_{'{'}min{'}'} \le w_i \le w_{'{'}max{'}'}$, $\sum w_i = 100\%$).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => {
              setRiskPreference('max_sharpe');
              handleOptimize(symbolList);
            }}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              riskPreference === 'max_sharpe'
                ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Max Sharpe Ratio
              </span>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tangency portfolio scenario maximizing historical risk-adjusted excess return per unit of volatility.
            </p>
          </div>

          <div
            onClick={() => {
              setRiskPreference('min_volatility');
              handleOptimize(symbolList);
            }}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              riskPreference === 'min_volatility'
                ? 'bg-cyan-500/10 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Minimum Volatility
              </span>
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Global Minimum Variance (GMV) scenario minimizing overall portfolio variance.
            </p>
          </div>

          <div
            onClick={() => {
              setRiskPreference('balanced');
              handleOptimize(symbolList);
            }}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              riskPreference === 'balanced'
                ? 'bg-indigo-500/10 border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Balanced Scenario
              </span>
              <Sliders className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Equilibrium scenario balancing maximum Sharpe growth and downside variance containment.
            </p>
          </div>
        </div>

        {/* Sliders & Constraints */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Historical Lookback Period
              </label>
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase">{period}</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {['6mo', '1y', '2y', '5y'].map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p);
                    handleOptimize(symbolList);
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg uppercase transition-all ${
                    period === p
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Min Allocation per Asset (w_min)
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {Math.round(minWeight * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.20"
              step="0.01"
              value={minWeight}
              onChange={(e) => setMinWeight(parseFloat(e.target.value))}
              onMouseUp={() => handleOptimize(symbolList)}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0% (Allow 0 weight)</span>
              <span>20% max bound</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Max Allocation per Asset (w_max)
              </label>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {Math.round(maxWeight * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.30"
              max="1.0"
              step="0.05"
              value={maxWeight}
              onChange={(e) => setMaxWeight(parseFloat(e.target.value))}
              onMouseUp={() => handleOptimize(symbolList)}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>30% cap</span>
              <span>100% (No single asset cap)</span>
            </div>
          </div>
        </div>
      </div>

      {isOptimizing ? (
        <LoadingState
          message="Executing Markowitz Convex Quadratic Optimization..."
          subtext="Calculating covariance matrix, annualized returns, and solving SLSQP Karush-Kuhn-Tucker constraints"
        />
      ) : error ? (
        <ErrorState
          title="Optimization Calculation Error"
          message={error}
          onRetry={() => handleOptimize(symbolList)}
        />
      ) : optimizationResult ? (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardCard
              title="Expected Annual Return E[R_p]"
              value={`${optimizationResult.expected_return}%`}
              change={`${(optimizationResult.expected_return - (optimizationResult.current_portfolio?.expected_return || 0)).toFixed(1)}%`}
              changeType={optimizationResult.expected_return >= (optimizationResult.current_portfolio?.expected_return || 0) ? 'positive' : 'negative'}
              changeLabel="vs equal weight baseline"
              icon={TrendingUp}
              iconColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            />

            <DashboardCard
              title="Expected Annual Volatility σ_p"
              value={`${optimizationResult.expected_volatility}%`}
              change={`${(optimizationResult.expected_volatility - (optimizationResult.current_portfolio?.expected_volatility || 0)).toFixed(1)}%`}
              changeType={optimizationResult.expected_volatility <= (optimizationResult.current_portfolio?.expected_volatility || 0) ? 'positive' : 'negative'}
              changeLabel="risk exposure"
              icon={Shield}
              iconColor="text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
            />

            <DashboardCard
              title="Model Sharpe Ratio"
              value={optimizationResult.sharpe_ratio}
              change={`${(optimizationResult.sharpe_ratio - (optimizationResult.current_portfolio?.sharpe_ratio || 0)).toFixed(2)}`}
              changeType={optimizationResult.sharpe_ratio >= (optimizationResult.current_portfolio?.sharpe_ratio || 0) ? 'positive' : 'negative'}
              changeLabel="excess return / risk"
              icon={Zap}
              iconColor="text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
            />

            <DashboardCard
              title="Total Portfolio Allocation"
              value="100.0%"
              change={`${optimizationResult.num_assets} Assets`}
              changeType="neutral"
              changeLabel="fully invested"
              icon={CheckCircle2}
              iconColor="text-purple-400 bg-purple-500/10 border-purple-500/20"
            />
          </div>

          {/* Allocation Comparison & Efficient Frontier */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Comparison Chart */}
            <div className="lg:col-span-2">
              <ChartCard
                title="Current vs. Model-Generated Allocation Scenario"
                subtitle="Side-by-side asset weightings comparison based on Mean-Variance SLSQP optimization"
              >
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comparisonChartData}
                      margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                      <XAxis dataKey="symbol" stroke="#94A3B8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111827',
                          borderColor: '#374151',
                          borderRadius: '12px',
                          color: '#F9FAFB',
                          fontSize: '12px',
                        }}
                        formatter={(val) => [`${val}%`, '']}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                      />
                      <Bar dataKey="Current %" fill="#475569" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Optimized Scenario %" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            {/* Allocation Breakdown Donut */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-emerald-400" />
                  Target Scenario Weightings
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Optimal weight vector $w^*$ generated by SciPy quadratic programming.
                </p>

                <div className="w-full h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
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
                        formatter={(val) => [`${val}%`, 'Allocation']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 mt-2 max-h-40 overflow-y-auto pr-1">
                  {pieData.map((p) => (
                    <div key={p.name} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="font-bold text-white font-mono">{p.name}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400">{p.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
                $\sum w_i = 100\%$ &bull; Long-only convexity
              </div>
            </div>
          </div>

          {/* Markowitz Efficient Frontier Plot */}
          {frontierPoints.length > 0 && (
            <div className="glass-card rounded-2xl p-6 border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ScatterIcon className="w-5 h-5 text-indigo-400" />
                    Markowitz Efficient Frontier Curve &amp; Portfolio Space
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hyperbolic boundary of maximum return portfolios for each risk level vs Monte Carlo simulated random allocations
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    Target Scenario
                  </span>
                  <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    Efficient Frontier
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                    Simulations
                  </span>
                </div>
              </div>

              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="Volatility"
                      unit="%"
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      domain={['dataMin - 2', 'dataMax + 2']}
                      label={{ value: 'Portfolio Annualized Volatility σ_p (%)', position: 'insideBottom', offset: -10, fill: '#64748B', fontSize: 11 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Expected Return"
                      unit="%"
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      domain={['dataMin - 2', 'dataMax + 2']}
                      label={{ value: 'Expected Annual Return E[R_p] (%)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#374151',
                        borderRadius: '12px',
                        color: '#F9FAFB',
                        fontSize: '12px',
                      }}
                      formatter={(val, name) => [`${val}%`, name === 'x' ? 'Volatility' : 'Expected Return']}
                    />
                    <Scatter name="Random Portfolios" data={simulatedPoints} fill="#334155" opacity={0.5} shape="circle" />
                    <Scatter name="Efficient Frontier" data={frontierPoints} fill="#818CF8" shape="diamond" line={{ stroke: '#818CF8', strokeWidth: 2 }} />
                    <Scatter name="Optimized Scenario" data={optPoint} fill="#10B981" shape="star" size={150} />
                    <Scatter name="Current Portfolio" data={currPoint} fill="#F59E0B" shape="triangle" size={120} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Asset Statistics Table */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-1">
              Individual Asset Risk-Return Characteristics
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Historical annualized performance statistics and scenario weight allocation per constituent.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Stock Asset</th>
                    <th className="py-3 px-4">Annual Return $E[R]$</th>
                    <th className="py-3 px-4">Annual Volatility $\sigma$</th>
                    <th className="py-3 px-4">Individual Sharpe</th>
                    <th className="py-3 px-4">Current Weight</th>
                    <th className="py-3 px-4 text-right">Model Weight $w^*$</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {assetStats.map((asset) => (
                    <tr key={asset.symbol} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-white font-mono flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-400" />
                        {asset.symbol}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-400">
                        {asset.annualized_return_pct >= 0 ? '+' : ''}{asset.annualized_return_pct}%
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {asset.annualized_volatility_pct}%
                      </td>
                      <td className="py-3 px-4 font-mono text-indigo-300 font-bold">
                        {asset.sharpe_ratio}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {Math.round((asset.current_weight || 0) * 1000) / 10}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {Math.round((asset.recommended_weight || 0) * 1000) / 10}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mandatory Analytical Disclaimer Banner */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Model-Generated Allocation Scenario &bull; Academic Notice
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Model-generated allocation scenario. Modern Portfolio Theory (MPT) is a mathematical analytical framework based on historical covariance and return distributions. It does not guarantee future financial returns, eliminate market risk, or constitute personalized investment advice.
              </p>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={Sliders}
          title="No Optimization Scenario Loaded"
          description="Select stock assets and click 'Run Optimization' to execute the Markowitz MPT solver."
        />
      )}
    </div>
  );
};

export default OptimizationPage;
