// Real-Time Social Buzz API
// Returns what venues are popping RIGHT NOW based on social media activity
// Works even at 1:15 AM on a Tuesday!

import { NextResponse } from 'next/server';
import { MOCK_VENUES } from '@/lib/data/mock-venues';
import {
  calculateRealTimeBuzz,
  buzzToScoringFactor,
  RealTimeBuzz,
} from '@/lib/api/social-media';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Always fresh

// Mock social buzz data for development
// In production, this would be replaced with actual API calls
function getMockSocialBuzz(venueId: string, venueName: string, venueSlug: string): RealTimeBuzz {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  // Simulate different activity levels based on time and venue
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
  const isPeakHour = (hour >= 21 || hour <= 2);
  const isLateNight = hour >= 0 && hour <= 3;

  // Base activity varies by venue
  const venuePopularity: Record<string, number> = {
    'georges-keep': 75,
    'camp-1604': 70,
    'the-venue': 65,
    'kung-fu-noodle': 80, // Late night spot
    'range-sa': 60,
    'lucys-two-times': 55,
    'weathered-souls': 65,
    'the-good-kind': 50,
    'jazz-tx': 70,
    'haunt': 85, // Club vibes
  };

  const basePopularity = venuePopularity[venueSlug] || 50;

  // Calculate pulse based on time factors
  let pulse = basePopularity;

  if (isWeekend) {
    pulse += 20;
  }
  if (isPeakHour) {
    pulse += 15;
  }
  if (isLateNight) {
    // Late night is special - some venues pop off
    if (venueSlug === 'kung-fu-noodle' || venueSlug === 'haunt') {
      pulse += 25;
    } else {
      pulse -= 10;
    }
  }

  // Add some randomness for realism
  pulse += Math.random() * 20 - 10;
  pulse = Math.max(0, Math.min(100, pulse));

  // Determine trend
  const trends: RealTimeBuzz['hourlyTrend'][] = ['exploding', 'rising', 'steady', 'falling', 'dead'];
  let trendIndex = 2; // steady by default

  if (pulse >= 80) trendIndex = 0; // exploding
  else if (pulse >= 60) trendIndex = 1; // rising
  else if (pulse >= 40) trendIndex = 2; // steady
  else if (pulse >= 20) trendIndex = 3; // falling
  else trendIndex = 4; // dead

  // Mock platform activity
  const activePlatforms: RealTimeBuzz['activePlatforms'] = [];
  if (Math.random() > 0.3) activePlatforms.push('instagram');
  if (Math.random() > 0.5) activePlatforms.push('tiktok');
  if (Math.random() > 0.6) activePlatforms.push('twitter');

  // Mock top post
  const topPost = pulse > 30 ? {
    platform: activePlatforms[0] || 'instagram' as const,
    postUrl: `https://instagram.com/p/mock_${venueSlug}`,
    engagement: Math.round(pulse * 10),
    content: `Having an amazing time at ${venueName}! 🍸🎉 #SATX #satxnightlife`,
  } : null;

  return {
    venueId,
    venueSlug,
    venueName,
    currentPulse: Math.round(pulse * 10) / 10,
    hourlyTrend: trends[trendIndex],
    peakHour: isPeakHour ? hour : 22,
    totalMentionsToday: Math.round(pulse * 2),
    totalMentionsHour: Math.round(pulse / 5),
    activePlatforms,
    topPost,
    liveNow: pulse > 70 && Math.random() > 0.7,
    friendsHere: 0,
    lastUpdated: now,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const limit = parseInt(searchParams.get('limit') || '10');
  const minPulse = parseFloat(searchParams.get('minPulse') || '0');
  const includeDetails = searchParams.get('details') === 'true';

  const now = new Date();
  const currentHour = now.getHours();
  const dayOfWeek = now.getDay();

  // Get all venues with their social buzz
  const venuesWithBuzz = MOCK_VENUES.map((venue) => {
    // In production, this would call calculateRealTimeBuzz
    // For now, use mock data
    const buzz = getMockSocialBuzz(venue.id, venue.name, venue.slug);
    const socialScore = buzzToScoringFactor(buzz);

    return {
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      category: venue.category,
      address: venue.address,
      city: venue.city,
      imageUrl: venue.imageUrl,
      latitude: venue.latitude,
      longitude: venue.longitude,

      // Social buzz data
      currentPulse: buzz.currentPulse,
      hourlyTrend: buzz.hourlyTrend,
      socialScore,
      totalMentionsToday: buzz.totalMentionsToday,
      totalMentionsHour: buzz.totalMentionsHour,
      activePlatforms: buzz.activePlatforms,
      liveNow: buzz.liveNow,
      peakHour: buzz.peakHour,

      // Include top post if details requested
      ...(includeDetails && buzz.topPost ? { topPost: buzz.topPost } : {}),

      // Activity status
      activityLevel: getActivityLevel(buzz.currentPulse),
      lastUpdated: buzz.lastUpdated.toISOString(),
    };
  });

  // Filter by minimum pulse
  const filteredVenues = venuesWithBuzz.filter(v => v.currentPulse >= minPulse);

  // Sort by current pulse (what's popping right now)
  filteredVenues.sort((a, b) => b.currentPulse - a.currentPulse);

  // Apply limit
  const limitedVenues = filteredVenues.slice(0, limit);

  // Get activity summary
  const explodingCount = limitedVenues.filter(v => v.hourlyTrend === 'exploding').length;
  const risingCount = limitedVenues.filter(v => v.hourlyTrend === 'rising').length;
  const liveCount = limitedVenues.filter(v => v.liveNow).length;

  // Determine overall nightlife status
  const nightlifeStatus = getNightlifeStatus(currentHour, dayOfWeek, limitedVenues);

  return NextResponse.json({
    venues: limitedVenues,
    meta: {
      timestamp: now.toISOString(),
      currentHour,
      dayOfWeek,
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
      totalVenues: venuesWithBuzz.length,
      buzzingVenues: filteredVenues.length,
    },
    summary: {
      nightlifeStatus,
      explodingCount,
      risingCount,
      liveNowCount: liveCount,
      topVenue: limitedVenues[0] ? {
        name: limitedVenues[0].name,
        pulse: limitedVenues[0].currentPulse,
        trend: limitedVenues[0].hourlyTrend,
      } : null,
      message: generateSummaryMessage(currentHour, dayOfWeek, limitedVenues),
    },
  });
}

function getActivityLevel(pulse: number): string {
  if (pulse >= 85) return 'exploding';
  if (pulse >= 70) return 'packed';
  if (pulse >= 50) return 'busy';
  if (pulse >= 30) return 'moderate';
  if (pulse >= 10) return 'slow';
  return 'dead';
}

function getNightlifeStatus(hour: number, dayOfWeek: number, venues: any[]): string {
  const avgPulse = venues.length > 0
    ? venues.reduce((sum, v) => sum + v.currentPulse, 0) / venues.length
    : 0;

  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
  const isLateNight = hour >= 0 && hour <= 4;
  const isPrimeTime = hour >= 21 && hour <= 23;

  if (avgPulse >= 70) return 'ON FIRE';
  if (avgPulse >= 50) return 'POPPIN';
  if (avgPulse >= 30) return 'GETTING STARTED';
  if (isLateNight && avgPulse >= 20) return 'LATE NIGHT VIBES';
  if (avgPulse >= 10) return 'WARMING UP';
  return 'QUIET NIGHT';
}

function generateSummaryMessage(hour: number, dayOfWeek: number, venues: any[]): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const day = dayNames[dayOfWeek];

  const topVenues = venues.filter(v => v.currentPulse >= 50);
  const exploding = venues.filter(v => v.hourlyTrend === 'exploding');
  const live = venues.filter(v => v.liveNow);

  // Late night messages (after midnight)
  if (hour >= 0 && hour <= 3) {
    if (topVenues.length > 0) {
      return `Late night on ${day}! ${topVenues.length} spots still going strong.`;
    }
    return `It's ${hour === 0 ? 'midnight' : hour + ' AM'} on ${day}. Most spots have wound down.`;
  }

  // Early morning
  if (hour >= 4 && hour <= 10) {
    return `Good morning! Nightlife is sleeping. Check back tonight!`;
  }

  // Daytime
  if (hour >= 11 && hour <= 17) {
    return `It's daytime! Happy hours start around 4-5 PM.`;
  }

  // Evening (6 PM - 9 PM)
  if (hour >= 18 && hour <= 20) {
    if (topVenues.length > 0) {
      return `Evening vibes! ${topVenues.length} spots heating up for tonight.`;
    }
    return `Night is just getting started. Check back in an hour or two!`;
  }

  // Prime time (9 PM - midnight)
  if (exploding.length > 0) {
    return `${exploding.length} spot${exploding.length > 1 ? 's are' : ' is'} EXPLODING right now!`;
  }
  if (live.length > 0) {
    return `${live.length} venue${live.length > 1 ? 's' : ''} streaming live right now!`;
  }
  if (topVenues.length > 0) {
    return `Prime time! ${topVenues.length} spots are poppin' right now.`;
  }
  return `${day} night is building up. Keep watching!`;
}
