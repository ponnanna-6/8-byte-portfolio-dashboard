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
 * Fetch BSE fundamentals for multiple scripcodes
 */
export async function fetchMultipleBSEFundamentals(scripcodes: string[]): Promise<Map<string, BSEFundamentalsData>> {
  const results = new Map<string, BSEFundamentalsData>();
  
  // Fetch in parallel with rate limiting
  const promises = scripcodes.map(async (scripcode, index) => {
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, index * 100));
    const data = await fetchBSEFundamentals(scripcode);
    if (data) {
      results.set(scripcode, data);
    }
  });

  await Promise.all(promises);
  return results;
}

