// Social Media Constants for SATX Nightlife Tracking

import { ScrapingConfig, SocialPlatform } from './types';

/**
 * SATX-specific venue hashtags to track
 * These are commonly used when posting about nightlife in San Antonio
 */
export const SATX_VENUE_HASHTAGS = [
  // General San Antonio
  'satx',
  'sanantonio',
  'sanantoniotx',
  'satxnightlife',
  'satxbars',
  'satxdrinks',
  'sanantoniobars',
  'satxfood',
  'satxlife',
  'satxweekend',
  'sanantoniofood',
  'exploreSATX',
  'visitsanantonio',

  // Nightlife specific
  'satxnights',
  'satxparty',
  'satxvibes',
  'sacocktails',
  'satxhappyhour',
  'satxbrewery',
  'satxdrinking',
  'satxbar',
  'satxclub',
  'satxlivemusic',

  // Area specific
  'thepearl',
  'pearldistrict',
  'therim',
  'lacantera',
  'stoneoak',
  'stoneoaktx',
  'boerne',
  'boernetx',
  'dominion',
  'helotes',
  'alamo',
  'riverwalk',
  'downtownsatx',

  // Venue-specific (will be dynamically expanded)
  'georgeskeep',
  'camp1604',
  'kungfunoodle',
  'thevenuesa',
];

/**
 * Keywords that indicate nightlife activity
 */
export const NIGHTLIFE_KEYWORDS = [
  'drinks',
  'cocktails',
  'bar',
  'club',
  'party',
  'vibes',
  'lit',
  'turnup',
  'turnt',
  'shots',
  'cheers',
  'nightout',
  'fridaynight',
  'saturdaynight',
  'happyhour',
  'livemusic',
  'dj',
  'dancing',
  'birthday',
  'celebration',
  'poppin',
  'packed',
  'crowded',
  'lineup',
  'waitlist',
];

/**
 * Keywords indicating high activity/popularity
 */
export const HIGH_ACTIVITY_KEYWORDS = [
  'packed',
  'crowded',
  'line',
  'wait',
  'full',
  'busy',
  'popping',
  'poppin',
  'lit',
  'fire',
  'crazy',
  'insane',
  'wild',
  'amazing',
  'best',
  'everyone',
  'whole town',
];

/**
 * Keywords indicating low activity
 */
export const LOW_ACTIVITY_KEYWORDS = [
  'empty',
  'dead',
  'quiet',
  'slow',
  'nobody',
  'ghost town',
  'boring',
  'lame',
];

/**
 * Instagram location IDs for SATX venues
 * These are used for location-based searches
 */
export const SATX_LOCATION_IDS: Record<string, string> = {
  // These would be populated with actual Instagram location IDs
  'san-antonio': '213049823',
  'the-pearl': '270571249',
  'the-rim': '1234567890',
  'la-cantera': '1234567891',
  'stone-oak': '1234567892',
  'boerne': '214687458',
};

/**
 * Venue social media handles mapping
 * Maps venue slugs to their social handles
 */
export const VENUE_SOCIAL_HANDLES: Record<
  string,
  Partial<Record<SocialPlatform, string>>
> = {
  'georges-keep': {
    instagram: 'georgeskeepsa',
    twitter: 'georgeskeep',
  },
  'camp-1604': {
    instagram: 'camp1604',
    twitter: 'camp1604',
    tiktok: 'camp1604',
  },
  'kung-fu-noodle': {
    instagram: 'kungfunoodlesa',
  },
  'the-venue': {
    instagram: 'thevenueboerne',
    twitter: 'thevenueboerne',
  },
  // Add more venues as needed
};

/**
 * Scraping configuration per platform
 */
export const SCRAPING_CONFIGS: Record<SocialPlatform, ScrapingConfig> = {
  instagram: {
    platform: 'instagram',
    enabled: true,
    rateLimit: {
      requestsPerMinute: 30,
      requestsPerHour: 200,
    },
    searchTerms: {
      hashtags: SATX_VENUE_HASHTAGS.slice(0, 30), // Instagram allows fewer hashtag searches
      keywords: NIGHTLIFE_KEYWORDS.slice(0, 10),
      locationRadius: 5000, // 5km
    },
    engagementThresholds: {
      viral: 10000, // 10k+ likes
      trending: 1000, // 1k+ likes
      minimum: 50, // Include posts with 50+ likes
    },
  },
  tiktok: {
    platform: 'tiktok',
    enabled: true,
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
    },
    searchTerms: {
      hashtags: SATX_VENUE_HASHTAGS,
      keywords: [...NIGHTLIFE_KEYWORDS, ...HIGH_ACTIVITY_KEYWORDS],
      locationRadius: 10000, // 10km
    },
    engagementThresholds: {
      viral: 1000000, // 1M+ views
      trending: 100000, // 100k+ views
      minimum: 1000, // Include videos with 1k+ views
    },
  },
  twitter: {
    platform: 'twitter',
    enabled: true,
    rateLimit: {
      requestsPerMinute: 30,
      requestsPerHour: 450,
    },
    searchTerms: {
      hashtags: SATX_VENUE_HASHTAGS.slice(0, 20),
      keywords: NIGHTLIFE_KEYWORDS,
      locationRadius: 25000, // 25km (Twitter has less precise location)
    },
    engagementThresholds: {
      viral: 1000, // 1k+ retweets
      trending: 100, // 100+ retweets
      minimum: 10, // Include tweets with 10+ likes
    },
  },
};

/**
 * Time windows for activity analysis
 */
export const TIME_WINDOWS = {
  realtime: 15 * 60 * 1000, // 15 minutes
  hourly: 60 * 60 * 1000, // 1 hour
  daily: 24 * 60 * 60 * 1000, // 24 hours
  weekly: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Activity pulse thresholds
 * Used to classify venue activity levels
 */
export const PULSE_THRESHOLDS = {
  // Pulse score ranges
  dead: { min: 0, max: 10 },
  slow: { min: 10, max: 30 },
  moderate: { min: 30, max: 50 },
  busy: { min: 50, max: 70 },
  packed: { min: 70, max: 85 },
  exploding: { min: 85, max: 100 },

  // Trend detection
  risingThreshold: 20, // 20% increase = rising
  fallingThreshold: -20, // 20% decrease = falling
  explodingThreshold: 100, // 100% increase = exploding
};

/**
 * Peak hours for different days
 * Used to weight activity based on expected patterns
 */
export const EXPECTED_PEAK_HOURS: Record<number, number[]> = {
  0: [21, 22, 23], // Sunday
  1: [18, 19, 20], // Monday (slower)
  2: [18, 19, 20], // Tuesday (slower)
  3: [18, 19, 20, 21], // Wednesday (mid-week pickup)
  4: [20, 21, 22, 23], // Thursday (weekend preview)
  5: [21, 22, 23, 0, 1], // Friday (peak)
  6: [21, 22, 23, 0, 1, 2], // Saturday (peak)
};

/**
 * Influencer follower thresholds
 */
export const INFLUENCER_THRESHOLDS = {
  micro: 1000, // 1k-10k followers
  mid: 10000, // 10k-100k followers
  macro: 100000, // 100k-1M followers
  mega: 1000000, // 1M+ followers
};

/**
 * Engagement multipliers based on influencer tier
 */
export const INFLUENCER_MULTIPLIERS = {
  micro: 1.2,
  mid: 1.5,
  macro: 2.0,
  mega: 3.0,
};

/**
 * Content freshness decay
 * Older content is weighted less for real-time scoring
 */
export const FRESHNESS_DECAY = {
  // Decay factor per hour
  hourlyDecay: 0.9,
  // Minimum weight (content older than this gets minimum weight)
  minWeight: 0.1,
  // Hours until minimum weight
  hoursToMinimum: 24,
};

/**
 * Geographic bounds for SATX area
 */
export const SATX_BOUNDS = {
  center: { lat: 29.4241, lng: -98.4936 },
  northWest: { lat: 29.65, lng: -98.85 },
  southEast: { lat: 29.25, lng: -98.35 },
  radiusMeters: 40000, // 40km radius for social searches
};
