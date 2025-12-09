import { PortfolioHolding, SectorSummary } from '@/types/portfolio';
import portfolioData from '@/data/portfolio.json';

export function getPortfolioData(): PortfolioHolding[] {
  return portfolioData as PortfolioHolding[];
}

export function getSectorSummaries(holdings: PortfolioHolding[]): SectorSummary[] {
  const sectorMap = new Map<string, PortfolioHolding[]>();
  
  holdings.forEach(holding => {
    const sector = holding.sector || 'Others';
    if (!sectorMap.has(sector)) {
      sectorMap.set(sector, []);
    }
    sectorMap.get(sector)!.push(holding);
  });

  const summaries: SectorSummary[] = [];
  
  sectorMap.forEach((holdings, sector) => {
    const totalInvestment = holdings.reduce((sum, h) => sum + h.fixed.investment, 0);
    const totalPresentValue = holdings.reduce((sum, h) => sum + h.realtime.presentValue, 0);
    const totalGainLoss = totalPresentValue - totalInvestment;
    
    summaries.push({
      sector,
      totalInvestment,
      totalPresentValue,
      totalGainLoss,
      holdings
    });
  });

  return summaries.sort((a, b) => b.totalInvestment - a.totalInvestment);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(value);
}

