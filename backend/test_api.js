// Comprehensive Automated Test Runner for Backend + Market Data + Analytics + Python ML Microservice

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('================================================================');
  console.log('  QuantPulse AI - End-to-End System Test Suite Execution        ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const testEmail = `ml_integration_${Date.now()}@abes.ac.in`;
  const testPassword = 'Password123!';
  let token = '';
  let portfolioId = '';

  const assert = (condition, testName, detail = '') => {
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${detail ? `(${detail})` : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  };

  try {
    // 1. Health Check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'online', '1. GET /api/health');

    // 2. Register User
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'AI Researcher',
        email: testEmail,
        password: testPassword,
      }),
    });
    const regData = await regRes.json();
    token = regData.token;
    assert(regRes.status === 201 && token, '2. POST /api/auth/register');

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 3. Live Market Quote: AAPL
    const quoteRes = await fetch(`${BASE_URL}/market/quote/AAPL`);
    const quoteData = await quoteRes.json();
    assert(
      quoteRes.status === 200 && quoteData.success && quoteData.data.price > 0,
      '3. GET /api/market/quote/AAPL',
      `Live Price: $${quoteData.data?.price}`
    );

    // 4. Live Market History: MSFT 1-Month
    const histRes = await fetch(`${BASE_URL}/market/history/MSFT?range=1mo`);
    const histData = await histRes.json();
    assert(
      histRes.status === 200 && Array.isArray(histData.data) && histData.data.length > 5,
      '4. GET /api/market/history/MSFT?range=1mo',
      `${histData.count} daily bars`
    );

    // 5. Create Portfolio & Holdings for Analytics
    const portRes = await fetch(`${BASE_URL}/portfolios`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'AI & Semi Quant Fund',
        description: 'Multi-asset validation portfolio',
      }),
    });
    const portData = await portRes.json();
    portfolioId = portData.data._id;

    await fetch(`${BASE_URL}/portfolios/${portfolioId}/holdings`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ symbol: 'AAPL', quantity: 10, averageBuyPrice: 175.0, sector: 'Technology' }),
    });
    await fetch(`${BASE_URL}/portfolios/${portfolioId}/holdings`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ symbol: 'NVDA', quantity: 4, averageBuyPrice: 700.0, sector: 'Semiconductors' }),
    });

    // 6. Portfolio Valuation & Live Performance Analytics
    const analyticsRes = await fetch(`${BASE_URL}/portfolios/${portfolioId}/analytics`, {
      headers: authHeaders,
    });
    const analyticsData = await analyticsRes.json();
    assert(
      analyticsRes.status === 200 && analyticsData.data.currentValue > 0,
      '5. GET /api/portfolios/:id/analytics',
      `Valuation: $${analyticsData.data?.currentValue}`
    );

    // 7. Quantitative Risk Analytics & Pearson Correlation Matrix
    const riskRes = await fetch(`${BASE_URL}/portfolios/${portfolioId}/risk`, {
      headers: authHeaders,
    });
    const riskData = await riskRes.json();
    assert(
      riskRes.status === 200 &&
        riskData.data.volatility > 0 &&
        riskData.data.correlationMatrix?.matrix?.length === 2,
      '6. GET /api/portfolios/:id/risk',
      `Vol: ${riskData.data?.volatility}%, Beta: ${riskData.data?.beta}`
    );

    // 8. Python ML: Train Linear Regression, Random Forest, XGBoost via Node Gateway
    console.log('\n--- Testing Python ML Microservice via Node Gateway ---');
    const trainRes = await fetch(`${BASE_URL}/ml/train`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ symbol: 'NVDA', lookback_years: 2 }),
    });
    const trainData = await trainRes.json();
    assert(
      trainRes.status === 200 &&
        trainData.data?.evaluations?.linear_regression &&
        trainData.data?.evaluations?.random_forest &&
        trainData.data?.evaluations?.xgboost,
      '7. POST /api/ml/train (Node -> Python FastAPI -> Scikit-Learn & XGBoost)',
      `Trained 3 models on ${trainData.data?.train_samples} samples`
    );

    // 9. Python ML: Model Evaluation & Comparison Metrics (MAE, RMSE, R²)
    const evalRes = await fetch(`${BASE_URL}/ml/evaluation/NVDA`, {
      headers: authHeaders,
    });
    const evalData = await evalRes.json();
    const evals = evalData.data?.evaluations;
    assert(
      evalRes.status === 200 &&
        evals?.linear_regression?.mae !== undefined &&
        evals?.random_forest?.mae !== undefined &&
        evals?.xgboost?.mae !== undefined,
      '8. GET /api/ml/evaluation/NVDA (Objective Out-of-Sample Model Comparison)',
      `OLS MAE: ${evals?.linear_regression?.mae}, RF MAE: ${evals?.random_forest?.mae}, XGB MAE: ${evals?.xgboost?.mae}`
    );

    // 10. Python ML: Explainable AI Feature Importances
    const xgbImportances = evalData.data?.feature_importances?.xgboost;
    assert(
      Array.isArray(xgbImportances) && xgbImportances.length > 0 && xgbImportances[0].feature,
      '9. Explainable AI Feature Attribution (XGBoost Feature Importances)',
      `Top Feature: ${xgbImportances?.[0]?.feature} (${(xgbImportances?.[0]?.importance * 100).toFixed(1)}%)`
    );

    // 11. Python ML: Next-Period Statistical Return & Directional Prediction
    const predRes = await fetch(`${BASE_URL}/ml/predict`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ symbol: 'NVDA' }),
    });
    const predData = await predRes.json();
    assert(
      predRes.status === 200 &&
        predData.data?.predictions?.xgboost?.trend_direction !== undefined,
      '10. POST /api/ml/predict (Next-Day Directional Forecast)',
      `Forecast: ${predData.data?.predictions?.xgboost?.trend_direction} (${predData.data?.predictions?.xgboost?.predicted_next_return_pct}%)`
    );

    // 12. Python ML: List Saved Models
    const modelsRes = await fetch(`${BASE_URL}/ml/models`, {
      headers: authHeaders,
    });
    const modelsData = await modelsRes.json();
    assert(
      modelsRes.status === 200 && Array.isArray(modelsData.data) && modelsData.data.length > 0,
      '11. GET /api/ml/models (Joblib Saved Model Artifacts)',
      `${modelsData.count} models on disk`
    );

    // Clean-up
    await fetch(`${BASE_URL}/portfolios/${portfolioId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
  } catch (error) {
    console.error('Test execution error:', error);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`  Tests Passed: ${passed} | Tests Failed: ${failed} `);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
