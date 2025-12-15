// Venue-Specific Social Media Activity API
// Returns detailed social stats for a single venue

import { NextResponse } from 'next/server';
import { MOCK_VENUES } from '@/lib/data/mock-venues';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Mock social stats for a specific venue
function getMockVenueSocialStats(venue: typeof MOCK_VENUES[0]) {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
  const isPeakHour = hour >= 21 || hour <= 2;

  // Base stats vary by venue type and popularity
  const baseMultiplier = venue.isExpertPick ? 1.3 : 1.0;

  const mentionsLastHour = Math.round((Math.random() * 15 + 5) * baseMultiplier);
  const mentionsLast24h = mentionsLastHour * (isWeekend ? 18 : 12);
  const mentionsLast7d = mentionsLast24h * 6;

  return {
    venueId: venue.id,
    venueSlug: venue.slug,
    venueName: venue.name,

    // Current activity
    currentPulse: Math.round((Math.random() * 40 + 30) * baseMultiplier),
    hourlyTrend: ['rising', 'steady', 'rising', 'exploding', 'steady'][Math.floor(Math.random() * 5)] as any,
    liveNow: Math.random() > 0.8,

    // Mention counts
    mentions: {
      lastHour: mentionsLastHour,
      last24Hours: mentionsLast24h,
      last7Days: mentionsLast7d,
      avgDaily: Math.round(mentionsLast7d / 7),
    },

    // Platform breakdown
    platforms: {
      instagram: {
        mentions: Math.round(mentionsLast24h * 0.5),
        engagement: Math.round(Math.random() * 5000 + 1000),
        topPost: {
          url: `https://instagram.com/p/mock_${venue.slug}_ig`,
          likes: Math.round(Math.random() * 500 + 100),
          comments: Math.round(Math.random() * 50 + 10),
          preview: `Amazing vibes at ${venue.name}! 🍸`,
        },
      },
      tiktok: {
        mentions: Math.round(mentionsLast24h * 0.3),
        engagement: Math.round(Math.random() * 50000 + 5000),
        topPost: {
          url: `https://tiktok.com/@user/video/mock_${venue.slug}_tt`,
          views: Math.round(Math.random() * 10000 + 1000),
          likes: Math.round(Math.random() * 1000 + 100),
          preview: `POV: You found the best spot in SATX`,
        },
      },
      twitter: {
        mentions: Math.round(mentionsLast24h * 0.2),
        engagement: Math.round(Math.random() * 500 + 50),
        topPost: {
          url: `https://twitter.com/user/status/mock_${venue.slug}_tw`,
          likes: Math.round(Math.random() * 100 + 10),
          retweets: Math.round(Math.random() * 20 + 2),
          preview: `${venue.name} is the move tonight! #SATX`,
        },
      },
    },

    // Trending hashtags
    topHashtags: [
      { tag: 'satx', count: Math.round(Math.random() * 50 + 20) },
      { tag: 'satxnightlife', count: Math.round(Math.random() * 30 + 10) },
      { tag: venue.slug.replace(/-/g, ''), count: Math.round(Math.random() * 20 + 5) },
      { tag: 'sanantoniobars', count: Math.round(Math.random() * 15 + 5) },
      { tag: 'drinks', count: Math.round(Math.random() * 10 + 2) },
    ],

    // Sentiment analysis
    sentiment: {
      overall: 0.7 + Math.random() * 0.25, // Generally positive
      breakdown: {
        positive: 0.75 + Math.random() * 0.15,
        neutral: 0.1 + Math.random() * 0.1,
        negative: Math.random() * 0.1,
      },
      topPositiveWords: ['amazing', 'love', 'vibes', 'best', 'great'],
      recentComplaints: Math.random() > 0.8 ? ['long wait', 'crowded'] : [],
    },

    // Peak activity analysis
    peakActivity: {
      peakHour: isPeakHour ? hour : 22,
      peakDay: isWeekend ? dayOfWeek : 5, // Friday default
      hourlyBreakdown: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        activity: i >= 21 || i <= 2
          ? Math.round(Math.random() * 50 + 50)
          : i >= 17
          ? Math.round(Math.random() * 30 + 20)
          : Math.round(Math.random() * 10),
      })),
    },

    // Influencer activity
    influencers: {
      mentionsThisWeek: Math.round(Math.random() * 5),
      topInfluencer: Math.random() > 0.5 ? {
        username: 'satxfoodie',
        platform: 'instagram',
        followers: 25000,
        postUrl: `https://instagram.com/p/mock_influencer`,
      } : null,
    },

    // Activity comparison
    comparison: {
      vsYesterday: Math.round((Math.random() - 0.3) * 50), // % change
      vsLastWeek: Math.round((Math.random() - 0.2) * 30),
      vsAverage: Math.round((Math.random() - 0.2) * 40),
    },

    lastUpdated: now.toISOString(),
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const venue = MOCK_VENUES.find((v) => v.slug === slug);

  if (!venue) {
    return NextResponse.json(
      { error: 'Venue not found' },
      { status: 404 }
    );
  }

  const socialStats = getMockVenueSocialStats(venue);

  return NextResponse.json({
    venue: {
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      category: venue.category,
      address: venue.address,
      imageUrl: venue.imageUrl,
    },
    social: socialStats,
    meta: {
      timestamp: new Date().toISOString(),
      dataFreshness: 'real-time',
      platforms: ['instagram', 'tiktok', 'twitter'],
    },
  });
}
