/**
 * Connector Interface
 * Plugin architecture for data source connectors
 */

import type { Env, RawVenueData, RawSignalData, ConnectorError, ConnectorConfig } from '../types';

/**
 * Base interface for all data source connectors
 */
export interface DataConnector {
  /** Unique identifier for this connector */
  readonly source: string;

  /** Human-readable name */
  readonly name: string;

  /** Is this connector enabled (via env vars) */
  isEnabled(): boolean;

  /** Check API health/quota */
  healthCheck(): Promise<{
    healthy: boolean;
    quotaRemaining?: number;
    message?: string;
  }>;

  /**
   * Search for venues in an area
   */
  searchVenues(params: {
    lat: number;
    lng: number;
    radiusMeters: number;
    types?: string[];
    pageToken?: string;
  }): Promise<{
    venues: RawVenueData[];
    nextPageToken?: string;
  }>;

  /**
   * Get detailed info for a specific venue
   */
  getVenueDetails(sourceId: string): Promise<RawVenueData | null>;

  /**
   * Fetch current signals (ratings, activity) for a venue
   */
  fetchSignals(sourceId: string): Promise<RawSignalData | null>;
}

/**
 * Connector registry for managing enabled connectors
 */
export class ConnectorRegistry {
  private connectors: Map<string, DataConnector> = new Map();

  register(connector: DataConnector): void {
    if (connector.isEnabled()) {
      this.connectors.set(connector.source, connector);
      console.log(`[Connectors] Registered: ${connector.name}`);
    } else {
      console.log(`[Connectors] Skipped (disabled): ${connector.name}`);
    }
  }

  get(source: string): DataConnector | undefined {
    return this.connectors.get(source);
  }

  getAll(): DataConnector[] {
    return Array.from(this.connectors.values());
  }

  getEnabled(): string[] {
    return Array.from(this.connectors.keys());
  }
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private requests: number[] = [];

  constructor(
    private maxRequestsPerMinute: number,
    private maxRequestsPerDay: number
  ) {}

  async checkLimit(): Promise<boolean> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneDayAgo = now - 86400000;

    // Clean old requests
    this.requests = this.requests.filter((t) => t > oneDayAgo);

    const lastMinute = this.requests.filter((t) => t > oneMinuteAgo).length;
    const lastDay = this.requests.length;

    return lastMinute < this.maxRequestsPerMinute && lastDay < this.maxRequestsPerDay;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getStatus(): { minuteRemaining: number; dayRemaining: number } {
    const now = Date.now();
    const lastMinute = this.requests.filter((t) => t > now - 60000).length;
    const lastDay = this.requests.filter((t) => t > now - 86400000).length;

    return {
      minuteRemaining: Math.max(0, this.maxRequestsPerMinute - lastMinute),
      dayRemaining: Math.max(0, this.maxRequestsPerDay - lastDay),
    };
  }
}

/**
 * Venue matching utilities
 */
export function normalizeVenueName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function venueNamesMatch(name1: string, name2: string): boolean {
  const n1 = normalizeVenueName(name1);
  const n2 = normalizeVenueName(name2);

  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;

  // Levenshtein distance for fuzzy matching
  const distance = levenshteinDistance(n1, n2);
  const maxLen = Math.max(n1.length, n2.length);
  return distance / maxLen < 0.2;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Category mapping from external sources to internal categories
 */
export const CATEGORY_MAP: Record<string, string> = {
  // Google Places types
  bar: 'bar',
  night_club: 'club',
  restaurant: 'restaurant_bar',
  cafe: 'bar',

  // Yelp categories
  bars: 'bar',
  cocktailbars: 'cocktail_lounge',
  sportsbars: 'sports_bar',
  divebars: 'dive_bar',
  breweries: 'brewery',
  brewpubs: 'brewery',
  winebars: 'winery',
  lounges: 'cocktail_lounge',
  danceclubs: 'club',
  musicvenues: 'live_music',
  jazzandblues: 'live_music',
  karaoke: 'bar',
  pubs: 'bar',
  beergardens: 'bar',
};

export function mapCategory(externalCategory: string): string {
  const normalized = externalCategory.toLowerCase().replace(/\s+/g, '');
  return CATEGORY_MAP[normalized] || 'bar';
}
