// Google Places API integration
// Fetches venue data, ratings, and reviews via official API

import { SATX_NW_BOUNDS } from '../db/schema';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
    periods?: Array<{
      open: { day: number; time: string };
      close?: { day: number; time: string };
    }>;
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  types?: string[];
  website?: string;
  formatted_phone_number?: string;
}

export interface PlaceSearchResponse {
  results: GooglePlaceResult[];
  status: string;
  next_page_token?: string;
}

export interface PlaceDetailsResponse {
  result: GooglePlaceResult;
  status: string;
}

/**
 * Search for bars and nightlife venues in the SATX NW/Boerne area
 */
export async function searchNightlifeVenues(
  pageToken?: string
): Promise<PlaceSearchResponse> {
  const params = new URLSearchParams({
    key: GOOGLE_PLACES_API_KEY,
    location: `${SATX_NW_BOUNDS.center.lat},${SATX_NW_BOUNDS.center.lng}`,
    radius: '25000', // 25km radius
    type: 'bar',
    keyword: 'bar cocktail brewery nightlife',
  });

  if (pageToken) {
    params.set('pagetoken', pageToken);
  }

  const response = await fetch(
    `${PLACES_BASE_URL}/nearbysearch/json?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get detailed information about a specific place
 */
export async function getPlaceDetails(placeId: string): Promise<GooglePlaceResult | null> {
  const params = new URLSearchParams({
    key: GOOGLE_PLACES_API_KEY,
    place_id: placeId,
    fields: [
      'place_id',
      'name',
      'formatted_address',
      'geometry',
      'rating',
      'user_ratings_total',
      'price_level',
      'opening_hours',
      'photos',
      'types',
      'website',
      'formatted_phone_number',
    ].join(','),
  });

  const response = await fetch(
    `${PLACES_BASE_URL}/details/json?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status}`);
  }

  const data: PlaceDetailsResponse = await response.json();

  if (data.status !== 'OK') {
    console.error(`Place details error: ${data.status}`);
    return null;
  }

  return data.result;
}

/**
 * Get photo URL for a place
 */
export function getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
  const params = new URLSearchParams({
    key: GOOGLE_PLACES_API_KEY,
    photoreference: photoReference,
    maxwidth: maxWidth.toString(),
  });

  return `${PLACES_BASE_URL}/photo?${params.toString()}`;
}

/**
 * Calculate distance between two coordinates in miles
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check if a location is within the SATX NW bounds
 */
export function isInSATXNWArea(lat: number, lng: number): boolean {
  return (
    lat >= SATX_NW_BOUNDS.south &&
    lat <= SATX_NW_BOUNDS.north &&
    lng >= SATX_NW_BOUNDS.west &&
    lng <= SATX_NW_BOUNDS.east
  );
}

/**
 * Map Google place types to our venue categories
 */
export function mapPlaceTypeToCategory(types: string[]): string {
  if (types.includes('night_club')) return 'club';
  if (types.includes('bar')) {
    if (types.includes('restaurant')) return 'restaurant_bar';
    return 'bar';
  }
  if (types.includes('brewery')) return 'brewery';
  if (types.includes('winery')) return 'winery';
  return 'bar';
}
