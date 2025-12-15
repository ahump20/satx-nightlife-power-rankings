/**
 * Scoring Engine
 * Transparent, documented scoring algorithms for all leaderboards
 */

import type { Env, ScoringWeights, TonightScore, MonthlyScore, TrendingScore, SignalSummary, SocialSignals } from '../types';

/**
 * Get scoring weights from KV or use defaults
 */
export async function getWeights(env: Env): Promise<ScoringWeights> {
  const stored = await env.CONFIG.get('scoring_weights', 'json');
  if (stored) return stored as ScoringWeights;

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    tonight: {
      popularity: 30,
      quality: 25,
      openNow: 15,
      deals: 15,
      proximity: 10,
      expertBoost: 5,
    },
    monthly: {
      quality: 40,
      popularity: 30,
      consistency: 15,
      deals: 10,
      expertBoost: 5,
    },
    bayesian: { m: 10, C: 3.8 },
    proximity: { maxBoostMiles: 5, decayRate: 0.5 },
    recency: { tonightHalfLifeHours: 6, trendingHalfLifeDays: 7 },
    social: {
      twitterWeight: 0.4,
      instagramWeight: 0.35,
      tiktokWeight: 0.25,
      viralThreshold: 50,
      mentionDecayHours: 2,
    },
  };
}

/**
 * Calculate Bayesian-adjusted rating
 * Formula: (v/(v+m))*R + (m/(v+m))*C
 * Where:
 *   R = venue's average rating
 *   v = number of votes/reviews
 *   m = minimum votes threshold
 *   C = prior mean (average rating across all venues)
 */
export function bayesianRating(rating: number, voteCount: number, m: number, C: number): number {
  if (voteCount === 0) return C;
  return (voteCount / (voteCount + m)) * rating + (m / (voteCount + m)) * C;
}

/**
 * Calculate distance-based proximity bonus
 * Returns 0-1 multiplier (1 = closest, 0 = beyond max range)
 */
export function proximityBonus(distanceMiles: number, maxBoostMiles: number, decayRate: number): number {
  if (distanceMiles >= maxBoostMiles * 2) return 0;
  if (distanceMiles <= 0.5) return 1;
  return Math.exp(-decayRate * (distanceMiles / maxBoostMiles));
}

/**
 * Calculate recency weight for time-decayed signals
 */
export function recencyWeight(hoursAgo: number, halfLifeHours: number): number {
  return Math.pow(0.5, hoursAgo / halfLifeHours);
}

/**
 * Calculate Social Buzz Score
 * Combines Twitter, Instagram, and TikTok signals into a unified buzz metric
 *
 * Returns 0-100 score:
 * - 0-20: Low activity
 * - 20-40: Some buzz
 * - 40-60: Active
 * - 60-80: Hot
 * - 80-100: Viral/Trending
 */
export function calculateSocialBuzzScore(
  social: {
    twitter: {
      mentions1h: number;
      mentions24h: number;
      engagement: number;
      sentiment: number;
    };
    instagram: {
      mentions1h: number;
      mentions24h: number;
      engagement: number;
    };
    tiktok: {
      mentions24h: number;
      viralScore: number;
      viewCount: number;
    };
  },
  weights?: {
    twitterWeight?: number;
    instagramWeight?: number;
    tiktokWeight?: number;
    viralThreshold?: number;
  }
): {
  buzzScore: number;
  breakdown: {
    twitter: number;
    instagram: number;
    tiktok: number;
  };
  trendDirection: 'rising' | 'falling' | 'stable';
  isViral: boolean;
} {
  const {
    twitterWeight = 0.4,
    instagramWeight = 0.35,
    tiktokWeight = 0.25,
    viralThreshold = 50,
  } = weights || {};

  // Twitter score (0-100)
  // Recent mentions weighted heavily + engagement + sentiment boost
  const twitterRecent = Math.min(social.twitter.mentions1h * 10, 50);
  const twitterDaily = Math.min(social.twitter.mentions24h * 2, 30);
  const twitterEngagement = Math.min(social.twitter.engagement / 100, 15);
  const sentimentBoost = social.twitter.sentiment > 0 ? social.twitter.sentiment * 5 : 0;
  const twitterScore = Math.min(twitterRecent + twitterDaily + twitterEngagement + sentimentBoost, 100);

  // Instagram score (0-100)
  // Strong hourly signals + engagement
  const instagramRecent = Math.min(social.instagram.mentions1h * 15, 60);
  const instagramDaily = Math.min(social.instagram.mentions24h * 1.5, 25);
  const instagramEngagement = Math.min(social.instagram.engagement / 50, 15);
  const instagramScore = Math.min(instagramRecent + instagramDaily + instagramEngagement, 100);

  // TikTok score (0-100)
  // Viral potential is key + view count
  const tiktokViral = social.tiktok.viralScore;
  const tiktokMentions = Math.min(social.tiktok.mentions24h * 3, 30);
  const tiktokViews = Math.min(social.tiktok.viewCount / 10000, 20);
  const tiktokScore = Math.min(tiktokViral + tiktokMentions + tiktokViews, 100);

  // Combined weighted score
  const buzzScore = Math.round(
    twitterScore * twitterWeight +
    instagramScore * instagramWeight +
    tiktokScore * tiktokWeight
  );

  // Determine trend direction based on hourly vs daily ratio
  const hourlyActivity = social.twitter.mentions1h + social.instagram.mentions1h;
  const dailyActivity = (social.twitter.mentions24h + social.instagram.mentions24h) / 24;
  const ratio = hourlyActivity / Math.max(dailyActivity, 0.1);

  let trendDirection: 'rising' | 'falling' | 'stable' = 'stable';
  if (ratio > 2) trendDirection = 'rising';
  else if (ratio < 0.5) trendDirection = 'falling';

  // Is this viral?
  const isViral = buzzScore >= viralThreshold || social.tiktok.viralScore >= 70;

  return {
    buzzScore,
    breakdown: {
      twitter: Math.round(twitterScore),
      instagram: Math.round(instagramScore),
      tiktok: Math.round(tiktokScore),
    },
    trendDirection,
    isViral,
  };
}

/**
 * Calculate Tonight Popularity Score
 *
 * Components (summing to 100):
 * - popularity (30): recent activity signals (reviews, checkins, mentions)
 * - quality (25): Bayesian-adjusted rating
 * - openNow (15): currently open bonus
 * - deals (15): active deals/specials
 * - proximity (10): distance from user
 * - expertBoost (5): expert pick multiplier
 */
export function calculateTonightScore(
  input: {
    rating: number;
    ratingCount: number;
    recentReviews: number;
    checkins: number;
    mentions: number;
    isOpen: boolean;
    activeDeals: number;
    distanceMiles: number;
    expertMultiplier: number;
    hoursAgo: number;
    // Social signals (optional - will boost score when available)
    socialBuzz?: {
      twitter: { mentions1h: number; mentions24h: number; engagement: number; sentiment: number };
      instagram: { mentions1h: number; mentions24h: number; engagement: number };
      tiktok: { mentions24h: number; viralScore: number; viewCount: number };
    };
  },
  weights: ScoringWeights
): TonightScore {
  const { tonight, bayesian, proximity } = weights;

  // Quality score (0-25): Bayesian rating normalized
  const adjustedRating = bayesianRating(input.rating, input.ratingCount, bayesian.m, bayesian.C);
  const qualityScore = (adjustedRating / 5) * tonight.quality;

  // Popularity score (0-30): Combined activity signals INCLUDING social media
  let socialBoost = 0;
  let socialBuzzData = null;

  if (input.socialBuzz) {
    socialBuzzData = calculateSocialBuzzScore(input.socialBuzz);
    // Social buzz adds up to 50% boost to popularity score
    socialBoost = (socialBuzzData.buzzScore / 100) * 0.5;
  }

  const activitySignal = Math.min(
    (input.recentReviews * 3 + input.checkins * 2 + input.mentions) / 20,
    1
  );
  const recencyFactor = recencyWeight(input.hoursAgo, weights.recency.tonightHalfLifeHours);
  const basePopularity = activitySignal * recencyFactor * tonight.popularity;
  const popularityScore = Math.min(basePopularity * (1 + socialBoost), tonight.popularity);

  // Open now bonus (0-15)
  const openNowScore = input.isOpen ? tonight.openNow : 0;

  // Deals score (0-15): More/better deals = higher score
  const dealsScore = Math.min(input.activeDeals / 3, 1) * tonight.deals;

  // Proximity score (0-10)
  const proximityMultiplier = proximityBonus(input.distanceMiles, proximity.maxBoostMiles, proximity.decayRate);
  const proximityScore = proximityMultiplier * tonight.proximity;

  // Expert boost (0-5)
  const expertBoostScore = (input.expertMultiplier - 1) * 100 * (tonight.expertBoost / 15);

  // Total
  const total = Math.min(
    qualityScore + popularityScore + openNowScore + dealsScore + proximityScore + expertBoostScore,
    100
  );

  // Determine confidence based on data quality
  const confidence = input.ratingCount > 50 && input.recentReviews > 2 ? 'high' : input.ratingCount > 10 ? 'medium' : 'low';

  // Build sources list
  const sources = ['google', 'yelp'];
  if (input.socialBuzz) {
    if (input.socialBuzz.twitter.mentions1h > 0 || input.socialBuzz.twitter.mentions24h > 0) sources.push('twitter');
    if (input.socialBuzz.instagram.mentions1h > 0 || input.socialBuzz.instagram.mentions24h > 0) sources.push('instagram');
    if (input.socialBuzz.tiktok.mentions24h > 0 || input.socialBuzz.tiktok.viralScore > 0) sources.push('tiktok');
  }

  return {
    total: Math.round(total * 10) / 10,
    breakdown: {
      popularity: Math.round(popularityScore * 10) / 10,
      quality: Math.round(qualityScore * 10) / 10,
      openNow: Math.round(openNowScore * 10) / 10,
      deals: Math.round(dealsScore * 10) / 10,
      proximity: Math.round(proximityScore * 10) / 10,
      expertBoost: Math.round(expertBoostScore * 10) / 10,
    },
    confidence,
    signals: {
      rating: input.rating,
      ratingCount: input.ratingCount,
      recentReviews: input.recentReviews,
      eventsTonight: 0,
      activeDeals: input.activeDeals,
      sources,
    },
    // Include social buzz details if available
    ...(socialBuzzData && {
      socialBuzz: {
        buzzScore: socialBuzzData.buzzScore,
        breakdown: socialBuzzData.breakdown,
        trendDirection: socialBuzzData.trendDirection,
        isViral: socialBuzzData.isViral,
      },
    }),
  };
}

/**
 * Calculate Monthly Power Score
 *
 * Components (summing to 100):
 * - quality (40): Bayesian-adjusted rating + consistency
 * - popularity (30): Review velocity + volume
 * - consistency (15): Rating stability over time
 * - deals (10): Deal quality and completeness
 * - expertBoost (5): Expert pick multiplier
 */
export function calculateMonthlyScore(
  input: {
    avgRating: number;
    totalReviews: number;
    newReviewsThisMonth: number;
    previousMonthReviews: number;
    ratingStdDev: number;
    dealsQuality: number;
    expertMultiplier: number;
  },
  weights: ScoringWeights
): MonthlyScore {
  const { monthly, bayesian } = weights;

  // Quality score (0-40)
  const adjustedRating = bayesianRating(input.avgRating, input.totalReviews, bayesian.m, bayesian.C);
  const qualityScore = (adjustedRating / 5) * monthly.quality;

  // Popularity score (0-30): Review velocity normalized
  const reviewVelocity = input.newReviewsThisMonth / Math.max(input.previousMonthReviews, 1);
  const velocityNormalized = Math.min(reviewVelocity, 2) / 2;
  const volumeNormalized = Math.min(input.totalReviews / 500, 1);
  const popularityScore = (velocityNormalized * 0.6 + volumeNormalized * 0.4) * monthly.popularity;

  // Consistency score (0-15): Lower std dev = higher consistency
  const consistencyScore = Math.max(0, 1 - input.ratingStdDev / 1.5) * monthly.consistency;

  // Deals score (0-10)
  const dealsScore = input.dealsQuality * monthly.deals;

  // Expert boost (0-5)
  const expertBoostScore = (input.expertMultiplier - 1) * 100 * (monthly.expertBoost / 15);

  const total = Math.min(qualityScore + popularityScore + consistencyScore + dealsScore + expertBoostScore, 100);

  return {
    powerRank: 0, // Set externally after sorting
    powerScore: Math.round(total * 10) / 10,
    breakdown: {
      quality: Math.round(qualityScore * 10) / 10,
      popularity: Math.round(popularityScore * 10) / 10,
      consistency: Math.round(consistencyScore * 10) / 10,
      deals: Math.round(dealsScore * 10) / 10,
      expertBoost: Math.round(expertBoostScore * 10) / 10,
    },
  };
}

/**
 * Calculate Trending Score
 * Measures momentum: how quickly a venue is rising/falling
 */
export function calculateTrendingScore(
  input: {
    currentRank: number;
    previousRank: number;
    currentScore: number;
    previousScore: number;
    weekOverWeek: {
      ratingDelta: number;
      reviewsDelta: number;
    };
  }
): TrendingScore {
  // Rank momentum (positive = rising)
  const rankDelta = input.previousRank - input.currentRank;
  const scoreDelta = input.currentScore - input.previousScore;

  // Week-over-week activity
  const wowMomentum = (input.weekOverWeek.reviewsDelta * 5 + input.weekOverWeek.ratingDelta * 20);

  // Combined momentum (-100 to +100)
  const momentum = Math.max(-100, Math.min(100, rankDelta * 10 + scoreDelta * 2 + wowMomentum));

  // Direction
  const direction = momentum > 10 ? 'rising' : momentum < -10 ? 'falling' : 'stable';

  return {
    trendingRank: 0, // Set externally
    momentum: Math.round(momentum),
    direction,
    weekOverWeek: {
      ratingDelta: input.weekOverWeek.ratingDelta,
      reviewsDelta: input.weekOverWeek.reviewsDelta,
      scoreDelta: Math.round(scoreDelta * 10) / 10,
    },
    monthOverMonth: {
      rankDelta,
      scoreDelta: Math.round(scoreDelta * 10) / 10,
    },
  };
}

/**
 * F1-style points for monthly rankings
 */
export function calculatePoints(rank: number): number {
  const pointsTable: Record<number, number> = {
    1: 25,
    2: 18,
    3: 15,
    4: 12,
    5: 10,
    6: 8,
    7: 6,
    8: 4,
    9: 2,
    10: 1,
  };
  return pointsTable[rank] || 0;
}
