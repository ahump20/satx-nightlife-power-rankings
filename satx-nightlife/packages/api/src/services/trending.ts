/**
 * Trending Service
 * Fast risers and momentum tracking
 */

import type { Env, LeaderboardEntry, LeaderboardResponse, VenueWithScores, Badge, TrendingScore } from '../types';
import { calculateTrendingScore } from './scoring';
import { calculateDistance } from '../lib/geo';

interface TrendingOptions {
  year: number;
  month: number;
  center: { lat: number; lng: number };
  radiusMiles: number;
  limit: number;
}

export class TrendingService {
  constructor(private env: Env) {}

  async getLeaderboard(options: TrendingOptions): Promise<LeaderboardResponse> {
    const { year, month, center, radiusMiles, limit } = options;

    // Get current and previous month rankings
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    const result = await this.env.DB.prepare(`
      SELECT
        v.*,
        curr.power_rank as current_rank,
        curr.power_score as current_score,
        prev.power_rank as previous_rank,
        prev.power_score as previous_score,
        -- Week-over-week data from signals
        (
          SELECT AVG(avg_rating) FROM signals_daily sd
          WHERE sd.venue_id = v.id AND sd.date >= date('now', '-7 days')
        ) as recent_rating,
        (
          SELECT AVG(avg_rating) FROM signals_daily sd
          WHERE sd.venue_id = v.id AND sd.date >= date('now', '-14 days') AND sd.date < date('now', '-7 days')
        ) as prev_week_rating,
        (
          SELECT SUM(new_reviews_count) FROM signals_daily sd
          WHERE sd.venue_id = v.id AND sd.date >= date('now', '-7 days')
        ) as recent_reviews,
        (
          SELECT SUM(new_reviews_count) FROM signals_daily sd
          WHERE sd.venue_id = v.id AND sd.date >= date('now', '-14 days') AND sd.date < date('now', '-7 days')
        ) as prev_week_reviews
      FROM venues v
      LEFT JOIN leaderboard_monthly curr ON v.id = curr.venue_id
        AND curr.year = ? AND curr.month = ?
      LEFT JOIN leaderboard_monthly prev ON v.id = prev.venue_id
        AND prev.year = ? AND prev.month = ?
      WHERE v.is_active = 1
        AND (curr.power_rank IS NOT NULL OR prev.power_rank IS NOT NULL)
    `)
      .bind(year, month, prevYear, prevMonth)
      .all();

    // Calculate trending scores
    const venuesWithTrending: Array<VenueWithScores & { trendingScore: TrendingScore }> = [];

    for (const row of result.results || []) {
      const venue = row as any;
      const distance = calculateDistance(center.lat, center.lng, venue.latitude, venue.longitude);

      if (distance > radiusMiles) continue;

      // Calculate week-over-week deltas
      const ratingDelta = (venue.recent_rating || 0) - (venue.prev_week_rating || 0);
      const reviewsDelta = (venue.recent_reviews || 0) - (venue.prev_week_reviews || 0);

      // Calculate trending score
      const trendingScore = calculateTrendingScore({
        currentRank: venue.current_rank || 999,
        previousRank: venue.previous_rank || venue.current_rank || 999,
        currentScore: venue.current_score || 0,
        previousScore: venue.previous_score || venue.current_score || 0,
        weekOverWeek: {
          ratingDelta,
          reviewsDelta,
        },
      });

      venuesWithTrending.push({
        id: venue.id,
        name: venue.name,
        slug: venue.slug,
        address: venue.address,
        city: venue.city,
        state: venue.state,
        latitude: venue.latitude,
        longitude: venue.longitude,
        category: venue.category,
        subCategory: venue.sub_category,
        priceLevel: venue.price_level,
        coverImageUrl: venue.cover_image_url,
        isVerified: Boolean(venue.is_verified),
        isActive: true,
        expertPickRank: venue.expert_pick_rank,
        expertBoostMultiplier: venue.expert_boost_multiplier || 1.0,
        createdAt: venue.created_at,
        updatedAt: venue.updated_at,
        distance,
        scores: {
          trending: trendingScore,
        },
        trendingScore,
      });
    }

    // Sort by absolute momentum (biggest movers first), then by direction (risers first)
    venuesWithTrending.sort((a, b) => {
      // Risers first
      if (a.trendingScore.direction === 'rising' && b.trendingScore.direction !== 'rising') return -1;
      if (b.trendingScore.direction === 'rising' && a.trendingScore.direction !== 'rising') return 1;

      // Then by absolute momentum
      return Math.abs(b.trendingScore.momentum) - Math.abs(a.trendingScore.momentum);
    });

    // Assign trending ranks
    venuesWithTrending.forEach((v, idx) => {
      v.trendingScore.trendingRank = idx + 1;
    });

    // Build entries
    const entries: LeaderboardEntry[] = venuesWithTrending.slice(0, limit).map((v) => {
      const badges: Badge[] = [];

      if (v.trendingScore.direction === 'rising') {
        if (v.trendingScore.momentum >= 50) {
          badges.push({ type: 'trending_up', label: '🚀 Hot Streak' });
        } else {
          badges.push({ type: 'trending_up', label: '↑ Rising' });
        }
      } else if (v.trendingScore.direction === 'falling') {
        badges.push({ type: 'most_improved', label: '↓ Cooling' });
      }

      if (v.trendingScore.monthOverMonth.rankDelta && v.trendingScore.monthOverMonth.rankDelta >= 5) {
        badges.push({ type: 'most_improved', label: 'Most Improved' });
      }

      if (v.expertPickRank && v.expertPickRank <= 4) {
        badges.push({ type: 'expert_pick', label: `Expert Pick` });
      }

      return {
        rank: v.trendingScore.trendingRank,
        venue: v,
        score: v.trendingScore.momentum,
        badges,
      };
    });

    return {
      type: 'trending',
      period: { year, month },
      entries,
      meta: {
        total: venuesWithTrending.length,
        radius: radiusMiles,
        center,
        lastUpdated: new Date().toISOString(),
      },
    };
  }
}
