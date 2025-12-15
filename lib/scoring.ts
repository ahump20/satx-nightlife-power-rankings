/**
 * Transparent scoring algorithm for venue power rankings
 * 
 * Factors:
 * - Check-ins (40%)
 * - Average rating (30%)
 * - Review count (20%)
 * - Expert boost (10% for designated venues)
 * 
 * Expert venues: George's Keep, Camp 1604, Kung Fu Saloon, The Venue
 */

interface ScoringInput {
  checkInCount: number;
  avgRating: number; // 0-5 scale
  reviewCount: number;
  expertBoost: number; // 0-1.5+ multiplier
  isExpertVenue: boolean;
}

const WEIGHTS = {
  checkIns: 0.4,
  rating: 0.3,
  reviews: 0.2,
  expert: 0.1,
};

const NORMALIZATION_FACTORS = {
  maxCheckIns: 1000, // Expected max check-ins per month
  maxReviews: 500,    // Expected max reviews
};

export function calculateVenueScore(input: ScoringInput): number {
  // Normalize check-ins (0-1 scale)
  const normalizedCheckIns = Math.min(
    input.checkInCount / NORMALIZATION_FACTORS.maxCheckIns,
    1
  );

  // Normalize rating (0-1 scale, already on 0-5)
  const normalizedRating = input.avgRating / 5;

  // Normalize reviews (0-1 scale)
  const normalizedReviews = Math.min(
    input.reviewCount / NORMALIZATION_FACTORS.maxReviews,
    1
  );

  // Calculate base score (0-100 scale)
  let score =
    normalizedCheckIns * WEIGHTS.checkIns * 100 +
    normalizedRating * WEIGHTS.rating * 100 +
    normalizedReviews * WEIGHTS.reviews * 100;

  // Apply expert boost
  if (input.isExpertVenue && input.expertBoost > 0) {
    score += input.expertBoost * WEIGHTS.expert * 100;
  }

  return Math.round(score * 100) / 100; // Round to 2 decimal places
}

export function determineTrend(
  currentRank: number,
  previousRank: number | null
): { direction: 'up' | 'down' | 'stable' | 'new'; change: number } {
  if (previousRank === null) {
    return { direction: 'new', change: 0 };
  }

  const change = previousRank - currentRank; // Positive = moved up in rankings

  if (change > 0) {
    return { direction: 'up', change };
  } else if (change < 0) {
    return { direction: 'down', change: Math.abs(change) };
  } else {
    return { direction: 'stable', change: 0 };
  }
}

export const EXPERT_VENUES = [
  "George's Keep",
  "Camp 1604",
  "Kung Fu Saloon",
  "The Venue",
];
