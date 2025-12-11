import { NextResponse } from 'next/server';
import { fetchBSEData, isBSEScripcode } from '@/lib/bseIndia';

/**
 * BSE India API Route
 * GET /api/bse?scripcode=544252
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scripcode = searchParams.get('scripcode');

  if (!scripcode) {
    return NextResponse.json(
      { error: 'scripcode parameter is required' },
      { status: 400 }
    );
  }

  if (!isBSEScripcode(scripcode)) {
    return NextResponse.json(
      { error: 'Invalid scripcode format. Must be numeric.' },
      { status: 400 }
    );
  }

  try {
    const data = await fetchBSEData(scripcode);
    
    if (!data) {
      return NextResponse.json(
        { error: 'Failed to fetch data from BSE API' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('BSE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

