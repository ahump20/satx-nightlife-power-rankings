import { NextResponse } from 'next/server';
import { MOCK_VENUES, MOCK_HISTORICAL_RANKINGS } from '@/lib/data/mock-venues';

export const revalidate = 3600; // 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const period = searchParams.get('period') || 'monthly'; // monthly, yearly
  const month = searchParams.get('month'); // 0-11
  const year = searchParams.get('year') || '2024';

  // Build rankings based on period
  let rankings = MOCK_VENUES.map((venue) => {
    const historicalData = MOCK_HISTORICAL_RANKINGS[venue.slug] || [];

    // Get ranking for specific month if provided
    const monthIndex = month ? parseInt(month) : new Date().getMonth();
    const periodRank = historicalData[monthIndex] || venue.currentRanking?.rank || 999;
    const previousPeriodRank = historicalData[monthIndex - 1] || venue.currentRanking?.previousRank || periodRank;

    // Calculate YTD average
    const ytdRankings = historicalData.slice(0, monthIndex + 1);
    const avgRank = ytdRankings.length > 0
      ? Math.round((ytdRankings.reduce((a, b) => a + b, 0) / ytdRankings.length) * 10) / 10
      : periodRank;

    return {
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      category: venue.category,
      subCategory: venue.subCategory,
      imageUrl: venue.imageUrl,
      isExpertPick: venue.isExpertPick,
      priceLevel: venue.priceLevel,
      city: venue.city,
      currentRank: periodRank,
      previousRank: previousPeriodRank,
      rankChange: previousPeriodRank - periodRank,
      powerScore: venue.currentRanking?.powerScore || 0,
      avgYTDRank: avgRank,
      bestRank: ytdRankings.length > 0 ? Math.min(...ytdRankings) : periodRank,
      monthlyHistory: historicalData.map((rank, idx) => ({
        month: new Date(parseInt(year), idx).toLocaleString('default', { month: 'short' }),
        rank,
      })),
      googleRating: venue.ratings.find((r) => r.source === 'google')?.rating,
      yelpRating: venue.ratings.find((r) => r.source === 'yelp')?.rating,
      reviewCount: venue.ratings.find((r) => r.source === 'google')?.reviewCount || 0,
    };
  }).sort((a, b) => a.currentRank - b.currentRank);

  // Get period label
  const periodLabel = period === 'monthly'
    ? new Date(parseInt(year), month ? parseInt(month) : new Date().getMonth()).toLocaleString('default', { month: 'long', year: 'numeric' })
    : year;

  return NextResponse.json({
    rankings,
    period,
    periodLabel,
    totalVenues: rankings.length,
    timestamp: new Date().toISOString(),
  });
}
