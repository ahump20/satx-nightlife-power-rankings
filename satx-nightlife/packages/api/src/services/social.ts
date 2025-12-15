/**
 * Social Signals Aggregator
 * Combines Twitter, Instagram, and TikTok data for venue buzz scoring
 */

import type { Env, SocialSignals } from '../types';
import { createTwitterConnector } from '../connectors/twitter';
import { createInstagramConnector } from '../connectors/instagram';
import { createTikTokConnector } from '../connectors/tiktok';

export class SocialSignalsService {
  private twitterConnector;
  private instagramConnector;
  private tiktokConnector;

  constructor(private env: Env) {
    this.twitterConnector = createTwitterConnector(env);
    this.instagramConnector = createInstagramConnector(env);
    this.tiktokConnector = createTikTokConnector(env);
  }

  /**
   * Get combined social signals for a venue
   * Queries all three platforms and aggregates results
   */
  async getVenueSignals(
    venueName: string,
    venueId: string,
    neighborhood?: string,
    category?: string
  ): Promise<SocialSignals> {
    // Fetch signals from all platforms in parallel
    const [twitterSignals, instagramSignals, tiktokSignals] = await Promise.all([
      this.twitterConnector.fetchSignals(venueName, venueId),
      this.instagramConnector.fetchSignals(venueName, venueId, neighborhood),
      this.tiktokConnector.fetchSignals(venueName, venueId, category),
    ]);

    // Build Twitter signals
    const twitter = {
      mentions1h: twitterSignals?.mentions1h || 0,
      mentions24h: twitterSignals?.mentions24h || 0,
      engagement: twitterSignals?.engagement || 0,
      sentiment: twitterSignals?.sentiment || 0,
      topTweets: (twitterSignals?.raw?.hourlyMentions as any[]) || [],
    };

    // Build Instagram signals
    const instagram = {
      mentions1h: instagramSignals?.mentions1h || 0,
      mentions24h: instagramSignals?.mentions24h || 0,
      engagement: instagramSignals?.engagement || 0,
      topPosts: (instagramSignals?.raw?.topPosts as any[]) || [],
    };

    // Build TikTok signals
    const tiktok = {
      mentions24h: tiktokSignals?.mentions24h || 0,
      viralScore: tiktokSignals?.viralScore || 0,
      viewCount: (tiktokSignals?.raw?.totalViews as number) || 0,
      topVideos: (tiktokSignals?.raw?.topVideos as any[]) || [],
    };

    // Calculate combined buzz score
    const totalMentions1h = twitter.mentions1h + instagram.mentions1h;
    const totalMentions24h = twitter.mentions24h + instagram.mentions24h + tiktok.mentions24h;

    // Determine trend direction
    const hourlyRate = totalMentions1h;
    const avgDailyRate = totalMentions24h / 24;
    let trendDirection: 'rising' | 'falling' | 'stable' = 'stable';
    if (hourlyRate > avgDailyRate * 2) trendDirection = 'rising';
    else if (hourlyRate < avgDailyRate * 0.5) trendDirection = 'falling';

    // Calculate overall buzz score
    const buzzScore = Math.min(
      100,
      twitter.mentions1h * 10 +
      twitter.engagement * 0.01 +
      instagram.mentions1h * 10 +
      instagram.engagement * 0.02 +
      tiktok.viralScore * 0.5 +
      tiktok.viewCount * 0.0001
    );

    // Find most recent activity
    const allTimestamps = [
      ...(twitter.topTweets?.map((t: any) => t.postedAt) || []),
      ...(instagram.topPosts?.map((p: any) => p.postedAt) || []),
      ...(tiktok.topVideos?.map((v: any) => v.postedAt) || []),
    ].filter(Boolean);

    const lastActivity = allTimestamps.length > 0
      ? allTimestamps.sort().reverse()[0]
      : undefined;

    return {
      twitter,
      instagram,
      tiktok,
      combined: {
        buzzScore: Math.round(buzzScore),
        trendDirection,
        lastActivity,
      },
    };
  }

  /**
   * Get SATX nightlife hotspots across all platforms
   */
  async getNightlifeHotspots(): Promise<{
    trending: string[];
    venueMentions: Map<string, number>;
    trendingHashtags: string[];
  }> {
    const [twitterActivity, instagramActivity, tiktokActivity] = await Promise.all([
      this.twitterConnector.searchNightlifeActivity({ hours: 6 }),
      this.instagramConnector.searchNightlifeActivity({ limit: 50 }),
      this.tiktokConnector.searchNightlifeContent({ maxResults: 50 }),
    ]);

    // Merge venue mentions from all platforms
    const venueMentions = new Map<string, number>();

    for (const [venue, count] of twitterActivity.venueMentions) {
      venueMentions.set(venue, (venueMentions.get(venue) || 0) + count * 2); // Twitter weighted higher for real-time
    }
    for (const [venue, count] of instagramActivity.venueMentions) {
      venueMentions.set(venue, (venueMentions.get(venue) || 0) + count);
    }
    for (const [venue, count] of tiktokActivity.venueMentions) {
      venueMentions.set(venue, (venueMentions.get(venue) || 0) + count * 1.5); // TikTok bonus for viral potential
    }

    // Get trending venues (sorted by combined mentions)
    const trending = Array.from(venueMentions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([venue]) => venue);

    // Merge trending hashtags
    const hashtagSet = new Set<string>([
      ...instagramActivity.trendingHashtags,
      ...tiktokActivity.trendingHashtags,
    ]);

    return {
      trending,
      venueMentions,
      trendingHashtags: Array.from(hashtagSet).slice(0, 20),
    };
  }

  /**
   * Check health of all social connectors
   */
  async healthCheck(): Promise<{
    twitter: { enabled: boolean; healthy: boolean; message?: string };
    instagram: { enabled: boolean; healthy: boolean; message?: string };
    tiktok: { enabled: boolean; healthy: boolean; message?: string };
  }> {
    const [twitterHealth, instagramHealth, tiktokHealth] = await Promise.all([
      this.twitterConnector.healthCheck(),
      this.instagramConnector.healthCheck(),
      this.tiktokConnector.healthCheck(),
    ]);

    return {
      twitter: {
        enabled: this.twitterConnector.isEnabled(),
        healthy: twitterHealth.healthy,
        message: twitterHealth.message,
      },
      instagram: {
        enabled: this.instagramConnector.isEnabled(),
        healthy: instagramHealth.healthy,
        message: instagramHealth.message,
      },
      tiktok: {
        enabled: this.tiktokConnector.isEnabled(),
        healthy: tiktokHealth.healthy,
        message: tiktokHealth.message,
      },
    };
  }
}

export function createSocialSignalsService(env: Env): SocialSignalsService {
  return new SocialSignalsService(env);
}
