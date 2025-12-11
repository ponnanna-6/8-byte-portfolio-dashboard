import { NextResponse } from 'next/server';
import { getPortfolioWithRealtimeData } from '@/lib/portfolioData';

/**
 * Portfolio Realtime Data API Route
 * GET /api/portfolio/realtime
 * Returns portfolio data with real-time prices from BSE API
 */
export async function GET() {
  try {
    const holdings = await getPortfolioWithRealtimeData();
    const lastUpdated = new Date().toLocaleString();

    return NextResponse.json({
      holdings,
      lastUpdated,
    });
  } catch (error) {
    console.error('Error fetching portfolio realtime data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio data' },
      { status: 500 }
    );
  }
}

