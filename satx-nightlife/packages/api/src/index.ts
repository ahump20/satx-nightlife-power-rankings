/**
 * SATX Nightlife Power Rankings API
 * Cloudflare Worker with Hono framework
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

import type { Env, IngestMessage } from './types';
import { leaderboardRoutes } from './routes/leaderboards';
import { venueRoutes } from './routes/venues';
import { dealRoutes } from './routes/deals';
import { adminRoutes } from './routes/admin';
import { runHourlyIngestion } from './jobs/hourly-ingest';
import { runDailyRollup } from './jobs/daily-rollup';
import { runMonthlySnapshot } from './jobs/monthly-snapshot';

// Create Hono app with environment bindings
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'https://satx-nightlife.pages.dev', 'https://satxnightlife.app'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposeHeaders: ['X-Request-ID', 'X-Cache-Status'],
    maxAge: 86400,
    credentials: true,
  })
);

// Request ID middleware
app.use('*', async (c, next) => {
  const requestId = c.req.header('X-Request-ID') || crypto.randomUUID();
  c.set('requestId', requestId);
  c.header('X-Request-ID', requestId);
  await next();
});

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API info
app.get('/', (c) => {
  return c.json({
    name: 'SATX Nightlife Power Rankings API',
    version: '1.0.0',
    docs: '/api/docs',
    endpoints: {
      leaderboards: {
        tonight: 'GET /api/leaderboards/tonight',
        monthly: 'GET /api/leaderboards/monthly',
        trending: 'GET /api/leaderboards/trending',
      },
      venues: {
        search: 'GET /api/venues/search',
        details: 'GET /api/venues/:id',
      },
      deals: {
        list: 'GET /api/deals',
        create: 'POST /api/deals',
      },
    },
  });
});

// Mount routes
app.route('/api/leaderboards', leaderboardRoutes);
app.route('/api/venues', venueRoutes);
app.route('/api/deals', dealRoutes);
app.route('/api/admin', adminRoutes);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      message: `Route ${c.req.method} ${c.req.path} not found`,
      requestId: c.get('requestId'),
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error(`[${c.get('requestId')}] Error:`, err);

  const status = err instanceof HTTPException ? err.status : 500;
  return c.json(
    {
      error: err.name || 'Internal Server Error',
      message: c.env.ENVIRONMENT === 'development' ? err.message : 'An unexpected error occurred',
      requestId: c.get('requestId'),
    },
    status as 400 | 401 | 403 | 404 | 500
  );
});

// HTTP Exception class
class HTTPException extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'HTTPException';
  }
}

// Export for Cloudflare Workers
export default {
  // HTTP fetch handler
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },

  // Scheduled (Cron) handler
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const hour = new Date(event.scheduledTime).getUTCHours();
    const day = new Date(event.scheduledTime).getUTCDate();

    console.log(`[Cron] Triggered at ${new Date(event.scheduledTime).toISOString()}`);

    try {
      // Determine which job to run based on cron pattern
      if (event.cron === '0 7 1 * *' || (day === 1 && hour === 7)) {
        // Monthly snapshot - 1st of month at 7 AM UTC
        console.log('[Cron] Running monthly snapshot job');
        await runMonthlySnapshot(env);
      } else if (event.cron === '0 6 * * *' || hour === 6) {
        // Daily rollup - 6 AM UTC
        console.log('[Cron] Running daily rollup job');
        await runDailyRollup(env);
      } else {
        // Hourly ingestion
        console.log('[Cron] Running hourly ingestion job');
        await runHourlyIngestion(env);
      }
    } catch (error) {
      console.error('[Cron] Job failed:', error);
      throw error;
    }
  },

  // Queue consumer handler
  async queue(batch: MessageBatch<IngestMessage>, env: Env): Promise<void> {
    console.log(`[Queue] Processing ${batch.messages.length} messages`);

    for (const message of batch.messages) {
      try {
        const { type, source, venueId, area } = message.body;

        switch (type) {
          case 'venue_sync':
            console.log(`[Queue] Syncing venue ${venueId} from ${source}`);
            // Import and run connector sync
            break;

          case 'signal_fetch':
            console.log(`[Queue] Fetching signals for area`, area);
            // Fetch fresh signals for area
            break;

          case 'deal_verify':
            console.log(`[Queue] Verifying deal for venue ${venueId}`);
            // Verify deal submission
            break;

          default:
            console.warn(`[Queue] Unknown message type: ${type}`);
        }

        message.ack();
      } catch (error) {
        console.error(`[Queue] Message processing failed:`, error);
        message.retry();
      }
    }
  },
};
