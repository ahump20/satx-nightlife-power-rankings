import { NextResponse } from 'next/server';
import { MOCK_VENUES } from '@/lib/data/mock-venues';
import { calculateDistance } from '@/lib/api/google-places';
import { calculatePowerScore, ScoringInput } from '@/lib/scoring/algorithm';

export const dynamic = 'force-dynamic';

/**
 * Generate real-time social buzz score based on time, day, and venue
 * This simulates what would come from the actual social media scrapers
 */
function getSocialBuzzScore(venueSlug: string, hour: number, dayOfWeek: number): {
  score: number;
  trend: 'exploding' | 'rising' | 'steady' | 'falling' | 'dead';
  platforms: string[];
  liveNow: boolean;
} {
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
  const isPeakHour = hour >= 21 || hour <= 2;
  const isLateNight = hour >= 0 && hour <= 3;

  // Base popularity varies by venue
  const venuePopularity: Record<string, number> = {
    'georges-keep': 70,
    'camp-1604': 65,
    'the-venue': 60,
    'kung-fu-noodle': 75, // Great late-night spot
    'range-sa': 55,
    'lucys-two-times': 50,
    'weathered-souls': 60,
    'the-good-kind': 45,
    'jazz-tx': 65,
    'haunt': 80, // Club scene
  };

  let buzz = venuePopularity[venueSlug] || 50;

  // Time-based adjustments
  if (isWeekend) buzz += 15;
  if (isPeakHour) buzz += 12;

  // Late night special handling - this is key for "1:15 AM on Tuesday"
  if (isLateNight) {
    if (venueSlug === 'kung-fu-noodle' || venueSlug === 'haunt') {
      buzz += 25; // These spots pop off late!
    } else if (isWeekend) {
      buzz += 5; // Weekend late nights are acceptable
    } else {
      buzz -= 20; // Weekday late night = most places dead
    }
  }

  // Weekday adjustment (Tuesday at 1 AM is unusual, boost if there's activity)
  if (!isWeekend && isLateNight && buzz > 40) {
    // Unexpected activity gets a relevance boost
    buzz += 15;
  }

  // Add some randomness for realism
  buzz += Math.random() * 10 - 5;
  buzz = Math.max(0, Math.min(100, Math.round(buzz)));

  // Determine trend
  let trend: 'exploding' | 'rising' | 'steady' | 'falling' | 'dead';
  if (buzz >= 85) trend = 'exploding';
  else if (buzz >= 65) trend = 'rising';
  else if (buzz >= 40) trend = 'steady';
  else if (buzz >= 15) trend = 'falling';
  else trend = 'dead';

  // Active platforms
  const platforms: string[] = [];
  if (buzz > 30) platforms.push('instagram');
  if (buzz > 50) platforms.push('tiktok');
  if (buzz > 60) platforms.push('twitter');

  // Live stream probability based on buzz
  const liveNow = buzz > 70 && Math.random() > 0.7;

  return { score: buzz, trend, platforms, liveNow };
}

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

    // Get real-time social buzz for this venue
    const socialBuzz = getSocialBuzzScore(venue.slug, currentHour, dayOfWeek);

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
      socialBuzzScore: socialBuzz.score, // NEW: Real-time social media activity
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
      // NEW: Social media trending data
      socialBuzz: {
        score: socialBuzz.score,
        trend: socialBuzz.trend,
        platforms: socialBuzz.platforms,
        liveNow: socialBuzz.liveNow,
      },
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
