// Transparent Power Ranking Scoring Algorithm
// All weights and calculations are documented for full transparency

import { ScoreBreakdown, EXPERT_PICKS } from '../db/schema';

/**
 * SCORING WEIGHTS - Fully Transparent
 * These weights determine how each factor contributes to the final power score.
 * Total weights sum to 1.0 (100%)
 */
export const SCORING_WEIGHTS = {
  // Review quality (40% total)
  googleRating: 0.20,      // Google Places rating (0-5 normalized)
  yelpRating: 0.15,        // Yelp rating (0-5 normalized)
  reviewVelocity: 0.05,    // Recent review activity trend

  // Engagement & Activity (25% total)
  dealsAndSpecials: 0.10,  // Active deals/happy hours
  eventsTonight: 0.10,     // Events happening now/soon
  socialBuzz: 0.05,        // Social media mentions (where API permitted)

  // Location & Convenience (15% total)
  proximity: 0.10,         // Distance from user (decays with distance)
  openNow: 0.05,           // Currently open bonus

  // Expert & Trending (20% total)
  expertPick: 0.10,        // Curated expert recommendations
  trendingMomentum: 0.10,  // Week-over-week ranking change
} as const;

/**
 * Calculate the complete power score for a venue
 */
export function calculatePowerScore(input: ScoringInput): ScoringResult {
  const breakdown: ScoreBreakdown = {
    googleRatingScore: 0,
    yelpRatingScore: 0,
    reviewVelocityScore: 0,
    dealsScore: 0,
    proximityBonus: 0,
    trendingBonus: 0,
    expertBoost: 0,
    socialBuzzScore: 0,
    totalWeightedScore: 0,
  };

  // 1. Google Rating Score (0-100 scale)
  if (input.googleRating !== null) {
    breakdown.googleRatingScore = normalizeRating(input.googleRating) * 100;
  }

  // 2. Yelp Rating Score (0-100 scale)
  if (input.yelpRating !== null) {
    breakdown.yelpRatingScore = normalizeRating(input.yelpRating) * 100;
  }

  // 3. Review Velocity Score (recent review momentum)
  breakdown.reviewVelocityScore = calculateReviewVelocity(
    input.recentReviewCount,
    input.totalReviewCount
  );

  // 4. Deals Score (active specials boost)
  breakdown.dealsScore = calculateDealsScore(
    input.activeDealsCount,
    input.hasHappyHourNow
  );

  // 5. Proximity Bonus (distance decay)
  if (input.userDistance !== null) {
    breakdown.proximityBonus = calculateProximityScore(input.userDistance);
  }

  // 6. Trending Bonus (rank momentum)
  if (input.previousRank !== null && input.currentRank !== null) {
    breakdown.trendingBonus = calculateTrendingScore(
      input.previousRank,
      input.currentRank
    );
  }

  // 7. Social Buzz Score (real-time social media activity)
  if (input.socialBuzzScore !== undefined && input.socialBuzzScore !== null) {
    breakdown.socialBuzzScore = input.socialBuzzScore;
  } else {
    // Default to neutral if no social data available
    breakdown.socialBuzzScore = 50;
  }

  // Calculate weighted score before expert boost
  const baseScore =
    (breakdown.googleRatingScore * SCORING_WEIGHTS.googleRating) +
    (breakdown.yelpRatingScore * SCORING_WEIGHTS.yelpRating) +
    (breakdown.reviewVelocityScore * SCORING_WEIGHTS.reviewVelocity) +
    (breakdown.dealsScore * SCORING_WEIGHTS.dealsAndSpecials) +
    (breakdown.proximityBonus * SCORING_WEIGHTS.proximity) +
    (breakdown.trendingBonus * SCORING_WEIGHTS.trendingMomentum) +
    (breakdown.socialBuzzScore * SCORING_WEIGHTS.socialBuzz) +
    (input.isOpenNow ? 100 * SCORING_WEIGHTS.openNow : 0) +
    (input.hasEventTonight ? 100 * SCORING_WEIGHTS.eventsTonight : 0);

  // 7. Apply Expert Boost (multiplicative, transparent)
  const expertConfig = input.venueSlug ? EXPERT_PICKS[input.venueSlug] : null;
  if (expertConfig || input.expertBoostMultiplier > 1) {
    const boost = expertConfig?.boost || input.expertBoostMultiplier;
    breakdown.expertBoost = (boost - 1) * 100; // Convert to percentage display
    breakdown.totalWeightedScore = baseScore * boost;
  } else {
    breakdown.totalWeightedScore = baseScore;
  }

  return {
    powerScore: Math.round(breakdown.totalWeightedScore * 10) / 10,
    breakdown,
    explanation: generateScoreExplanation(breakdown, input),
  };
}

/**
 * Normalize rating from 0-5 to 0-1 scale with quality threshold
 * Ratings below 3.0 are penalized more heavily
 */
function normalizeRating(rating: number): number {
  if (rating < 3.0) {
    // Penalize low ratings more heavily
    return (rating / 5) * 0.5;
  }
  // Linear scale for 3.0-5.0
  return 0.5 + ((rating - 3.0) / 2.0) * 0.5;
}

/**
 * Calculate review velocity score based on recent activity
 * Higher score for venues with growing review momentum
 */
function calculateReviewVelocity(recentCount: number, totalCount: number): number {
  if (totalCount === 0) return 50; // Neutral for new venues

  const velocityRatio = recentCount / Math.max(totalCount * 0.1, 1);

  // Cap at 100, baseline at 50
  return Math.min(100, 50 + (velocityRatio * 25));
}

/**
 * Calculate deals score based on active specials
 */
function calculateDealsScore(activeDeals: number, hasHappyHour: boolean): number {
  let score = 0;

  // Base score for having deals
  score += Math.min(activeDeals * 15, 60);

  // Happy hour bonus
  if (hasHappyHour) {
    score += 40;
  }

  return Math.min(score, 100);
}

/**
 * Calculate proximity score with distance decay
 * Full score within 1 mile, decays to 0 at 25 miles
 */
function calculateProximityScore(distanceMiles: number): number {
  if (distanceMiles <= 1) return 100;
  if (distanceMiles >= 25) return 0;

  // Exponential decay
  const decay = Math.exp(-0.15 * (distanceMiles - 1));
  return Math.round(decay * 100);
}

/**
 * Calculate trending score based on rank change
 * Positive for improving ranks, negative for declining
 */
function calculateTrendingScore(previousRank: number, currentRank: number): number {
  const change = previousRank - currentRank; // Positive = improved

  if (change === 0) return 50; // Neutral

  // Cap at ±50 rank changes
  const cappedChange = Math.max(-50, Math.min(50, change));

  return 50 + cappedChange;
}

/**
 * Generate human-readable explanation of the score
 */
function generateScoreExplanation(
  breakdown: ScoreBreakdown,
  input: ScoringInput
): string {
  const parts: string[] = [];

  if (breakdown.googleRatingScore >= 90) {
    parts.push('Excellent Google reviews');
  } else if (breakdown.googleRatingScore >= 80) {
    parts.push('Strong Google rating');
  }

  if (breakdown.yelpRatingScore >= 90) {
    parts.push('Top Yelp rating');
  }

  if (breakdown.dealsScore >= 60) {
    parts.push('Great deals tonight');
  }

  if (breakdown.proximityBonus >= 80) {
    parts.push('Very close to you');
  }

  if (breakdown.trendingBonus >= 70) {
    parts.push('Trending up');
  } else if (breakdown.trendingBonus <= 30) {
    parts.push('Cooling off');
  }

  // Social buzz explanations
  if (breakdown.socialBuzzScore >= 85) {
    parts.push('EXPLODING on social media');
  } else if (breakdown.socialBuzzScore >= 70) {
    parts.push('Buzzing on social');
  } else if (breakdown.socialBuzzScore >= 50) {
    parts.push('Active on social');
  }

  if (breakdown.expertBoost > 0) {
    const expertConfig = input.venueSlug ? EXPERT_PICKS[input.venueSlug] : null;
    if (expertConfig) {
      parts.push(`Expert pick: ${expertConfig.reason}`);
    } else {
      parts.push('Expert recommended');
    }
  }

  return parts.length > 0 ? parts.join(' • ') : 'Solid local option';
}

/**
 * Get weight explanation for transparency display
 */
export function getWeightExplanation(): WeightExplanation[] {
  return [
    {
      name: 'Google Rating',
      weight: SCORING_WEIGHTS.googleRating,
      description: 'Average rating from Google Places reviews',
    },
    {
      name: 'Yelp Rating',
      weight: SCORING_WEIGHTS.yelpRating,
      description: 'Average rating from Yelp reviews',
    },
    {
      name: 'Review Momentum',
      weight: SCORING_WEIGHTS.reviewVelocity,
      description: 'Recent review activity compared to historical average',
    },
    {
      name: 'Deals & Specials',
      weight: SCORING_WEIGHTS.dealsAndSpecials,
      description: 'Active happy hours and promotional offers',
    },
    {
      name: 'Events Tonight',
      weight: SCORING_WEIGHTS.eventsTonight,
      description: 'Live music, trivia, or special events happening now',
    },
    {
      name: 'Social Buzz',
      weight: SCORING_WEIGHTS.socialBuzz,
      description: 'Recent social media activity and mentions',
    },
    {
      name: 'Proximity',
      weight: SCORING_WEIGHTS.proximity,
      description: 'Distance from your current location',
    },
    {
      name: 'Open Now',
      weight: SCORING_WEIGHTS.openNow,
      description: 'Bonus for venues currently open',
    },
    {
      name: 'Expert Pick',
      weight: SCORING_WEIGHTS.expertPick,
      description: 'Curated recommendations from local experts',
    },
    {
      name: 'Trending',
      weight: SCORING_WEIGHTS.trendingMomentum,
      description: 'Week-over-week ranking momentum',
    },
  ];
}

// Types
export interface ScoringInput {
  venueSlug: string | null;
  googleRating: number | null;
  yelpRating: number | null;
  recentReviewCount: number;
  totalReviewCount: number;
  activeDealsCount: number;
  hasHappyHourNow: boolean;
  hasEventTonight: boolean;
  isOpenNow: boolean;
  userDistance: number | null;
  previousRank: number | null;
  currentRank: number | null;
  expertBoostMultiplier: number;
  // Social media buzz score (0-100)
  // Higher scores = more social activity, trending posts, live streams
  socialBuzzScore?: number | null;
}

export interface ScoringResult {
  powerScore: number;
  breakdown: ScoreBreakdown;
  explanation: string;
}

export interface WeightExplanation {
  name: string;
  weight: number;
  description: string;
}
