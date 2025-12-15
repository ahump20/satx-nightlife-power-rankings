// Social Media Scraping Types for Real-Time Trending
// Tracks Instagram, TikTok, and Twitter/X activity for SATX venues

export type SocialPlatform = 'instagram' | 'tiktok' | 'twitter';
export type SocialPlatformOrAll = SocialPlatform | 'all';

export interface SocialMention {
  id: string;
  platform: SocialPlatform;
  venueId: string;
  postId: string;
  postUrl: string;
  authorUsername: string;
  authorFollowers: number;
  content: string;
  hashtags: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number | null; // TikTok/Reels views
  mediaType: 'image' | 'video' | 'story' | 'reel' | 'text';
  postedAt: Date;
  fetchedAt: Date;
  engagementScore: number; // Calculated engagement metric
  isLive: boolean; // For Instagram/TikTok live streams
  locationTagged: boolean; // If venue was location-tagged
}

export interface VenueSocialProfile {
  venueId: string;
  platform: SocialPlatform;
  handle: string;
  profileUrl: string;
  followerCount: number;
  isVerified: boolean;
  lastPostAt: Date | null;
  avgEngagementRate: number;
  linkedAt: Date;
}

export interface HourlyActivityPulse {
  id: string;
  venueId: string;
  hour: Date; // Truncated to hour
  platform: SocialPlatformOrAll; // Can be specific platform or 'all' for aggregated
  mentionCount: number;
  totalEngagement: number;
  avgSentiment: number; // -1 to 1 scale
  viralPosts: number; // Posts with engagement > threshold
  liveStreamsCount: number;
  uniquePosters: number;
  topHashtags: string[];
  peakActivityMinute: number; // 0-59
  pulseScore: number; // Normalized 0-100 activity score
}

export interface RealTimeBuzz {
  venueId: string;
  venueSlug: string;
  venueName: string;
  currentPulse: number; // Real-time buzz score (0-100)
  hourlyTrend: 'rising' | 'falling' | 'steady' | 'exploding' | 'dead';
  peakHour: number; // Hour of peak activity today
  totalMentionsToday: number;
  totalMentionsHour: number;
  activePlatforms: SocialPlatform[];
  topPost: {
    platform: SocialPlatform;
    postUrl: string;
    engagement: number;
    content: string;
  } | null;
  liveNow: boolean;
  friendsHere: number; // Placeholder for future friend tracking
  lastUpdated: Date;
}

export interface SocialSearchQuery {
  venueNames: string[];
  hashtags: string[];
  locationIds: {
    instagram?: string;
    tiktok?: string;
  };
  coordinates: {
    lat: number;
    lng: number;
    radiusMeters: number;
  };
}

export interface ScrapingConfig {
  platform: SocialPlatform;
  enabled: boolean;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  searchTerms: {
    hashtags: string[];
    keywords: string[];
    locationRadius: number;
  };
  engagementThresholds: {
    viral: number;
    trending: number;
    minimum: number;
  };
}

// Sentiment analysis result
export interface SentimentResult {
  score: number; // -1 to 1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  keywords: string[];
}

// Platform-specific data structures
export interface InstagramPost {
  id: string;
  shortcode: string;
  type: 'image' | 'video' | 'carousel' | 'reel' | 'story';
  caption: string;
  likeCount: number;
  commentCount: number;
  viewCount?: number;
  location?: {
    id: string;
    name: string;
    lat: number;
    lng: number;
  };
  owner: {
    username: string;
    followerCount: number;
    isVerified: boolean;
  };
  takenAt: Date;
  hashtags: string[];
  mentions: string[];
}

export interface TikTokVideo {
  id: string;
  videoId: string;
  description: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  author: {
    username: string;
    followerCount: number;
    isVerified: boolean;
  };
  location?: {
    name: string;
    lat: number;
    lng: number;
  };
  createdAt: Date;
  hashtags: string[];
  sounds?: {
    id: string;
    title: string;
  };
  isLive: boolean;
}

export interface TwitterPost {
  id: string;
  text: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  quoteCount: number;
  viewCount?: number;
  author: {
    username: string;
    followerCount: number;
    isVerified: boolean;
  };
  location?: {
    name: string;
    coordinates?: [number, number];
  };
  createdAt: Date;
  hashtags: string[];
  mentions: string[];
  mediaType?: 'photo' | 'video' | 'gif';
}

// Aggregated social stats for a venue
export interface VenueSocialStats {
  venueId: string;
  lastHour: {
    mentions: number;
    engagement: number;
    sentiment: number;
    platforms: Record<SocialPlatform, number>;
  };
  last24Hours: {
    mentions: number;
    engagement: number;
    sentiment: number;
    peakHour: number;
    platforms: Record<SocialPlatform, number>;
  };
  last7Days: {
    mentions: number;
    engagement: number;
    avgDailyMentions: number;
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
  };
  topHashtags: Array<{ tag: string; count: number }>;
  influencerMentions: number;
  viralPosts: number;
  buzzScore: number; // Composite 0-100 score
}
