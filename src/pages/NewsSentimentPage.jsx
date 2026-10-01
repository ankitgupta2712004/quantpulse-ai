import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Search,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  Filter,
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
} from 'recharts';
import PageHeader from '../components/PageHeader';
import DashboardCard from '../components/DashboardCard';
import ChartCard from '../components/ChartCard';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { newsService } from '../services/newsService';
import { useAuth } from '../hooks/useAuth';

const popularTickers = ['AAPL', 'NVDA', 'MSFT', 'AMZN', 'TSLA', 'GOOGL', 'META'];

const NewsSentimentPage = () => {
  const { isAuthenticated } = useAuth();
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [customInput, setCustomInput] = useState('');
  const [sentimentData, setSentimentData] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL | positive | neutral | negative
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchNewsSentiment = async (symbol) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await newsService.getNewsSentiment(symbol);
      const data = res.data || res;
      setSentimentData(data);
    } catch (err) {
      console.error('Failed to load news sentiment:', err);
      setError(err.message || `Unable to fetch news sentiment for ${symbol}`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNewsSentiment(selectedSymbol);
  }, [selectedSymbol, isAuthenticated]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchNewsSentiment(selectedSymbol);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    setSelectedSymbol(customInput.trim().toUpperCase());
    setCustomInput('');
  };

  const articles = sentimentData?.articles || [];
  const filteredArticles = articles.filter((art) => {
    if (filter === 'ALL') return true;
    return (art.sentiment || '').toLowerCase() === filter.toLowerCase();
  });

  const counts = sentimentData?.sentiment_counts || sentimentData?.counts || { positive: 0, neutral: 0, negative: 0, total: 0 };
  const distribution = sentimentData?.sentiment_distribution || sentimentData?.distribution || { positive_pct: 0, neutral_pct: 0, negative_pct: 0 };

  const chartData = [
    { name: 'Positive', count: counts.positive || 0, percentage: distribution.positive_pct || 0, color: '#10B981' },
    { name: 'Neutral', count: counts.neutral || 0, percentage: distribution.neutral_pct || 0, color: '#64748B' },
    { name: 'Negative', count: counts.negative || 0, percentage: distribution.negative_pct || 0, color: '#F43F5E' },
  ];

  const overallSentiment = sentimentData?.overall_sentiment || 'Neutral';
  const overallScore = sentimentData?.overall_sentiment_score ?? sentimentData?.overall_score ?? 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="FinBERT Financial News &amp; NLP Sentiment Intelligence"
        subtitle="Transformer-based natural language processing model specialized in financial phraseology and sentiment scoring."
        badge={sentimentData?.model ? "FinBERT Transformer" : "NLP Core"}
        actionButton={
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh Live News Stream"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh News</span>
          </button>
        }
      />

      {/* Ticker Selector Bar */}
      <div className="glass-card p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-2">
              Analyzed Stock:
            </span>
            {popularTickers.map((sym) => (
              <button
                key={sym}
                onClick={() => setSelectedSymbol(sym)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                  selectedSymbol === sym
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Search Ticker (e.g. MSFT)..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          </form>
        </div>
      </div>

      {isLoading ? (
        <LoadingState
          message={`Fetching & Analyzing Financial News for ${selectedSymbol}...`}
          subtext="Executing HuggingFace FinBERT sequence classification across latest press releases"
        />
      ) : error ? (
        <ErrorState
          title="FinBERT Sentiment Service Error"
          message={error}
          onRetry={() => fetchNewsSentiment(selectedSymbol)}
        />
      ) : (
        <>
          {/* Sentiment Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardCard
              title="Overall Market Sentiment"
              value={overallSentiment}
              change={`${overallScore >= 0 ? '+' : ''}${overallScore}`}
              changeType={overallScore > 0 ? 'positive' : overallScore < 0 ? 'negative' : 'neutral'}
              changeLabel="Compound Polarity"
              icon={Brain}
              iconColor="text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
            />

            <DashboardCard
              title="Bullish Signals"
              value={`${counts.positive} Articles`}
              change={`${distribution.positive_pct}%`}
              changeType="positive"
              changeLabel="of total coverage"
              icon={TrendingUp}
              iconColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            />

            <DashboardCard
              title="Neutral / Informational"
              value={`${counts.neutral} Articles`}
              change={`${distribution.neutral_pct}%`}
              changeType="neutral"
              changeLabel="of total coverage"
              icon={Minus}
              iconColor="text-slate-400 bg-slate-500/10 border-slate-500/20"
            />

            <DashboardCard
              title="Bearish / Downside Risk"
              value={`${counts.negative} Articles`}
              change={`${distribution.negative_pct}%`}
              changeType="negative"
              changeLabel="of total coverage"
              icon={TrendingDown}
              iconColor="text-rose-400 bg-rose-500/10 border-rose-500/20"
            />
          </div>

          {/* Sentiment Polarity Distribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChartCard
                title={`FinBERT Sentiment Polarity Distribution for ${selectedSymbol}`}
                subtitle="Aggregated proportion of Positive, Neutral, and Negative financial news coverage"
                isEmpty={articles.length === 0}
                emptyMessage="No news articles found for this ticker."
              >
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111827',
                          borderColor: '#374151',
                          borderRadius: '12px',
                          color: '#F9FAFB',
                          fontSize: '12px',
                        }}
                        formatter={(val, name, props) => [`${props.payload.count} articles (${val}%)`, 'Share']}
                      />
                      <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            {/* FinBERT Architecture Summary Card */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    NLP Model Architecture
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  FinBERT is a BERT language model trained on financial communication corpora (Financial PhraseBank &amp; corporate filings) specifically designed to distinguish technical market tone.
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Total Articles Analyzed:</span>
                    <span className="font-bold text-white font-mono">{counts.total}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Average Polarity:</span>
                    <span className={`font-bold font-mono ${overallScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {overallScore >= 0 ? '+' : ''}{overallScore}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 text-[11px] text-slate-500">
                Analytical signal only &bull; No guaranteed returns.
              </div>
            </div>
          </div>

          {/* Live News Feed Stream Section */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-indigo-400" />
                  Live Financial News Stream &amp; NLP Classifications
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Financial press releases classified in real-time by FinBERT sequence classification
                </p>
              </div>

              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                {['ALL', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-lg font-semibold uppercase text-[11px] transition-all ${
                      filter === f
                        ? 'bg-indigo-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {filteredArticles.length === 0 ? (
              <EmptyState
                icon={Newspaper}
                title={`No ${filter !== 'ALL' ? filter : ''} articles found`}
                description={`No news stories matching ${filter} sentiment classification for ${selectedSymbol}.`}
              />
            ) : (
              <div className="space-y-3">
                {filteredArticles.map((art, idx) => {
                  const isPos = (art.sentiment || '').toLowerCase() === 'positive';
                  const isNeg = (art.sentiment || '').toLowerCase() === 'negative';
                  const headline = art.headline || art.title;
                  const source = art.source || art.publisher || 'Financial News';
                  const pubDate = art.publication_date || art.published_at || 'Recent';
                  const url = art.url || art.link || '#';
                  const score = typeof art.sentiment_score === 'number' ? art.sentiment_score : (art.compound_score ?? 0);

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-slate-400 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {source}
                          </span>
                          <span className="text-slate-600">&bull;</span>
                          <span className="text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {pubDate}
                          </span>
                        </div>

                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-white hover:text-indigo-400 transition-colors block leading-snug group"
                        >
                          <span>{headline}</span>
                          <ExternalLink className="w-3.5 h-3.5 inline ml-1.5 opacity-60 group-hover:opacity-100" />
                        </a>

                        {art.summary && (
                          <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                            {art.summary}
                          </p>
                        )}
                      </div>

                      <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-1">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1 ${
                            isPos
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isNeg
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {isPos && <TrendingUp className="w-3 h-3" />}
                          {isNeg && <TrendingDown className="w-3 h-3" />}
                          {art.sentiment} ({score >= 0 ? `+${score}` : score})
                        </span>

                        {art.confidence && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            Confidence: {art.confidence}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Disclaimer Box */}
            <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Important Disclaimer
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  News sentiment is an analytical signal and should not be treated as guaranteed investment advice.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NewsSentimentPage;
