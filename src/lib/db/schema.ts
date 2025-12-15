// Database schema for SATX Nightlife Power Rankings
// Designed for PostgreSQL with PostGIS extension

export interface Venue {
  id: string;
  googlePlaceId: string | null;
  yelpId: string | null;
  name: string;
  slug: string;
  address: string;
  city: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  category: VenueCategory;
  subCategory: string | null;
  phone: string | null;
  website: string | null;
  imageUrl: string | null;
  priceLevel: 1 | 2 | 3 | 4 | null;
  isExpertPick: boolean;
  expertBoostMultiplier: number;
  createdAt: Date;
  updatedAt: Date;
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

export interface VenueHours {
  id: string;
  venueId: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  openTime: string;  // HH:MM format
  closeTime: string; // HH:MM format
  isHappyHour: boolean;
  happyHourStart: string | null;
  happyHourEnd: string | null;
}

export interface Deal {
  id: string;
  venueId: string;
  title: string;
  description: string;
  dealType: DealType;
  dayOfWeek: number | null; // null = every day
  startTime: string | null;
  endTime: string | null;
  discountPercent: number | null;
  discountAmount: number | null;
  minPurchase: number | null;
  validFrom: Date;
  validUntil: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export type DealType =
  | 'happy_hour'
  | 'daily_special'
  | 'event'
  | 'limited_time'
  | 'member_only';

export interface Rating {
  id: string;
  venueId: string;
  source: RatingSource;
  rating: number;        // Normalized 0-5 scale
  reviewCount: number;
  fetchedAt: Date;
}

export type RatingSource = 'google' | 'yelp' | 'internal';

export interface RankingSnapshot {
  id: string;
  venueId: string;
  periodType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  periodStart: Date;
  periodEnd: Date;
  rank: number;
  previousRank: number | null;
  powerScore: number;
  scoreBreakdown: ScoreBreakdown;
  createdAt: Date;
}

export interface ScoreBreakdown {
  googleRatingScore: number;
  yelpRatingScore: number;
  reviewVelocityScore: number;
  dealsScore: number;
  proximityBonus: number;
  trendingBonus: number;
  expertBoost: number;
  totalWeightedScore: number;
}

export interface Event {
  id: string;
  venueId: string;
  title: string;
  description: string | null;
  eventType: EventType;
  startTime: Date;
  endTime: Date | null;
  ticketUrl: string | null;
  imageUrl: string | null;
  source: string;
  sourceEventId: string | null;
  createdAt: Date;
}

export type EventType =
  | 'live_music'
  | 'dj'
  | 'trivia'
  | 'karaoke'
  | 'comedy'
  | 'special_event'
  | 'holiday'
  | 'sports';

// Expert-picked venues with boost configuration
export const EXPERT_PICKS: Record<string, { boost: number; reason: string }> = {
  'georges-keep': {
    boost: 1.15,
    reason: 'Award-winning craft cocktail bar with innovative seasonal menus'
  },
  'camp-1604': {
    boost: 1.12,
    reason: 'Premier NW SA destination with excellent food and drinks'
  },
  'kung-fu-noodle': {
    boost: 1.10,
    reason: 'Unique late-night spot with authentic atmosphere'
  },
  'the-venue': {
    boost: 1.10,
    reason: 'Top Boerne nightlife destination with live entertainment'
  }
};

// San Antonio NW / Boerne area bounds
export const SATX_NW_BOUNDS = {
  north: 29.85,
  south: 29.45,
  east: -98.35,
  west: -98.85,
  center: {
    lat: 29.65,
    lng: -98.60
  }
};

// SQL for creating tables with PostGIS
export const CREATE_TABLES_SQL = `
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Venues table
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id VARCHAR(255) UNIQUE,
  yelp_id VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100) NOT NULL,
  zip_code VARCHAR(10) NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  category VARCHAR(50) NOT NULL,
  sub_category VARCHAR(100),
  phone VARCHAR(20),
  website VARCHAR(500),
  image_url VARCHAR(1000),
  price_level SMALLINT CHECK (price_level BETWEEN 1 AND 4),
  is_expert_pick BOOLEAN DEFAULT FALSE,
  expert_boost_multiplier DECIMAL(3,2) DEFAULT 1.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create spatial index
CREATE INDEX IF NOT EXISTS idx_venues_location ON venues USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_venues_category ON venues(category);
CREATE INDEX IF NOT EXISTS idx_venues_slug ON venues(slug);

-- Venue hours table
CREATE TABLE IF NOT EXISTS venue_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_happy_hour BOOLEAN DEFAULT FALSE,
  happy_hour_start TIME,
  happy_hour_end TIME,
  UNIQUE(venue_id, day_of_week)
);

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  deal_type VARCHAR(50) NOT NULL,
  day_of_week SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME,
  end_time TIME,
  discount_percent DECIMAL(5,2),
  discount_amount DECIMAL(10,2),
  min_purchase DECIMAL(10,2),
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_venue ON deals(venue_id);
CREATE INDEX IF NOT EXISTS idx_deals_active ON deals(is_active, valid_from, valid_until);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  source VARCHAR(20) NOT NULL,
  rating DECIMAL(2,1) NOT NULL CHECK (rating BETWEEN 0 AND 5),
  review_count INTEGER NOT NULL DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, source)
);

CREATE INDEX IF NOT EXISTS idx_ratings_venue ON ratings(venue_id);

-- Ranking snapshots table
CREATE TABLE IF NOT EXISTS ranking_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  period_type VARCHAR(20) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  rank INTEGER NOT NULL,
  previous_rank INTEGER,
  power_score DECIMAL(6,2) NOT NULL,
  score_breakdown JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rankings_venue ON ranking_snapshots(venue_id);
CREATE INDEX IF NOT EXISTS idx_rankings_period ON ranking_snapshots(period_type, period_start);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  ticket_url VARCHAR(1000),
  image_url VARCHAR(1000),
  source VARCHAR(100) NOT NULL,
  source_event_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_venue ON events(venue_id);
CREATE INDEX IF NOT EXISTS idx_events_time ON events(start_time);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;
