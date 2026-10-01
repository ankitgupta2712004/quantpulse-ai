async function runNewsTests() {
  console.log('====================================================');
  console.log('  TESTING FINBERT FINANCIAL NEWS SENTIMENT MODULE  ');
  console.log('====================================================\n');

  // Test 1: Fetch News & Sentiment for AAPL
  console.log('[Test 1] Testing GET http://127.0.0.1:5000/api/news/AAPL ...');
  try {
    const res1 = await fetch('http://127.0.0.1:5000/api/news/AAPL');
    const data1 = await res1.json();
    console.log(`Status: ${res1.status}`);
    console.log(`Symbol: ${data1.symbol}`);
    console.log(`Articles Count: ${data1.articles_count}`);
    console.log(`Overall Sentiment: ${data1.overall_sentiment} (Score: ${data1.overall_sentiment_score})`);
    console.log(`Distribution:`, JSON.stringify(data1.sentiment_distribution));
    console.log(`Model Used: ${data1.model}`);
    console.log(`Disclaimer: "${data1.disclaimer}"`);
    if (data1.articles && data1.articles.length > 0) {
      console.log(`\nSample Article 1:`);
      console.log(` - Headline: ${data1.articles[0].headline}`);
      console.log(` - Source: ${data1.articles[0].source}`);
      console.log(` - Date: ${data1.articles[0].publication_date}`);
      console.log(` - Sentiment: ${data1.articles[0].sentiment} (Score: ${data1.articles[0].sentiment_score})`);
      console.log(` - URL: ${data1.articles[0].url}`);
    }
  } catch (err) {
    console.error('Test 1 failed:', err.message);
  }

  // Test 2: Fetch News & Sentiment for NVDA
  console.log('\n[Test 2] Testing GET http://127.0.0.1:5000/api/news/NVDA ...');
  try {
    const res2 = await fetch('http://127.0.0.1:5000/api/news/NVDA');
    const data2 = await res2.json();
    console.log(`Status: ${res2.status}`);
    console.log(`Articles Count: ${data2.articles_count}`);
    console.log(`Overall Sentiment: ${data2.overall_sentiment} (${data2.overall_sentiment_score})`);
    console.log(`Distribution:`, JSON.stringify(data2.sentiment_distribution));
  } catch (err) {
    console.error('Test 2 failed:', err.message);
  }

  // Test 3: Custom Text Analysis (FinBERT inference)
  console.log('\n[Test 3] Testing POST http://127.0.0.1:5000/api/news/analyze with financial texts ...');
  try {
    const testTexts = [
      "Apple reports record quarterly revenue and surges 8% on massive iPhone AI demand.",
      "The Federal Reserve maintained interest rates unchanged amidst persistent economic uncertainty.",
      "Company incurs severe quarterly losses and warns of sharp revenue decline due to supply chain breakdown."
    ];
    for (const text of testTexts) {
      const res3 = await fetch('http://127.0.0.1:5000/api/news/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data3 = await res3.json();
      console.log(`- Text: "${text}"`);
      console.log(`  -> Sentiment: ${data3.sentiment} | Score: ${data3.sentiment_score} | Probabilities: Positive=${data3.probabilities?.positive}, Neutral=${data3.probabilities?.neutral}, Negative=${data3.probabilities?.negative}`);
    }
  } catch (err) {
    console.error('Test 3 failed:', err.message);
  }

  // Test 4: Invalid/Empty Symbol handling
  console.log('\n[Test 4] Testing GET http://127.0.0.1:5000/api/news/INVALID_SYMBOL_XYZ999 ...');
  try {
    const res4 = await fetch('http://127.0.0.1:5000/api/news/INVALID_SYMBOL_XYZ999');
    const data4 = await res4.json();
    console.log(`Status: ${res4.status}`);
    console.log(`Articles Count: ${data4.articles_count || 0}`);
    console.log(`Sentiment: ${data4.overall_sentiment}`);
    console.log(`Message: ${data4.message || 'Handled gracefully'}`);
  } catch (err) {
    console.error('Test 4 failed:', err.message);
  }

  console.log('\n====================================================');
  console.log('             ALL NEWS TESTS FINISHED               ');
  console.log('====================================================');
}

runNewsTests();
