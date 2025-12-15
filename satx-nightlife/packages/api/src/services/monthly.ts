/**
 * Monthly Service
 * Monthly power rankings leaderboard
 */

import type { Env, LeaderboardEntry, LeaderboardResponse, VenueWithScores, Badge, MonthlyScore } from '../types';
import { getWeights, calculateMonthlyScore } from './scoring';
import { calculateDistance } from '../lib/geo';

interface MonthlyOptions {
  year: number;
  month: number;
  center: { lat: number; lng: number };
  radiusMiles: number;
  limit: number;
  offset: number;
  expertMode: boolean;
}

export class MonthlyService {
  constructor(private env: Env) {}

  async getLeaderboard(options: MonthlyOptions): Promise<LeaderboardResponse> {
    const { year, month, center, radiusMiles, limit, offset, expertMode } = options;
    const weights = await getWeights(this.env);

    // First, try to get pre-computed leaderboard
    const precomputed = await this.env.DB.prepare(`
      SELECT
        lm.*,
        v.id, v.name, v.slug, v.address, v.city, v.state,
        v.latitude, v.longitude, v.category, v.sub_category,
        v.price_level, v.cover_image_url, v.expert_pick_rank,
        v.expert_boost_multiplier
      FROM leaderboard_monthly lm
      JOIN venues v ON lm.venue_id = v.id
      WHERE lm.year = ? AND lm.month = ? AND v.is_active = 1
      ORDER BY lm.power_rank ASC
    `)
      .bind(year, month)
      .all();

    let entries: LeaderboardEntry[];
    let total: number;

    if (precomputed.results && precomputed.results.length > 0) {
      // Use pre-computed rankings
      const filtered = (precomputed.results as any[]).filter((row) => {
        const distance = calculateDistance(center.lat, center.lng, row.latitude, row.longitude);
        return distance <= radiusMiles;
      });

      total = filtered.length;

      entries = filtered.slice(offset, offset + limit).map((row, idx) => {
        const distance = calculateDistance(center.lat, center.lng, row.latitude, row.longitude);
        const venue = this.mapRowToVenue(row, distance);

        const monthlyScore: MonthlyScore = {
          powerRank: row.power_rank,
          previousRank: row.previous_rank,
          rankDelta: row.rank_delta,
          powerScore: row.power_score,
          breakdown: row.score_breakdown ? JSON.parse(row.score_breakdown) : null,
        };

        venue.scores = { monthly: monthlyScore };

        const badges = this.getBadges(row, monthlyScore);

        return {
          rank: row.power_rank,
          venue,
          score: row.power_score,
          previousRank: row.previous_rank,
          rankDelta: row.rank_delta,
          badges,
        };
      });
    } else {
      // Compute on-the-fly (for current month or missing data)
      entries = await this.computeCurrentMonth(options, weights);
      total = entries.length;
    }

    return {
      type: 'monthly',
      period: { year, month },
      entries,
      meta: {
        total,
        radius: radiusMiles,
        center,
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  private async computeCurrentMonth(
    options: MonthlyOptions,
    weights: any
  ): Promise<LeaderboardEntry[]> {
    const { year, month, center, radiusMiles, limit, offset, expertMode } = options;

    // Get month date range
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    // Fetch aggregated signals for the month
    const result = await this.env.DB.prepare(`
      SELECT
        v.*,
        AVG(sd.avg_rating) as avg_rating,
        SUM(sd.total_rating_count) as total_reviews,
        SUM(sd.new_reviews_count) as new_reviews_this_month,
        (
          SELECT SUM(sd2.new_reviews_count)
          FROM signals_daily sd2
          WHERE sd2.venue_id = v.id
            AND sd2.date >= date(?, '-1 month')
            AND sd2.date < ?
        ) as prev_month_reviews,
        COUNT(DISTINCT sd.date) as days_with_data,
        (SELECT COUNT(*) FROM deals d WHERE d.venue_id = v.id AND d.is_active = 1 AND d.status = 'approved') as deal_count,
        -- Previous month rank
        (SELECT power_rank FROM leaderboard_monthly lm WHERE lm.venue_id = v.id AND lm.year = ? AND lm.month = ?) as prev_rank
      FROM venues v
      LEFT JOIN signals_daily sd ON v.id = sd.venue_id
        AND sd.date >= ? AND sd.date <= ?
      WHERE v.is_active = 1
      GROUP BY v.id
      HAVING days_with_data > 0 OR v.expert_pick_rank IS NOT NULL
    `)
      .bind(startDate, startDate, year, month > 1 ? month - 1 : 12, startDate, endDate)
      .all();

    // Calculate scores
    const venuesWithScores: Array<VenueWithScores & { score: number; monthlyScore: MonthlyScore }> = [];

    for (const row of result.results || []) {
      const venue = row as any;
      const distance = calculateDistance(center.lat, center.lng, venue.latitude, venue.longitude);

      if (distance > radiusMiles) continue;

      const expertMultiplier = expertMode ? venue.expert_boost_multiplier || 1.0 : 1.0;

      const monthlyScore = calculateMonthlyScore(
        {
          avgRating: venue.avg_rating || 0,
          totalReviews: venue.total_reviews || 0,
          newReviewsThisMonth: venue.new_reviews_this_month || 0,
          previousMonthReviews: venue.prev_month_reviews || 1,
          ratingStdDev: 0.3, // Default, would need more data to compute
          dealsQuality: Math.min((venue.deal_count || 0) / 5, 1),
          expertMultiplier,
        },
        weights
      );

      venuesWithScores.push({
        ...this.mapRowToVenue(venue, distance),
        score: monthlyScore.powerScore,
        monthlyScore,
      });
    }

    // Sort and assign ranks
    venuesWithScores.sort((a, b) => b.score - a.score);
    venuesWithScores.forEach((v, idx) => {
      v.monthlyScore.powerRank = idx + 1;
    });

    // Build entries
    return venuesWithScores.slice(offset, offset + limit).map((v) => {
      const prevRank = (v as any).prev_rank;
      v.monthlyScore.previousRank = prevRank;
      v.monthlyScore.rankDelta = prevRank ? prevRank - v.monthlyScore.powerRank : undefined;

      v.scores = { monthly: v.monthlyScore };

      return {
        rank: v.monthlyScore.powerRank,
        venue: v,
        score: v.score,
        previousRank: v.monthlyScore.previousRank,
        rankDelta: v.monthlyScore.rankDelta,
        badges: this.getBadges(v, v.monthlyScore),
      };
    });
  }

  private mapRowToVenue(row: any, distance: number): VenueWithScores {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      address: row.address,
      city: row.city,
      state: row.state,
      latitude: row.latitude,
      longitude: row.longitude,
      category: row.category,
      subCategory: row.sub_category,
      priceLevel: row.price_level,
      coverImageUrl: row.cover_image_url,
      isVerified: Boolean(row.is_verified),
      isActive: true,
      expertPickRank: row.expert_pick_rank,
      expertBoostMultiplier: row.expert_boost_multiplier || 1.0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      distance,
      scores: {},
    };
  }

  private getBadges(row: any, score: MonthlyScore): Badge[] {
    const badges: Badge[] = [];

    if (row.expert_pick_rank && row.expert_pick_rank <= 4) {
      badges.push({ type: 'expert_pick', label: `Expert Pick #${row.expert_pick_rank}` });
    }
    if (score.rankDelta && score.rankDelta >= 3) {
      badges.push({ type: 'trending_up', label: `↑${score.rankDelta} spots` });
    }
    if (score.rankDelta && score.rankDelta >= 5) {
      badges.push({ type: 'most_improved', label: 'Most Improved' });
    }
    if (score.powerRank === 1) {
      badges.push({ type: 'hot_tonight', label: '#1 This Month' });
    }

    return badges;
  }
}
