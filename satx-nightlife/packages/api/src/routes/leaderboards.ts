/**
 * Leaderboard API Routes
 * Tonight, Monthly, and Trending rankings
 */

import { Hono } from 'hono';
import type { Env, LeaderboardResponse } from '../types';
import { LeaderboardQuerySchema, MonthlyQuerySchema } from '../types';
import { TonightService } from '../services/tonight';
import { MonthlyService } from '../services/monthly';
import { TrendingService } from '../services/trending';
import { getCachedResponse, setCachedResponse } from '../lib/cache';

export const leaderboardRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /api/leaderboards/tonight
 * Real-time "What's hot tonight" leaderboard
 */
leaderboardRoutes.get('/tonight', async (c) => {
  const query = LeaderboardQuerySchema.safeParse(Object.fromEntries(c.req.query()));

  if (!query.success) {
    return c.json(
      {
        error: 'Invalid query parameters',
        details: query.error.flatten(),
      },
      400
    );
  }

  const { lat, lng, radius_miles, limit, offset, category, expert_mode } = query.data;
  const cacheKey = `tonight:${lat.toFixed(3)}:${lng.toFixed(3)}:${radius_miles}:${limit}:${category || 'all'}:${expert_mode}`;

  // Check cache first (60-second TTL for tonight)
  const cached = await getCachedResponse(c.env.CACHE, cacheKey);
  if (cached) {
    c.header('X-Cache-Status', 'HIT');
    return c.json(cached);
  }

  c.header('X-Cache-Status', 'MISS');

  // Compute fresh leaderboard
  const service = new TonightService(c.env);
  const result = await service.getLeaderboard({
    center: { lat, lng },
    radiusMiles: radius_miles,
    limit,
    offset,
    category,
    expertMode: expert_mode,
  });

  // Cache the response
  await setCachedResponse(c.env.CACHE, cacheKey, result, 60);

  return c.json(result);
});

/**
 * GET /api/leaderboards/monthly
 * Monthly power rankings
 */
leaderboardRoutes.get('/monthly', async (c) => {
  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1;

  const rawQuery = Object.fromEntries(c.req.query());
  const query = MonthlyQuerySchema.safeParse({
    ...rawQuery,
    year: rawQuery.year || defaultYear,
    month: rawQuery.month || defaultMonth,
  });

  if (!query.success) {
    return c.json(
      {
        error: 'Invalid query parameters',
        details: query.error.flatten(),
      },
      400
    );
  }

  const { lat, lng, radius_miles, limit, offset, year, month, expert_mode } = query.data;
  const cacheKey = `monthly:${year}:${month}:${lat.toFixed(3)}:${lng.toFixed(3)}:${radius_miles}:${limit}:${expert_mode}`;

  // Check cache (1-hour TTL for monthly)
  const cached = await getCachedResponse(c.env.CACHE, cacheKey);
  if (cached) {
    c.header('X-Cache-Status', 'HIT');
    return c.json(cached);
  }

  c.header('X-Cache-Status', 'MISS');

  const service = new MonthlyService(c.env);
  const result = await service.getLeaderboard({
    year,
    month,
    center: { lat, lng },
    radiusMiles: radius_miles,
    limit,
    offset,
    expertMode: expert_mode,
  });

  // Cache for 1 hour
  await setCachedResponse(c.env.CACHE, cacheKey, result, 3600);

  return c.json(result);
});

/**
 * GET /api/leaderboards/trending
 * Trending venues (fast risers this month)
 */
leaderboardRoutes.get('/trending', async (c) => {
  const now = new Date();
  const rawQuery = Object.fromEntries(c.req.query());
  const query = MonthlyQuerySchema.safeParse({
    ...rawQuery,
    year: rawQuery.year || now.getFullYear(),
    month: rawQuery.month || now.getMonth() + 1,
  });

  if (!query.success) {
    return c.json(
      {
        error: 'Invalid query parameters',
        details: query.error.flatten(),
      },
      400
    );
  }

  const { lat, lng, radius_miles, limit, year, month } = query.data;
  const cacheKey = `trending:${year}:${month}:${lat.toFixed(3)}:${lng.toFixed(3)}:${radius_miles}:${limit}`;

  // Check cache (30-minute TTL for trending)
  const cached = await getCachedResponse(c.env.CACHE, cacheKey);
  if (cached) {
    c.header('X-Cache-Status', 'HIT');
    return c.json(cached);
  }

  c.header('X-Cache-Status', 'MISS');

  const service = new TrendingService(c.env);
  const result = await service.getLeaderboard({
    year,
    month,
    center: { lat, lng },
    radiusMiles: radius_miles,
    limit,
  });

  // Cache for 30 minutes
  await setCachedResponse(c.env.CACHE, cacheKey, result, 1800);

  return c.json(result);
});

/**
 * GET /api/leaderboards/year
 * Year-to-date standings with monthly winners
 */
leaderboardRoutes.get('/year', async (c) => {
  const yearParam = c.req.query('year');
  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

  if (year < 2024 || year > 2030) {
    return c.json({ error: 'Invalid year' }, 400);
  }

  const cacheKey = `year:${year}`;

  const cached = await getCachedResponse(c.env.CACHE, cacheKey);
  if (cached) {
    c.header('X-Cache-Status', 'HIT');
    return c.json(cached);
  }

  c.header('X-Cache-Status', 'MISS');

  // Fetch YTD standings and monthly winners
  const [standings, winners] = await Promise.all([
    c.env.DB.prepare(`
      SELECT
        v.id, v.name, v.slug, v.category, v.cover_image_url,
        s.total_points, s.wins, s.podiums, s.best_rank, s.current_rank
      FROM standings_ytd s
      JOIN venues v ON s.venue_id = v.id
      WHERE s.year = ?
      ORDER BY s.total_points DESC
      LIMIT 20
    `)
      .bind(year)
      .all(),

    c.env.DB.prepare(`
      SELECT
        lm.month, lm.power_rank, lm.power_score,
        v.id, v.name, v.slug, v.cover_image_url
      FROM leaderboard_monthly lm
      JOIN venues v ON lm.venue_id = v.id
      WHERE lm.year = ? AND lm.power_rank = 1
      ORDER BY lm.month
    `)
      .bind(year)
      .all(),
  ]);

  const result = {
    year,
    standings: standings.results?.map((row: any, idx: number) => ({
      rank: idx + 1,
      venue: {
        id: row.id,
        name: row.name,
        slug: row.slug,
        category: row.category,
        coverImageUrl: row.cover_image_url,
      },
      totalPoints: row.total_points,
      wins: row.wins,
      podiums: row.podiums,
      bestRank: row.best_rank,
      currentRank: row.current_rank,
    })),
    monthlyWinners: winners.results?.map((row: any) => ({
      month: row.month,
      venue: {
        id: row.id,
        name: row.name,
        slug: row.slug,
        coverImageUrl: row.cover_image_url,
      },
      powerScore: row.power_score,
    })),
    lastUpdated: new Date().toISOString(),
  };

  // Cache for 1 hour
  await setCachedResponse(c.env.CACHE, cacheKey, result, 3600);

  return c.json(result);
});
