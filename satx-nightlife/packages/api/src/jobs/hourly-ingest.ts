/**
 * Hourly Ingestion Job
 * Runs every hour via Cloudflare Cron Trigger
 * Fetches fresh data from all configured connectors
 */

import { Env, Venue } from '../types';
import { GooglePlacesConnector } from '../connectors/google-places';
import { YelpConnector } from '../connectors/yelp';
import { EventbriteConnector } from '../connectors/eventbrite';
import { setCache, getCache } from '../lib/cache';

// San Antonio metro area center points for data collection
const COLLECTION_POINTS = [
  { lat: 29.4241, lng: -98.4936, name: 'Downtown SA' },
  { lat: 29.5427, lng: -98.6117, name: 'NW San Antonio' },
  { lat: 29.5847, lng: -98.4500, name: 'North SA' },
  { lat: 29.7947, lng: -98.7298, name: 'Boerne' },
  { lat: 29.5958, lng: -98.5778, name: 'Stone Oak' },
  { lat: 29.4651, lng: -98.5254, name: 'Medical Center' },
];

const RADIUS_MILES = 10;

interface IngestionResult {
  source: string;
  venuesProcessed: number;
  signalsCreated: number;
  errors: string[];
}

export async function runHourlyIngest(env: Env): Promise<IngestionResult[]> {
  const results: IngestionResult[] = [];
  const hour = new Date().getUTCHours();

  console.log(`[hourly-ingest] Starting ingestion at hour ${hour}`);

  // Initialize connectors
  const googleConnector = new GooglePlacesConnector(env.GOOGLE_API_KEY);
  const yelpConnector = new YelpConnector(env.YELP_API_KEY);
  const eventbriteConnector = new EventbriteConnector(env.EVENTBRITE_API_KEY || '');

  // Process each collection point
  for (const point of COLLECTION_POINTS) {
    console.log(`[hourly-ingest] Processing ${point.name}`);

    // Google Places ingestion
    try {
      const googleResult = await ingestFromGoogle(
        env,
        googleConnector,
        point.lat,
        point.lng,
        RADIUS_MILES
      );
      results.push(googleResult);
    } catch (error) {
      console.error(`[hourly-ingest] Google error at ${point.name}:`, error);
      results.push({
        source: `google-${point.name}`,
        venuesProcessed: 0,
        signalsCreated: 0,
        errors: [String(error)],
      });
    }

    // Yelp ingestion (rate limited, so we space out calls)
    try {
      const yelpResult = await ingestFromYelp(
        env,
        yelpConnector,
        point.lat,
        point.lng,
        RADIUS_MILES
      );
      results.push(yelpResult);
    } catch (error) {
      console.error(`[hourly-ingest] Yelp error at ${point.name}:`, error);
      results.push({
        source: `yelp-${point.name}`,
        venuesProcessed: 0,
        signalsCreated: 0,
        errors: [String(error)],
      });
    }
  }

  // Eventbrite - only fetch events once (not per location)
  try {
    const eventbriteResult = await ingestFromEventbrite(env, eventbriteConnector);
    results.push(eventbriteResult);
  } catch (error) {
    console.error('[hourly-ingest] Eventbrite error:', error);
    results.push({
      source: 'eventbrite',
      venuesProcessed: 0,
      signalsCreated: 0,
      errors: [String(error)],
    });
  }

  // Log summary
  const totalVenues = results.reduce((sum, r) => sum + r.venuesProcessed, 0);
  const totalSignals = results.reduce((sum, r) => sum + r.signalsCreated, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

  console.log(`[hourly-ingest] Complete: ${totalVenues} venues, ${totalSignals} signals, ${totalErrors} errors`);

  // Store last run metadata
  await setCache(env.KV, 'job:hourly-ingest:last-run', {
    timestamp: new Date().toISOString(),
    results: {
      venuesProcessed: totalVenues,
      signalsCreated: totalSignals,
      errorCount: totalErrors,
    },
  }, 86400); // 24 hour TTL

  return results;
}

async function ingestFromGoogle(
  env: Env,
  connector: GooglePlacesConnector,
  lat: number,
  lng: number,
  radiusMiles: number
): Promise<IngestionResult> {
  const result: IngestionResult = {
    source: 'google',
    venuesProcessed: 0,
    signalsCreated: 0,
    errors: [],
  };

  const venues = await connector.searchNearby(lat, lng, radiusMiles);

  for (const venue of venues) {
    try {
      // Upsert venue
      await upsertVenue(env, venue, 'google');
      result.venuesProcessed++;

      // Create hourly signal
      if (venue.scores) {
        await createHourlySignal(env, venue.id, 'google', {
          rating: venue.scores.rating || 0,
          review_count: venue.scores.reviewCount || 0,
          // Note: Popular times not available via ToS-compliant API
          checkin_count: 0,
          event_flag: false,
        });
        result.signalsCreated++;
      }
    } catch (error) {
      result.errors.push(`Venue ${venue.id}: ${String(error)}`);
    }
  }

  return result;
}

async function ingestFromYelp(
  env: Env,
  connector: YelpConnector,
  lat: number,
  lng: number,
  radiusMiles: number
): Promise<IngestionResult> {
  const result: IngestionResult = {
    source: 'yelp',
    venuesProcessed: 0,
    signalsCreated: 0,
    errors: [],
  };

  const venues = await connector.searchNearby(lat, lng, radiusMiles);

  for (const venue of venues) {
    try {
      // Upsert venue
      await upsertVenue(env, venue, 'yelp');
      result.venuesProcessed++;

      // Create hourly signal
      if (venue.scores) {
        await createHourlySignal(env, venue.id, 'yelp', {
          rating: venue.scores.rating || 0,
          review_count: venue.scores.reviewCount || 0,
          checkin_count: 0,
          event_flag: false,
        });
        result.signalsCreated++;
      }
    } catch (error) {
      result.errors.push(`Venue ${venue.id}: ${String(error)}`);
    }
  }

  return result;
}

async function ingestFromEventbrite(
  env: Env,
  connector: EventbriteConnector
): Promise<IngestionResult> {
  const result: IngestionResult = {
    source: 'eventbrite',
    venuesProcessed: 0,
    signalsCreated: 0,
    errors: [],
  };

  // San Antonio area bounds
  const events = await connector.searchNearby(29.4241, -98.4936, 25);

  // Group events by venue and flag venues with events tonight
  const venueEvents = new Map<string, number>();
  const today = new Date().toISOString().split('T')[0];

  for (const event of events) {
    if (event.id) {
      const count = venueEvents.get(event.id) || 0;
      venueEvents.set(event.id, count + 1);
    }
  }

  // Update venues with event flags
  for (const [venueId, eventCount] of venueEvents) {
    try {
      await env.DB.prepare(`
        UPDATE venues SET has_events_tonight = 1
        WHERE id = ? OR google_place_id = ? OR yelp_id = ?
      `).bind(venueId, venueId, venueId).run();

      result.venuesProcessed++;
    } catch (error) {
      result.errors.push(`Event venue ${venueId}: ${String(error)}`);
    }
  }

  return result;
}

async function upsertVenue(env: Env, venue: Venue, source: string): Promise<void> {
  const now = new Date().toISOString();

  // Check if venue exists by source ID
  const existing = await env.DB.prepare(`
    SELECT id FROM venues
    WHERE google_place_id = ? OR yelp_id = ?
  `).bind(
    source === 'google' ? venue.id : null,
    source === 'yelp' ? venue.id : null
  ).first<{ id: string }>();

  if (existing) {
    // Update existing venue
    await env.DB.prepare(`
      UPDATE venues SET
        name = COALESCE(?, name),
        lat = COALESCE(?, lat),
        lng = COALESCE(?, lng),
        address = COALESCE(?, address),
        category = COALESCE(?, category),
        price_level = COALESCE(?, price_level),
        photo_url = COALESCE(?, photo_url),
        updated_at = ?
      WHERE id = ?
    `).bind(
      venue.name,
      venue.location.lat,
      venue.location.lng,
      venue.address,
      venue.category,
      venue.priceLevel,
      venue.photoUrl,
      now,
      existing.id
    ).run();

    // Update source reference
    await env.DB.prepare(`
      INSERT INTO venue_sources (venue_id, source, source_id, last_sync)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (venue_id, source) DO UPDATE SET
        source_id = excluded.source_id,
        last_sync = excluded.last_sync
    `).bind(existing.id, source, venue.id, now).run();
  } else {
    // Insert new venue
    const newId = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO venues (
        id, name, lat, lng, address, category, price_level, photo_url,
        google_place_id, yelp_id, is_expert_pick, expert_rank, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?)
    `).bind(
      newId,
      venue.name,
      venue.location.lat,
      venue.location.lng,
      venue.address,
      venue.category,
      venue.priceLevel,
      venue.photoUrl,
      source === 'google' ? venue.id : null,
      source === 'yelp' ? venue.id : null,
      now,
      now
    ).run();

    // Add source reference
    await env.DB.prepare(`
      INSERT INTO venue_sources (venue_id, source, source_id, last_sync)
      VALUES (?, ?, ?, ?)
    `).bind(newId, source, venue.id, now).run();
  }
}

async function createHourlySignal(
  env: Env,
  venueId: string,
  source: string,
  data: {
    rating: number;
    review_count: number;
    checkin_count: number;
    event_flag: boolean;
  }
): Promise<void> {
  const now = new Date();
  const hour = now.getUTCHours();
  const dateStr = now.toISOString().split('T')[0];

  // Look up internal venue ID
  const venue = await env.DB.prepare(`
    SELECT id FROM venues
    WHERE id = ? OR google_place_id = ? OR yelp_id = ?
  `).bind(venueId, venueId, venueId).first<{ id: string }>();

  if (!venue) {
    console.warn(`[hourly-ingest] Venue not found for signal: ${venueId}`);
    return;
  }

  await env.DB.prepare(`
    INSERT INTO signals_hourly (
      venue_id, source, hour, date, rating, review_count,
      checkin_count, event_flag, raw_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (venue_id, source, hour, date) DO UPDATE SET
      rating = excluded.rating,
      review_count = excluded.review_count,
      checkin_count = excluded.checkin_count,
      event_flag = excluded.event_flag,
      raw_json = excluded.raw_json
  `).bind(
    venue.id,
    source,
    hour,
    dateStr,
    data.rating,
    data.review_count,
    data.checkin_count,
    data.event_flag ? 1 : 0,
    JSON.stringify(data),
    now.toISOString()
  ).run();
}
