import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// In-memory cache for market quotes & historical time-series
const quoteCache = new Map();
const historyCache = new Map();
const CACHE_TTL_QUOTE = 60 * 1000; // 1 minute
const CACHE_TTL_HISTORY = 15 * 60 * 1000; // 15 minutes

export const marketDataService = {
  /**
   * Fetch live stock quote for a symbol
   */
  getQuote: async (symbol) => {
    if (!symbol) throw new Error('Stock symbol is required');
    const cleanSymbol = symbol.trim().toUpperCase();

    // Check cache
    const cached = quoteCache.get(cleanSymbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_QUOTE) {
      return cached.data;
    }

    try {
      const quote = await yahooFinance.quote(cleanSymbol);
      if (!quote || quote.regularMarketPrice === undefined) {
        throw new Error(`Market quote unavailable for ticker '${cleanSymbol}'`);
      }

      const formatted = {
        symbol: cleanSymbol,
        companyName: quote.longName || quote.shortName || cleanSymbol,
        price: quote.regularMarketPrice,
        change: parseFloat((quote.regularMarketChange || 0).toFixed(2)),
        changePercent: parseFloat((quote.regularMarketChangePercent || 0).toFixed(2)),
        currency: quote.currency || 'USD',
        exchange: quote.exchange || 'NASDAQ',
        marketState: quote.marketState || 'REGULAR',
        dayHigh: quote.regularMarketDayHigh || quote.regularMarketPrice,
        dayLow: quote.regularMarketDayLow || quote.regularMarketPrice,
        open: quote.regularMarketOpen || quote.regularMarketPrice,
        previousClose: quote.regularMarketPreviousClose || quote.regularMarketPrice,
        volume: quote.regularMarketVolume || 0,
        marketCap: quote.marketCap || null,
        peRatio: quote.trailingPE ? parseFloat(quote.trailingPE.toFixed(2)) : null,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || null,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow || null,
        lastUpdated: new Date().toISOString(),
      };

      quoteCache.set(cleanSymbol, { data: formatted, timestamp: Date.now() });
      return formatted;
    } catch (error) {
      throw new Error(`Failed to fetch quote for '${cleanSymbol}': ${error.message}`);
    }
  },

  /**
   * Batch fetch quotes for multiple symbols in parallel
   */
  getMultipleQuotes: async (symbols = []) => {
    if (!symbols || symbols.length === 0) return {};
    const uniqueSymbols = [...new Set(symbols.map((s) => s.trim().toUpperCase()))];
    const results = {};

    await Promise.allSettled(
      uniqueSymbols.map(async (sym) => {
        try {
          results[sym] = await marketDataService.getQuote(sym);
        } catch (err) {
          results[sym] = {
            symbol: sym,
            companyName: sym,
            price: null,
            change: 0,
            changePercent: 0,
            error: err.message,
          };
        }
      })
    );

    return results;
  },

  /**
   * Fetch historical daily OHLCV prices
   * @param {string} symbol - Ticker
   * @param {string} range - '1mo' | '3mo' | '6mo' | '1y' | '5y'
   */
  getHistoricalData: async (symbol, range = '1y') => {
    if (!symbol) throw new Error('Stock symbol is required');
    const cleanSymbol = symbol.trim().toUpperCase();
    const cacheKey = `${cleanSymbol}_${range}`;

    const cached = historyCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_HISTORY) {
      return cached.data;
    }

    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (range) {
        case '1mo':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3mo':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6mo':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '5y':
          startDate.setFullYear(startDate.getFullYear() - 5);
          break;
        case '1y':
        default:
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const queryOptions = {
        period1: startDate,
        period2: endDate,
        interval: '1d',
      };

      const chartData = await yahooFinance.chart(cleanSymbol, queryOptions);
      if (!chartData || !chartData.quotes || chartData.quotes.length === 0) {
        throw new Error(`No historical data found for '${cleanSymbol}'`);
      }

      const formatted = chartData.quotes
        .filter((q) => q.close !== null && q.close !== undefined)
        .map((q) => ({
          date: new Date(q.date).toISOString().split('T')[0],
          open: parseFloat((q.open || q.close).toFixed(2)),
          high: parseFloat((q.high || q.close).toFixed(2)),
          low: parseFloat((q.low || q.close).toFixed(2)),
          close: parseFloat(q.close.toFixed(2)),
          adjClose: parseFloat((q.adjclose || q.close).toFixed(2)),
          volume: q.volume || 0,
        }));

      historyCache.set(cacheKey, { data: formatted, timestamp: Date.now() });
      return formatted;
    } catch (error) {
      throw new Error(`Failed to fetch historical data for '${cleanSymbol}': ${error.message}`);
    }
  },

  /**
   * Fetch aligned daily closing prices for multiple symbols over a period
   * Used for multi-asset risk analytics, beta, volatility, and correlation matrix.
   */
  getAlignedHistoricalCloses: async (symbols = [], period = '1y') => {
    if (!symbols || symbols.length === 0) return { dates: [], closesMap: {} };

    const uniqueSymbols = [...new Set(symbols.map((s) => s.trim().toUpperCase()))];
    const rawHistories = {};

    await Promise.allSettled(
      uniqueSymbols.map(async (sym) => {
        try {
          rawHistories[sym] = await marketDataService.getHistoricalData(sym, period);
        } catch (err) {
          console.warn(`[MarketData] Could not fetch history for ${sym}:`, err.message);
          rawHistories[sym] = [];
        }
      })
    );

    // Collect all valid dates
    const dateSet = new Set();
    Object.values(rawHistories).forEach((series) => {
      series.forEach((item) => dateSet.add(item.date));
    });

    const sortedDates = Array.from(dateSet).sort();
    const closesMap = {};

    uniqueSymbols.forEach((sym) => {
      const history = rawHistories[sym] || [];
      const historyMap = new Map(history.map((h) => [h.date, h.close]));

      let lastKnownClose = history.length > 0 ? history[0].close : 0;
      const alignedCloses = [];

      for (const d of sortedDates) {
        if (historyMap.has(d)) {
          lastKnownClose = historyMap.get(d);
        }
        alignedCloses.push(lastKnownClose);
      }

      closesMap[sym] = alignedCloses;
    });

    return { dates: sortedDates, closesMap };
  },

  /**
   * Search for ticker symbols and companies
   */
  searchSymbols: async (query) => {
    if (!query || !query.trim()) return [];
    try {
      const searchRes = await yahooFinance.search(query.trim(), { quotesCount: 8, newsCount: 0 });
      if (!searchRes || !searchRes.quotes) return [];

      return searchRes.quotes
        .filter((q) => q.isYahooFinance)
        .map((q) => ({
          symbol: q.symbol,
          name: q.longname || q.shortname || q.symbol,
          exchange: q.exchange || '',
          type: q.quoteType || 'EQUITY',
        }));
    } catch (error) {
      console.warn(`[MarketData] Search query failed for '${query}':`, error.message);
      return [];
    }
  },

  /**
   * Get detailed company statistics and fundamentals
   */
  getCompanyStats: async (symbol) => {
    if (!symbol) throw new Error('Stock symbol is required');
    const cleanSymbol = symbol.trim().toUpperCase();

    try {
      const quote = await marketDataService.getQuote(cleanSymbol);
      const summaryDetail = await yahooFinance.quoteSummary(cleanSymbol, {
        modules: ['summaryDetail', 'defaultKeyStatistics', 'assetProfile'],
      }).catch(() => null);

      const stats = {
        symbol: cleanSymbol,
        companyName: quote.companyName,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        sector: summaryDetail?.assetProfile?.sector || 'Equities',
        industry: summaryDetail?.assetProfile?.industry || 'General',
        marketCap: quote.marketCap,
        peRatio: quote.peRatio,
        forwardPE: summaryDetail?.summaryDetail?.forwardPE
          ? parseFloat(summaryDetail.summaryDetail.forwardPE.toFixed(2))
          : null,
        dividendYield: summaryDetail?.summaryDetail?.dividendYield
          ? (summaryDetail.summaryDetail.dividendYield * 100).toFixed(2) + '%'
          : 'N/A',
        beta: summaryDetail?.defaultKeyStatistics?.beta
          ? parseFloat(summaryDetail.defaultKeyStatistics.beta.toFixed(2))
          : null,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
        description: summaryDetail?.assetProfile?.longBusinessSummary || '',
      };

      return stats;
    } catch (error) {
      throw new Error(`Failed to fetch company stats for '${cleanSymbol}': ${error.message}`);
    }
  },
};
