/**
 * Eventbrite API Connector (Stub)
 * Fetches events at venues via official Eventbrite API
 *
 * API Documentation: https://www.eventbrite.com/platform/api
 *
 * Note: This is a stub implementation. Full implementation would require
 * mapping events to venues and updating event counts.
 */

import type { Env, RawVenueData, RawSignalData } from '../types';
import type { DataConnector } from './types';
import { RateLimiter } from './types';

interface EventbriteEvent {
  id: string;
  name: { text: string };
  start: { utc: string };
  end: { utc: string };
  venue_id?: string;
  venue?: {
    id: string;
    name: string;
    address: {
      address_1: string;
      city: string;
      region: string;
      postal_code: string;
      latitude: string;
      longitude: string;
    };
  };
}

export class EventbriteConnector implements DataConnector {
  readonly source = 'eventbrite';
  readonly name = 'Eventbrite';

  private apiKey: string;
  private rateLimiter: RateLimiter;
  private baseUrl = 'https://www.eventbriteapi.com/v3';

  constructor(private env: Env) {
    this.apiKey = env.EVENTBRITE_API_KEY || '';
    // Eventbrite: Rate limits vary by plan
    this.rateLimiter = new RateLimiter(100, 1000);
  }

  isEnabled(): boolean {
    return Boolean(this.apiKey);
  }

  async healthCheck(): Promise<{ healthy: boolean; quotaRemaining?: number; message?: string }> {
    if (!this.isEnabled()) {
      return { healthy: false, message: 'API key not configured' };
    }

    return {
      healthy: true,
      message: 'Eventbrite connector ready (stub implementation)',
    };
  }

  async searchVenues(params: {
    lat: number;
    lng: number;
    radiusMeters: number;
    types?: string[];
    pageToken?: string;
  }): Promise<{ venues: RawVenueData[]; nextPageToken?: string }> {
    // Eventbrite is primarily an events platform, not venue discovery
    // We would search for events and extract venue information
    console.log('[Eventbrite] searchVenues called - stub implementation');

    if (!this.isEnabled()) {
      return { venues: [] };
    }

    // In a full implementation, we would:
    // 1. Search for events in the area: GET /events/search
    // 2. Extract venue information from events
    // 3. Return unique venues

    return { venues: [] };
  }

  async getVenueDetails(venueId: string): Promise<RawVenueData | null> {
    console.log('[Eventbrite] getVenueDetails called - stub implementation');

    if (!this.isEnabled()) {
      return null;
    }

    // In a full implementation:
    // GET /venues/{venue_id}

    return null;
  }

  async fetchSignals(venueId: string): Promise<RawSignalData | null> {
    console.log('[Eventbrite] fetchSignals called - stub implementation');

    if (!this.isEnabled()) {
      return null;
    }

    // In a full implementation:
    // 1. Search for upcoming events at this venue
    // 2. Return event count as signal

    return {
      sourceId: venueId,
      source: this.source,
      timestamp: new Date().toISOString(),
      eventCount: 0,
      raw: {},
    };
  }

  /**
   * Search for events in an area (specific to Eventbrite)
   */
  async searchEvents(params: {
    lat: number;
    lng: number;
    radiusMiles: number;
    startDate?: string;
    endDate?: string;
  }): Promise<EventbriteEvent[]> {
    if (!this.isEnabled()) {
      return [];
    }

    if (!await this.rateLimiter.checkLimit()) {
      console.warn('[Eventbrite] Rate limit reached');
      return [];
    }

    const searchParams = new URLSearchParams({
      'location.latitude': String(params.lat),
      'location.longitude': String(params.lng),
      'location.within': `${params.radiusMiles}mi`,
      'categories': '103', // Nightlife category
      'expand': 'venue',
    });

    if (params.startDate) {
      searchParams.set('start_date.range_start', params.startDate);
    }
    if (params.endDate) {
      searchParams.set('start_date.range_end', params.endDate);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/events/search?${searchParams}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      this.rateLimiter.recordRequest();

      if (!response.ok) {
        console.error(`[Eventbrite] API error: ${response.status}`);
        return [];
      }

      const data = await response.json() as any;
      return data.events || [];
    } catch (error) {
      console.error('[Eventbrite] Fetch error:', error);
      return [];
    }
  }
}
