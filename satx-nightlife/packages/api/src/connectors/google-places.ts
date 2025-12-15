/**
 * Google Places API Connector
 * Fetches venue data via official Places API
 *
 * API Documentation: https://developers.google.com/maps/documentation/places/web-service
 *
 * Terms Compliance:
 * - Uses official API only
 * - Does NOT scrape Popular Times (not available via API)
 * - Respects rate limits and caching requirements
 * - Displays attribution as required
 */

import type { Env, RawVenueData, RawSignalData, BusinessHours } from '../types';
import type { DataConnector } from './types';
import { RateLimiter, mapCategory } from './types';
import { z } from 'zod';

// Google Places API response schemas
const PlaceResultSchema = z.object({
  place_id: z.string(),
  name: z.string(),
  formatted_address: z.string().optional(),
  geometry: z.object({
    location: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
  }),
  rating: z.number().optional(),
  user_ratings_total: z.number().optional(),
  price_level: z.number().optional(),
  types: z.array(z.string()).optional(),
  business_status: z.string().optional(),
  opening_hours: z
    .object({
      open_now: z.boolean().optional(),
      weekday_text: z.array(z.string()).optional(),
      periods: z
        .array(
          z.object({
            open: z.object({ day: z.number(), time: z.string() }),
            close: z.object({ day: z.number(), time: z.string() }).optional(),
          })
        )
        .optional(),
    })
    .optional(),
  photos: z
    .array(
      z.object({
        photo_reference: z.string(),
        height: z.number(),
        width: z.number(),
      })
    )
    .optional(),
  formatted_phone_number: z.string().optional(),
  website: z.string().optional(),
});

type PlaceResult = z.infer<typeof PlaceResultSchema>;

export class GooglePlacesConnector implements DataConnector {
  readonly source = 'google_places';
  readonly name = 'Google Places';

  private apiKey: string;
  private rateLimiter: RateLimiter;

  constructor(private env: Env) {
    this.apiKey = env.GOOGLE_PLACES_API_KEY || '';
    // Google Places: 1000 requests/day free, then paid
    this.rateLimiter = new RateLimiter(60, 1000);
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
      console.warn('[GooglePlaces] Rate limit reached');
      return { venues: [] };
    }

    const searchParams = new URLSearchParams({
      location: `${params.lat},${params.lng}`,
      radius: String(Math.min(params.radiusMeters, 50000)),
      type: 'bar', // Primary type
      key: this.apiKey,
    });

    if (params.pageToken) {
      searchParams.set('pagetoken', params.pageToken);
    }

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${searchParams}`;

    try {
      const response = await fetch(url);
      this.rateLimiter.recordRequest();

      if (!response.ok) {
        console.error(`[GooglePlaces] API error: ${response.status}`);
        return { venues: [] };
      }

      const data = await response.json() as any;

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error(`[GooglePlaces] API status: ${data.status}`, data.error_message);
        return { venues: [] };
      }

      const venues: RawVenueData[] = (data.results || []).map((place: any) => {
        const parsed = PlaceResultSchema.safeParse(place);
        if (!parsed.success) {
          console.warn('[GooglePlaces] Failed to parse place:', parsed.error);
          return null;
        }
        return this.mapPlaceToVenue(parsed.data);
      }).filter(Boolean) as RawVenueData[];

      return {
        venues,
        nextPageToken: data.next_page_token,
      };
    } catch (error) {
      console.error('[GooglePlaces] Fetch error:', error);
      return { venues: [] };
    }
  }

  async getVenueDetails(placeId: string): Promise<RawVenueData | null> {
    if (!await this.rateLimiter.checkLimit()) {
      return null;
    }

    const fields = [
      'place_id',
      'name',
      'formatted_address',
      'geometry',
      'rating',
      'user_ratings_total',
      'price_level',
      'types',
      'business_status',
      'opening_hours',
      'photos',
      'formatted_phone_number',
      'website',
    ].join(',');

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      this.rateLimiter.recordRequest();

      if (!response.ok) return null;

      const data = await response.json() as any;

      if (data.status !== 'OK') {
        console.error(`[GooglePlaces] Details error: ${data.status}`);
        return null;
      }

      const parsed = PlaceResultSchema.safeParse(data.result);
      if (!parsed.success) return null;

      return this.mapPlaceToVenue(parsed.data);
    } catch (error) {
      console.error('[GooglePlaces] Details fetch error:', error);
      return null;
    }
  }

  async fetchSignals(placeId: string): Promise<RawSignalData | null> {
    // Google Places doesn't provide real-time signals beyond what's in details
    // We can only get rating and review count
    const venue = await this.getVenueDetails(placeId);

    if (!venue) return null;

    return {
      sourceId: placeId,
      source: this.source,
      timestamp: new Date().toISOString(),
      rating: venue.rating,
      ratingCount: venue.ratingCount,
      isOpen: venue.raw?.isOpenNow as boolean | undefined,
      raw: venue.raw,
    };
  }

  private mapPlaceToVenue(place: PlaceResult): RawVenueData {
    // Parse hours
    const hours: BusinessHours[] = [];
    if (place.opening_hours?.periods) {
      for (const period of place.opening_hours.periods) {
        hours.push({
          dayOfWeek: period.open.day,
          open: this.formatTime(period.open.time),
          close: period.close ? this.formatTime(period.close.time) : '23:59',
        });
      }
    }

    // Get first photo URL (requires another API call to resolve)
    const photoRef = place.photos?.[0]?.photo_reference;

    // Map category
    const primaryType = place.types?.find((t) =>
      ['bar', 'night_club', 'restaurant', 'cafe'].includes(t)
    );

    return {
      sourceId: place.place_id,
      source: this.source,
      name: place.name,
      address: place.formatted_address || '',
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      phone: place.formatted_phone_number,
      website: place.website,
      category: mapCategory(primaryType || 'bar'),
      priceLevel: place.price_level,
      rating: place.rating,
      ratingCount: place.user_ratings_total,
      photos: photoRef
        ? [`https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${this.apiKey}`]
        : [],
      hours,
      raw: {
        types: place.types,
        businessStatus: place.business_status,
        isOpenNow: place.opening_hours?.open_now,
      },
    };
  }

  private formatTime(time: string): string {
    // Convert HHMM to HH:MM
    if (time.length === 4) {
      return `${time.slice(0, 2)}:${time.slice(2)}`;
    }
    return time;
  }
}
