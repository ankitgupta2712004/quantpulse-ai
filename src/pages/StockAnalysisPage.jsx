import React, { useState, useEffect } from 'react';
import {
  Search,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Activity,
  Layers,
  Info,
  Calendar,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Plus,
  Building2,
  Globe,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import PageHeader from '../components/PageHeader';
import ChartCard from '../components/ChartCard';
import DashboardCard from '../components/DashboardCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { formatCurrency, formatPercentage, formatCompactNumber } from '../utils/formatters';
import { marketService } from '../services/marketService';
import { watchlistService } from '../services/watchlistService';
import { portfolioService } from '../services/portfolioService';
import { useAuth } from '../hooks/useAuth';

const popularStocks = ['AAPL', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'TSLA', 'META'];

const StockAnalysisPage = () => {
  const { isAuthenticated } = useAuth();
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [quote, setQuote] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [timeframe, setTimeframe] = useState('1y');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [error, setError] = useState(null);

  // Watchlist & Add Holding states
  const [watchlist, setWatchlist] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addQuantity, setAddQuantity] = useState('10');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');

  // Fetch Watchlist & Portfolios
  useEffect(() => {
    if (isAuthenticated) {
      watchlistService.getWatchlist().then((res) => {
        if (res.success && res.data) setWatchlist(res.data.map((w) => w.symbol));
      }).catch(() => {});

      portfolioService.getPortfolios().then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setPortfolios(res.data);
          setSelectedPortfolioId(res.data[0]._id);
        }
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  // Fetch Stock Data on Symbol Change
  const loadStockData = async (symbol) => {
    setIsLoading(true);
    setError(null);
    try {
      const [quoteRes, statsRes, histRes] = await Promise.all([
        marketService.getQuote(symbol),
        marketService.getCompanyStats(symbol).catch(() => null),
        marketService.getHistory(symbol, timeframe).catch(() => ({ data: [] })),
      ]);

      if (quoteRes.success && quoteRes.data) {
        setQuote(quoteRes.data);
      }
      if (statsRes && statsRes.success) {
        setStats(statsRes.data);
      }
      if (histRes && histRes.data) {
        setHistory(histRes.data);
      }
    } catch (err) {
      console.error('Failed to load stock data:', err);
      setError(err.message || `Unable to fetch market data for '${symbol}'`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStockData(selectedSymbol);
  }, [selectedSymbol]);

  // Change Timeframe
  const handleTimeframeChange = async (newRange) => {
    setTimeframe(newRange);
    setIsChartLoading(true);
    try {
      const histRes = await marketService.getHistory(selectedSymbol, newRange);
      if (histRes && histRes.data) {
        setHistory(histRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch history for range:', newRange, err);
    } finally {
      setIsChartLoading(false);
    }
  };

  // Search Autocomplete
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await marketService.searchSymbols(searchQuery);
        if (res.success && res.data) {
          setSearchResults(res.data);
        }
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchResult = (symbol) => {
    setSelectedSymbol(symbol);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleToggleWatchlist = async () => {
    if (!isAuthenticated) {
      alert('Please log in to manage your watchlist');
      return;
    }
    const sym = quote?.symbol || selectedSymbol;
    try {
      if (watchlist.includes(sym)) {
        await watchlistService.removeFromWatchlist(sym);
        setWatchlist(watchlist.filter((s) => s !== sym));
      } else {
        await watchlistService.addToWatchlist(sym);
        setWatchlist([...watchlist, sym]);
      }
    } catch (err) {
      console.error('Watchlist toggle error:', err);
    }
  };

  const handleAddHoldingToPortfolio = async (e) => {
    e.preventDefault();
    if (!selectedPortfolioId || !quote) return;

    try {
      await portfolioService.addHolding(selectedPortfolioId, {
        symbol: quote.symbol,
        quantity: parseFloat(addQuantity),
        averageBuyPrice: quote.price,
        sector: stats?.sector || 'Equities',
      });
      setIsAddModalOpen(false);
      alert(`Added ${addQuantity} shares of ${quote.symbol} at ${formatCurrency(quote.price)} to portfolio!`);
    } catch (err) {
      alert(err.message || 'Failed to add holding');
    }
  };

  const isBookmarked = watchlist.includes(quote?.symbol || selectedSymbol);
  const isPositive = quote ? quote.changePercent >= 0 : true;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Stock Technical &amp; Fundamental Market Analysis"
        subtitle="Live prices, valuation multiples, historical OHLCV chart, and portfolio allocation triggers."
        badge={quote?.currency ? `${quote.currency} &bull; ${quote.exchange}` : 'Live Market Feed'}
        actionButton={
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleWatchlist}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isBookmarked
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4 text-cyan-400" /> : <Bookmark className="w-4 h-4" />}
              <span>{isBookmarked ? 'In Watchlist' : 'Watchlist'}</span>
            </button>

            {portfolios.length > 0 && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add to Portfolio
              </button>
            )}
          </div>
        }
      />

      {/* Stock Search Bar & Popular Watchlist */}
      <div className="glass-card p-5 rounded-2xl relative space-y-4">
        <div className="relative">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company name or ticker (e.g. Apple, Microsoft, NVDA, TSLA, INFY)..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {isSearching && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              </div>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl glass-card border border-slate-700 shadow-2xl z-50 overflow-hidden divide-y divide-slate-800">
              {searchResults.map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => handleSelectSearchResult(item.symbol)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-800/80 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white font-mono text-sm">{item.symbol}</span>
                    <span className="text-xs text-slate-300 truncate max-w-xs">{item.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                    {item.exchange}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Ticker Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-medium mr-1">Popular Tickers:</span>
          {popularStocks.map((sym) => (
            <button
              key={sym}
              onClick={() => setSelectedSymbol(sym)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                selectedSymbol === sym
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState message={`Fetching Live Market Feed for ${selectedSymbol}...`} subtext="Retrieving real-time quotes, fundamentals, and historical OHLCV data" />
      ) : error ? (
        <ErrorState title="Market Feed Error" message={error} onRetry={() => loadStockData(selectedSymbol)} />
      ) : quote ? (
        <>
          {/* Selected Stock Overview Banner */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-extrabold text-white tracking-wide font-mono">
                  {quote.symbol}
                </h2>
                {stats?.sector && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                    {stats.sector}
                  </span>
                )}
                {stats?.industry && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60 hidden sm:inline-block">
                    {stats.industry}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300 mt-1 font-medium">{quote.companyName}</p>
            </div>

            <div className="flex items-baseline gap-4 md:text-right">
              <div>
                <div className="text-3xl lg:text-4xl font-extrabold text-white font-mono">
                  {formatCurrency(quote.price, quote.currency)}
                </div>
                <div
                  className={`text-xs sm:text-sm font-bold flex items-center gap-1 mt-0.5 md:justify-end ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{quote.change >= 0 ? '+' : ''}{formatCurrency(quote.change, quote.currency)}</span>
                  <span>({formatPercentage(quote.changePercent)})</span>
                  <span className="text-slate-500 font-normal ml-1">Today</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Fundamentals & Ratios */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="glass-card p-4 rounded-xl text-center">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Market Cap</div>
              <div className="text-sm font-bold text-white mt-1 font-mono">
                {quote.marketCap ? formatCompactNumber(quote.marketCap) : '--'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Valuation</div>
            </div>

            <div className="glass-card p-4 rounded-xl text-center">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">P/E Ratio</div>
              <div className="text-sm font-bold text-white mt-1 font-mono">
                {quote.peRatio ? quote.peRatio : '--'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Trailing 12M</div>
            </div>

            <div className="glass-card p-4 rounded-xl text-center">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Beta (5Y)</div>
              <div className="text-sm font-bold text-white mt-1 font-mono">
                {stats?.beta !== null && stats?.beta !== undefined ? stats.beta : '--'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">vs Market</div>
            </div>

            <div className="glass-card p-4 rounded-xl text-center">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">52W High</div>
              <div className="text-sm font-bold text-white mt-1 font-mono">
                {quote.fiftyTwoWeekHigh ? formatCurrency(quote.fiftyTwoWeekHigh) : '--'}
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-0.5">Year Peak</div>
            </div>

            <div className="glass-card p-4 rounded-xl text-center">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">52W Low</div>
              <div className="text-sm font-bold text-white mt-1 font-mono">
                {quote.fiftyTwoWeekLow ? formatCurrency(quote.fiftyTwoWeekLow) : '--'}
              </div>
              <div className="text-[10px] text-rose-400/80 mt-0.5">Year Trough</div>
            </div>

            <div className="glass-card p-4 rounded-xl text-center">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Dividend Yield</div>
              <div className="text-sm font-bold text-white mt-1 font-mono">
                {stats?.dividendYield || 'N/A'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Annualized</div>
            </div>
          </div>

          {/* Interactive Historical Price Chart (Recharts) */}
          <ChartCard
            title={`${quote.symbol} Price Action &amp; Trend Trajectory`}
            subtitle="Historical daily adjusted close prices from official market data provider"
            filters={['1mo', '3mo', '6mo', '1y', '5y']}
            activeFilter={timeframe}
            onFilterChange={handleTimeframeChange}
            isEmpty={history.length === 0}
            emptyMessage="No historical price bars returned for this range."
          >
            {isChartLoading ? (
              <div className="flex items-center justify-center h-64 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mr-2" />
                <span className="text-xs">Loading price series...</span>
              </div>
            ) : (
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.0} />
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
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#374151',
                        borderRadius: '12px',
                        color: '#F9FAFB',
                        fontSize: '12px',
                      }}
                      formatter={(val) => [`$${Number(val).toFixed(2)}`, 'Closing Price']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke={isPositive ? '#10b981' : '#f43f5e'}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPrice)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          {/* Company Profile & Business Summary */}
          {stats?.description && (
            <div className="glass-card p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider mb-3">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Company Overview &amp; Profile
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-h-36 overflow-y-auto pr-2">
                {stats.description}
              </p>
            </div>
          )}
        </>
      ) : null}

      {/* Modal: Quick Add to Portfolio */}
      {isAddModalOpen && quote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-6 w-full max-w-md border border-slate-700 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-1">
              Add {quote.symbol} to Portfolio
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Current market quote: <span className="text-emerald-400 font-bold font-mono">{formatCurrency(quote.price)}</span>
            </p>

            <form onSubmit={handleAddHoldingToPortfolio} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Destination Portfolio
                </label>
                <select
                  value={selectedPortfolioId}
                  onChange={(e) => setSelectedPortfolioId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {portfolios.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Quantity (Shares)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex justify-between">
                <span className="text-slate-400">Total Capital Required:</span>
                <span className="text-white font-bold font-mono">
                  {formatCurrency(parseFloat(addQuantity || 0) * quote.price)}
                </span>
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
                  Confirm Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAnalysisPage;
