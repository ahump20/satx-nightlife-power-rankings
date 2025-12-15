import { NextResponse } from 'next/server';
import { MOCK_VENUES } from '@/lib/data/mock-venues';
import { calculateDistance } from '@/lib/api/google-places';
import { calculatePowerScore, ScoringInput } from '@/lib/scoring/algorithm';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '50');
  const sortBy = searchParams.get('sort') || 'rank';

  let venues = [...MOCK_VENUES];

  // Filter by category
  if (category && category !== 'all') {
    venues = venues.filter((v) => v.category === category);
  }

  // Calculate distance if user location provided
  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    venues = venues.map((venue) => {
      const distance = calculateDistance(
        userLat,
        userLng,
        venue.latitude,
        venue.longitude
      );

      // Recalculate power score with proximity
      const googleRating = venue.ratings.find((r) => r.source === 'google');
      const yelpRating = venue.ratings.find((r) => r.source === 'yelp');
      const now = new Date();
      const currentHour = now.getHours();

      const scoringInput: ScoringInput = {
        venueSlug: venue.slug,
        googleRating: googleRating?.rating || null,
        yelpRating: yelpRating?.rating || null,
        recentReviewCount: Math.round((googleRating?.reviewCount || 0) * 0.1),
        totalReviewCount: googleRating?.reviewCount || 0,
        activeDealsCount: venue.deals.filter((d) => d.isActive).length,
        hasHappyHourNow: venue.deals.some(
          (d) =>
            d.dealType === 'happy_hour' &&
            d.startTime &&
            d.endTime &&
            currentHour >= parseInt(d.startTime) &&
            currentHour < parseInt(d.endTime)
        ),
        hasEventTonight: venue.events.some(
          (e) => new Date(e.startTime).toDateString() === now.toDateString()
        ),
        isOpenNow: currentHour >= 16 && currentHour < 2, // Simplified check
        userDistance: distance,
        previousRank: venue.currentRanking?.previousRank || null,
        currentRank: venue.currentRanking?.rank || null,
        expertBoostMultiplier: venue.expertBoostMultiplier,
      };

      const { powerScore, breakdown, explanation } = calculatePowerScore(scoringInput);

      return {
        ...venue,
        distance: Math.round(distance * 10) / 10,
        liveScore: powerScore,
        scoreBreakdown: breakdown,
        scoreExplanation: explanation,
      };
    });
  }

  // Sort venues
  switch (sortBy) {
    case 'distance':
      venues.sort((a, b) => ((a as any).distance || 999) - ((b as any).distance || 999));
      break;
    case 'rating':
      venues.sort((a, b) => {
        const aRating = a.ratings.find((r) => r.source === 'google')?.rating || 0;
        const bRating = b.ratings.find((r) => r.source === 'google')?.rating || 0;
        return bRating - aRating;
      });
      break;
    case 'score':
      venues.sort((a, b) => ((b as any).liveScore || b.currentRanking?.powerScore || 0) - ((a as any).liveScore || a.currentRanking?.powerScore || 0));
      break;
    case 'rank':
    default:
      venues.sort((a, b) => (a.currentRanking?.rank || 999) - (b.currentRanking?.rank || 999));
  }

  // Apply limit
  venues = venues.slice(0, limit);

  return NextResponse.json({
    venues,
    total: MOCK_VENUES.length,
    timestamp: new Date().toISOString(),
  });
}
