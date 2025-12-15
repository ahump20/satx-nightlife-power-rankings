/**
 * Twitter/X API Connector
 * Real-time venue mentions and nightlife hashtag monitoring
 *
 * Uses Twitter API v2 for:
 * - Recent tweets mentioning venue names
 * - SATX nightlife hashtag tracking
 * - Engagement metrics (likes, retweets, replies)
 */

import type { Env, RawSignalData, SocialPost } from '../types';
import { RateLimiter, normalizeVenueName } from './types';

const TWITTER_API_BASE = 'https://api.twitter.com/2';

// SATX nightlife hashtags to monitor
const SATX_HASHTAGS = [
  '#satxnightlife',
  '#sanantoniobars',
  '#satxbars',
  '#sanantonionightlife',
  '#satxdrinks',
  '#downtownsa',
  '#pearldistrict',
  '#southtown',
  '#stoneoakbars',
  '#lacantera',
  '#therimsatx',
];

// Rate limit: 450 requests per 15 min (Basic tier)
const rateLimiter = new RateLimiter(30, 1000);

interface TwitterSearchResponse {
  data?: Array<{
    id: string;
    text: string;
    created_at: string;
    author_id: string;
    public_metrics?: {
      retweet_count: number;
      reply_count: number;
      like_count: number;
      quote_count: number;
    };
    entities?: {
      hashtags?: Array<{ tag: string }>;
      mentions?: Array<{ username: string }>;
    };
  }>;
  includes?: {
    users?: Array<{
      id: string;
      username: string;
      name: string;
    }>;
  };
  meta?: {
    newest_id?: string;
    oldest_id?: string;
    result_count: number;
    next_token?: string;
  };
}

export class TwitterConnector {
  readonly source = 'twitter';
  readonly name = 'Twitter/X API';
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  isEnabled(): boolean {
    return !!this.env.TWITTER_BEARER_TOKEN;
  }

  async healthCheck(): Promise<{ healthy: boolean; quotaRemaining?: number; message?: string }> {
    if (!this.isEnabled()) {
      return { healthy: false, message: 'Twitter Bearer Token not configured' };
    }

    const status = rateLimiter.getStatus();
    return {
      healthy: true,
      quotaRemaining: status.minuteRemaining,
      message: `${status.minuteRemaining} requests remaining this minute`,
    };
  }

  /**
   * Search for recent tweets mentioning a specific venue
   */
  async searchVenueMentions(
    venueName: string,
    options: { hours?: number; maxResults?: number } = {}
  ): Promise<{
    mentions: SocialPost[];
    engagement: number;
    sentiment: number;
  }> {
    if (!this.isEnabled() || !(await rateLimiter.checkLimit())) {
      return { mentions: [], engagement: 0, sentiment: 0 };
    }

    const { hours = 24, maxResults = 100 } = options;
    const normalizedName = normalizeVenueName(venueName);

    // Build search query
    const query = `"${venueName}" OR ${normalizedName.split(' ').join(' OR ')} -is:retweet lang:en`;
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    try {
      const params = new URLSearchParams({
        query,
        'start_time': startTime,
        'max_results': Math.min(maxResults, 100).toString(),
        'tweet.fields': 'created_at,public_metrics,entities',
        'user.fields': 'username,name',
        'expansions': 'author_id',
      });

      const response = await fetch(`${TWITTER_API_BASE}/tweets/search/recent?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.env.TWITTER_BEARER_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      rateLimiter.recordRequest();

      if (!response.ok) {
        const error = await response.text();
        console.error(`[Twitter] Search failed: ${response.status} - ${error}`);
        return { mentions: [], engagement: 0, sentiment: 0 };
      }

      const data: TwitterSearchResponse = await response.json();

      if (!data.data || data.data.length === 0) {
        return { mentions: [], engagement: 0, sentiment: 0 };
      }

      // Map users for author lookup
      const userMap = new Map<string, string>();
      if (data.includes?.users) {
        for (const user of data.includes.users) {
          userMap.set(user.id, user.username);
        }
      }

      // Process tweets
      const mentions: SocialPost[] = data.data.map(tweet => ({
        id: tweet.id,
        platform: 'twitter',
        content: tweet.text,
        author: userMap.get(tweet.author_id) || undefined,
        engagement:
          (tweet.public_metrics?.like_count || 0) +
          (tweet.public_metrics?.retweet_count || 0) * 2 +
          (tweet.public_metrics?.reply_count || 0) * 3,
        postedAt: tweet.created_at,
        url: `https://twitter.com/i/status/${tweet.id}`,
      }));

      // Calculate total engagement
      const totalEngagement = mentions.reduce((sum, m) => sum + m.engagement, 0);

      // Simple sentiment analysis (positive words vs negative)
      const sentiment = this.analyzeSentiment(data.data.map(t => t.text).join(' '));

      return { mentions, engagement: totalEngagement, sentiment };
    } catch (error) {
      console.error(`[Twitter] Error searching venue mentions:`, error);
      return { mentions: [], engagement: 0, sentiment: 0 };
    }
  }

  /**
   * Search SATX nightlife hashtags for general activity
   */
  async searchNightlifeActivity(options: { hours?: number } = {}): Promise<{
    tweets: SocialPost[];
    venueMentions: Map<string, number>;
    hotspots: string[];
  }> {
    if (!this.isEnabled() || !(await rateLimiter.checkLimit())) {
      return { tweets: [], venueMentions: new Map(), hotspots: [] };
    }

    const { hours = 6 } = options;
    const query = SATX_HASHTAGS.slice(0, 5).join(' OR ') + ' -is:retweet';
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    try {
      const params = new URLSearchParams({
        query,
        'start_time': startTime,
        'max_results': '100',
        'tweet.fields': 'created_at,public_metrics,entities',
        'user.fields': 'username',
        'expansions': 'author_id',
      });

      const response = await fetch(`${TWITTER_API_BASE}/tweets/search/recent?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.env.TWITTER_BEARER_TOKEN}`,
        },
      });

      rateLimiter.recordRequest();

      if (!response.ok) {
        return { tweets: [], venueMentions: new Map(), hotspots: [] };
      }

      const data: TwitterSearchResponse = await response.json();

      if (!data.data) {
        return { tweets: [], venueMentions: new Map(), hotspots: [] };
      }

      // Extract venue mentions from tweets
      const venueMentions = new Map<string, number>();
      const knownVenues = [
        'georges keep', 'camp 1604', 'kung fu noodle', 'the venue',
        'sternewirth', 'jazz tx', 'the mix', 'santos', 'paramour',
        'esquire tavern', 'bar 1919', 'big hops', 'ranger creek',
        'freetail', 'dorrol', 'heat nightclub', 'bonham exchange',
      ];

      for (const tweet of data.data) {
        const text = tweet.text.toLowerCase();
        for (const venue of knownVenues) {
          if (text.includes(venue)) {
            venueMentions.set(venue, (venueMentions.get(venue) || 0) + 1);
          }
        }
      }

      // Sort by mention count to find hotspots
      const hotspots = Array.from(venueMentions.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([venue]) => venue);

      const tweets: SocialPost[] = data.data.map(tweet => ({
        id: tweet.id,
        platform: 'twitter',
        content: tweet.text,
        engagement:
          (tweet.public_metrics?.like_count || 0) +
          (tweet.public_metrics?.retweet_count || 0) * 2,
        postedAt: tweet.created_at,
        url: `https://twitter.com/i/status/${tweet.id}`,
      }));

      return { tweets, venueMentions, hotspots };
    } catch (error) {
      console.error(`[Twitter] Error searching nightlife activity:`, error);
      return { tweets: [], venueMentions: new Map(), hotspots: [] };
    }
  }

  /**
   * Get social signals for a venue
   */
  async fetchSignals(
    venueName: string,
    sourceId: string
  ): Promise<RawSignalData | null> {
    const [hourlyData, dailyData] = await Promise.all([
      this.searchVenueMentions(venueName, { hours: 1, maxResults: 50 }),
      this.searchVenueMentions(venueName, { hours: 24, maxResults: 100 }),
    ]);

    return {
      sourceId,
      source: 'twitter',
      timestamp: new Date().toISOString(),
      mentions1h: hourlyData.mentions.length,
      mentions24h: dailyData.mentions.length,
      engagement: dailyData.engagement,
      sentiment: dailyData.sentiment,
      hashtags: this.extractHashtags(dailyData.mentions),
      raw: {
        hourlyMentions: hourlyData.mentions.slice(0, 5),
        dailyMentions: dailyData.mentions.slice(0, 10),
      },
    };
  }

  /**
   * Simple sentiment analysis based on keyword matching
   */
  private analyzeSentiment(text: string): number {
    const lowerText = text.toLowerCase();

    const positiveWords = [
      'amazing', 'awesome', 'great', 'best', 'love', 'loved', 'fire',
      'lit', 'vibes', 'fun', 'incredible', 'perfect', 'excellent',
      'packed', 'bumping', 'popping', 'goated', 'slaps', 'legendary',
    ];

    const negativeWords = [
      'bad', 'terrible', 'worst', 'hate', 'boring', 'dead', 'empty',
      'overpriced', 'rude', 'slow', 'crowded', 'gross', 'sketchy',
      'avoid', 'disappointed', 'waste', 'sucks', 'trash',
    ];

    let score = 0;
    for (const word of positiveWords) {
      if (lowerText.includes(word)) score += 0.1;
    }
    for (const word of negativeWords) {
      if (lowerText.includes(word)) score -= 0.1;
    }

    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Extract unique hashtags from posts
   */
  private extractHashtags(posts: SocialPost[]): string[] {
    const hashtags = new Set<string>();
    const hashtagRegex = /#(\w+)/g;

    for (const post of posts) {
      if (post.content) {
        let match;
        while ((match = hashtagRegex.exec(post.content)) !== null) {
          hashtags.add(match[1].toLowerCase());
        }
      }
    }

    return Array.from(hashtags);
  }
}

export function createTwitterConnector(env: Env): TwitterConnector {
  return new TwitterConnector(env);
}
