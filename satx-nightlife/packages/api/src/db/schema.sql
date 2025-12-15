-- SATX Nightlife Power Rankings - D1 Schema
-- PostgreSQL-compatible SQLite schema for Cloudflare D1

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- ============================================
-- CORE VENUE TABLES
-- ============================================

-- Canonical venues table
CREATE TABLE IF NOT EXISTS venues (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'San Antonio',
  state TEXT NOT NULL DEFAULT 'TX',
  zip_code TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  phone TEXT,
  website TEXT,
  category TEXT NOT NULL DEFAULT 'bar',
  sub_category TEXT,
  price_level INTEGER CHECK (price_level BETWEEN 1 AND 4),
  cover_image_url TEXT,
  description TEXT,
  is_verified INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  expert_pick_rank INTEGER,
  expert_boost_multiplier REAL DEFAULT 1.0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_venues_location ON venues(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_venues_category ON venues(category);
CREATE INDEX IF NOT EXISTS idx_venues_active ON venues(is_active);
CREATE INDEX IF NOT EXISTS idx_venues_expert ON venues(expert_pick_rank);

-- Venue name aliases for deduplication
CREATE TABLE IF NOT EXISTS venue_aliases (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  venue_id TEXT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(venue_id, alias)
);

CREATE INDEX IF NOT EXISTS idx_aliases_name ON venue_aliases(alias);

-- External source mappings
CREATE TABLE IF NOT EXISTS venue_sources (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  venue_id TEXT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'google_places', 'yelp', 'eventbrite'
  source_id TEXT NOT NULL,
  source_url TEXT,
  raw_data TEXT, -- JSON blob of last fetched data
  last_synced_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_sources_venue ON venue_sources(venue_id);
CREATE INDEX IF NOT EXISTS idx_sources_source ON venue_sources(source, source_id);

-- ============================================
-- SIGNAL TABLES (Popularity/Activity Data)
-- ============================================

-- Hourly signals for "Tonight" calculations
CREATE TABLE IF NOT EXISTS signals_hourly (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  venue_id TEXT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  hour_bucket TEXT NOT NULL, -- ISO format: '2024-01-15T20:00:00Z'
  source TEXT NOT NULL,

  -- Rating signals
  rating REAL,
  rating_count INTEGER,
  rating_delta INTEGER DEFAULT 0,

  -- Activity signals
  review_count_delta INTEGER DEFAULT 0,
  checkin_count INTEGER DEFAULT 0,
  event_count INTEGER DEFAULT 0,
  mention_count INTEGER DEFAULT 0,

  -- Operational
  is_open INTEGER,
  wait_estimate_minutes INTEGER,

  -- Deal presence
  has_active_deal INTEGER DEFAULT 0,

  raw_signals TEXT, -- JSON for additional source-specific data
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  UNIQUE(venue_id, hour_bucket, source)
);

CREATE INDEX IF NOT EXISTS idx_signals_hourly_venue ON signals_hourly(venue_id);
CREATE INDEX IF NOT EXISTS idx_signals_hourly_bucket ON signals_hourly(hour_bucket);
CREATE INDEX IF NOT EXISTS idx_signals_hourly_recent ON signals_hourly(venue_id, hour_bucket DESC);

-- Daily aggregated signals for trending calculations
CREATE TABLE IF NOT EXISTS signals_daily (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  venue_id TEXT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- '2024-01-15'

  -- Aggregated metrics
  avg_rating REAL,
  total_rating_count INTEGER,
  new_reviews_count INTEGER DEFAULT 0,
  total_checkins INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  total_mentions INTEGER DEFAULT 0,

  -- Computed scores (for that day)
  popularity_score REAL,
  quality_score REAL,
  activity_score REAL,

  -- Week-over-week deltas
  wow_rating_delta REAL,
  wow_reviews_delta INTEGER,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  UNIQUE(venue_id, date)
);

CREATE INDEX IF NOT EXISTS idx_signals_daily_venue ON signals_daily(venue_id);
CREATE INDEX IF NOT EXISTS idx_signals_daily_date ON signals_daily(date);

-- ============================================
-- LEADERBOARD TABLES
-- ============================================

-- Monthly leaderboard snapshots
CREATE TABLE IF NOT EXISTS leaderboard_monthly (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  venue_id TEXT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),

  -- Rankings
  power_rank INTEGER NOT NULL,
  previous_rank INTEGER,
  rank_delta INTEGER,
  trending_rank INTEGER,

  -- Scores (0-100 scale)
  power_score REAL NOT NULL,
  quality_score REAL NOT NULL,
  popularity_score REAL NOT NULL,
  trending_score REAL NOT NULL,
  deals_score REAL DEFAULT 0,

  -- Score breakdown (JSON)
  score_breakdown TEXT,

  -- F1-style points (optional)
  points INTEGER DEFAULT 0,

  -- Signals summary
  total_reviews INTEGER,
  avg_rating REAL,
  new_reviews_count INTEGER,
  events_hosted INTEGER,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  UNIQUE(venue_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON leaderboard_monthly(year, month);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard_monthly(year, month, power_rank);

-- YTD standings
CREATE TABLE IF NOT EXISTS standings_ytd (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  venue_id TEXT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,

  total_points INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  podiums INTEGER DEFAULT 0, -- top 3 finishes
  best_rank INTEGER,
  current_rank INTEGER,

  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  UNIQUE(venue_id, year)
);

-- ============================================
-- DEALS & PROMOTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  venue_id TEXT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deal_type TEXT NOT NULL, -- 'happy_hour', 'daily_special', 'event', 'student', 'industry'

  -- Schedule
  day_of_week INTEGER, -- 0=Sunday, NULL=every day
  start_time TEXT, -- '16:00'
  end_time TEXT,   -- '19:00'

  -- Validity
  valid_from TEXT,
  valid_until TEXT,

  -- Metadata
  discount_percent INTEGER,
  discount_amount REAL,
  tags TEXT, -- JSON array

  -- Moderation
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  submitted_by TEXT,
  approved_by TEXT,
  approved_at TEXT,

  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_deals_venue ON deals(venue_id);
CREATE INDEX IF NOT EXISTS idx_deals_type ON deals(deal_type);
CREATE INDEX IF NOT EXISTS idx_deals_active ON deals(is_active, status);
CREATE INDEX IF NOT EXISTS idx_deals_day ON deals(day_of_week);

-- User/Admin submissions for deals
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  venue_id TEXT REFERENCES venues(id) ON DELETE SET NULL,
  venue_name_submitted TEXT,
  submission_type TEXT NOT NULL, -- 'deal', 'venue_update', 'new_venue'
  data TEXT NOT NULL, -- JSON

  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_notes TEXT,

  submitted_by_ip TEXT,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT,
  reviewed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- ============================================
-- AUDIT & CONFIG
-- ============================================

-- Audit log for config/weight changes
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_value TEXT,
  new_value TEXT,
  performed_by TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- ============================================
-- SEED DATA: Expert Picks
-- ============================================

-- Insert expert-picked venues (will be merged with API data)
INSERT OR IGNORE INTO venues (id, name, slug, address, city, latitude, longitude, category, expert_pick_rank, expert_boost_multiplier, is_verified)
VALUES
  ('expert-georges-keep', 'George''s Keep', 'georges-keep', '312 Pearl Pkwy Ste 2101', 'San Antonio', 29.4426, -98.4789, 'cocktail_lounge', 1, 1.15, 1),
  ('expert-camp-1604', 'Camp 1604', 'camp-1604', '22702 US-281 N', 'San Antonio', 29.6517, -98.4653, 'bar', 2, 1.12, 1),
  ('expert-kung-fu', 'Kung Fu Noodle', 'kung-fu-noodle', '8525 Blanco Rd', 'San Antonio', 29.5246, -98.5233, 'bar', 3, 1.08, 1),
  ('expert-the-venue', 'The Venue', 'the-venue-boerne', '1425 S Main St', 'Boerne', 29.7793, -98.7320, 'live_music', 4, 1.08, 1);
