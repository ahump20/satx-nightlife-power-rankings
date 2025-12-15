/**
 * Daily Rollup Job
 * Runs at 6 AM UTC via Cloudflare Cron Trigger
 * Aggregates hourly signals into daily summaries
 * Updates tonight scores and trending calculations
 */

import { Env } from '../types';
import { setCache } from '../lib/cache';
import {
  bayesianRating,
  recencyWeight,
  proximityBonus,
  GLOBAL_MEAN_RATING,
  MIN_REVIEWS_CONFIDENCE,
} from '../services/scoring';

interface DailyRollupResult {
  signalsProcessed: number;
  venuesUpdated: number;
  trendingCalculated: number;
  errors: string[];
}

export async function runDailyRollup(env: Env): Promise<DailyRollupResult> {
  const result: DailyRollupResult = {
    signalsProcessed: 0,
    venuesUpdated: 0,
    trendingCalculated: 0,
    errors: [],
  };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  console.log(`[daily-rollup] Starting rollup for ${dateStr}`);

  try {
    // Step 1: Aggregate hourly signals into daily signals
    result.signalsProcessed = await aggregateHourlyToDaily(env, dateStr);
    console.log(`[daily-rollup] Aggregated ${result.signalsProcessed} signals`);

    // Step 2: Update venue scores based on daily signals
    result.venuesUpdated = await updateVenueScores(env, dateStr);
    console.log(`[daily-rollup] Updated ${result.venuesUpdated} venues`);

    // Step 3: Calculate trending scores
    result.trendingCalculated = await calculateTrendingScores(env, dateStr);
    console.log(`[daily-rollup] Calculated ${result.trendingCalculated} trending scores`);

    // Step 4: Clean up old hourly signals (keep 7 days)
    await cleanupOldSignals(env, 7);

    // Step 5: Invalidate relevant caches
    await invalidateCaches(env);

  } catch (error) {
    console.error('[daily-rollup] Error:', error);
    result.errors.push(String(error));
  }

  // Store last run metadata
  await setCache(env.KV, 'job:daily-rollup:last-run', {
    timestamp: new Date().toISOString(),
    date: dateStr,
    results: result,
  }, 86400);

  console.log(`[daily-rollup] Complete: ${result.venuesUpdated} venues, ${result.errors.length} errors`);

  return result;
}

async function aggregateHourlyToDaily(env: Env, date: string): Promise<number> {
  // Get all hourly signals for the date
  const hourlySignals = await env.DB.prepare(`
    SELECT
      venue_id,
      AVG(rating) as avg_rating,
      MAX(review_count) as max_review_count,
      SUM(checkin_count) as total_checkins,
      MAX(event_flag) as had_event,
      COUNT(*) as signal_count,
      GROUP_CONCAT(DISTINCT source) as sources
    FROM signals_hourly
    WHERE date = ?
    GROUP BY venue_id
  `).bind(date).all<{
    venue_id: string;
    avg_rating: number;
    max_review_count: number;
    total_checkins: number;
    had_event: number;
    signal_count: number;
    sources: string;
  }>();

  if (!hourlySignals.results) return 0;

  let processed = 0;

  for (const signal of hourlySignals.results) {
    try {
      // Insert daily aggregated signal
      await env.DB.prepare(`
        INSERT INTO signals_daily (
          venue_id, date, avg_rating, review_count, checkin_count,
          event_flag, signal_count, sources, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (venue_id, date) DO UPDATE SET
          avg_rating = excluded.avg_rating,
          review_count = excluded.review_count,
          checkin_count = excluded.checkin_count,
          event_flag = excluded.event_flag,
          signal_count = excluded.signal_count,
          sources = excluded.sources
      `).bind(
        signal.venue_id,
        date,
        signal.avg_rating,
        signal.max_review_count,
        signal.total_checkins,
        signal.had_event,
        signal.signal_count,
        signal.sources,
        new Date().toISOString()
      ).run();

      processed++;
    } catch (error) {
      console.error(`[daily-rollup] Error aggregating venue ${signal.venue_id}:`, error);
    }
  }

  return processed;
}

async function updateVenueScores(env: Env, date: string): Promise<number> {
  // Get venues with recent signals
  const venues = await env.DB.prepare(`
    SELECT
      v.id,
      v.name,
      v.is_expert_pick,
      v.expert_rank,
      sd.avg_rating,
      sd.review_count,
      sd.checkin_count,
      sd.event_flag
    FROM venues v
    LEFT JOIN signals_daily sd ON v.id = sd.venue_id AND sd.date = ?
    WHERE sd.venue_id IS NOT NULL
  `).bind(date).all<{
    id: string;
    name: string;
    is_expert_pick: number;
    expert_rank: number | null;
    avg_rating: number;
    review_count: number;
    checkin_count: number;
    event_flag: number;
  }>();

  if (!venues.results) return 0;

  let updated = 0;

  for (const venue of venues.results) {
    try {
      // Calculate Bayesian-adjusted rating
      const adjustedRating = bayesianRating(
        venue.avg_rating,
        venue.review_count,
        MIN_REVIEWS_CONFIDENCE,
        GLOBAL_MEAN_RATING
      );

      // Calculate tonight score components
      const baseScore = adjustedRating * 20; // Scale to 0-100
      const eventBoost = venue.event_flag ? 10 : 0;
      const expertBoost = venue.is_expert_pick && venue.expert_rank
        ? Math.max(0, 15 - (venue.expert_rank - 1) * 3) // #1 gets 15, #2 gets 12, etc.
        : 0;

      const tonightScore = Math.min(100, baseScore + eventBoost + expertBoost);

      // Update venue cached scores
      await env.DB.prepare(`
        UPDATE venues SET
          cached_tonight_score = ?,
          cached_rating = ?,
          cached_review_count = ?,
          updated_at = ?
        WHERE id = ?
      `).bind(
        tonightScore,
        venue.avg_rating,
        venue.review_count,
        new Date().toISOString(),
        venue.id
      ).run();

      updated++;
    } catch (error) {
      console.error(`[daily-rollup] Error updating venue ${venue.id}:`, error);
    }
  }

  return updated;
}

async function calculateTrendingScores(env: Env, date: string): Promise<number> {
  // Get venues with at least 7 days of signals for trend calculation
  const venues = await env.DB.prepare(`
    SELECT
      v.id,
      v.name,
      COUNT(sd.date) as days_with_signals,
      AVG(CASE WHEN sd.date >= date(?, '-7 days') THEN sd.avg_rating END) as recent_avg,
      AVG(CASE WHEN sd.date < date(?, '-7 days') AND sd.date >= date(?, '-30 days') THEN sd.avg_rating END) as prev_avg,
      SUM(CASE WHEN sd.date >= date(?, '-7 days') THEN sd.review_count ELSE 0 END) as recent_reviews,
      SUM(CASE WHEN sd.date < date(?, '-7 days') AND sd.date >= date(?, '-30 days') THEN sd.review_count ELSE 0 END) as prev_reviews
    FROM venues v
    JOIN signals_daily sd ON v.id = sd.venue_id
    WHERE sd.date >= date(?, '-30 days')
    GROUP BY v.id
    HAVING days_with_signals >= 7
  `).bind(date, date, date, date, date, date, date).all<{
    id: string;
    name: string;
    days_with_signals: number;
    recent_avg: number | null;
    prev_avg: number | null;
    recent_reviews: number;
    prev_reviews: number;
  }>();

  if (!venues.results) return 0;

  let calculated = 0;

  for (const venue of venues.results) {
    try {
      if (venue.recent_avg === null || venue.prev_avg === null) continue;

      // Calculate momentum (rating change)
      const ratingDelta = venue.recent_avg - venue.prev_avg;

      // Calculate velocity (review growth rate)
      const prevReviewsNorm = Math.max(venue.prev_reviews, 1);
      const reviewGrowth = (venue.recent_reviews - venue.prev_reviews) / prevReviewsNorm;

      // Trending score: weighted combination of momentum and velocity
      // Range roughly -50 to +50, centered on 0
      const trendingScore = (ratingDelta * 10) + (reviewGrowth * 20);

      // Determine trend direction
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (trendingScore > 5) trend = 'up';
      else if (trendingScore < -5) trend = 'down';

      // Update venue trending data
      await env.DB.prepare(`
        UPDATE venues SET
          cached_trending_score = ?,
          cached_trend_direction = ?,
          updated_at = ?
        WHERE id = ?
      `).bind(
        trendingScore,
        trend,
        new Date().toISOString(),
        venue.id
      ).run();

      calculated++;
    } catch (error) {
      console.error(`[daily-rollup] Error calculating trend for venue ${venue.id}:`, error);
    }
  }

  return calculated;
}

async function cleanupOldSignals(env: Env, keepDays: number): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - keepDays);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  const result = await env.DB.prepare(`
    DELETE FROM signals_hourly WHERE date < ?
  `).bind(cutoffStr).run();

  console.log(`[daily-rollup] Cleaned up ${result.meta.changes} old hourly signals`);
}

async function invalidateCaches(env: Env): Promise<void> {
  // Delete cached leaderboards to force refresh
  const keysToDelete = [
    'leaderboard:tonight:*',
    'leaderboard:trending:*',
  ];

  // List and delete matching keys
  // Note: KV list is eventually consistent, so we also set short TTLs
  const list = await env.KV.list({ prefix: 'leaderboard:' });

  for (const key of list.keys) {
    await env.KV.delete(key.name);
  }

  console.log(`[daily-rollup] Invalidated ${list.keys.length} cached leaderboards`);
}
