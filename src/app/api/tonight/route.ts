import { NextResponse } from 'next/server';
import { MOCK_VENUES } from '@/lib/data/mock-venues';
import { calculateDistance } from '@/lib/api/google-places';
import { calculatePowerScore, ScoringInput } from '@/lib/scoring/algorithm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const limit = parseInt(searchParams.get('limit') || '5');

  const now = new Date();
  const currentHour = now.getHours();
  const dayOfWeek = now.getDay();

  let venues = MOCK_VENUES.map((venue) => {
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;

    const distance =
      userLat && userLng
        ? calculateDistance(userLat, userLng, venue.latitude, venue.longitude)
        : null;

    // Check for active deals tonight
    const activeDeals = venue.deals.filter((deal) => {
      if (!deal.isActive) return false;
      if (deal.dayOfWeek !== null && deal.dayOfWeek !== dayOfWeek) return false;
      return true;
    });

    // Check for events tonight
    const eventsTonight = venue.events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === now.toDateString();
    });

    // Check if currently in happy hour
    const happyHourActive = activeDeals.some((deal) => {
      if (deal.dealType !== 'happy_hour') return false;
      if (!deal.startTime || !deal.endTime) return true;
      const startHour = parseInt(deal.startTime.split(':')[0]);
      const endHour = parseInt(deal.endTime.split(':')[0]);
      return currentHour >= startHour && currentHour < endHour;
    });

    // Calculate live score
    const googleRating = venue.ratings.find((r) => r.source === 'google');
    const yelpRating = venue.ratings.find((r) => r.source === 'yelp');

    const scoringInput: ScoringInput = {
      venueSlug: venue.slug,
      googleRating: googleRating?.rating || null,
      yelpRating: yelpRating?.rating || null,
      recentReviewCount: Math.round((googleRating?.reviewCount || 0) * 0.1),
      totalReviewCount: googleRating?.reviewCount || 0,
      activeDealsCount: activeDeals.length,
      hasHappyHourNow: happyHourActive,
      hasEventTonight: eventsTonight.length > 0,
      isOpenNow: currentHour >= 11 || currentHour < 2,
      userDistance: distance,
      previousRank: venue.currentRanking?.previousRank || null,
      currentRank: venue.currentRanking?.rank || null,
      expertBoostMultiplier: venue.expertBoostMultiplier,
    };

    const { powerScore, breakdown, explanation } = calculatePowerScore(scoringInput);

    return {
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      category: venue.category,
      subCategory: venue.subCategory,
      address: venue.address,
      city: venue.city,
      imageUrl: venue.imageUrl,
      priceLevel: venue.priceLevel,
      isExpertPick: venue.isExpertPick,
      distance: distance ? Math.round(distance * 10) / 10 : null,
      liveScore: powerScore,
      scoreExplanation: explanation,
      rank: venue.currentRanking?.rank,
      googleRating: googleRating?.rating,
      yelpRating: yelpRating?.rating,
      activeDeals,
      eventsTonight,
      happyHourActive,
      breakdown,
    };
  });

  // Sort by live score (includes proximity bonus)
  venues.sort((a, b) => b.liveScore - a.liveScore);

  // Apply limit
  venues = venues.slice(0, limit);

  return NextResponse.json({
    venues,
    timestamp: new Date().toISOString(),
    dayOfWeek,
    currentHour,
  });
}
