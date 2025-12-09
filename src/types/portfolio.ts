export interface PortfolioHolding {
  symbol: string;
  companyName: string;
  sector: string;
  fixed: {
    purchasePrice: number;
    qty: number;
    investment: number;
    portfolioPercent: string;
    stage2: boolean;
  };
  realtime: {
    cmp: number;
    presentValue: number;
    gainLoss: number;
    gainLossPercent: string;
    marketCap: number;
  };
  fundamentals: {
    peTTM: number | null;
    latestEarnings: number | null;
    revenueTTM: string | number | null;
    ebitdaTTM: number | null;
    ebitdaPercent: string | null;
    pat: string | number | null;
    patPercent: string | null;
    cfoMarch24: number | null;
    cfo5Years: number | null;
    debtToEquity: number | null;
    bookValue: number | string | null;
    revenueGrowth: string | null;
    ebitdaGrowth: string | null;
    profitGrowth: string | null;
    marketCapGrowth: string | null;
    priceToSales: number | null;
    cfoToEbitda: string | null;
    cfoToPat: string | null;
    priceToBook: number | null;
  };
}

export interface SectorSummary {
  sector: string;
  totalInvestment: number;
  totalPresentValue: number;
  totalGainLoss: number;
  holdings: PortfolioHolding[];
}

