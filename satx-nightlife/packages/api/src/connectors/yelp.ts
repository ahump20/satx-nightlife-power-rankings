/**
 * Yelp Fusion API Connector
 * Fetches venue data via official Yelp API
 *
 * API Documentation: https://docs.developer.yelp.com/docs/fusion-intro
 *
 * Terms Compliance:
 * - Uses official Fusion API only
 * - Displays Yelp attribution as required
 * - Respects rate limits (5000/day for most plans)
 * - Caches responses appropriately
 */

import type { Env, RawVenueData, RawSignalData, BusinessHours } from '../types';
import type { DataConnector } from './types';
import { RateLimiter, mapCategory } from './types';
import { z } from 'zod';

// Yelp API response schemas
const YelpBusinessSchema = z.object({
  id: z.string(),
  alias: z.string(),
  name: z.string(),
  image_url: z.string().optional(),
  is_closed: z.boolean(),
  url: z.string(),
  review_count: z.number(),
  categories: z.array(
    z.object({
      alias: z.string(),
      title: z.string(),
    })
  ),
  rating: z.number(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  price: z.string().optional(),
  location: z.object({
    address1: z.string().nullable(),
    address2: z.string().nullable().optional(),
    city: z.string(),
    zip_code: z.string(),
    country: z.string(),
    state: z.string(),
    display_address: z.array(z.string()),
  }),
  phone: z.string().optional(),
  display_phone: z.string().optional(),
  distance: z.number().optional(),
  hours: z
    .array(
      z.object({
        open: z.array(
          z.object({
            is_overnight: z.boolean(),
            start: z.string(),
            end: z.string(),
            day: z.number(),
          })
        ),
        hours_type: z.string(),
        is_open_now: z.boolean(),
      })
    )
    .optional(),
});

type YelpBusiness = z.infer<typeof YelpBusinessSchema>;

export class YelpConnector implements DataConnector {
  readonly source = 'yelp';
  readonly name = 'Yelp Fusion';

  private apiKey: string;
  private rateLimiter: RateLimiter;
  private baseUrl = 'https://api.yelp.com/v3';

  constructor(private env: Env) {
    this.apiKey = env.YELP_API_KEY || '';
    // Yelp Fusion: 5000 requests/day
    this.rateLimiter = new RateLimiter(100, 5000);
  }

  isEnabled(): boolean {
    return Boolean(this.apiKey);
  }

  async healthCheck(): Promise<{ healthy: boolean; quotaRemaining?: number; message?: string }> {
    if (!this.isEnabled()) {
      return { healthy: false, message: 'API key not configured' };
    }

    const status = this.rateLimiter.getStatus();
    return {
      healthy: status.dayRemaining > 0,
      quotaRemaining: status.dayRemaining,
      message: `${status.dayRemaining} requests remaining today`,
    };
  }

  async searchVenues(params: {
    lat: number;
    lng: number;
    radiusMeters: number;
    types?: string[];
    pageToken?: string;
  }): Promise<{ venues: RawVenueData[]; nextPageToken?: string }> {
    if (!await this.rateLimiter.checkLimit()) {
      console.warn('[Yelp] Rate limit reached');
      return { venues: [] };
    }

    const offset = params.pageToken ? parseInt(params.pageToken) : 0;

    const searchParams = new URLSearchParams({
      latitude: String(params.lat),
      longitude: String(params.lng),
      radius: String(Math.min(params.radiusMeters, 40000)), // Yelp max is 40km
      categories: 'bars,cocktailbars,sportsbars,breweries,lounges,nightlife',
      sort_by: 'rating',
      limit: '50',
      offset: String(offset),
    });

    const url = `${this.baseUrl}/businesses/search?${searchParams}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
        },
      });

      this.rateLimiter.recordRequest();

      if (!response.ok) {
        console.error(`[Yelp] API error: ${response.status}`);
        return { venues: [] };
      }

      const data = await response.json() as any;

      const venues: RawVenueData[] = (data.businesses || [])
        .map((biz: any) => {
          const parsed = YelpBusinessSchema.safeParse(biz);
          if (!parsed.success) {
            console.warn('[Yelp] Failed to parse business:', parsed.error);
            return null;
          }
          return this.mapBusinessToVenue(parsed.data);
        })
        .filter(Boolean) as RawVenueData[];

      // Check if there are more results
      const total = data.total || 0;
      const nextOffset = offset + 50;
      const nextPageToken = nextOffset < total && nextOffset < 1000 ? String(nextOffset) : undefined;

      return { venues, nextPageToken };
    } catch (error) {
      console.error('[Yelp] Fetch error:', error);
      return { venues: [] };
    }
  }

  async getVenueDetails(businessId: string): Promise<RawVenueData | null> {
    if (!await this.rateLimiter.checkLimit()) {
      return null;
    }

    const url = `${this.baseUrl}/businesses/${businessId}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
        },
      });

      this.rateLimiter.recordRequest();

      if (!response.ok) {
        if (response.status === 404) return null;
        console.error(`[Yelp] Details error: ${response.status}`);
        return null;
      }

      const data = await response.json() as any;
      const parsed = YelpBusinessSchema.safeParse(data);

      if (!parsed.success) {
        console.warn('[Yelp] Failed to parse business details:', parsed.error);
        return null;
      }

      return this.mapBusinessToVenue(parsed.data);
    } catch (error) {
      console.error('[Yelp] Details fetch error:', error);
      return null;
    }
  }

  async fetchSignals(businessId: string): Promise<RawSignalData | null> {
    const venue = await this.getVenueDetails(businessId);

    if (!venue) return null;

    return {
      sourceId: businessId,
      source: this.source,
      timestamp: new Date().toISOString(),
      rating: venue.rating,
      ratingCount: venue.ratingCount,
      isOpen: venue.raw?.isOpenNow as boolean | undefined,
      raw: venue.raw,
    };
  }

  private mapBusinessToVenue(biz: YelpBusiness): RawVenueData {
    // Parse hours
    const hours: BusinessHours[] = [];
    if (biz.hours?.[0]?.open) {
      for (const period of biz.hours[0].open) {
        hours.push({
          dayOfWeek: period.day,
          open: this.formatTime(period.start),
          close: this.formatTime(period.end),
        });
      }
    }

    // Map category from first Yelp category
    const primaryCategory = biz.categories[0]?.alias || 'bars';

    // Convert price ($, $$, etc.) to numeric level
    const priceLevel = biz.price ? biz.price.length : undefined;

    return {
      sourceId: biz.id,
      source: this.source,
      name: biz.name,
      address: biz.location.display_address.join(', '),
      latitude: biz.coordinates.latitude,
      longitude: biz.coordinates.longitude,
      phone: biz.display_phone || biz.phone,
      website: biz.url,
      category: mapCategory(primaryCategory),
      priceLevel,
      rating: biz.rating,
      ratingCount: biz.review_count,
      photos: biz.image_url ? [biz.image_url] : [],
      hours,
      raw: {
        alias: biz.alias,
        categories: biz.categories,
        isClosed: biz.is_closed,
        isOpenNow: biz.hours?.[0]?.is_open_now,
        yelpUrl: biz.url,
      },
    };
  }

  private formatTime(time: string): string {
    // Yelp uses HHMM format
    if (time.length === 4) {
      return `${time.slice(0, 2)}:${time.slice(2)}`;
    }
    return time;
  }
}
