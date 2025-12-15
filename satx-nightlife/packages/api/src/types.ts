// Core Types for SATX Nightlife Power Rankings API

import { z } from 'zod';

// ============================================
// Environment & Bindings
// ============================================

export interface Env {
  // D1 Database
  DB: D1Database;

  // KV Namespaces
  CACHE: KVNamespace;
  CONFIG: KVNamespace;

  // R2 Storage
  STORAGE: R2Bucket;

  // Queues
  INGEST_QUEUE: Queue;

  // Environment Variables
  ENVIRONMENT: string;
  DEFAULT_LAT: string;
  DEFAULT_LNG: string;
  DEFAULT_RADIUS_MILES: string;

  // API Keys (set via secrets)
  GOOGLE_PLACES_API_KEY?: string;
  YELP_API_KEY?: string;
  EVENTBRITE_API_KEY?: string;
  ADMIN_API_KEY?: string;
  JWT_SECRET?: string;

  // Social Media API Keys
  TWITTER_BEARER_TOKEN?: string;
  INSTAGRAM_ACCESS_TOKEN?: string;
  INSTAGRAM_APP_ID?: string;
  TIKTOK_CLIENT_KEY?: string;
  TIKTOK_CLIENT_SECRET?: string;
}

// ============================================
// Venue Types
// ============================================

export interface Venue {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  category: VenueCategory;
  subCategory?: string;
  priceLevel?: 1 | 2 | 3 | 4;
  coverImageUrl?: string;
  description?: string;
  isVerified: boolean;
  isActive: boolean;
  expertPickRank?: number;
  expertBoostMultiplier: number;
  createdAt: string;
  updatedAt: string;
}

export type VenueCategory =
  | 'bar'
  | 'cocktail_lounge'
  | 'brewery'
  | 'winery'
  | 'sports_bar'
  | 'dive_bar'
  | 'rooftop'
  | 'live_music'
  | 'club'
  | 'restaurant_bar';

export interface VenueWithScores extends Venue {
  distance?: number;
  scores: {
    tonight?: TonightScore;
    monthly?: MonthlyScore;
    trending?: TrendingScore;
  };
  activeDeals?: Deal[];
  lastUpdated?: string;
}

// ============================================
// Score Types
// ============================================

export interface TonightScore {
  total: number;
  breakdown: {
    popularity: number;      // 0-30: based on recent activity
    quality: number;         // 0-25: adjusted rating
    openNow: number;         // 0-15: is open bonus
    deals: number;           // 0-15: active deals
    proximity: number;       // 0-10: distance boost
    expertBoost: number;     // 0-5: expert pick bonus
  };
  confidence: 'high' | 'medium' | 'low';
  signals: SignalSummary;
}

export interface MonthlyScore {
  powerRank: number;
  previousRank?: number;
  rankDelta?: number;
  powerScore: number;       // 0-100
  breakdown: {
    quality: number;        // 0-40: Bayesian-adjusted rating
    popularity: number;     // 0-30: review velocity + volume
    consistency: number;    // 0-15: rating stability
    deals: number;          // 0-10: deal quality
    expertBoost: number;    // 0-5: expert pick bonus
  };
}

export interface TrendingScore {
  trendingRank: number;
  momentum: number;         // -100 to +100
  direction: 'rising' | 'falling' | 'stable';
  weekOverWeek: {
    ratingDelta: number;
    reviewsDelta: number;
    scoreDelta: number;
  };
  monthOverMonth: {
    rankDelta: number;
    scoreDelta: number;
  };
}

export interface SignalSummary {
  rating: number;
  ratingCount: number;
  recentReviews: number;
  eventsTonight: number;
  activeDeals: number;
  lastCheckinHours?: number;
  sources: string[];
}

// ============================================
// Leaderboard Types
// ============================================

export interface LeaderboardEntry {
  rank: number;
  venue: VenueWithScores;
  score: number;
  previousRank?: number;
  rankDelta?: number;
  badges?: Badge[];
}

export interface Badge {
  type: 'expert_pick' | 'trending_up' | 'most_improved' | 'hot_tonight' | 'best_deals';
  label: string;
}

export interface LeaderboardResponse {
  type: 'tonight' | 'monthly' | 'trending';
  period?: { year: number; month: number };
  entries: LeaderboardEntry[];
  meta: {
    total: number;
    radius: number;
    center: { lat: number; lng: number };
    lastUpdated: string;
    nextUpdate?: string;
  };
}

// ============================================
// Deal Types
// ============================================

export interface Deal {
  id: string;
  venueId: string;
  title: string;
  description?: string;
  dealType: DealType;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  validFrom?: string;
  validUntil?: string;
  discountPercent?: number;
  discountAmount?: number;
  tags?: string[];
  status: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
}

export type DealType =
  | 'happy_hour'
  | 'daily_special'
  | 'event'
  | 'student'
  | 'industry'
  | 'limited_time';

// ============================================
// Connector Types
// ============================================

export interface ConnectorConfig {
  enabled: boolean;
  apiKey?: string;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

export interface ConnectorResult {
  source: string;
  venues: RawVenueData[];
  signals: RawSignalData[];
  errors: ConnectorError[];
  metadata: {
    fetchedAt: string;
    requestCount: number;
    quotaRemaining?: number;
  };
}

export interface RawVenueData {
  sourceId: string;
  source: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  category?: string;
  priceLevel?: number;
  rating?: number;
  ratingCount?: number;
  photos?: string[];
  hours?: BusinessHours[];
  raw: Record<string, unknown>;
}

export interface RawSignalData {
  sourceId: string;
  source: string;
  timestamp: string;
  rating?: number;
  ratingCount?: number;
  reviewCountDelta?: number;
  isOpen?: boolean;
  eventCount?: number;
  raw: Record<string, unknown>;

  // Social media signals
  mentions1h?: number;
  mentions24h?: number;
  engagement?: number;
  sentiment?: number; // -1 to 1
  viralScore?: number; // 0 to 100
  hashtags?: string[];
}

export interface SocialSignals {
  twitter: {
    mentions1h: number;
    mentions24h: number;
    engagement: number;
    sentiment: number;
    topTweets?: SocialPost[];
  };
  instagram: {
    mentions1h: number;
    mentions24h: number;
    engagement: number;
    topPosts?: SocialPost[];
  };
  tiktok: {
    mentions24h: number;
    viralScore: number;
    viewCount: number;
    topVideos?: SocialPost[];
  };
  combined: {
    buzzScore: number;
    trendDirection: 'rising' | 'falling' | 'stable';
    lastActivity?: string;
  };
}

export interface SocialPost {
  id: string;
  platform: 'twitter' | 'instagram' | 'tiktok';
  content?: string;
  author?: string;
  engagement: number;
  postedAt: string;
  url?: string;
}

export interface ConnectorError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface BusinessHours {
  dayOfWeek: number;
  open: string;
  close: string;
}

// ============================================
// Config Types
// ============================================

export interface ScoringWeights {
  version: number;
  updatedAt: string;
  updatedBy?: string;

  tonight: {
    popularity: number;
    quality: number;
    openNow: number;
    deals: number;
    proximity: number;
    expertBoost: number;
  };

  monthly: {
    quality: number;
    popularity: number;
    consistency: number;
    deals: number;
    expertBoost: number;
  };

  bayesian: {
    m: number;  // minimum votes threshold
    C: number;  // prior mean (average rating across all venues)
  };

  proximity: {
    maxBoostMiles: number;
    decayRate: number;
  };

  recency: {
    tonightHalfLifeHours: number;
    trendingHalfLifeDays: number;
  };

  social?: {
    twitterWeight: number;
    instagramWeight: number;
    tiktokWeight: number;
    viralThreshold: number;
    mentionDecayHours: number;
  };
}

export interface ExpertPickConfig {
  venues: Array<{
    slug: string;
    boostMultiplier: number;
    reason?: string;
  }>;
  enabled: boolean;
  maxBoostPercent: number;
}

// ============================================
// API Request/Response Types
// ============================================

export const LocationQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius_miles: z.coerce.number().min(1).max(25).default(5),
});

export const LeaderboardQuerySchema = LocationQuerySchema.extend({
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
  category: z.string().optional(),
  expert_mode: z.coerce.boolean().default(false),
});

export const MonthlyQuerySchema = LeaderboardQuerySchema.extend({
  year: z.coerce.number().min(2024).max(2030),
  month: z.coerce.number().min(1).max(12),
});

export const DealCreateSchema = z.object({
  venue_id: z.string().uuid(),
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  deal_type: z.enum(['happy_hour', 'daily_special', 'event', 'student', 'industry', 'limited_time']),
  day_of_week: z.number().min(0).max(6).optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  discount_percent: z.number().min(0).max(100).optional(),
  discount_amount: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
});

export type LocationQuery = z.infer<typeof LocationQuerySchema>;
export type LeaderboardQuery = z.infer<typeof LeaderboardQuerySchema>;
export type MonthlyQuery = z.infer<typeof MonthlyQuerySchema>;
export type DealCreate = z.infer<typeof DealCreateSchema>;

// ============================================
// Queue Message Types
// ============================================

export interface IngestMessage {
  type: 'venue_sync' | 'signal_fetch' | 'deal_verify';
  source: string;
  venueId?: string;
  area?: {
    lat: number;
    lng: number;
    radiusMiles: number;
  };
  priority: 'high' | 'normal' | 'low';
  timestamp: string;
}
