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
    compRes: unknown;
    texturl: unknown;
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
 * Search for BSE scripcode by symbol name (e.g., "HDFCBANK")
 * Returns the BSE scripcode if found
 */
export async function searchBSEScripcode(symbol: string): Promise<string | null> {
  try {
    const url = `https://api.bseindia.com/Msource/1D/getQouteSearch.aspx?Type=EQ&text=${encodeURIComponent(symbol)}&flag=site`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'origin': 'https://www.bseindia.com',
        'priority': 'u=1, i',
        'referer': 'https://www.bseindia.com/',
        'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`BSE Search API error: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // Parse HTML to extract scripcode
    // Pattern 1: Extract from URL path - Format: /stock-share-price/.../SYMBOL/SCRIPCODE/
    const urlMatch = html.match(/\/stock-share-price\/[^\/]+\/[^\/]+\/(\d+)\//);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }

    // Pattern 2: Extract from span content - Format: <span><strong>SYMBOL</strong>&nbsp;&nbsp;&nbsp;ISIN&nbsp;&nbsp;&nbsp;SCRIPCODE</span>
    // Look for a 5-6 digit number after the ISIN (which is typically 12 characters)
    const spanMatch = html.match(/<strong>([^<]+)<\/strong>[^<]*INE\d{10}[^<]*?(\d{5,6})/);
    if (spanMatch && spanMatch[2]) {
      return spanMatch[2];
    }

    // Pattern 3: Fallback - look for any 5-6 digit number in the HTML (less reliable)
    const fallbackMatch = html.match(/\b(\d{5,6})\b/);
    if (fallbackMatch && fallbackMatch[1]) {
      // Verify it's likely a scripcode (not a year or other number)
      const num = parseInt(fallbackMatch[1]);
      if (num >= 500000 && num <= 999999) {
        return fallbackMatch[1];
      }
    }

    return null;
  } catch (error) {
    console.error(`Error searching BSE scripcode for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch BSE data for multiple scripcodes with optimized rate limiting
 */
export async function fetchMultipleBSEData(scripcodes: string[]): Promise<Map<string, BSEStockData>> {
  const results = new Map<string, BSEStockData>();
  
  if (scripcodes.length === 0) {
    return results;
  }

  // Process in concurrent batches to optimize rate limiting
  const BATCH_SIZE = 10;
  const BATCH_DELAY_MS = 1000; // 1 second between batches
  
  for (let i = 0; i < scripcodes.length; i += BATCH_SIZE) {
    const batch = scripcodes.slice(i, i + BATCH_SIZE);
    
    // Fetch batch in parallel
    const batchPromises = batch.map(async (scripcode) => {
      try {
        const data = await fetchBSEData(scripcode);
        return { scripcode, data };
      } catch (error) {
        console.error(`Error fetching BSE data for ${scripcode}:`, error);
        return { scripcode, data: null };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ scripcode, data }) => {
      if (data) {
        results.set(scripcode, data);
      }
    });
    
    // Add delay between batches (except for the last batch)
    if (i + BATCH_SIZE < scripcodes.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }
  
  return results;
}

export interface BSEFundamentalsResponse {
  SecurityId: string;
  Grp_Index: string;
  FaceVal: string;
  SecurityCode: string;
  ISIN: string;
  Industry: string;
  Group: string;
  Index: string;
  PAIDUP_VALUE: string;
  EPS: string;
  CEPS: string;
  PE: string;
  OPM: string;
  NPM: string;
  PB: string;
  ROE: string;
  Sector: string;
  IndustryNew: string;
  IGroup: string;
  ISubGroup: string;
  IShow: string;
  SetlType: string;
  COName: string;
  Contact: string;
  Email: string;
  SDD: string;
  COdetails: string;
  sddscrip: string;
  maturitydate: string;
  ConEPS: string;
  ConCEPS: string;
  ConPE: string;
  ConOPM: string;
  ConNPM: string;
  ConPB: string | null;
  ConROE: string | null;
}

export interface BSEFundamentalsData {
  scripcode: string;
  securityId: string;
  isin: string;
  sector: string;
  industry: string;
  faceValue: number;
  eps: number | null;
  ceps: number | null;
  pe: number | null;
  pb: number | null;
  roe: number | null;
  opm: number | null;
  npm: number | null;
  group: string;
  index: string;
}

/**
 * Fetch fundamental data from BSE India API
 * @param scripcode - BSE scrip code (e.g., "544252")
 * @returns Promise<BSEFundamentalsData>
 */
export async function fetchBSEFundamentals(scripcode: string): Promise<BSEFundamentalsData | null> {
  try {
    const url = `https://api.bseindia.com/BseIndiaAPI/api/ComHeadernew/w?quotetype=EQ&scripcode=${scripcode}&seriesid=`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'origin': 'https://www.bseindia.com',
        'priority': 'u=1, i',
        'referer': 'https://www.bseindia.com/',
        'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`BSE Fundamentals API error: ${response.status} ${response.statusText}`);
    }

    const data: BSEFundamentalsResponse = await response.json();
    return mapBSEFundamentalsResponse(scripcode, data);
  } catch (error) {
    console.error(`Error fetching BSE fundamentals for ${scripcode}:`, error);
    return null;
  }
}

/**
 * Map BSE Fundamentals API response to standardized format
 */
function mapBSEFundamentalsResponse(scripcode: string, data: BSEFundamentalsResponse): BSEFundamentalsData {
  const parseNumber = (value: string | null | undefined): number | null => {
    if (!value || value === '-' || value.trim() === '') return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  return {
    scripcode,
    securityId: data.SecurityId || '',
    isin: data.ISIN || '',
    sector: data.Sector || data.IndustryNew || '',
    industry: data.Industry || data.ISubGroup || '',
    faceValue: parseNumber(data.FaceVal) || 0,
    eps: parseNumber(data.EPS),
    ceps: parseNumber(data.CEPS),
    pe: parseNumber(data.PE),
    pb: parseNumber(data.PB),
    roe: parseNumber(data.ROE),
    opm: parseNumber(data.OPM),
    npm: parseNumber(data.NPM),
    group: data.Group || '',
    index: data.Index || '',
  };
}

/**
 * Fetch BSE fundamentals for multiple scripcodes with optimized rate limiting
 */
export async function fetchMultipleBSEFundamentals(scripcodes: string[]): Promise<Map<string, BSEFundamentalsData>> {
  const results = new Map<string, BSEFundamentalsData>();
  
  if (scripcodes.length === 0) {
    return results;
  }

  // Process in concurrent batches to optimize rate limiting
  const BATCH_SIZE = 10;
  const BATCH_DELAY_MS = 1000; // 1 second between batches
  
  for (let i = 0; i < scripcodes.length; i += BATCH_SIZE) {
    const batch = scripcodes.slice(i, i + BATCH_SIZE);
    
    // Fetch batch in parallel
    const batchPromises = batch.map(async (scripcode) => {
      try {
        const data = await fetchBSEFundamentals(scripcode);
        return { scripcode, data };
      } catch (error) {
        console.error(`Error fetching BSE fundamentals for ${scripcode}:`, error);
        return { scripcode, data: null };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ scripcode, data }) => {
      if (data) {
        results.set(scripcode, data);
      }
    });
    
    // Add delay between batches (except for the last batch)
    if (i + BATCH_SIZE < scripcodes.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }
  
  return results;
}

