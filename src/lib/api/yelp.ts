// Yelp Fusion API integration
// Fetches business data and ratings via official Yelp API

import { SATX_NW_BOUNDS } from '../db/schema';

const YELP_API_KEY = process.env.YELP_API_KEY || '';
const YELP_BASE_URL = 'https://api.yelp.com/v3';

export interface YelpBusiness {
  id: string;
  alias: string;
  name: string;
  image_url: string;
  is_closed: boolean;
  url: string;
  review_count: number;
  categories: Array<{
    alias: string;
    title: string;
  }>;
  rating: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  transactions: string[];
  price?: string;
  location: {
    address1: string;
    address2?: string;
    address3?: string;
    city: string;
    zip_code: string;
    country: string;
    state: string;
    display_address: string[];
  };
  phone: string;
  display_phone: string;
  distance?: number;
  hours?: Array<{
    open: Array<{
      is_overnight: boolean;
      start: string;
      end: string;
      day: number;
    }>;
    hours_type: string;
    is_open_now: boolean;
  }>;
}

export interface YelpSearchResponse {
  businesses: YelpBusiness[];
  total: number;
  region: {
    center: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface YelpReview {
  id: string;
  url: string;
  text: string;
  rating: number;
  time_created: string;
  user: {
    id: string;
    profile_url: string;
    image_url: string;
    name: string;
  };
}

export interface YelpReviewsResponse {
  reviews: YelpReview[];
  total: number;
  possible_languages: string[];
}

/**
 * Search for bars and nightlife venues via Yelp
 */
export async function searchYelpVenues(
  offset: number = 0,
  limit: number = 50
): Promise<YelpSearchResponse> {
  const params = new URLSearchParams({
    latitude: SATX_NW_BOUNDS.center.lat.toString(),
    longitude: SATX_NW_BOUNDS.center.lng.toString(),
    radius: '40000', // 40km in meters
    categories: 'bars,cocktailbars,beerbar,breweries,wine_bars,sportsbars,divebars,lounges',
    sort_by: 'rating',
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`${YELP_BASE_URL}/businesses/search?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${YELP_API_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Yelp API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get detailed business information from Yelp
 */
export async function getYelpBusinessDetails(businessId: string): Promise<YelpBusiness | null> {
  const response = await fetch(`${YELP_BASE_URL}/businesses/${businessId}`, {
    headers: {
      Authorization: `Bearer ${YELP_API_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Yelp API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get recent reviews for a business (up to 3 per Yelp API limits)
 */
export async function getYelpReviews(businessId: string): Promise<YelpReviewsResponse> {
  const response = await fetch(`${YELP_BASE_URL}/businesses/${businessId}/reviews`, {
    headers: {
      Authorization: `Bearer ${YELP_API_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Yelp API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Match a venue name to Yelp business
 */
export async function matchVenueToYelp(
  name: string,
  address: string,
  city: string
): Promise<YelpBusiness | null> {
  const params = new URLSearchParams({
    term: name,
    location: `${address}, ${city}, TX`,
    categories: 'bars,nightlife',
    limit: '5',
  });

  const response = await fetch(`${YELP_BASE_URL}/businesses/search?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${YELP_API_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Yelp API error: ${response.status}`);
  }

  const data: YelpSearchResponse = await response.json();

  // Find best match by name similarity
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const business of data.businesses) {
    const normalizedBizName = business.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedBizName.includes(normalizedName) || normalizedName.includes(normalizedBizName)) {
      return business;
    }
  }

  // Return first result if close enough
  if (data.businesses.length > 0 && data.businesses[0].distance && data.businesses[0].distance < 500) {
    return data.businesses[0];
  }

  return null;
}

/**
 * Convert Yelp price string to numeric level
 */
export function yelpPriceToLevel(price?: string): number | null {
  if (!price) return null;
  return price.length; // $ = 1, $$ = 2, $$$ = 3, $$$$ = 4
}

/**
 * Map Yelp categories to our venue categories
 */
export function mapYelpCategoryToVenueCategory(categories: Array<{ alias: string }>): string {
  const aliases = categories.map((c) => c.alias);

  if (aliases.includes('cocktailbars')) return 'cocktail_lounge';
  if (aliases.includes('breweries') || aliases.includes('brewpubs')) return 'brewery';
  if (aliases.includes('wine_bars') || aliases.includes('wineries')) return 'winery';
  if (aliases.includes('sportsbars')) return 'sports_bar';
  if (aliases.includes('divebars')) return 'dive_bar';
  if (aliases.includes('lounges')) return 'rooftop';
  if (aliases.includes('musicvenues') || aliases.includes('jazzandblues')) return 'live_music';
  if (aliases.includes('danceclubs')) return 'club';
  if (aliases.some((a) => a.includes('restaurant'))) return 'restaurant_bar';

  return 'bar';
}
