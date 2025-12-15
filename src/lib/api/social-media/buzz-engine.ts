// Social Buzz Engine - Real-Time Trending Calculation
// Aggregates social media activity across Instagram, TikTok, and Twitter/X
// to determine what venues are popping RIGHT NOW

import {
  SocialMention,
  SocialPlatform,
  VenueSocialStats,
  RealTimeBuzz,
  HourlyActivityPulse,
  SocialSearchQuery,
} from './types';
import { searchInstagramForVenue, instagramPostToMention, getRecentPostsForVenue as getRecentInstagram } from './instagram-scraper';
import { searchTikTokForVenue, tiktokVideoToMention, getRecentVideosForVenue as getRecentTikTok } from './tiktok-scraper';
import { searchTwitterForVenue, twitterPostToMention, getRecentTweetsForVenue as getRecentTwitter } from './twitter-scraper';
import { analyzeSentiment, analyzeActivityLevel } from './sentiment';
import {
  PULSE_THRESHOLDS,
  INFLUENCER_THRESHOLDS,
  INFLUENCER_MULTIPLIERS,
  FRESHNESS_DECAY,
  EXPECTED_PEAK_HOURS,
  SATX_BOUNDS,
  TIME_WINDOWS,
} from './constants';
import { VenueBuzzSnapshot, SocialPlatform as DBSocialPlatform } from '../../db/schema';

/**
 * Main entry point: Calculate real-time buzz for a venue
 * This is called frequently (every 5-15 minutes) to get live data
 */
export async function calculateRealTimeBuzz(
  venueId: string,
  venueSlug: string,
  venueName: string,
  venueCoords: { lat: number; lng: number },
  venueHashtags: string[] = []
): Promise<RealTimeBuzz> {
  const query: SocialSearchQuery = {
    venueNames: [venueName, venueSlug.replace(/-/g, ' ')],
    hashtags: [
      venueSlug.replace(/-/g, ''),
      ...venueHashtags,
      'satx',
      'sanantonio',
      'satxnightlife',
    ],
    locationIds: {},
    coordinates: {
      lat: venueCoords.lat,
      lng: venueCoords.lng,
      radiusMeters: 500, // 500m radius around venue
    },
  };

  // Fetch data from all platforms in parallel
  const [instagramMentions, tiktokMentions, twitterMentions] = await Promise.all([
    fetchInstagramMentions(query, venueId),
    fetchTikTokMentions(query, venueId),
    fetchTwitterMentions(query, venueId),
  ]);

  const allMentions = [...instagramMentions, ...tiktokMentions, ...twitterMentions];

  // Calculate buzz metrics
  const now = new Date();
  const hourAgo = new Date(now.getTime() - TIME_WINDOWS.hourly);
  const dayAgo = new Date(now.getTime() - TIME_WINDOWS.daily);

  const mentionsLastHour = allMentions.filter(m => m.postedAt >= hourAgo);
  const mentionsLast24h = allMentions.filter(m => m.postedAt >= dayAgo);

  // Calculate current pulse score
  const currentPulse = calculatePulseScore(mentionsLastHour, now);

  // Determine hourly trend
  const hourlyTrend = determineHourlyTrend(mentionsLastHour, mentionsLast24h);

  // Find top post
  const topPost = findTopPost(allMentions);

  // Check for live streams
  const liveNow = allMentions.some(m => m.isLive);

  // Determine active platforms
  const activePlatforms = getActivePlatforms(mentionsLastHour);

  return {
    venueId,
    venueSlug,
    venueName,
    currentPulse,
    hourlyTrend: hourlyTrend.trend,
    peakHour: findPeakHour(mentionsLast24h),
    totalMentionsToday: mentionsLast24h.length,
    totalMentionsHour: mentionsLastHour.length,
    activePlatforms,
    topPost,
    liveNow,
    friendsHere: 0, // Future feature
    lastUpdated: now,
  };
}

/**
 * Calculate pulse score based on recent mentions
 * Higher scores mean the venue is popping right now
 */
function calculatePulseScore(mentions: SocialMention[], now: Date): number {
  if (mentions.length === 0) return 0;

  let score = 0;
  const hourOfDay = now.getHours();
  const dayOfWeek = now.getDay();

  for (const mention of mentions) {
    // Base score from engagement
    let mentionScore = mention.engagementScore;

    // Apply freshness decay (more recent = higher weight)
    const ageMinutes = (now.getTime() - mention.postedAt.getTime()) / (60 * 1000);
    const freshnessMultiplier = Math.max(
      FRESHNESS_DECAY.minWeight,
      Math.pow(FRESHNESS_DECAY.hourlyDecay, ageMinutes / 60)
    );
    mentionScore *= freshnessMultiplier;

    // Apply influencer multiplier
    const influencerTier = getInfluencerTier(mention.authorFollowers);
    if (influencerTier) {
      mentionScore *= INFLUENCER_MULTIPLIERS[influencerTier];
    }

    // Boost for video content (more engaging)
    if (mention.mediaType === 'video' || mention.mediaType === 'reel') {
      mentionScore *= 1.3;
    }

    // Boost for location-tagged posts (confirms they're at venue)
    if (mention.locationTagged) {
      mentionScore *= 1.5;
    }

    // Boost for live streams (real-time proof of activity)
    if (mention.isLive) {
      mentionScore *= 2.0;
    }

    // Boost for positive sentiment
    if (mention.engagementScore > 0) {
      mentionScore *= 1 + (mention.engagementScore * 0.2);
    }

    score += mentionScore;
  }

  // Apply time-based weighting
  // Off-peak activity is more notable (1:15 AM on Tuesday = big deal!)
  const isExpectedPeakHour = EXPECTED_PEAK_HOURS[dayOfWeek]?.includes(hourOfDay);

  if (!isExpectedPeakHour) {
    // Unexpected activity gets a significant boost
    const offPeakMultiplier = dayOfWeek >= 1 && dayOfWeek <= 3 ? 2.5 : 1.8;
    score *= offPeakMultiplier;
  }

  // Late night bonus (after midnight activity is noteworthy)
  if (hourOfDay >= 0 && hourOfDay <= 3) {
    score *= 1.5;
  }

  // Normalize to 0-100 scale
  const normalizedScore = Math.min(100, score / 2);

  return Math.round(normalizedScore * 10) / 10;
}

/**
 * Determine the trend direction based on recent vs historical activity
 */
function determineHourlyTrend(
  lastHour: SocialMention[],
  last24h: SocialMention[]
): { trend: 'exploding' | 'rising' | 'steady' | 'falling' | 'dead'; percentChange: number } {
  const hourlyCount = lastHour.length;
  const hourlyEngagement = lastHour.reduce((sum, m) => sum + m.engagementScore, 0);

  // Calculate average hourly rate over last 24h
  const avgHourlyCount = last24h.length / 24;
  const avgHourlyEngagement = last24h.reduce((sum, m) => sum + m.engagementScore, 0) / 24;

  if (avgHourlyCount === 0 && hourlyCount === 0) {
    return { trend: 'dead', percentChange: 0 };
  }

  // Calculate percent change from average
  const countChange = avgHourlyCount > 0
    ? ((hourlyCount - avgHourlyCount) / avgHourlyCount) * 100
    : hourlyCount > 0 ? 100 : 0;

  const engagementChange = avgHourlyEngagement > 0
    ? ((hourlyEngagement - avgHourlyEngagement) / avgHourlyEngagement) * 100
    : hourlyEngagement > 0 ? 100 : 0;

  // Use weighted average of count and engagement change
  const percentChange = (countChange * 0.4 + engagementChange * 0.6);

  let trend: 'exploding' | 'rising' | 'steady' | 'falling' | 'dead';

  if (percentChange >= PULSE_THRESHOLDS.explodingThreshold) {
    trend = 'exploding';
  } else if (percentChange >= PULSE_THRESHOLDS.risingThreshold) {
    trend = 'rising';
  } else if (percentChange <= PULSE_THRESHOLDS.fallingThreshold) {
    trend = 'falling';
  } else if (hourlyCount === 0 && avgHourlyCount < 1) {
    trend = 'dead';
  } else {
    trend = 'steady';
  }

  return { trend, percentChange };
}

/**
 * Find the top performing post across all platforms
 */
function findTopPost(mentions: SocialMention[]): RealTimeBuzz['topPost'] {
  if (mentions.length === 0) return null;

  const sorted = [...mentions].sort((a, b) => b.engagementScore - a.engagementScore);
  const top = sorted[0];

  return {
    platform: top.platform,
    postUrl: top.postUrl,
    engagement: top.engagementScore,
    content: top.content.slice(0, 100) + (top.content.length > 100 ? '...' : ''),
  };
}

/**
 * Identify which platforms have active mentions
 */
function getActivePlatforms(mentions: SocialMention[]): SocialPlatform[] {
  const platforms = new Set<SocialPlatform>();
  for (const mention of mentions) {
    platforms.add(mention.platform);
  }
  return Array.from(platforms);
}

/**
 * Find the peak activity hour in the last 24h
 */
function findPeakHour(mentions: SocialMention[]): number {
  const hourCounts: Record<number, number> = {};

  for (const mention of mentions) {
    const hour = mention.postedAt.getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  }

  let peakHour = 21; // Default
  let maxCount = 0;

  for (const [hour, count] of Object.entries(hourCounts)) {
    if (count > maxCount) {
      maxCount = count;
      peakHour = parseInt(hour);
    }
  }

  return peakHour;
}

/**
 * Get influencer tier based on follower count
 */
function getInfluencerTier(
  followers: number
): 'micro' | 'mid' | 'macro' | 'mega' | null {
  if (followers >= INFLUENCER_THRESHOLDS.mega) return 'mega';
  if (followers >= INFLUENCER_THRESHOLDS.macro) return 'macro';
  if (followers >= INFLUENCER_THRESHOLDS.mid) return 'mid';
  if (followers >= INFLUENCER_THRESHOLDS.micro) return 'micro';
  return null;
}

/**
 * Fetch and convert Instagram mentions
 */
async function fetchInstagramMentions(
  query: SocialSearchQuery,
  venueId: string
): Promise<SocialMention[]> {
  try {
    const posts = await getRecentInstagram(query, 24); // Last 24 hours
    return posts.map(post => instagramPostToMention(post, venueId));
  } catch (error) {
    console.error('Instagram fetch error:', error);
    return [];
  }
}

/**
 * Fetch and convert TikTok mentions
 */
async function fetchTikTokMentions(
  query: SocialSearchQuery,
  venueId: string
): Promise<SocialMention[]> {
  try {
    const videos = await getRecentTikTok(query, 24);
    return videos.map(video => tiktokVideoToMention(video, venueId));
  } catch (error) {
    console.error('TikTok fetch error:', error);
    return [];
  }
}

/**
 * Fetch and convert Twitter mentions
 */
async function fetchTwitterMentions(
  query: SocialSearchQuery,
  venueId: string
): Promise<SocialMention[]> {
  try {
    const tweets = await getRecentTwitter(query, 24);
    return tweets.map(tweet => twitterPostToMention(tweet, venueId));
  } catch (error) {
    console.error('Twitter fetch error:', error);
    return [];
  }
}

/**
 * Calculate comprehensive social stats for a venue
 * Used for the scoring algorithm
 */
export async function calculateVenueSocialStats(
  venueId: string,
  venueName: string,
  venueSlug: string,
  venueCoords: { lat: number; lng: number }
): Promise<VenueSocialStats> {
  const buzz = await calculateRealTimeBuzz(
    venueId,
    venueSlug,
    venueName,
    venueCoords
  );

  const query: SocialSearchQuery = {
    venueNames: [venueName],
    hashtags: [venueSlug.replace(/-/g, '')],
    locationIds: {},
    coordinates: {
      lat: venueCoords.lat,
      lng: venueCoords.lng,
      radiusMeters: 500,
    },
  };

  // Get all mentions for full stats
  const [instagram, tiktok, twitter] = await Promise.all([
    fetchInstagramMentions(query, venueId),
    fetchTikTokMentions(query, venueId),
    fetchTwitterMentions(query, venueId),
  ]);

  const allMentions = [...instagram, ...tiktok, ...twitter];
  const now = new Date();
  const hourAgo = new Date(now.getTime() - TIME_WINDOWS.hourly);
  const dayAgo = new Date(now.getTime() - TIME_WINDOWS.daily);
  const weekAgo = new Date(now.getTime() - TIME_WINDOWS.weekly);

  const lastHour = allMentions.filter(m => m.postedAt >= hourAgo);
  const last24h = allMentions.filter(m => m.postedAt >= dayAgo);
  const last7d = allMentions.filter(m => m.postedAt >= weekAgo);

  // Calculate platform breakdown
  const platformCounts = (mentions: SocialMention[]) => ({
    instagram: mentions.filter(m => m.platform === 'instagram').length,
    tiktok: mentions.filter(m => m.platform === 'tiktok').length,
    twitter: mentions.filter(m => m.platform === 'twitter').length,
  });

  // Calculate hashtag frequency
  const hashtagCounts: Record<string, number> = {};
  for (const mention of allMentions) {
    for (const tag of mention.hashtags) {
      hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
    }
  }
  const topHashtags = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  // Count influencer mentions
  const influencerMentions = allMentions.filter(
    m => m.authorFollowers >= INFLUENCER_THRESHOLDS.micro
  ).length;

  // Count viral posts
  const viralPosts = allMentions.filter(m => m.engagementScore >= 80).length;

  // Calculate sentiment
  const avgSentiment = (mentions: SocialMention[]) =>
    mentions.length > 0
      ? mentions.reduce((sum, m) => {
          const sentiment = analyzeSentiment(m.content);
          return sum + sentiment.score;
        }, 0) / mentions.length
      : 0;

  // Calculate trend
  const prevWeek = allMentions.filter(
    m => m.postedAt >= new Date(weekAgo.getTime() - TIME_WINDOWS.weekly) &&
         m.postedAt < weekAgo
  );
  const trendPercentage = prevWeek.length > 0
    ? ((last7d.length - prevWeek.length) / prevWeek.length) * 100
    : last7d.length > 0 ? 100 : 0;

  return {
    venueId,
    lastHour: {
      mentions: lastHour.length,
      engagement: lastHour.reduce((sum, m) => sum + m.engagementScore, 0),
      sentiment: avgSentiment(lastHour),
      platforms: platformCounts(lastHour),
    },
    last24Hours: {
      mentions: last24h.length,
      engagement: last24h.reduce((sum, m) => sum + m.engagementScore, 0),
      sentiment: avgSentiment(last24h),
      peakHour: buzz.peakHour,
      platforms: platformCounts(last24h),
    },
    last7Days: {
      mentions: last7d.length,
      engagement: last7d.reduce((sum, m) => sum + m.engagementScore, 0),
      avgDailyMentions: last7d.length / 7,
      trend: trendPercentage > 10 ? 'up' : trendPercentage < -10 ? 'down' : 'stable',
      trendPercentage,
    },
    topHashtags,
    influencerMentions,
    viralPosts,
    buzzScore: buzz.currentPulse,
  };
}

/**
 * Get all venues sorted by current buzz level
 * This is the "What's Popping Right Now" feature
 */
export async function getVenuesByBuzz(
  venues: Array<{ id: string; name: string; slug: string; lat: number; lng: number }>
): Promise<RealTimeBuzz[]> {
  const buzzPromises = venues.map(venue =>
    calculateRealTimeBuzz(venue.id, venue.slug, venue.name, { lat: venue.lat, lng: venue.lng })
  );

  const buzzResults = await Promise.all(buzzPromises);

  // Sort by current pulse (highest first)
  return buzzResults.sort((a, b) => b.currentPulse - a.currentPulse);
}

/**
 * Convert real-time buzz to a scoring factor (0-100)
 * This is used by the main scoring algorithm
 */
export function buzzToScoringFactor(buzz: RealTimeBuzz): number {
  let score = buzz.currentPulse;

  // Boost for trending up
  if (buzz.hourlyTrend === 'exploding') {
    score *= 1.5;
  } else if (buzz.hourlyTrend === 'rising') {
    score *= 1.2;
  } else if (buzz.hourlyTrend === 'falling') {
    score *= 0.8;
  } else if (buzz.hourlyTrend === 'dead') {
    score *= 0.5;
  }

  // Boost for live activity
  if (buzz.liveNow) {
    score += 20;
  }

  // Boost for multi-platform activity
  if (buzz.activePlatforms.length >= 3) {
    score *= 1.2;
  } else if (buzz.activePlatforms.length >= 2) {
    score *= 1.1;
  }

  // Cap at 100
  return Math.min(100, Math.round(score));
}

/**
 * Generate hourly pulse record for storage
 */
export function generateHourlyPulse(
  venueId: string,
  mentions: SocialMention[],
  platform: SocialPlatform | 'all' = 'all'
): HourlyActivityPulse {
  const now = new Date();
  const hourTimestamp = new Date(now);
  hourTimestamp.setMinutes(0, 0, 0);

  const platformMentions = platform === 'all'
    ? mentions
    : mentions.filter(m => m.platform === platform);

  const uniquePosters = new Set(platformMentions.map(m => m.authorUsername)).size;

  const hashtagCounts: Record<string, number> = {};
  for (const mention of platformMentions) {
    for (const tag of mention.hashtags) {
      hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
    }
  }
  const topHashtags = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  return {
    id: `${venueId}_${hourTimestamp.toISOString()}_${platform}`,
    venueId,
    hour: hourTimestamp,
    platform,
    mentionCount: platformMentions.length,
    totalEngagement: platformMentions.reduce((sum, m) => sum + m.engagementScore, 0),
    avgSentiment: platformMentions.length > 0
      ? platformMentions.reduce((sum, m) => sum + analyzeSentiment(m.content).score, 0) / platformMentions.length
      : 0,
    viralPosts: platformMentions.filter(m => m.engagementScore >= 80).length,
    liveStreamsCount: platformMentions.filter(m => m.isLive).length,
    uniquePosters,
    topHashtags,
    peakActivityMinute: findPeakMinute(platformMentions),
    pulseScore: calculatePulseScore(platformMentions, now),
  };
}

function findPeakMinute(mentions: SocialMention[]): number {
  if (mentions.length === 0) return 0;

  const minuteCounts: Record<number, number> = {};
  for (const mention of mentions) {
    const minute = mention.postedAt.getMinutes();
    minuteCounts[minute] = (minuteCounts[minute] || 0) + 1;
  }

  let peakMinute = 0;
  let maxCount = 0;
  for (const [minute, count] of Object.entries(minuteCounts)) {
    if (count > maxCount) {
      maxCount = count;
      peakMinute = parseInt(minute);
    }
  }

  return peakMinute;
}
