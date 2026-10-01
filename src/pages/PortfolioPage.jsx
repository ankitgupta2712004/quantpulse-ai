import React, { useState, useEffect } from 'react';
import {
  Plus,
  Briefcase,
  Search,
  Filter,
  DollarSign,
  PieChart as PieChartIcon,
  X,
  Layers,
  TrendingUp,
  TrendingDown,
  FolderPlus,
  RefreshCw,
  Clock,
  Activity,
  Trash2,
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
import PortfolioTable from '../components/PortfolioTable';
import DashboardCard from '../components/DashboardCard';
import ChartCard from '../components/ChartCard';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';
import { portfolioService } from '../services/portfolioService';
import { useAuth } from '../hooks/useAuth';

const PIE_COLORS = ['#10B981', '#38BDF8', '#818CF8', '#FBBF24', '#F43F5E', '#A78BFA', '#34D399', '#FB7185'];

const PortfolioPage = () => {
  const { isAuthenticated } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [activePortfolio, setActivePortfolio] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNewPortfolioModalOpen, setIsNewPortfolioModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  // Form states
  const [newHolding, setNewHolding] = useState({
    symbol: '',
    quantity: '',
    averageBuyPrice: '',
    sector: 'Technology',
  });
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioDesc, setNewPortfolioDesc] = useState('');

  // Fetch portfolios on load
  const fetchPortfolios = async (preserveActiveId = null) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await portfolioService.getPortfolios();
      if (res.success && res.data) {
        setPortfolios(res.data);
        if (res.data.length > 0) {
          const targetId = preserveActiveId || (activePortfolio ? activePortfolio._id : res.data[0]._id);
          const current = res.data.find((p) => p._id === targetId) || res.data[0];
          setActivePortfolio(current);
          await loadPortfolioAnalytics(current._id);
        } else {
          setActivePortfolio(null);
          setAnalytics(null);
          setTransactions([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch portfolios:', err);
      setError(err.message || 'Failed to connect to backend database.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPortfolioAnalytics = async (portfolioId) => {
    try {
      const [analyticsRes, portDetailsRes] = await Promise.all([
        portfolioService.getPortfolioAnalytics(portfolioId),
        portfolioService.getPortfolioById(portfolioId).catch(() => ({ data: { transactions: [] } })),
      ]);

      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
      if (portDetailsRes.success && portDetailsRes.data) {
        setTransactions(portDetailsRes.data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load portfolio analytics:', err);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, [isAuthenticated]);

  const handleRefresh = async () => {
    if (!activePortfolio) return;
    setIsRefreshing(true);
    await loadPortfolioAnalytics(activePortfolio._id);
    setIsRefreshing(false);
  };

  const handleSelectPortfolio = async (portfolio) => {
    setActivePortfolio(portfolio);
    setIsLoading(true);
    await loadPortfolioAnalytics(portfolio._id);
    setIsLoading(false);
  };

  const handleCreatePortfolio = async (e) => {
    e.preventDefault();
    if (!newPortfolioName.trim()) return;

    try {
      const res = await portfolioService.createPortfolio({
        name: newPortfolioName.trim(),
        description: newPortfolioDesc.trim(),
      });
      if (res.success && res.data) {
        setIsNewPortfolioModalOpen(false);
        setNewPortfolioName('');
        setNewPortfolioDesc('');
        await fetchPortfolios(res.data._id);
      }
    } catch (err) {
      alert(err.message || 'Failed to create portfolio');
    }
  };

  const handleAddHolding = async (e) => {
    e.preventDefault();
    if (!activePortfolio || !newHolding.symbol || !newHolding.quantity || !newHolding.averageBuyPrice) return;

    try {
      const res = await portfolioService.addHolding(activePortfolio._id, {
        symbol: newHolding.symbol.toUpperCase(),
        quantity: parseFloat(newHolding.quantity),
        averageBuyPrice: parseFloat(newHolding.averageBuyPrice),
        sector: newHolding.sector,
      });

      if (res.success) {
        setIsAddModalOpen(false);
        setNewHolding({ symbol: '', quantity: '', averageBuyPrice: '', sector: 'Technology' });
        await loadPortfolioAnalytics(activePortfolio._id);
        const pRes = await portfolioService.getPortfolios();
        if (pRes.success) setPortfolios(pRes.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to add holding');
    }
  };

  const handleRemoveHolding = async (holdingId) => {
    if (!confirm('Are you sure you want to remove this asset from portfolio?')) return;
    try {
      await portfolioService.deleteHolding(holdingId);
      if (activePortfolio) {
        await loadPortfolioAnalytics(activePortfolio._id);
      }
    } catch (err) {
      alert(err.message || 'Failed to remove holding');
    }
  };

  const holdingsList = analytics?.holdingsWithLiveQuotes || [];
  const filteredHoldings = holdingsList.filter(
    (item) =>
      item.symbol.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (item.sector && item.sector.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  if (isLoading) {
    return <LoadingState message="Loading Live Portfolio Valuation..." subtext="Syncing MongoDB holdings with real-time market data" />;
  }

  if (error && portfolios.length === 0) {
    return <ErrorState title="Database Offline" message={error} onRetry={() => fetchPortfolios()} />;
  }

  const isProfit = (analytics?.totalGain || 0) >= 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Portfolio Valuation &amp; Asset Holdings"
        subtitle="Real-time aggregation of holdings, live market valuations, cost basis, and sector exposures."
        badge={activePortfolio ? activePortfolio.name : 'No Portfolio'}
        actionButton={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title="Refresh Live Market Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={() => setIsNewPortfolioModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
            >
              <FolderPlus className="w-4 h-4 text-cyan-400" />
              New Portfolio
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              disabled={!activePortfolio}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Asset
            </button>
          </div>
        }
      />

      {/* Portfolio Selector Tabs */}
      {portfolios.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2 shrink-0">
            Portfolios:
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
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-400">
                {p.holdingsCount || 0}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 4 Key Real Valuation Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Current Portfolio Value"
          value={analytics && !analytics.isEmpty ? formatCurrency(analytics.currentValue) : undefined}
          isPendingConnection={!analytics || analytics.isEmpty}
          change={analytics && !analytics.isEmpty ? `${analytics.dailyGain >= 0 ? '+' : ''}${formatCurrency(analytics.dailyGain)}` : undefined}
          changeType={analytics?.dailyGain >= 0 ? 'positive' : 'negative'}
          changeLabel="Today"
          icon={DollarSign}
          iconColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        />

        <DashboardCard
          title="Total Cost Basis (Invested)"
          value={analytics && !analytics.isEmpty ? formatCurrency(analytics.totalInvestment) : undefined}
          isPendingConnection={!analytics || analytics.isEmpty}
          description="Total acquisition capital deployed"
          icon={Briefcase}
          iconColor="text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
        />

        <DashboardCard
          title="Net Unrealized P/L"
          value={analytics && !analytics.isEmpty ? `${isProfit ? '+' : ''}${formatCurrency(analytics.totalGain)}` : undefined}
          isPendingConnection={!analytics || analytics.isEmpty}
          change={analytics && !analytics.isEmpty ? `${isProfit ? '+' : ''}${formatPercentage(analytics.totalGainPercentage)}` : undefined}
          changeType={isProfit ? 'positive' : 'negative'}
          changeLabel="Total Return"
          icon={isProfit ? TrendingUp : TrendingDown}
          iconColor={isProfit ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}
        />

        <DashboardCard
          title="Active Positions"
          value={holdingsList.length.toString()}
          description={`${analytics?.sectorAllocation?.length || 0} sectors represented`}
          icon={Layers}
          iconColor="text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
        />
      </div>

      {/* Charts Grid: Asset Allocation & Performance Trajectory */}
      {analytics && !analytics.isEmpty && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Historical Valuation Trajectory */}
          <div className="lg:col-span-2">
            <ChartCard
              title="Portfolio Historical Valuation Trajectory"
              subtitle="Aggregated daily historical portfolio value over past 6 months"
              isEmpty={!analytics.performanceHistory || analytics.performanceHistory.length === 0}
              emptyMessage="Historical valuation trajectory requires market price history."
            >
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.performanceHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => {
                        const parts = val.split('-');
                        return parts.length === 3 ? `${parts[1]}/${parts[2]}` : val;
                      }}
                    />
                    <YAxis
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      domain={['auto', 'auto']}
                      tickFormatter={(val) => `$${Number(val).toLocaleString()}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#374151',
                        borderRadius: '12px',
                        color: '#F9FAFB',
                        fontSize: '12px',
                      }}
                      formatter={(val) => [`$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Portfolio Value']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area type="monotone" dataKey="portfolioValue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Chart 2: Asset Allocation Donut */}
          <div>
            <ChartCard
              title="Asset Allocation Weight"
              subtitle="Weight breakdown by ticker value"
              isEmpty={!analytics.assetAllocation || analytics.assetAllocation.length === 0}
            >
              <div className="w-full h-64 flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.assetAllocation}
                      dataKey="weightPercentage"
                      nameKey="symbol"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
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
                      formatter={(val, name) => [`${val}%`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend Chips */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                  {analytics.assetAllocation.map((item, idx) => (
                    <div key={item.symbol} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="font-semibold">{item.symbol}</span>
                      <span className="text-slate-500">({item.weightPercentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter holdings by symbol or sector..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setIsTxModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Audit History ({transactions.length})</span>
          </button>
        </div>
      </div>

      {/* Holdings Table with Live Quotes */}
      <PortfolioTable
        holdings={filteredHoldings.map((h) => ({
          id: h.id,
          symbol: h.symbol,
          name: h.companyName,
          shares: h.quantity,
          avgCost: h.averageBuyPrice,
          currentPrice: h.currentPrice,
        }))}
        onRemoveHolding={handleRemoveHolding}
        onAddHoldingClick={() => setIsAddModalOpen(true)}
      />

      {/* Modal: Add New Asset */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-6 w-full max-w-md border border-slate-700 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white">Add Asset to {activePortfolio?.name}</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHolding} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ticker Symbol (e.g. AAPL, NVDA, MSFT, GOOGL)
                </label>
                <input
                  type="text"
                  required
                  value={newHolding.symbol}
                  onChange={(e) => setNewHolding({ ...newHolding, symbol: e.target.value })}
                  placeholder="AAPL"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Number of Shares
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newHolding.quantity}
                    onChange={(e) => setNewHolding({ ...newHolding, quantity: e.target.value })}
                    placeholder="10"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Average Buy Price ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newHolding.averageBuyPrice}
                    onChange={(e) => setNewHolding({ ...newHolding, averageBuyPrice: e.target.value })}
                    placeholder="175.50"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sector Classification
                </label>
                <select
                  value={newHolding.sector}
                  onChange={(e) => setNewHolding({ ...newHolding, sector: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Technology">Technology</option>
                  <option value="Semiconductors">Semiconductors</option>
                  <option value="Financials">Financials</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Consumer Cyclical">Consumer Cyclical</option>
                  <option value="Energy">Energy</option>
                  <option value="Communication">Communication</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
                >
                  Save to Portfolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create New Portfolio */}
      {isNewPortfolioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-6 w-full max-w-md border border-slate-700 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white">Create New Portfolio</h3>
              <button
                onClick={() => setIsNewPortfolioModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePortfolio} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Portfolio Name
                </label>
                <input
                  type="text"
                  required
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                  placeholder="e.g. AI &amp; Semi Growth"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newPortfolioDesc}
                  onChange={(e) => setNewPortfolioDesc(e.target.value)}
                  placeholder="Academic research allocation..."
                  rows="3"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewPortfolioModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
                >
                  Create Portfolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transactions History */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-6 w-full max-w-2xl border border-slate-700 shadow-2xl relative max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                Audit Log: {activePortfolio?.name} Transactions
              </h3>
              <button
                onClick={() => setIsTxModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No trade executions logged for this portfolio yet.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx._id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          tx.type === 'BUY'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {tx.type}
                      </span>
                      <span className="font-bold text-white font-mono">{tx.symbol}</span>
                      <span className="text-slate-400">{tx.quantity} shares</span>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-white font-medium">
                        @{formatCurrency(tx.price)} = {formatCurrency(tx.quantity * tx.price)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {formatDate(tx.transactionDate || tx.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;
