import { NextResponse } from 'next/server';
import { MOCK_VENUES } from '@/lib/data/mock-venues';

export const revalidate = 3600; // 1 hour

export async function GET() {
  // Calculate trending score based on rank change
  const trendingVenues = MOCK_VENUES.map((venue) => {
    const currentRank = venue.currentRanking?.rank || 999;
    const previousRank = venue.currentRanking?.previousRank || currentRank;
    const rankChange = previousRank - currentRank;

    return {
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      category: venue.category,
      imageUrl: venue.imageUrl,
      isExpertPick: venue.isExpertPick,
      currentRank,
      previousRank,
      rankChange,
      powerScore: venue.currentRanking?.powerScore || 0,
      direction: rankChange > 0 ? 'up' : rankChange < 0 ? 'down' : 'same',
    };
  })
    .filter((v) => v.rankChange !== 0)
    .sort((a, b) => Math.abs(b.rankChange) - Math.abs(a.rankChange))
    .slice(0, 10);

  // Separate movers up and movers down
  const moversUp = trendingVenues.filter((v) => v.rankChange > 0);
  const moversDown = trendingVenues.filter((v) => v.rankChange < 0);

  return NextResponse.json({
    moversUp,
    moversDown,
    timestamp: new Date().toISOString(),
  });
}
