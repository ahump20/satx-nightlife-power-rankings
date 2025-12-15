/**
 * Frontend TypeScript types
 */

export interface Venue {
  id: string;
  name: string;
  category: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  distance?: number;
  priceLevel?: number;
  photoUrl?: string;
  isExpertPick: boolean;
  expertRank?: number;
  scores: VenueScores;
}

export interface VenueScores {
  tonight?: number;
  monthly?: number;
  trending?: number;
  rating?: number;
  reviewCount?: number;
  trendDirection?: 'up' | 'down' | 'stable';
}

export interface LeaderboardEntry {
  rank: number;
  venue: Venue;
  score: number;
  change?: number;
  badges?: string[];
}

export interface Leaderboard {
  type: 'tonight' | 'monthly' | 'trending' | 'year';
  entries: LeaderboardEntry[];
  generatedAt: string;
  userLocation?: {
    lat: number;
    lng: number;
  };
  radiusMiles?: number;
}

export interface Deal {
  id: string;
  venueId: string;
  venueName: string;
  title: string;
  description: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
  verified: boolean;
  submittedBy?: string;
  expiresAt?: string;
}

export interface LocationState {
  lat: number | null;
  lng: number | null;
  loading: boolean;
  error: string | null;
  radiusMiles: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    timestamp: string;
    cached: boolean;
    ttl?: number;
  };
}

export type TabType = 'tonight' | 'monthly' | 'trending' | 'year';
