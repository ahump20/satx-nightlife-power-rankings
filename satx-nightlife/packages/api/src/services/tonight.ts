/**
 * Tonight Service
 * Real-time "What's hot tonight" leaderboard
 */

import type { Env, LeaderboardEntry, LeaderboardResponse, VenueWithScores, Badge } from '../types';
import { getWeights, calculateTonightScore } from './scoring';
import { calculateDistance } from '../lib/geo';
import { createSocialSignalsService } from './social';

interface TonightOptions {
  center: { lat: number; lng: number };
  radiusMiles: number;
  limit: number;
  offset: number;
  category?: string;
  expertMode: boolean;
}

export class TonightService {
  private socialService;

  constructor(private env: Env) {
    this.socialService = createSocialSignalsService(env);
  }

  async getLeaderboard(options: TonightOptions): Promise<LeaderboardResponse> {
    const { center, radiusMiles, limit, offset, category, expertMode } = options;
    const weights = await getWeights(this.env);

    // Current time context
    const now = new Date();
    const currentHour = now.toISOString().slice(0, 13) + ':00:00Z';
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();

    // Fetch venues with recent signals
    let sql = `
      SELECT
        v.*,
        -- Latest signals
        COALESCE(sh.rating, sd.avg_rating, 0) as current_rating,
        COALESCE(sh.rating_count, sd.total_rating_count, 0) as rating_count,
        COALESCE(sh.review_count_delta, 0) as recent_reviews,
        COALESCE(sh.checkin_count, 0) as checkins,
        COALESCE(sh.mention_count, 0) as mentions,
        COALESCE(sh.is_open, 1) as is_open,
        COALESCE(sh.has_active_deal, 0) as has_deal,
        sh.hour_bucket,
        -- Count active deals
        (SELECT COUNT(*) FROM deals d WHERE d.venue_id = v.id AND d.is_active = 1 AND d.status = 'approved') as deal_count
      FROM venues v
      LEFT JOIN signals_hourly sh ON v.id = sh.venue_id
        AND sh.hour_bucket >= ?
      LEFT JOIN signals_daily sd ON v.id = sd.venue_id
        AND sd.date = date('now')
      WHERE v.is_active = 1
    `;

    const params: any[] = [sixHoursAgo];

    if (category) {
      sql += ` AND v.category = ?`;
      params.push(category);
    }

    sql += ` GROUP BY v.id ORDER BY v.expert_pick_rank ASC NULLS LAST`;

    const result = await this.env.DB.prepare(sql).bind(...params).all();

    // Process venues
    const venuesWithScores: Array<VenueWithScores & { score: number }> = [];

    // Pre-fetch social signals for all venues (batch for efficiency)
    // In production, this would be cached in KV with short TTL
    const socialSignalsCache = new Map<string, any>();

    // Fetch social signals in parallel for venues within radius (limited batch)
    const venuesInRadius = (result.results || []).filter((row: any) => {
      const distance = calculateDistance(center.lat, center.lng, row.latitude, row.longitude);
      return distance <= radiusMiles;
    }).slice(0, 20); // Limit to top 20 for API efficiency

    await Promise.all(
      venuesInRadius.map(async (row: any) => {
        try {
          const signals = await this.socialService.getVenueSignals(
            row.name,
            row.id,
            row.neighborhood,
            row.category
          );
          socialSignalsCache.set(row.id, signals);
        } catch (e) {
          // Social signals are optional - continue without them
          console.warn(`[Tonight] Failed to fetch social signals for ${row.name}:`, e);
        }
      })
    );

    for (const row of result.results || []) {
      const venue = row as any;
      const distance = calculateDistance(center.lat, center.lng, venue.latitude, venue.longitude);

      // Skip if outside radius
      if (distance > radiusMiles) continue;

      // Calculate hours since last signal
      const hoursAgo = venue.hour_bucket
        ? (now.getTime() - new Date(venue.hour_bucket).getTime()) / (1000 * 60 * 60)
        : 24;

      // Expert boost (only if expert mode enabled)
      const expertMultiplier = expertMode ? venue.expert_boost_multiplier || 1.0 : 1.0;

      // Get social signals for this venue
      const socialSignals = socialSignalsCache.get(venue.id);
      const socialBuzz = socialSignals ? {
        twitter: {
          mentions1h: socialSignals.twitter.mentions1h,
          mentions24h: socialSignals.twitter.mentions24h,
          engagement: socialSignals.twitter.engagement,
          sentiment: socialSignals.twitter.sentiment,
        },
        instagram: {
          mentions1h: socialSignals.instagram.mentions1h,
          mentions24h: socialSignals.instagram.mentions24h,
          engagement: socialSignals.instagram.engagement,
        },
        tiktok: {
          mentions24h: socialSignals.tiktok.mentions24h,
          viralScore: socialSignals.tiktok.viralScore,
          viewCount: socialSignals.tiktok.viewCount,
        },
      } : undefined;

      // Calculate tonight score with social signals
      const tonightScore = calculateTonightScore(
        {
          rating: venue.current_rating || 0,
          ratingCount: venue.rating_count || 0,
          recentReviews: venue.recent_reviews || 0,
          checkins: venue.checkins || 0,
          mentions: venue.mentions || 0,
          isOpen: Boolean(venue.is_open),
          activeDeals: venue.deal_count || 0,
          distanceMiles: distance,
          expertMultiplier,
          hoursAgo,
          socialBuzz,
        },
        weights
      );

      venuesWithScores.push({
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
          tonight: tonightScore,
        },
        score: tonightScore.total,
      });
    }

    // Sort by tonight score
    venuesWithScores.sort((a, b) => b.score - a.score);

    // Apply pagination
    const paginatedVenues = venuesWithScores.slice(offset, offset + limit);

    // Build leaderboard entries with badges
    const entries: LeaderboardEntry[] = paginatedVenues.map((venue, idx) => {
      const badges: Badge[] = [];

      if (venue.expertPickRank && venue.expertPickRank <= 4) {
        badges.push({ type: 'expert_pick', label: `Expert Pick #${venue.expertPickRank}` });
      }
      if (venue.scores.tonight && venue.scores.tonight.breakdown.deals > 10) {
        badges.push({ type: 'best_deals', label: 'Great Deals' });
      }
      if (venue.score >= 80) {
        badges.push({ type: 'hot_tonight', label: 'Hot Tonight' });
      }
      // Social media trending badge
      const socialBuzz = (venue.scores.tonight as any)?.socialBuzz;
      if (socialBuzz?.isViral) {
        badges.push({ type: 'trending_up', label: '🔥 Trending on Social' });
      } else if (socialBuzz?.buzzScore >= 40 && socialBuzz?.trendDirection === 'rising') {
        badges.push({ type: 'trending_up', label: '📈 Rising' });
      }

      return {
        rank: offset + idx + 1,
        venue,
        score: venue.score,
        badges,
      };
    });

    return {
      type: 'tonight',
      entries,
      meta: {
        total: venuesWithScores.length,
        radius: radiusMiles,
        center,
        lastUpdated: now.toISOString(),
        nextUpdate: new Date(now.getTime() + 60000).toISOString(), // 1 minute
      },
    };
  }
}
