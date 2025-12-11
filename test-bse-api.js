/**
 * Test BSE India API
 * Run with: node test-bse-api.js
 */

const https = require('https');

const scripcode = '544252'; // Bajaj Housing

const url = `https://api.bseindia.com/BseIndiaAPI/api/getScripHeaderData/w?Debtflag=&scripcode=${scripcode}&seriesid=`;

https.get(url, {
  headers: {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
    'origin': 'https://www.bseindia.com',
    'referer': 'https://www.bseindia.com/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
  }
}, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      
      // Extract key data
      console.log('\n=== MAPPED DATA ===');
      console.log('Company:', json.Cmpname?.FullN || json.Cmpname?.ShortN);
      console.log('Current Price (LTP):', json.CurrRate?.LTP || json.Header?.LTP);
      console.log('Previous Close:', json.Header?.PrevClose);
      console.log('Open:', json.Header?.Open);
      console.log('High:', json.Header?.High);
      console.log('Low:', json.Header?.Low);
      console.log('Change:', json.CurrRate?.Chg);
      console.log('Change %:', json.CurrRate?.PcChg);
      console.log('Last Updated:', json.Header?.Ason);
    } catch (error) {
      console.error('Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
  });
}).on('error', (error) => {
  console.error('Error:', error.message);
});

