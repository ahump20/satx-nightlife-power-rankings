import { NextResponse } from 'next/server';
import { MOCK_VENUES, MOCK_HISTORICAL_RANKINGS } from '@/lib/data/mock-venues';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const venue = MOCK_VENUES.find((v) => v.slug === slug);

  if (!venue) {
    return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
  }

  // Get historical ranking data
  const historicalRankings = MOCK_HISTORICAL_RANKINGS[slug] || [];

  // Calculate YTD stats
  const ytdStats = {
    avgRank: historicalRankings.length > 0
      ? Math.round((historicalRankings.reduce((a, b) => a + b, 0) / historicalRankings.length) * 10) / 10
      : null,
    bestRank: historicalRankings.length > 0 ? Math.min(...historicalRankings) : null,
    worstRank: historicalRankings.length > 0 ? Math.max(...historicalRankings) : null,
    monthlyRankings: historicalRankings.map((rank, idx) => ({
      month: new Date(2024, idx).toLocaleString('default', { month: 'short' }),
      rank,
    })),
  };

  return NextResponse.json({
    venue,
    historicalRankings,
    ytdStats,
    timestamp: new Date().toISOString(),
  });
}
