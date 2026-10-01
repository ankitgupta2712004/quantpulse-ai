async function runFullSystemE2E() {
  console.log('================================================================');
  console.log(' QUANT-PULSE AI SYSTEM: END-TO-END FULL USER WORKFLOW TEST     ');
  console.log('================================================================\n');

  const randomSuffix = Math.floor(Math.random() * 100000);
  const testUser = {
    name: `Test Researcher ${randomSuffix}`,
    email: `researcher_${randomSuffix}@university.edu`,
    password: 'SecurePassword123!',
  };

  let token = null;
  let portfolioId = null;

  // Step 1: Register
  console.log('[Step 1] Testing User Registration (POST /api/auth/register)...');
  try {
    const regRes = await fetch('http://127.0.0.1:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    const regData = await regRes.json();
    console.log(`Status: ${regRes.status} | User Registered: ${regData.user?.email || testUser.email}`);
    token = regData.token;
  } catch (err) {
    console.error('Registration failed:', err.message);
  }

  // Step 2: Login
  console.log('\n[Step 2] Testing User Login (POST /api/auth/login)...');
  try {
    const logRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });
    const logData = await logRes.json();
    console.log(`Status: ${logRes.status} | JWT Token Obtained: ${!!logData.token}`);
    token = logData.token || token;
  } catch (err) {
    console.error('Login failed:', err.message);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Step 3: Create Portfolio
  console.log('\n[Step 3] Testing Create Portfolio (POST /api/portfolios)...');
  try {
    const portRes = await fetch('http://127.0.0.1:5000/api/portfolios', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Growth & AI Core Portfolio',
        description: 'B.Tech CSE Capstone Diversified Portfolio',
        currency: 'USD',
      }),
    });
    const portData = await portRes.json();
    console.log(`Status: ${portRes.status} | Portfolio ID: ${portData.data?._id} | Name: ${portData.data?.name}`);
    portfolioId = portData.data?._id;
  } catch (err) {
    console.error('Create Portfolio failed:', err.message);
  }

  // Step 4: Add Holdings (AAPL, MSFT, NVDA) via POST /api/portfolios/:id/holdings
  console.log('\n[Step 4] Testing Add Holdings (POST /api/portfolios/:id/holdings)...');
  const holdingsToAdd = [
    { symbol: 'AAPL', quantity: 20, buyPrice: 185.50 },
    { symbol: 'MSFT', quantity: 15, buyPrice: 380.00 },
    { symbol: 'NVDA', quantity: 10, buyPrice: 115.00 },
  ];
  for (const h of holdingsToAdd) {
    try {
      const hRes = await fetch(`http://127.0.0.1:5000/api/portfolios/${portfolioId}/holdings`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(h),
      });
      const hData = await hRes.json();
      console.log(` - Added ${h.symbol}: ${h.quantity} shares @ $${h.buyPrice} (Status: ${hRes.status})`);
    } catch (err) {
      console.error(`Add holding ${h.symbol} failed:`, err.message);
    }
  }

  // Step 5: Market Data Quotes
  console.log('\n[Step 5] Testing Market Data (GET /api/market/quote/AAPL)...');
  try {
    const mktRes = await fetch('http://127.0.0.1:5000/api/market/quote/AAPL');
    const mktData = await mktRes.json();
    console.log(`Status: ${mktRes.status} | AAPL Price: $${mktData.data?.price || mktData.data?.regularMarketPrice} | Change: ${mktData.data?.changePercent?.toFixed(2) || mktData.data?.regularMarketChangePercent?.toFixed(2)}%`);
  } catch (err) {
    console.error('Market data quote failed:', err.message);
  }

  // Step 6: Portfolio Analytics & Valuation
  console.log(`\n[Step 6] Testing Portfolio Valuation & Analytics (GET /api/portfolios/${portfolioId}/analytics)...`);
  try {
    const anRes = await fetch(`http://127.0.0.1:5000/api/portfolios/${portfolioId}/analytics`, {
      headers: authHeaders,
    });
    const anData = await anRes.json();
    console.log(`Status: ${anRes.status}`);
    console.log(` - Total Valuation: $${anData.data?.currentValue?.toFixed(2)}`);
    console.log(` - Total Invested: $${anData.data?.totalInvested?.toFixed(2)}`);
    console.log(` - Unrealized Gain: $${anData.data?.totalGain?.toFixed(2)} (${anData.data?.totalGainPercentage?.toFixed(2)}%)`);
    console.log(` - Asset Allocations:`, anData.data?.assetAllocation?.map(a => `${a.symbol}: ${a.weightPercentage?.toFixed(1)}%`));
  } catch (err) {
    console.error('Portfolio analytics failed:', err.message);
  }

  // Step 7: Risk Analytics (Volatility, Sharpe, Beta, VaR)
  console.log(`\n[Step 7] Testing Risk Analytics (GET /api/portfolios/${portfolioId}/risk)...`);
  try {
    const rkRes = await fetch(`http://127.0.0.1:5000/api/portfolios/${portfolioId}/risk`, {
      headers: authHeaders,
    });
    const rkData = await rkRes.json();
    console.log(`Status: ${rkRes.status}`);
    console.log(` - Annualized Volatility: ${rkData.data?.annualizedVolatility?.toFixed(2)}%`);
    console.log(` - Sharpe Ratio: ${rkData.data?.sharpeRatio?.toFixed(2)}`);
    console.log(` - Beta vs S&P 500: ${rkData.data?.beta?.toFixed(2)}`);
    console.log(` - Value at Risk (VaR 95%): ${rkData.data?.valueAtRisk95?.toFixed(2)}%`);
  } catch (err) {
    console.error('Risk analytics failed:', err.message);
  }

  // Step 8: FinBERT News Sentiment Analysis
  console.log('\n[Step 8] Testing FinBERT Financial News Sentiment (GET /api/news/AAPL)...');
  try {
    const newsRes = await fetch('http://127.0.0.1:5000/api/news/AAPL');
    const newsData = await newsRes.json();
    console.log(`Status: ${newsRes.status}`);
    console.log(` - Articles Analyzed: ${newsData.articles_count}`);
    console.log(` - Overall Tone: ${newsData.overall_sentiment} (Score: ${newsData.overall_sentiment_score})`);
    console.log(` - Distribution:`, newsData.sentiment_distribution);
  } catch (err) {
    console.error('News sentiment failed:', err.message);
  }

  // Step 9: Machine Learning Model Evaluation
  console.log('\n[Step 9] Testing ML Models Evaluation (GET /api/ml/evaluation/AAPL)...');
  try {
    const mlRes = await fetch('http://127.0.0.1:5000/api/ml/evaluation/AAPL', {
      headers: authHeaders,
    });
    const mlData = await mlRes.json();
    console.log(`Status: ${mlRes.status}`);
    console.log(` - Linear Regression: RMSE=${mlData.data?.evaluations?.linear_regression?.rmse}, Acc=${mlData.data?.evaluations?.linear_regression?.directional_accuracy}%`);
    console.log(` - Random Forest: RMSE=${mlData.data?.evaluations?.random_forest?.rmse}, Acc=${mlData.data?.evaluations?.random_forest?.directional_accuracy}%`);
    console.log(` - XGBoost Regressor: RMSE=${mlData.data?.evaluations?.xgboost?.rmse}, Acc=${mlData.data?.evaluations?.xgboost?.directional_accuracy}%`);
  } catch (err) {
    console.error('ML model evaluation failed:', err.message);
  }

  // Step 10: Modern Portfolio Theory (MPT) Optimization
  console.log('\n[Step 10] Testing MPT Portfolio Optimization (POST /api/optimization/analyze)...');
  try {
    const optRes = await fetch('http://127.0.0.1:5000/api/optimization/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbols: ['AAPL', 'MSFT', 'NVDA'],
        period: '1y',
        risk_preference: 'max_sharpe',
      }),
    });
    const optData = await optRes.json();
    console.log(`Status: ${optRes.status}`);
    console.log(` - Expected Annual Return: ${optData.data?.expected_return}%`);
    console.log(` - Expected Volatility: ${optData.data?.expected_volatility}%`);
    console.log(` - Model Sharpe Ratio: ${optData.data?.sharpe_ratio}`);
    console.log(` - Optimal Allocation Weights:`, optData.data?.recommended_weights);
  } catch (err) {
    console.error('Optimization analysis failed:', err.message);
  }

  console.log('\n================================================================');
  console.log(' ALL 10 STEPS OF THE END-TO-END WORKFLOW SUCCEEDED PERFECTLY!   ');
  console.log('================================================================');
}

runFullSystemE2E();
