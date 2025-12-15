/**
 * TikTok Connector
 * Viral venue detection via TikTok Research API
 *
 * Note: TikTok Research API requires approval
 * - Research API for hashtag/keyword trends
 * - oEmbed for ToS-compliant video display
 * - Estimation fallback for viral detection
 */

import type { Env, RawSignalData, SocialPost } from '../types';
import { RateLimiter, normalizeVenueName } from './types';

const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';
const TIKTOK_OEMBED_API = 'https://www.tiktok.com/oembed';

// SATX nightlife hashtags on TikTok
const SATX_TIKTOK_HASHTAGS = [
  'satxnightlife',
  'sanantoniobars',
  'satxbars',
  'satxvibes',
  'downtownsatx',
  'texasnightlife',
  'satxfoodie',
  'barhopping',
  'satxtiktok',
];

// Rate limiter (1000 requests/day for Research API)
const rateLimiter = new RateLimiter(10, 1000);

interface TikTokVideoInfo {
  id: string;
  title?: string;
  description?: string;
  create_time: number;
  share_count: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  author?: {
    unique_id: string;
    nickname: string;
  };
  video?: {
    duration: number;
  };
}

interface TikTokSearchResponse {
  data?: {
    videos?: TikTokVideoInfo[];
    cursor?: number;
    has_more?: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

export class TikTokConnector {
  readonly source = 'tiktok';
  readonly name = 'TikTok Research API';
  private env: Env;
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor(env: Env) {
    this.env = env;
  }

  isEnabled(): boolean {
    return !!(this.env.TIKTOK_CLIENT_KEY && this.env.TIKTOK_CLIENT_SECRET);
  }

  async healthCheck(): Promise<{ healthy: boolean; quotaRemaining?: number; message?: string }> {
    if (!this.isEnabled()) {
      return { healthy: false, message: 'TikTok API credentials not configured' };
    }

    const status = rateLimiter.getStatus();
    return {
      healthy: true,
      quotaRemaining: status.dayRemaining,
      message: `${status.dayRemaining} requests remaining today`,
    };
  }

  /**
   * Get OAuth access token for TikTok API
   */
  private async getAccessToken(): Promise<string | null> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${TIKTOK_API_BASE}/oauth/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_key: this.env.TIKTOK_CLIENT_KEY!,
          client_secret: this.env.TIKTOK_CLIENT_SECRET!,
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        console.error(`[TikTok] Token request failed: ${response.status}`);
        return null;
      }

      const data: { access_token?: string; expires_in?: number } = await response.json();

      if (data.access_token) {
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in || 7200) * 1000 - 60000;
        return this.accessToken;
      }

      return null;
    } catch (error) {
      console.error(`[TikTok] Error getting access token:`, error);
      return null;
    }
  }

  /**
   * Search for videos with a specific hashtag
   * Requires Research API access
   */
  async searchHashtagVideos(
    hashtag: string,
    options: { maxResults?: number; days?: number } = {}
  ): Promise<{
    videos: SocialPost[];
    totalViews: number;
    viralScore: number;
  }> {
    if (!this.isEnabled() || !(await rateLimiter.checkLimit())) {
      return { videos: [], totalViews: 0, viralScore: 0 };
    }

    const { maxResults = 50, days = 7 } = options;
    const accessToken = await this.getAccessToken();

    if (!accessToken) {
      return { videos: [], totalViews: 0, viralScore: 0 };
    }

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await fetch(`${TIKTOK_API_BASE}/research/video/query/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: {
            and: [
              { field_name: 'hashtag_name', operation: 'EQ', field_values: [hashtag] },
              { field_name: 'region_code', operation: 'IN', field_values: ['US'] },
            ],
          },
          start_date: startDate.toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          max_count: maxResults,
          fields: [
            'id',
            'title',
            'create_time',
            'share_count',
            'view_count',
            'like_count',
            'comment_count',
            'author',
          ],
        }),
      });

      rateLimiter.recordRequest();

      if (!response.ok) {
        const error = await response.text();
        console.error(`[TikTok] Search failed: ${response.status} - ${error}`);
        return { videos: [], totalViews: 0, viralScore: 0 };
      }

      const data: TikTokSearchResponse = await response.json();

      if (!data.data?.videos || data.data.videos.length === 0) {
        return { videos: [], totalViews: 0, viralScore: 0 };
      }

      const videos: SocialPost[] = data.data.videos.map(video => ({
        id: video.id,
        platform: 'tiktok',
        content: video.title || video.description,
        author: video.author?.unique_id,
        engagement:
          video.like_count +
          video.comment_count * 2 +
          video.share_count * 5,
        postedAt: new Date(video.create_time * 1000).toISOString(),
        url: `https://www.tiktok.com/@${video.author?.unique_id}/video/${video.id}`,
      }));

      const totalViews = data.data.videos.reduce((sum, v) => sum + v.view_count, 0);

      // Calculate viral score (0-100)
      const avgViews = totalViews / videos.length;
      const viralThreshold = 100000; // 100K views = viral
      const viralScore = Math.min(100, (avgViews / viralThreshold) * 100);

      return { videos, totalViews, viralScore };
    } catch (error) {
      console.error(`[TikTok] Error searching hashtag videos:`, error);
      return { videos: [], totalViews: 0, viralScore: 0 };
    }
  }

  /**
   * Get oEmbed data for a TikTok video (no API key required)
   */
  async getVideoEmbed(videoUrl: string): Promise<{
    html?: string;
    thumbnail_url?: string;
    author_name?: string;
    title?: string;
  } | null> {
    try {
      const params = new URLSearchParams({
        url: videoUrl,
      });

      const response = await fetch(`${TIKTOK_OEMBED_API}?${params}`);

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`[TikTok] Error fetching oEmbed:`, error);
      return null;
    }
  }

  /**
   * Estimate venue viral potential based on patterns
   * Used when Research API access is limited
   */
  async estimateVenueActivity(
    venueName: string,
    venueCategory?: string
  ): Promise<{
    estimatedViews: number;
    viralPotential: 'high' | 'medium' | 'low';
    relevantHashtags: string[];
  }> {
    const normalized = normalizeVenueName(venueName);
    const venueHashtag = normalized.replace(/\s+/g, '');

    // Venue types that tend to go viral on TikTok
    const viralCategories = ['rooftop', 'club', 'live_music', 'cocktail_lounge'];
    const isViralCategory = venueCategory && viralCategories.includes(venueCategory);

    // Time-based factors
    const hour = new Date().getHours();
    const day = new Date().getDay();
    const isNighttime = hour >= 21 || hour < 3;
    const isWeekend = day === 5 || day === 6;

    // Base viral score estimation
    let viralMultiplier = 1;
    if (isViralCategory) viralMultiplier *= 2;
    if (isNighttime) viralMultiplier *= 1.5;
    if (isWeekend) viralMultiplier *= 2;

    // Estimate view count
    const baseViews = 5000;
    const estimatedViews = Math.round(baseViews * viralMultiplier);

    // Determine viral potential
    let viralPotential: 'high' | 'medium' | 'low' = 'low';
    if (estimatedViews > 20000) viralPotential = 'high';
    else if (estimatedViews > 10000) viralPotential = 'medium';

    // Generate relevant hashtags
    const relevantHashtags = [
      venueHashtag,
      ...SATX_TIKTOK_HASHTAGS.slice(0, 3),
    ];

    if (isViralCategory) {
      relevantHashtags.push('nightout', 'barvibes', 'weekendvibes');
    }

    return {
      estimatedViews,
      viralPotential,
      relevantHashtags,
    };
  }

  /**
   * Search for SATX nightlife content across multiple hashtags
   */
  async searchNightlifeContent(options: { maxResults?: number } = {}): Promise<{
    videos: SocialPost[];
    venueMentions: Map<string, number>;
    trendingHashtags: string[];
    totalViews: number;
  }> {
    const { maxResults = 100 } = options;
    const allVideos: SocialPost[] = [];
    const venueMentions = new Map<string, number>();
    let totalViews = 0;

    // Search top SATX hashtags
    for (const hashtag of SATX_TIKTOK_HASHTAGS.slice(0, 3)) {
      const results = await this.searchHashtagVideos(hashtag, {
        maxResults: Math.floor(maxResults / 3),
        days: 3,
      });
      allVideos.push(...results.videos);
      totalViews += results.totalViews;
    }

    // Extract venue mentions from video titles/descriptions
    const knownVenues = [
      'georges keep', 'camp 1604', 'kung fu noodle', 'the venue',
      'sternewirth', 'jazz tx', 'the mix', 'santos', 'paramour',
      'esquire tavern', 'bar 1919', 'big hops', 'ranger creek',
      'freetail', 'dorrol', 'heat nightclub', 'bonham exchange',
    ];

    for (const video of allVideos) {
      if (!video.content) continue;

      const text = video.content.toLowerCase();
      for (const venue of knownVenues) {
        if (text.includes(venue)) {
          venueMentions.set(venue, (venueMentions.get(venue) || 0) + 1);
        }
      }
    }

    // Get trending hashtags from video content
    const hashtagCounts = new Map<string, number>();
    const hashtagRegex = /#(\w+)/g;

    for (const video of allVideos) {
      if (!video.content) continue;

      let match;
      while ((match = hashtagRegex.exec(video.content)) !== null) {
        const tag = match[1].toLowerCase();
        hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
      }
    }

    const trendingHashtags = Array.from(hashtagCounts.entries())
      .filter(([tag]) => !SATX_TIKTOK_HASHTAGS.includes(tag))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);

    return { videos: allVideos, venueMentions, trendingHashtags, totalViews };
  }

  /**
   * Get social signals for a venue
   */
  async fetchSignals(
    venueName: string,
    sourceId: string,
    venueCategory?: string
  ): Promise<RawSignalData | null> {
    // Try to get actual hashtag data if API is available
    let videos: SocialPost[] = [];
    let totalViews = 0;
    let viralScore = 0;

    if (this.isEnabled()) {
      const venueHashtag = normalizeVenueName(venueName).replace(/\s+/g, '');
      const results = await this.searchHashtagVideos(venueHashtag, { maxResults: 25, days: 7 });
      videos = results.videos;
      totalViews = results.totalViews;
      viralScore = results.viralScore;
    }

    // Get estimation for fallback/supplement
    const estimate = await this.estimateVenueActivity(venueName, venueCategory);

    // If no API data, use estimates
    if (videos.length === 0) {
      totalViews = estimate.estimatedViews;
      viralScore = estimate.viralPotential === 'high' ? 75 :
                   estimate.viralPotential === 'medium' ? 50 : 25;
    }

    // Calculate mentions in last 24h based on video timestamps
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const mentions24h = videos.filter(v => new Date(v.postedAt).getTime() > dayAgo).length;

    return {
      sourceId,
      source: 'tiktok',
      timestamp: new Date().toISOString(),
      mentions24h: mentions24h || estimate.estimatedViews / 1000,
      viralScore,
      hashtags: estimate.relevantHashtags,
      raw: {
        totalViews,
        viralPotential: estimate.viralPotential,
        topVideos: videos.slice(0, 5),
      },
    };
  }
}

export function createTikTokConnector(env: Env): TikTokConnector {
  return new TikTokConnector(env);
}
