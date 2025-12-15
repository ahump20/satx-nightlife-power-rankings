/**
 * Venue API Routes
 * Search and details for venues
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, Venue, VenueWithScores, Deal } from '../types';
import { LocationQuerySchema } from '../types';
import { calculateDistance } from '../lib/geo';
import { getCachedResponse, setCachedResponse } from '../lib/cache';

export const venueRoutes = new Hono<{ Bindings: Env }>();

const SearchQuerySchema = LocationQuerySchema.extend({
  q: z.string().min(2).max(100).optional(),
  category: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
  open_now: z.coerce.boolean().default(false),
  has_deals: z.coerce.boolean().default(false),
});

/**
 * GET /api/venues/search
 * Search venues by name, location, and filters
 */
venueRoutes.get('/search', async (c) => {
  const query = SearchQuerySchema.safeParse(Object.fromEntries(c.req.query()));

  if (!query.success) {
    return c.json(
      {
        error: 'Invalid query parameters',
        details: query.error.flatten(),
      },
      400
    );
  }

  const { lat, lng, radius_miles, q, category, limit, offset, open_now, has_deals } = query.data;

  // Build SQL query dynamically
  let sql = `
    SELECT
      v.*,
      (
        SELECT json_group_array(json_object(
          'id', d.id,
          'title', d.title,
          'deal_type', d.deal_type,
          'start_time', d.start_time,
          'end_time', d.end_time
        ))
        FROM deals d
        WHERE d.venue_id = v.id AND d.is_active = 1 AND d.status = 'approved'
        LIMIT 3
      ) as active_deals,
      (
        SELECT avg_rating FROM signals_daily sd
        WHERE sd.venue_id = v.id
        ORDER BY sd.date DESC LIMIT 1
      ) as latest_rating
    FROM venues v
    WHERE v.is_active = 1
  `;

  const params: any[] = [];

  // Name search
  if (q) {
    sql += ` AND (v.name LIKE ? OR EXISTS (SELECT 1 FROM venue_aliases va WHERE va.venue_id = v.id AND va.alias LIKE ?))`;
    params.push(`%${q}%`, `%${q}%`);
  }

  // Category filter
  if (category) {
    sql += ` AND v.category = ?`;
    params.push(category);
  }

  // Has deals filter
  if (has_deals) {
    sql += ` AND EXISTS (SELECT 1 FROM deals d WHERE d.venue_id = v.id AND d.is_active = 1 AND d.status = 'approved')`;
  }

  sql += ` ORDER BY v.expert_pick_rank ASC NULLS LAST, v.name ASC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const result = await c.env.DB.prepare(sql).bind(...params).all();

  // Filter by distance and enrich with distance
  const venues = (result.results || [])
    .map((row: any) => {
      const distance = calculateDistance(lat, lng, row.latitude, row.longitude);
      return {
        ...mapDbRowToVenue(row),
        distance,
        activeDeals: row.active_deals ? JSON.parse(row.active_deals).filter((d: any) => d.id) : [],
        latestRating: row.latest_rating,
      };
    })
    .filter((v: any) => v.distance <= radius_miles)
    .sort((a: any, b: any) => a.distance - b.distance);

  return c.json({
    venues,
    meta: {
      total: venues.length,
      limit,
      offset,
      center: { lat, lng },
      radiusMiles: radius_miles,
    },
  });
});

/**
 * GET /api/venues/:id
 * Get detailed venue information
 */
venueRoutes.get('/:id', async (c) => {
  const venueId = c.req.param('id');
  const latParam = c.req.query('lat');
  const lngParam = c.req.query('lng');

  const cacheKey = `venue:${venueId}`;

  // Check cache (5-minute TTL)
  const cached = await getCachedResponse(c.env.CACHE, cacheKey);
  if (cached && !latParam) {
    c.header('X-Cache-Status', 'HIT');
    return c.json(cached);
  }

  // Fetch venue with related data
  const [venueResult, dealsResult, signalsResult, rankingResult, sourcesResult] = await Promise.all([
    c.env.DB.prepare(`SELECT * FROM venues WHERE id = ? OR slug = ?`).bind(venueId, venueId).first(),

    c.env.DB.prepare(`
      SELECT * FROM deals
      WHERE venue_id = (SELECT id FROM venues WHERE id = ? OR slug = ?)
        AND is_active = 1 AND status = 'approved'
      ORDER BY day_of_week, start_time
    `)
      .bind(venueId, venueId)
      .all(),

    c.env.DB.prepare(`
      SELECT * FROM signals_daily
      WHERE venue_id = (SELECT id FROM venues WHERE id = ? OR slug = ?)
      ORDER BY date DESC LIMIT 30
    `)
      .bind(venueId, venueId)
      .all(),

    c.env.DB.prepare(`
      SELECT * FROM leaderboard_monthly
      WHERE venue_id = (SELECT id FROM venues WHERE id = ? OR slug = ?)
      ORDER BY year DESC, month DESC LIMIT 12
    `)
      .bind(venueId, venueId)
      .all(),

    c.env.DB.prepare(`
      SELECT source, source_id, source_url, last_synced_at FROM venue_sources
      WHERE venue_id = (SELECT id FROM venues WHERE id = ? OR slug = ?)
    `)
      .bind(venueId, venueId)
      .all(),
  ]);

  if (!venueResult) {
    return c.json({ error: 'Venue not found' }, 404);
  }

  const venue = mapDbRowToVenue(venueResult);

  // Calculate distance if user location provided
  let distance: number | undefined;
  if (latParam && lngParam) {
    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);
    if (!isNaN(lat) && !isNaN(lng)) {
      distance = calculateDistance(lat, lng, venue.latitude, venue.longitude);
    }
  }

  // Map deals
  const deals: Deal[] = (dealsResult.results || []).map((row: any) => ({
    id: row.id,
    venueId: row.venue_id,
    title: row.title,
    description: row.description,
    dealType: row.deal_type,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    discountPercent: row.discount_percent,
    discountAmount: row.discount_amount,
    tags: row.tags ? JSON.parse(row.tags) : [],
    status: row.status,
    isActive: Boolean(row.is_active),
  }));

  // Get latest signals for score summary
  const recentSignals = signalsResult.results || [];
  const latestSignal = recentSignals[0] as any;

  // Get latest ranking
  const rankings = rankingResult.results || [];
  const latestRanking = rankings[0] as any;

  // Build response
  const response = {
    venue: {
      ...venue,
      distance,
    },
    deals,
    scores: {
      monthly: latestRanking
        ? {
            powerRank: latestRanking.power_rank,
            previousRank: latestRanking.previous_rank,
            rankDelta: latestRanking.rank_delta,
            powerScore: latestRanking.power_score,
            breakdown: latestRanking.score_breakdown ? JSON.parse(latestRanking.score_breakdown) : null,
          }
        : null,
    },
    signals: {
      latest: latestSignal
        ? {
            date: latestSignal.date,
            avgRating: latestSignal.avg_rating,
            totalRatingCount: latestSignal.total_rating_count,
            newReviews: latestSignal.new_reviews_count,
            popularityScore: latestSignal.popularity_score,
          }
        : null,
      trend: recentSignals.slice(0, 7).map((s: any) => ({
        date: s.date,
        rating: s.avg_rating,
        reviews: s.new_reviews_count,
      })),
    },
    rankingHistory: rankings.map((r: any) => ({
      year: r.year,
      month: r.month,
      rank: r.power_rank,
      score: r.power_score,
    })),
    sources: (sourcesResult.results || []).map((s: any) => ({
      source: s.source,
      sourceId: s.source_id,
      url: s.source_url,
      lastSynced: s.last_synced_at,
    })),
    lastUpdated: new Date().toISOString(),
  };

  // Cache if no user location (generic response)
  if (!latParam) {
    await setCachedResponse(c.env.CACHE, cacheKey, response, 300);
  }

  return c.json(response);
});

/**
 * GET /api/venues/nearby
 * Get venues near a location (lightweight endpoint)
 */
venueRoutes.get('/nearby', async (c) => {
  const query = LocationQuerySchema.extend({
    limit: z.coerce.number().min(1).max(20).default(10),
  }).safeParse(Object.fromEntries(c.req.query()));

  if (!query.success) {
    return c.json(
      {
        error: 'Invalid query parameters',
        details: query.error.flatten(),
      },
      400
    );
  }

  const { lat, lng, radius_miles, limit } = query.data;

  // Simple nearby query
  const result = await c.env.DB.prepare(`
    SELECT id, name, slug, latitude, longitude, category, price_level, expert_pick_rank
    FROM venues
    WHERE is_active = 1
    ORDER BY expert_pick_rank ASC NULLS LAST
    LIMIT 100
  `).all();

  const venues = (result.results || [])
    .map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category,
      priceLevel: row.price_level,
      isExpertPick: Boolean(row.expert_pick_rank),
      latitude: row.latitude,
      longitude: row.longitude,
      distance: calculateDistance(lat, lng, row.latitude, row.longitude),
    }))
    .filter((v) => v.distance <= radius_miles)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  return c.json({
    venues,
    center: { lat, lng },
    radiusMiles: radius_miles,
  });
});

// Helper function to map DB row to Venue type
function mapDbRowToVenue(row: any): Venue {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    address: row.address,
    city: row.city,
    state: row.state,
    zipCode: row.zip_code,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    website: row.website,
    category: row.category,
    subCategory: row.sub_category,
    priceLevel: row.price_level,
    coverImageUrl: row.cover_image_url,
    description: row.description,
    isVerified: Boolean(row.is_verified),
    isActive: Boolean(row.is_active),
    expertPickRank: row.expert_pick_rank,
    expertBoostMultiplier: row.expert_boost_multiplier || 1.0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
