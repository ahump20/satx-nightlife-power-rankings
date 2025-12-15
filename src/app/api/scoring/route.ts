import { NextResponse } from 'next/server';
import { SCORING_WEIGHTS, getWeightExplanation } from '@/lib/scoring/algorithm';
import { EXPERT_PICKS } from '@/lib/db/schema';

export async function GET() {
  const weights = getWeightExplanation();

  // Format weights as percentages
  const formattedWeights = weights.map((w) => ({
    ...w,
    percentage: Math.round(w.weight * 100),
  }));

  // Group by category
  const categories = {
    quality: formattedWeights.filter((w) =>
      ['Google Rating', 'Yelp Rating', 'Review Momentum'].includes(w.name)
    ),
    engagement: formattedWeights.filter((w) =>
      ['Deals & Specials', 'Events Tonight', 'Social Buzz'].includes(w.name)
    ),
    convenience: formattedWeights.filter((w) =>
      ['Proximity', 'Open Now'].includes(w.name)
    ),
    special: formattedWeights.filter((w) =>
      ['Expert Pick', 'Trending'].includes(w.name)
    ),
  };

  // Expert picks info
  const expertPicks = Object.entries(EXPERT_PICKS).map(([slug, config]) => ({
    slug,
    boostPercentage: Math.round((config.boost - 1) * 100),
    reason: config.reason,
  }));

  return NextResponse.json({
    weights: formattedWeights,
    categories,
    expertPicks,
    methodology: {
      title: 'Transparent Scoring Methodology',
      description: 'Our power rankings combine multiple data sources with transparent weighting. Every factor is documented and the formula is public.',
      formula: 'Power Score = (Weighted Factor Sum) × Expert Boost Multiplier',
      updates: 'Scores refresh every 5 minutes. Rankings are recalculated daily.',
    },
    timestamp: new Date().toISOString(),
  });
}
