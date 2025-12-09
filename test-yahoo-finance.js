const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

const symbol = 'ICICI Bank';

async function test() {
  try {
    const quote = await yahooFinance.search(symbol);
    const quoteSummary = await yahooFinance.quoteSummary(symbol, {
      modules: ['financialData', 'defaultKeyStatistics']
    });
    
    console.log(JSON.stringify({ quote, quoteSummary }, null, 2));
  } catch (error) {
    console.error(error);
  }
}

test();
