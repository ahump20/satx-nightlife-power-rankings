/**
 * Admin API Routes
 * Configuration, weights, and moderation
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, ScoringWeights, ExpertPickConfig } from '../types';
import { verifyAuth } from '../lib/auth';

export const adminRoutes = new Hono<{ Bindings: Env }>();

// Auth middleware for all admin routes
adminRoutes.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const isAuthed = authHeader ? await verifyAuth(c.env, authHeader) : false;

  if (!isAuthed) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
});

/**
 * GET /api/admin/config
 * Get current scoring weights and configuration
 */
adminRoutes.get('/config', async (c) => {
  const [weights, expertPicks] = await Promise.all([
    c.env.CONFIG.get('scoring_weights', 'json'),
    c.env.CONFIG.get('expert_picks', 'json'),
  ]);

  return c.json({
    weights: weights || getDefaultWeights(),
    expertPicks: expertPicks || getDefaultExpertPicks(),
  });
});

/**
 * PUT /api/admin/config/weights
 * Update scoring weights
 */
adminRoutes.put('/config/weights', async (c) => {
  const body = await c.req.json();

  // Validate weights structure
  const WeightsSchema = z.object({
    tonight: z.object({
      popularity: z.number().min(0).max(100),
      quality: z.number().min(0).max(100),
      openNow: z.number().min(0).max(100),
      deals: z.number().min(0).max(100),
      proximity: z.number().min(0).max(100),
      expertBoost: z.number().min(0).max(100),
    }),
    monthly: z.object({
      quality: z.number().min(0).max(100),
      popularity: z.number().min(0).max(100),
      consistency: z.number().min(0).max(100),
      deals: z.number().min(0).max(100),
      expertBoost: z.number().min(0).max(100),
    }),
    bayesian: z.object({
      m: z.number().min(1),
      C: z.number().min(1).max(5),
    }),
    proximity: z.object({
      maxBoostMiles: z.number().min(1).max(25),
      decayRate: z.number().min(0.1).max(2),
    }),
    recency: z.object({
      tonightHalfLifeHours: z.number().min(1).max(24),
      trendingHalfLifeDays: z.number().min(1).max(30),
    }),
  });

  const parsed = WeightsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid weights structure', details: parsed.error.flatten() }, 400);
  }

  // Get current weights for audit
  const currentWeights = await c.env.CONFIG.get('scoring_weights', 'json');

  // Update with version
  const newWeights: ScoringWeights = {
    ...parsed.data,
    version: ((currentWeights as any)?.version || 0) + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin',
  };

  await c.env.CONFIG.put('scoring_weights', JSON.stringify(newWeights));

  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO audit_log (id, action, entity_type, old_value, new_value, performed_by)
    VALUES (?, 'update', 'scoring_weights', ?, ?, 'admin')
  `)
    .bind(crypto.randomUUID(), JSON.stringify(currentWeights), JSON.stringify(newWeights))
    .run();

  // Invalidate cached leaderboards
  await invalidateLeaderboardCache(c.env.CACHE);

  return c.json({
    success: true,
    weights: newWeights,
  });
});

/**
 * PUT /api/admin/config/expert-picks
 * Update expert pick configuration
 */
adminRoutes.put('/config/expert-picks', async (c) => {
  const body = await c.req.json();

  const ExpertPicksSchema = z.object({
    enabled: z.boolean(),
    maxBoostPercent: z.number().min(0).max(50),
    venues: z.array(
      z.object({
        slug: z.string(),
        boostMultiplier: z.number().min(1).max(1.5),
        reason: z.string().optional(),
      })
    ),
  });

  const parsed = ExpertPicksSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid expert picks structure', details: parsed.error.flatten() }, 400);
  }

  const currentConfig = await c.env.CONFIG.get('expert_picks', 'json');
  await c.env.CONFIG.put('expert_picks', JSON.stringify(parsed.data));

  // Update venue records
  for (const pick of parsed.data.venues) {
    await c.env.DB.prepare(`
      UPDATE venues
      SET expert_boost_multiplier = ?, expert_pick_rank = (
        SELECT COUNT(*) + 1 FROM venues WHERE expert_pick_rank IS NOT NULL AND slug != ?
      )
      WHERE slug = ?
    `)
      .bind(pick.boostMultiplier, pick.slug, pick.slug)
      .run();
  }

  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO audit_log (id, action, entity_type, old_value, new_value, performed_by)
    VALUES (?, 'update', 'expert_picks', ?, ?, 'admin')
  `)
    .bind(crypto.randomUUID(), JSON.stringify(currentConfig), JSON.stringify(parsed.data))
    .run();

  await invalidateLeaderboardCache(c.env.CACHE);

  return c.json({ success: true, config: parsed.data });
});

/**
 * GET /api/admin/submissions
 * List pending submissions for moderation
 */
adminRoutes.get('/submissions', async (c) => {
  const status = c.req.query('status') || 'pending';
  const limit = parseInt(c.req.query('limit') || '20');

  const result = await c.env.DB.prepare(`
    SELECT s.*, v.name as venue_name
    FROM submissions s
    LEFT JOIN venues v ON s.venue_id = v.id
    WHERE s.status = ?
    ORDER BY s.submitted_at DESC
    LIMIT ?
  `)
    .bind(status, limit)
    .all();

  return c.json({
    submissions: (result.results || []).map((row: any) => ({
      id: row.id,
      venueId: row.venue_id,
      venueName: row.venue_name || row.venue_name_submitted,
      type: row.submission_type,
      data: JSON.parse(row.data),
      status: row.status,
      submittedAt: row.submitted_at,
      reviewerNotes: row.reviewer_notes,
    })),
  });
});

/**
 * POST /api/admin/submissions/:id/review
 * Approve or reject a submission
 */
adminRoutes.post('/submissions/:id/review', async (c) => {
  const submissionId = c.req.param('id');
  const { action, notes } = await c.req.json();

  if (!['approve', 'reject'].includes(action)) {
    return c.json({ error: 'Invalid action' }, 400);
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  // Update submission
  await c.env.DB.prepare(`
    UPDATE submissions
    SET status = ?, reviewer_notes = ?, reviewed_at = datetime('now'), reviewed_by = 'admin'
    WHERE id = ?
  `)
    .bind(newStatus, notes || null, submissionId)
    .run();

  // If approving a deal submission, update the deal status too
  const submission = await c.env.DB.prepare(`SELECT * FROM submissions WHERE id = ?`).bind(submissionId).first();

  if (submission && submission.submission_type === 'deal' && action === 'approve') {
    const data = JSON.parse(submission.data as string);
    if (data.dealId) {
      await c.env.DB.prepare(`UPDATE deals SET status = 'approved' WHERE id = ?`).bind(data.dealId).run();
    }
  }

  return c.json({ success: true, status: newStatus });
});

/**
 * GET /api/admin/audit
 * View audit log
 */
adminRoutes.get('/audit', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const entityType = c.req.query('entity_type');

  let sql = `SELECT * FROM audit_log`;
  const params: any[] = [];

  if (entityType) {
    sql += ` WHERE entity_type = ?`;
    params.push(entityType);
  }

  sql += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);

  const result = await c.env.DB.prepare(sql).bind(...params).all();

  return c.json({
    entries: (result.results || []).map((row: any) => ({
      id: row.id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      performedBy: row.performed_by,
      createdAt: row.created_at,
    })),
  });
});

/**
 * POST /api/admin/sync
 * Trigger manual data sync
 */
adminRoutes.post('/sync', async (c) => {
  const { source, area } = await c.req.json();

  // Queue ingestion message
  await c.env.INGEST_QUEUE.send({
    type: 'signal_fetch',
    source: source || 'all',
    area: area || {
      lat: parseFloat(c.env.DEFAULT_LAT),
      lng: parseFloat(c.env.DEFAULT_LNG),
      radiusMiles: 25,
    },
    priority: 'high',
    timestamp: new Date().toISOString(),
  });

  return c.json({ success: true, message: 'Sync job queued' });
});

// Helper functions
async function invalidateLeaderboardCache(cache: KVNamespace) {
  // List and delete cached leaderboard keys
  const list = await cache.list({ prefix: 'tonight:' });
  for (const key of list.keys) {
    await cache.delete(key.name);
  }

  const monthlyList = await cache.list({ prefix: 'monthly:' });
  for (const key of monthlyList.keys) {
    await cache.delete(key.name);
  }
}

function getDefaultWeights(): ScoringWeights {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    tonight: {
      popularity: 30,
      quality: 25,
      openNow: 15,
      deals: 15,
      proximity: 10,
      expertBoost: 5,
    },
    monthly: {
      quality: 40,
      popularity: 30,
      consistency: 15,
      deals: 10,
      expertBoost: 5,
    },
    bayesian: {
      m: 10, // minimum votes threshold
      C: 3.8, // prior mean
    },
    proximity: {
      maxBoostMiles: 5,
      decayRate: 0.5,
    },
    recency: {
      tonightHalfLifeHours: 6,
      trendingHalfLifeDays: 7,
    },
  };
}

function getDefaultExpertPicks(): ExpertPickConfig {
  return {
    enabled: true,
    maxBoostPercent: 15,
    venues: [
      { slug: 'georges-keep', boostMultiplier: 1.15, reason: 'Long-standing #1 craft cocktail bar' },
      { slug: 'camp-1604', boostMultiplier: 1.12, reason: 'Premier NW SA outdoor venue' },
      { slug: 'kung-fu-noodle', boostMultiplier: 1.08, reason: 'Unique late-night atmosphere' },
      { slug: 'the-venue-boerne', boostMultiplier: 1.08, reason: 'Top Boerne entertainment' },
    ],
  };
}
