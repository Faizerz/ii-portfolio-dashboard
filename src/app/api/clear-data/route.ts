import { NextResponse } from 'next/server';
import { clearHoldings, clearPriceCache } from '@/lib/db';

export async function POST() {
  try {
    clearHoldings();
    clearPriceCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing data:', error);
    return NextResponse.json(
      { error: 'Failed to clear data' },
      { status: 500 }
    );
  }
}
