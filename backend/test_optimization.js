async function runOptimizationTests() {
  console.log('====================================================');
  console.log('  TESTING MPT PORTFOLIO OPTIMIZATION MODULE        ');
  console.log('====================================================\n');

  // Test 1: 2 Stocks (AAPL, MSFT)
  console.log('[Test 1] Testing 2 Stocks (AAPL, MSFT) ...');
  try {
    const res1 = await fetch('http://127.0.0.1:5000/api/optimization/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbols: ['AAPL', 'MSFT'],
        period: '1y',
        risk_preference: 'max_sharpe',
      }),
    });
    const data1 = await res1.json();
    console.log(`Status: ${res1.status}`);
    console.log(`Assets: ${data1.data?.symbols?.join(', ')}`);
    console.log(`Recommended Weights:`, data1.data?.recommended_weights);
    console.log(`Expected Return: ${data1.data?.expected_return}%`);
    console.log(`Expected Volatility: ${data1.data?.expected_volatility}%`);
    console.log(`Sharpe Ratio: ${data1.data?.sharpe_ratio}`);
    console.log(`Frontier Points: ${data1.data?.efficient_frontier?.length || 0}`);
    console.log(`Disclaimer: "${data1.data?.disclaimer}"`);
  } catch (err) {
    console.error('Test 1 failed:', err.message);
  }

  // Test 2: 3 Stocks (AAPL, NVDA, AMZN) with Min Volatility preference
  console.log('\n[Test 2] Testing 3 Stocks (AAPL, NVDA, AMZN) [Min Volatility] ...');
  try {
    const res2 = await fetch('http://127.0.0.1:5000/api/optimization/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbols: ['AAPL', 'NVDA', 'AMZN'],
        period: '1y',
        risk_preference: 'min_volatility',
        min_weight: 0.05,
        max_weight: 0.60,
      }),
    });
    const data2 = await res2.json();
    console.log(`Status: ${res2.status}`);
    console.log(`Scenario: ${data2.data?.scenario_title}`);
    console.log(`Recommended Weights:`, data2.data?.recommended_weights);
    console.log(`Expected Return: ${data2.data?.expected_return}%`);
    console.log(`Expected Volatility: ${data2.data?.expected_volatility}%`);
    console.log(`Sharpe Ratio: ${data2.data?.sharpe_ratio}`);
    const weightSum = Object.values(data2.data?.recommended_weights || {}).reduce((a, b) => a + b, 0);
    console.log(`Total Allocation Sum: ${Math.round(weightSum * 100)}%`);
  } catch (err) {
    console.error('Test 2 failed:', err.message);
  }

  // Test 3: 5+ Stocks (AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA)
  console.log('\n[Test 3] Testing 6 Stocks (AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA) ...');
  try {
    const res3 = await fetch('http://127.0.0.1:5000/api/optimization/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA'],
        period: '2y',
        risk_preference: 'max_sharpe',
      }),
    });
    const data3 = await res3.json();
    console.log(`Status: ${res3.status}`);
    console.log(`Assets Count: ${data3.data?.num_assets}`);
    console.log(`Recommended Weights:`, data3.data?.recommended_weights);
    console.log(`Expected Return: ${data3.data?.expected_return}%`);
    console.log(`Expected Volatility: ${data3.data?.expected_volatility}%`);
    console.log(`Sharpe Ratio: ${data3.data?.sharpe_ratio}`);
    console.log(`Max Sharpe Scenario:`, data3.data?.scenarios?.max_sharpe);
    console.log(`Min Volatility Scenario:`, data3.data?.scenarios?.min_volatility);
    console.log(`Equal Weight Scenario:`, data3.data?.scenarios?.equal_weight);
  } catch (err) {
    console.error('Test 3 failed:', err.message);
  }

  // Test 4: Duplicate symbols handling (e.g. ['AAPL', 'AAPL', 'MSFT', 'MSFT'])
  console.log('\n[Test 4] Testing Duplicate Symbols (AAPL, AAPL, MSFT, MSFT) ...');
  try {
    const res4 = await fetch('http://127.0.0.1:5000/api/optimization/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbols: ['AAPL', 'AAPL', 'MSFT', 'MSFT'],
        period: '1y',
      }),
    });
    const data4 = await res4.json();
    console.log(`Status: ${res4.status}`);
    console.log(`Deduplicated Symbols:`, data4.data?.symbols);
    console.log(`Num Assets: ${data4.data?.num_assets}`);
    console.log(`Recommended Weights:`, data4.data?.recommended_weights);
  } catch (err) {
    console.error('Test 4 failed:', err.message);
  }

  // Test 5: Insufficient / Invalid symbols handling
  console.log('\n[Test 5] Testing Insufficient / Invalid Symbols ...');
  try {
    const res5 = await fetch('http://127.0.0.1:5000/api/optimization/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbols: ['NONEXISTENT_TICKER_123', 'ANOTHER_FAKE_TICKER_456'],
        period: '1y',
      }),
    });
    const data5 = await res5.json();
    console.log(`Status: ${res5.status}`);
    console.log(`Error Handled: ${data5.message || 'Handled gracefully'}`);
  } catch (err) {
    console.error('Test 5 failed:', err.message);
  }

  console.log('\n====================================================');
  console.log('         ALL OPTIMIZATION TESTS FINISHED            ');
  console.log('====================================================');
}

runOptimizationTests();
