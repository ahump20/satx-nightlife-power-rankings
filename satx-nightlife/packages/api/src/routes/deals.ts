/**
 * Deals API Routes
 * List, create, and manage venue deals/specials
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, Deal } from '../types';
import { DealCreateSchema, LocationQuerySchema } from '../types';
import { calculateDistance } from '../lib/geo';
import { verifyAuth } from '../lib/auth';

export const dealRoutes = new Hono<{ Bindings: Env }>();

const DealsQuerySchema = LocationQuerySchema.extend({
  venue_id: z.string().optional(),
  deal_type: z.string().optional(),
  day_of_week: z.coerce.number().min(0).max(6).optional(),
  active_now: z.coerce.boolean().default(false),
  limit: z.coerce.number().min(1).max(50).default(20),
});

/**
 * GET /api/deals
 * List deals with filters
 */
dealRoutes.get('/', async (c) => {
  const query = DealsQuerySchema.safeParse(Object.fromEntries(c.req.query()));

  if (!query.success) {
    return c.json(
      {
        error: 'Invalid query parameters',
        details: query.error.flatten(),
      },
      400
    );
  }

  const { lat, lng, radius_miles, venue_id, deal_type, day_of_week, active_now, limit } = query.data;

  let sql = `
    SELECT
      d.*,
      v.id as venue_id,
      v.name as venue_name,
      v.slug as venue_slug,
      v.latitude,
      v.longitude,
      v.category as venue_category
    FROM deals d
    JOIN venues v ON d.venue_id = v.id
    WHERE d.is_active = 1 AND d.status = 'approved' AND v.is_active = 1
  `;

  const params: any[] = [];

  if (venue_id) {
    sql += ` AND (d.venue_id = ? OR v.slug = ?)`;
    params.push(venue_id, venue_id);
  }

  if (deal_type) {
    sql += ` AND d.deal_type = ?`;
    params.push(deal_type);
  }

  if (day_of_week !== undefined) {
    sql += ` AND (d.day_of_week IS NULL OR d.day_of_week = ?)`;
    params.push(day_of_week);
  }

  // Check validity dates
  sql += ` AND (d.valid_from IS NULL OR d.valid_from <= date('now'))`;
  sql += ` AND (d.valid_until IS NULL OR d.valid_until >= date('now'))`;

  sql += ` ORDER BY d.deal_type, d.day_of_week, d.start_time LIMIT ?`;
  params.push(limit * 2); // Fetch extra to filter by distance

  const result = await c.env.DB.prepare(sql).bind(...params).all();

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5);

  // Process and filter results
  const deals = (result.results || [])
    .map((row: any) => {
      const distance = calculateDistance(lat, lng, row.latitude, row.longitude);

      // Check if active right now
      let isActiveNow = false;
      if (row.day_of_week === null || row.day_of_week === currentDay) {
        if (!row.start_time || !row.end_time) {
          isActiveNow = true;
        } else {
          isActiveNow = currentTime >= row.start_time && currentTime <= row.end_time;
        }
      }

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        dealType: row.deal_type,
        dayOfWeek: row.day_of_week,
        startTime: row.start_time,
        endTime: row.end_time,
        discountPercent: row.discount_percent,
        discountAmount: row.discount_amount,
        tags: row.tags ? JSON.parse(row.tags) : [],
        venue: {
          id: row.venue_id,
          name: row.venue_name,
          slug: row.venue_slug,
          category: row.venue_category,
          distance,
        },
        isActiveNow,
      };
    })
    .filter((d: any) => d.venue.distance <= radius_miles)
    .filter((d: any) => !active_now || d.isActiveNow)
    .sort((a: any, b: any) => a.venue.distance - b.venue.distance)
    .slice(0, limit);

  return c.json({
    deals,
    meta: {
      total: deals.length,
      center: { lat, lng },
      radiusMiles: radius_miles,
      filters: {
        dealType: deal_type,
        dayOfWeek: day_of_week,
        activeNow: active_now,
      },
    },
  });
});

/**
 * GET /api/deals/today
 * Get deals active today
 */
dealRoutes.get('/today', async (c) => {
  const query = LocationQuerySchema.extend({
    limit: z.coerce.number().min(1).max(30).default(15),
  }).safeParse(Object.fromEntries(c.req.query()));

  if (!query.success) {
    return c.json({ error: 'Invalid query parameters', details: query.error.flatten() }, 400);
  }

  const { lat, lng, radius_miles, limit } = query.data;
  const today = new Date().getDay();

  const result = await c.env.DB.prepare(`
    SELECT
      d.*,
      v.name as venue_name,
      v.slug as venue_slug,
      v.latitude,
      v.longitude
    FROM deals d
    JOIN venues v ON d.venue_id = v.id
    WHERE d.is_active = 1
      AND d.status = 'approved'
      AND v.is_active = 1
      AND (d.day_of_week IS NULL OR d.day_of_week = ?)
      AND (d.valid_from IS NULL OR d.valid_from <= date('now'))
      AND (d.valid_until IS NULL OR d.valid_until >= date('now'))
    ORDER BY d.start_time
  `)
    .bind(today)
    .all();

  const deals = (result.results || [])
    .map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      dealType: row.deal_type,
      startTime: row.start_time,
      endTime: row.end_time,
      discountPercent: row.discount_percent,
      venue: {
        name: row.venue_name,
        slug: row.venue_slug,
        distance: calculateDistance(lat, lng, row.latitude, row.longitude),
      },
    }))
    .filter((d: any) => d.venue.distance <= radius_miles)
    .sort((a: any, b: any) => a.venue.distance - b.venue.distance)
    .slice(0, limit);

  return c.json({
    deals,
    dayOfWeek: today,
    total: deals.length,
  });
});

/**
 * POST /api/deals
 * Submit a new deal (requires auth for admin, or goes to moderation queue)
 */
dealRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = DealCreateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        error: 'Invalid deal data',
        details: parsed.error.flatten(),
      },
      400
    );
  }

  const data = parsed.data;

  // Check if admin (auto-approve) or public (pending moderation)
  const authHeader = c.req.header('Authorization');
  const isAdmin = authHeader ? await verifyAuth(c.env, authHeader) : false;

  const dealId = crypto.randomUUID();
  const status = isAdmin ? 'approved' : 'pending';

  await c.env.DB.prepare(`
    INSERT INTO deals (
      id, venue_id, title, description, deal_type,
      day_of_week, start_time, end_time,
      discount_percent, discount_amount, tags, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      dealId,
      data.venue_id,
      data.title,
      data.description || null,
      data.deal_type,
      data.day_of_week ?? null,
      data.start_time || null,
      data.end_time || null,
      data.discount_percent ?? null,
      data.discount_amount ?? null,
      data.tags ? JSON.stringify(data.tags) : null,
      status
    )
    .run();

  // If pending, also create submission record
  if (!isAdmin) {
    await c.env.DB.prepare(`
      INSERT INTO submissions (id, venue_id, submission_type, data, status, submitted_by_ip)
      VALUES (?, ?, 'deal', ?, 'pending', ?)
    `)
      .bind(crypto.randomUUID(), data.venue_id, JSON.stringify({ dealId, ...data }), c.req.header('CF-Connecting-IP') || 'unknown')
      .run();
  }

  return c.json(
    {
      success: true,
      dealId,
      status,
      message: status === 'approved' ? 'Deal created successfully' : 'Deal submitted for review',
    },
    201
  );
});

/**
 * DELETE /api/deals/:id
 * Remove a deal (admin only)
 */
dealRoutes.delete('/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  const isAdmin = authHeader ? await verifyAuth(c.env, authHeader) : false;

  if (!isAdmin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const dealId = c.req.param('id');

  const result = await c.env.DB.prepare(`UPDATE deals SET is_active = 0 WHERE id = ?`).bind(dealId).run();

  if (result.changes === 0) {
    return c.json({ error: 'Deal not found' }, 404);
  }

  // Audit log
  await c.env.DB.prepare(`
    INSERT INTO audit_log (id, action, entity_type, entity_id, performed_by)
    VALUES (?, 'delete', 'deal', ?, 'admin')
  `)
    .bind(crypto.randomUUID(), dealId)
    .run();

  return c.json({ success: true });
});
