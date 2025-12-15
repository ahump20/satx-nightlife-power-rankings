/**
 * Monthly Snapshot Job
 * Runs on 1st of each month at 7 AM UTC via Cloudflare Cron Trigger
 * Creates monthly leaderboard snapshots and updates YTD standings
 */

import { Env } from '../types';
import { setCache } from '../lib/cache';
import {
  bayesianRating,
  GLOBAL_MEAN_RATING,
  MIN_REVIEWS_CONFIDENCE,
} from '../services/scoring';

interface MonthlySnapshotResult {
  month: string;
  year: number;
  venuesRanked: number;
  ytdUpdated: number;
  errors: string[];
}

export async function runMonthlySnapshot(env: Env): Promise<MonthlySnapshotResult> {
  const now = new Date();
  // Get previous month (since we run on the 1st)
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = prevMonth.getFullYear();
  const month = prevMonth.getMonth() + 1; // 1-indexed
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  console.log(`[monthly-snapshot] Creating snapshot for ${monthStr}`);

  const result: MonthlySnapshotResult = {
    month: monthStr,
    year,
    venuesRanked: 0,
    ytdUpdated: 0,
    errors: [],
  };

  try {
    // Step 1: Calculate monthly power rankings
    result.venuesRanked = await calculateMonthlyRankings(env, year, month);
    console.log(`[monthly-snapshot] Ranked ${result.venuesRanked} venues`);

    // Step 2: Update YTD standings
    result.ytdUpdated = await updateYTDStandings(env, year);
    console.log(`[monthly-snapshot] Updated ${result.ytdUpdated} YTD standings`);

    // Step 3: Archive to R2 for historical records
    await archiveToR2(env, year, month);

    // Step 4: Invalidate monthly caches
    await invalidateMonthlyCaches(env);

  } catch (error) {
    console.error('[monthly-snapshot] Error:', error);
    result.errors.push(String(error));
  }

  // Store last run metadata
  await setCache(env.KV, 'job:monthly-snapshot:last-run', {
    timestamp: new Date().toISOString(),
    month: monthStr,
    results: result,
  }, 86400 * 35); // Keep for ~1 month

  console.log(`[monthly-snapshot] Complete for ${monthStr}`);

  return result;
}

async function calculateMonthlyRankings(env: Env, year: number, month: number): Promise<number> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

  // Get aggregated monthly data for all venues
  const venueStats = await env.DB.prepare(`
    SELECT
      v.id,
      v.name,
      v.category,
      v.is_expert_pick,
      v.expert_rank,
      AVG(sd.avg_rating) as month_avg_rating,
      SUM(sd.review_count) as month_review_count,
      SUM(sd.checkin_count) as month_checkins,
      COUNT(CASE WHEN sd.event_flag = 1 THEN 1 END) as event_days,
      COUNT(sd.date) as active_days
    FROM venues v
    JOIN signals_daily sd ON v.id = sd.venue_id
    WHERE sd.date BETWEEN ? AND ?
    GROUP BY v.id
    HAVING active_days >= 7
    ORDER BY month_avg_rating DESC
  `).bind(startDate, endDate).all<{
    id: string;
    name: string;
    category: string;
    is_expert_pick: number;
    expert_rank: number | null;
    month_avg_rating: number;
    month_review_count: number;
    month_checkins: number;
    event_days: number;
    active_days: number;
  }>();

  if (!venueStats.results) return 0;

  // Calculate power scores and rank
  const rankedVenues = venueStats.results.map((venue) => {
    // Bayesian-adjusted rating
    const adjustedRating = bayesianRating(
      venue.month_avg_rating,
      venue.month_review_count,
      MIN_REVIEWS_CONFIDENCE,
      GLOBAL_MEAN_RATING
    );

    // Power score formula:
    // 60% adjusted rating (scaled)
    // 20% engagement (reviews + checkins, log-scaled)
    // 10% consistency (active days / 30)
    // 10% events bonus

    const ratingComponent = adjustedRating * 12; // Max ~60 for 5-star
    const engagementComponent = Math.min(20, Math.log10(venue.month_review_count + venue.month_checkins + 1) * 5);
    const consistencyComponent = (venue.active_days / 30) * 10;
    const eventsComponent = Math.min(10, venue.event_days * 2);

    // Expert pick boost (applied at ranking, not score)
    const expertBoost = venue.is_expert_pick && venue.expert_rank
      ? Math.max(0, 8 - (venue.expert_rank - 1) * 2) // #1 gets 8, #2 gets 6, etc.
      : 0;

    const powerScore = ratingComponent + engagementComponent + consistencyComponent + eventsComponent + expertBoost;

    return {
      ...venue,
      adjustedRating,
      powerScore: Math.round(powerScore * 10) / 10, // Round to 1 decimal
    };
  });

  // Sort by power score descending
  rankedVenues.sort((a, b) => b.powerScore - a.powerScore);

  // Insert into leaderboard_monthly with rankings
  let rank = 0;
  let prevScore = -1;
  let actualRank = 0;

  for (const venue of rankedVenues) {
    actualRank++;
    // Handle ties - same score gets same rank
    if (venue.powerScore !== prevScore) {
      rank = actualRank;
      prevScore = venue.powerScore;
    }

    try {
      await env.DB.prepare(`
        INSERT INTO leaderboard_monthly (
          venue_id, year, month, rank, power_score,
          avg_rating, review_count, checkin_count, event_count,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (venue_id, year, month) DO UPDATE SET
          rank = excluded.rank,
          power_score = excluded.power_score,
          avg_rating = excluded.avg_rating,
          review_count = excluded.review_count,
          checkin_count = excluded.checkin_count,
          event_count = excluded.event_count
      `).bind(
        venue.id,
        year,
        month,
        rank,
        venue.powerScore,
        venue.adjustedRating,
        venue.month_review_count,
        venue.month_checkins,
        venue.event_days,
        new Date().toISOString()
      ).run();
    } catch (error) {
      console.error(`[monthly-snapshot] Error ranking venue ${venue.id}:`, error);
    }
  }

  return rankedVenues.length;
}

async function updateYTDStandings(env: Env, year: number): Promise<number> {
  // Calculate YTD standings based on all monthly rankings so far
  const ytdStats = await env.DB.prepare(`
    SELECT
      venue_id,
      COUNT(*) as months_ranked,
      AVG(rank) as avg_rank,
      MIN(rank) as best_rank,
      AVG(power_score) as avg_power_score,
      SUM(power_score) as total_power_score,
      GROUP_CONCAT(rank ORDER BY month) as rank_history
    FROM leaderboard_monthly
    WHERE year = ?
    GROUP BY venue_id
    ORDER BY avg_power_score DESC
  `).bind(year).all<{
    venue_id: string;
    months_ranked: number;
    avg_rank: number;
    best_rank: number;
    avg_power_score: number;
    total_power_score: number;
    rank_history: string;
  }>();

  if (!ytdStats.results) return 0;

  // Calculate YTD rank
  let ytdRank = 0;
  let prevScore = -1;
  let actualRank = 0;

  for (const venue of ytdStats.results) {
    actualRank++;
    if (venue.avg_power_score !== prevScore) {
      ytdRank = actualRank;
      prevScore = venue.avg_power_score;
    }

    // Calculate trend based on recent rank changes
    const ranks = venue.rank_history.split(',').map(Number);
    let trend: 'up' | 'down' | 'stable' | 'new' = 'stable';

    if (ranks.length === 1) {
      trend = 'new';
    } else if (ranks.length >= 2) {
      const recentRank = ranks[ranks.length - 1];
      const prevRank = ranks[ranks.length - 2];
      if (recentRank < prevRank) trend = 'up';
      else if (recentRank > prevRank) trend = 'down';
    }

    try {
      await env.DB.prepare(`
        INSERT INTO standings_ytd (
          venue_id, year, ytd_rank, avg_rank, best_rank,
          avg_power_score, months_ranked, trend, rank_history,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (venue_id, year) DO UPDATE SET
          ytd_rank = excluded.ytd_rank,
          avg_rank = excluded.avg_rank,
          best_rank = excluded.best_rank,
          avg_power_score = excluded.avg_power_score,
          months_ranked = excluded.months_ranked,
          trend = excluded.trend,
          rank_history = excluded.rank_history,
          updated_at = excluded.updated_at
      `).bind(
        venue.venue_id,
        year,
        ytdRank,
        venue.avg_rank,
        venue.best_rank,
        venue.avg_power_score,
        venue.months_ranked,
        trend,
        venue.rank_history,
        new Date().toISOString()
      ).run();
    } catch (error) {
      console.error(`[monthly-snapshot] Error updating YTD for venue ${venue.venue_id}:`, error);
    }
  }

  return ytdStats.results.length;
}

async function archiveToR2(env: Env, year: number, month: number): Promise<void> {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  // Get full monthly leaderboard
  const leaderboard = await env.DB.prepare(`
    SELECT
      lm.*,
      v.name,
      v.category,
      v.address,
      v.lat,
      v.lng,
      v.is_expert_pick,
      v.expert_rank
    FROM leaderboard_monthly lm
    JOIN venues v ON lm.venue_id = v.id
    WHERE lm.year = ? AND lm.month = ?
    ORDER BY lm.rank ASC
  `).bind(year, month).all();

  if (!leaderboard.results) return;

  // Create archive object
  const archive = {
    month: monthStr,
    year,
    monthNum: month,
    generatedAt: new Date().toISOString(),
    totalVenues: leaderboard.results.length,
    rankings: leaderboard.results,
  };

  // Store in R2
  const key = `archives/monthly/${year}/${monthStr}.json`;
  await env.R2.put(key, JSON.stringify(archive, null, 2), {
    httpMetadata: {
      contentType: 'application/json',
    },
    customMetadata: {
      year: String(year),
      month: String(month),
      venueCount: String(leaderboard.results.length),
    },
  });

  console.log(`[monthly-snapshot] Archived to R2: ${key}`);
}

async function invalidateMonthlyCaches(env: Env): Promise<void> {
  // Delete cached monthly and year leaderboards
  const list = await env.KV.list({ prefix: 'leaderboard:monthly' });
  for (const key of list.keys) {
    await env.KV.delete(key.name);
  }

  const yearList = await env.KV.list({ prefix: 'leaderboard:year' });
  for (const key of yearList.keys) {
    await env.KV.delete(key.name);
  }

  console.log(`[monthly-snapshot] Invalidated ${list.keys.length + yearList.keys.length} caches`);
}
