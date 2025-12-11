/**
 * BSE India API Service
 * Fetches stock data from BSE India API
 */

export interface BSEResponse {
  CurrRate: {
    LTP: string;
    Chg: string;
    PcChg: string;
    D_Cpricelink: string;
    IssueChgVal: string;
    IssueChgPC: string;
  };
  Cmpname: {
    FullN: string;
    ShortN: string;
    SeriesN: string;
    SEOUrlEQ: string;
    SEOUrlDR: string;
    IsNotPropernFIT: string;
    Category: string;
    EquityScrips: string;
  };
  Header: {
    Noticecnt: string;
    PrevClose: string;
    Open: string;
    High: string;
    Low: string;
    LTP: string;
    DisplayText: string;
    Category: string;
    PRE_OPEN_NO_BIDS: string | null;
    PRE_OPEN_NO_I_PRICE: string | null;
    PRE_OPEN_I_PRICE: string | null;
    PRE_OPEN_I_PRICE_QTY: string | null;
    PCAS_NO_BIDS: string | null;
    PCAS_INDICATIVE_PRICE: string | null;
    PCAS_INDICATIVE_QTY: string | null;
    PERODIC_CALL_AUCTION: string | null;
    GSMURL: string;
    GSMText: string;
    Invit: string;
    Ason: string;
    NAVRate: string;
    NAVdttm: string;
    ASMText: string;
    SMSText: string;
    IRPText: string;
    ASMURL: string;
    SMSURL: string;
    IRPURL: string;
    IDB_DisplayText: string;
    IsALF: string;
    EMSText: string;
    EMSURL: string;
  };
  CompResp: {
    compRes: any;
    texturl: any;
  };
}

export interface BSEStockData {
  scripcode: string;
  companyName: string;
  currentPrice: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

/**
 * Fetch stock data from BSE India API
 * @param scripcode - BSE scrip code (e.g., "544252")
 * @returns Promise<BSEStockData>
 */
export async function fetchBSEData(scripcode: string): Promise<BSEStockData | null> {
  try {
    const url = `https://api.bseindia.com/BseIndiaAPI/api/getScripHeaderData/w?Debtflag=&scripcode=${scripcode}&seriesid=`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'origin': 'https://www.bseindia.com',
        'referer': 'https://www.bseindia.com/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`BSE API error: ${response.status} ${response.statusText}`);
    }

    const data: BSEResponse = await response.json();
    return mapBSEResponseToStockData(scripcode, data);
  } catch (error) {
    console.error(`Error fetching BSE data for ${scripcode}:`, error);
    return null;
  }
}

/**
 * Map BSE API response to standardized stock data format
 */
function mapBSEResponseToStockData(scripcode: string, data: BSEResponse): BSEStockData {
  const ltp = parseFloat(data.CurrRate?.LTP || data.Header?.LTP || '0');
  const prevClose = parseFloat(data.Header?.PrevClose || '0');
  const change = parseFloat(data.CurrRate?.Chg?.replace('+', '') || '0');
  const changePercent = parseFloat(data.CurrRate?.PcChg?.replace('+', '').replace('%', '') || '0');

  return {
    scripcode,
    companyName: data.Cmpname?.FullN || data.Cmpname?.ShortN || '',
    currentPrice: ltp,
    previousClose: prevClose,
    open: parseFloat(data.Header?.Open || '0'),
    high: parseFloat(data.Header?.High || '0'),
    low: parseFloat(data.Header?.Low || '0'),
    change,
    changePercent,
    lastUpdated: data.Header?.Ason || new Date().toISOString(),
  };
}

/**
 * Check if a symbol is a BSE scripcode (numeric)
 */
export function isBSEScripcode(symbol: string): boolean {
  return /^\d+$/.test(symbol);
}

/**
 * Fetch BSE data for multiple scripcodes
 */
export async function fetchMultipleBSEData(scripcodes: string[]): Promise<Map<string, BSEStockData>> {
  const results = new Map<string, BSEStockData>();
  
  // Fetch in parallel with rate limiting
  const promises = scripcodes.map(async (scripcode, index) => {
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, index * 100));
    const data = await fetchBSEData(scripcode);
    if (data) {
      results.set(scripcode, data);
    }
  });

  await Promise.all(promises);
  return results;
}

