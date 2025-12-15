/**
 * Instagram Connector
 * Hashtag/venue activity monitoring via Instagram Graph API
 *
 * Note: Instagram Graph API has limited public access
 * - Business accounts can pull their own metrics
 * - Hashtag search requires approved business account
 * - This connector uses oEmbed for ToS-compliant display
 * - Falls back to estimation when API is unavailable
 */

import type { Env, RawSignalData, SocialPost } from '../types';
import { RateLimiter, normalizeVenueName } from './types';

const INSTAGRAM_GRAPH_API = 'https://graph.instagram.com/v18.0';
const INSTAGRAM_OEMBED_API = 'https://graph.facebook.com/v18.0/instagram_oembed';

// SATX nightlife hashtags
const SATX_HASHTAGS = [
  'satxnightlife',
  'sanantoniobars',
  'satxbars',
  'sanantonionightlife',
  'downtownsatx',
  'pearlbrewery',
  'southtownsatx',
  'stoneoaksa',
  'lacantera',
];

// Rate limit for Graph API (200 calls/hour per user)
const rateLimiter = new RateLimiter(3, 200);

interface InstagramHashtagResponse {
  data?: Array<{
    id: string;
  }>;
  paging?: {
    cursors?: {
      after?: string;
      before?: string;
    };
    next?: string;
  };
}

interface InstagramMediaResponse {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  username?: string;
}

export class InstagramConnector {
  readonly source = 'instagram';
  readonly name = 'Instagram Graph API';
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  isEnabled(): boolean {
    return !!this.env.INSTAGRAM_ACCESS_TOKEN;
  }

  async healthCheck(): Promise<{ healthy: boolean; quotaRemaining?: number; message?: string }> {
    if (!this.isEnabled()) {
      return { healthy: false, message: 'Instagram Access Token not configured' };
    }

    const status = rateLimiter.getStatus();
    return {
      healthy: true,
      quotaRemaining: status.minuteRemaining,
      message: `${status.minuteRemaining} requests remaining`,
    };
  }

  /**
   * Search for recent posts with a specific hashtag
   * Requires approved business account access
   */
  async searchHashtagPosts(
    hashtag: string,
    options: { limit?: number } = {}
  ): Promise<{
    posts: SocialPost[];
    totalCount: number;
  }> {
    if (!this.isEnabled() || !(await rateLimiter.checkLimit())) {
      return { posts: [], totalCount: 0 };
    }

    const { limit = 50 } = options;

    try {
      // First, get the hashtag ID
      const hashtagSearchParams = new URLSearchParams({
        user_id: this.env.INSTAGRAM_APP_ID || '',
        q: hashtag,
        access_token: this.env.INSTAGRAM_ACCESS_TOKEN!,
      });

      const hashtagResponse = await fetch(
        `${INSTAGRAM_GRAPH_API}/ig_hashtag_search?${hashtagSearchParams}`
      );

      rateLimiter.recordRequest();

      if (!hashtagResponse.ok) {
        console.error(`[Instagram] Hashtag search failed: ${hashtagResponse.status}`);
        return { posts: [], totalCount: 0 };
      }

      const hashtagData: { data?: Array<{ id: string }> } = await hashtagResponse.json();
      if (!hashtagData.data || hashtagData.data.length === 0) {
        return { posts: [], totalCount: 0 };
      }

      const hashtagId = hashtagData.data[0].id;

      // Get recent media for this hashtag
      const mediaParams = new URLSearchParams({
        user_id: this.env.INSTAGRAM_APP_ID || '',
        fields: 'id,caption,media_type,permalink,timestamp,like_count,comments_count',
        limit: limit.toString(),
        access_token: this.env.INSTAGRAM_ACCESS_TOKEN!,
      });

      const mediaResponse = await fetch(
        `${INSTAGRAM_GRAPH_API}/${hashtagId}/recent_media?${mediaParams}`
      );

      rateLimiter.recordRequest();

      if (!mediaResponse.ok) {
        return { posts: [], totalCount: 0 };
      }

      const mediaData: { data?: InstagramMediaResponse[] } = await mediaResponse.json();

      if (!mediaData.data) {
        return { posts: [], totalCount: 0 };
      }

      const posts: SocialPost[] = mediaData.data.map(media => ({
        id: media.id,
        platform: 'instagram',
        content: media.caption || undefined,
        engagement: (media.like_count || 0) + (media.comments_count || 0) * 3,
        postedAt: media.timestamp,
        url: media.permalink,
      }));

      return { posts, totalCount: posts.length };
    } catch (error) {
      console.error(`[Instagram] Error searching hashtag posts:`, error);
      return { posts: [], totalCount: 0 };
    }
  }

  /**
   * Get oEmbed data for an Instagram post (ToS compliant)
   */
  async getPostEmbed(postUrl: string): Promise<{
    html?: string;
    thumbnail_url?: string;
    author_name?: string;
  } | null> {
    if (!this.isEnabled() || !(await rateLimiter.checkLimit())) {
      return null;
    }

    try {
      const params = new URLSearchParams({
        url: postUrl,
        access_token: this.env.INSTAGRAM_ACCESS_TOKEN!,
        omitscript: 'true',
      });

      const response = await fetch(`${INSTAGRAM_OEMBED_API}?${params}`);
      rateLimiter.recordRequest();

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`[Instagram] Error fetching oEmbed:`, error);
      return null;
    }
  }

  /**
   * Estimate venue activity based on hashtag patterns
   * Used when direct API access is limited
   */
  async estimateVenueActivity(
    venueName: string,
    venueNeighborhood?: string
  ): Promise<{
    estimatedMentions: number;
    confidence: 'high' | 'medium' | 'low';
    hashtags: string[];
  }> {
    const normalized = normalizeVenueName(venueName);
    const venueHashtag = normalized.replace(/\s+/g, '');

    // Generate venue-specific and location hashtags
    const hashtags = [
      venueHashtag,
      ...SATX_HASHTAGS.slice(0, 3),
    ];

    if (venueNeighborhood) {
      const neighborhoodHash = venueNeighborhood.toLowerCase().replace(/\s+/g, '');
      hashtags.push(neighborhoodHash);
    }

    // If we have API access, try to search
    if (this.isEnabled()) {
      const results = await this.searchHashtagPosts(venueHashtag, { limit: 25 });
      if (results.totalCount > 0) {
        return {
          estimatedMentions: results.totalCount,
          confidence: 'high',
          hashtags,
        };
      }
    }

    // Fallback: estimate based on venue type and time
    const hour = new Date().getHours();
    const isNighttime = hour >= 20 || hour < 3;
    const isWeekend = [5, 6].includes(new Date().getDay());

    let baseEstimate = 5;
    if (isNighttime) baseEstimate *= 2;
    if (isWeekend) baseEstimate *= 1.5;

    return {
      estimatedMentions: Math.round(baseEstimate),
      confidence: 'low',
      hashtags,
    };
  }

  /**
   * Search for SATX nightlife activity across multiple hashtags
   */
  async searchNightlifeActivity(options: { limit?: number } = {}): Promise<{
    posts: SocialPost[];
    venueMentions: Map<string, number>;
    trendingHashtags: string[];
  }> {
    const { limit = 100 } = options;
    const allPosts: SocialPost[] = [];
    const venueMentions = new Map<string, number>();
    const hashtagCounts = new Map<string, number>();

    // Search top SATX hashtags
    for (const hashtag of SATX_HASHTAGS.slice(0, 3)) {
      const results = await this.searchHashtagPosts(hashtag, { limit: Math.floor(limit / 3) });
      allPosts.push(...results.posts);
    }

    // Extract venue mentions from captions
    const knownVenues = [
      'georges keep', 'camp 1604', 'kung fu noodle', 'the venue',
      'sternewirth', 'jazz tx', 'the mix', 'santos', 'paramour',
      'esquire tavern', 'bar 1919', 'big hops', 'ranger creek',
      'freetail', 'dorrol', 'heat nightclub', 'bonham exchange',
    ];

    for (const post of allPosts) {
      if (!post.content) continue;

      const text = post.content.toLowerCase();

      // Count venue mentions
      for (const venue of knownVenues) {
        if (text.includes(venue)) {
          venueMentions.set(venue, (venueMentions.get(venue) || 0) + 1);
        }
      }

      // Count hashtags
      const hashtagRegex = /#(\w+)/g;
      let match;
      while ((match = hashtagRegex.exec(post.content)) !== null) {
        const tag = match[1].toLowerCase();
        hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
      }
    }

    // Get trending hashtags (excluding common ones)
    const trendingHashtags = Array.from(hashtagCounts.entries())
      .filter(([tag]) => !SATX_HASHTAGS.includes(tag))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);

    return { posts: allPosts, venueMentions, trendingHashtags };
  }

  /**
   * Get social signals for a venue
   */
  async fetchSignals(
    venueName: string,
    sourceId: string,
    neighborhood?: string
  ): Promise<RawSignalData | null> {
    const activity = await this.estimateVenueActivity(venueName, neighborhood);

    // Try to get actual hashtag posts if API is available
    let posts: SocialPost[] = [];
    if (this.isEnabled()) {
      const venueHashtag = normalizeVenueName(venueName).replace(/\s+/g, '');
      const results = await this.searchHashtagPosts(venueHashtag, { limit: 25 });
      posts = results.posts;
    }

    // Calculate engagement from posts
    const totalEngagement = posts.reduce((sum, p) => sum + p.engagement, 0);

    // Estimate hourly vs daily based on post timestamps
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    const mentions1h = posts.filter(p => new Date(p.postedAt).getTime() > hourAgo).length;

    return {
      sourceId,
      source: 'instagram',
      timestamp: new Date().toISOString(),
      mentions1h,
      mentions24h: activity.estimatedMentions,
      engagement: totalEngagement,
      hashtags: activity.hashtags,
      raw: {
        confidence: activity.confidence,
        topPosts: posts.slice(0, 5),
      },
    };
  }
}

export function createInstagramConnector(env: Env): InstagramConnector {
  return new InstagramConnector(env);
}
