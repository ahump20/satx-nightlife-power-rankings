// TikTok Scraper for Real-Time Venue Activity
// Uses TikTok's Research API and public endpoints for trending content

import {
  TikTokVideo,
  SocialMention,
  SocialSearchQuery,
} from './types';
import { analyzeSentiment } from './sentiment';
import { SATX_VENUE_HASHTAGS } from './constants';

const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';
const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN || '';
const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || '';
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || '';

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // 500ms between requests

interface TikTokSearchResult {
  videos: TikTokVideo[];
  cursor: number;
  hasMore: boolean;
}

/**
 * Search TikTok for videos mentioning a venue
 * Uses hashtag search and location-based discovery
 */
export async function searchTikTokForVenue(
  query: SocialSearchQuery
): Promise<TikTokVideo[]> {
  const videos: TikTokVideo[] = [];

  // Search by hashtags
  for (const hashtag of query.hashtags) {
    const hashtagVideos = await searchByHashtag(hashtag);
    videos.push(...hashtagVideos);
  }

  // Search by keywords (venue names)
  for (const keyword of query.venueNames) {
    const keywordVideos = await searchByKeyword(keyword);
    videos.push(...keywordVideos);
  }

  // Search by location if coordinates available
  const locationVideos = await searchByLocation(
    query.coordinates.lat,
    query.coordinates.lng,
    query.coordinates.radiusMeters
  );
  videos.push(...locationVideos);

  // Deduplicate by video ID
  const uniqueVideos = deduplicateVideos(videos);

  // Filter for relevant content
  const relevantVideos = filterRelevantVideos(uniqueVideos, query.venueNames);

  return relevantVideos;
}

/**
 * Search TikTok videos by hashtag
 */
async function searchByHashtag(hashtag: string): Promise<TikTokVideo[]> {
  await rateLimit();

  try {
    const response = await fetch(`${TIKTOK_API_BASE}/research/video/query/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TIKTOK_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          and: [
            {
              field_name: 'hashtag_name',
              operation: 'EQ',
              field_values: [hashtag.replace('#', '')],
            },
          ],
        },
        start_date: getDateDaysAgo(7),
        end_date: getTodayDate(),
        max_count: 100,
        fields: [
          'id',
          'video_description',
          'create_time',
          'like_count',
          'comment_count',
          'share_count',
          'view_count',
          'username',
          'hashtag_names',
        ],
      }),
    });

    if (!response.ok) {
      console.error(`TikTok hashtag search failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return parseTikTokVideos(data.data?.videos || []);
  } catch (error) {
    console.error('TikTok hashtag search error:', error);
    return [];
  }
}

/**
 * Search TikTok videos by keyword
 */
async function searchByKeyword(keyword: string): Promise<TikTokVideo[]> {
  await rateLimit();

  try {
    const response = await fetch(`${TIKTOK_API_BASE}/research/video/query/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TIKTOK_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          and: [
            {
              field_name: 'keyword',
              operation: 'EQ',
              field_values: [keyword],
            },
            {
              field_name: 'region_code',
              operation: 'EQ',
              field_values: ['US'],
            },
          ],
        },
        start_date: getDateDaysAgo(7),
        end_date: getTodayDate(),
        max_count: 50,
        fields: [
          'id',
          'video_description',
          'create_time',
          'like_count',
          'comment_count',
          'share_count',
          'view_count',
          'username',
          'hashtag_names',
        ],
      }),
    });

    if (!response.ok) {
      console.error(`TikTok keyword search failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return parseTikTokVideos(data.data?.videos || []);
  } catch (error) {
    console.error('TikTok keyword search error:', error);
    return [];
  }
}

/**
 * Search TikTok videos by location
 */
async function searchByLocation(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<TikTokVideo[]> {
  await rateLimit();

  try {
    // TikTok location search requires POI (Point of Interest) IDs
    // First search for nearby POIs, then get videos from those locations
    const response = await fetch(`${TIKTOK_API_BASE}/research/video/query/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TIKTOK_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          and: [
            {
              field_name: 'region_code',
              operation: 'EQ',
              field_values: ['US'],
            },
            // Search for San Antonio related content
            {
              field_name: 'keyword',
              operation: 'IN',
              field_values: ['San Antonio', 'SATX', 'sanantonio'],
            },
          ],
        },
        start_date: getDateDaysAgo(1), // Last 24 hours for real-time
        end_date: getTodayDate(),
        max_count: 100,
        fields: [
          'id',
          'video_description',
          'create_time',
          'like_count',
          'comment_count',
          'share_count',
          'view_count',
          'username',
          'hashtag_names',
        ],
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return parseTikTokVideos(data.data?.videos || []);
  } catch (error) {
    console.error('TikTok location search error:', error);
    return [];
  }
}

/**
 * Parse TikTok API response into our TikTokVideo format
 */
function parseTikTokVideos(videoItems: any[]): TikTokVideo[] {
  return videoItems.map((item) => {
    const hashtags = item.hashtag_names || extractHashtags(item.video_description || '');

    return {
      id: item.id,
      videoId: item.id,
      description: item.video_description || '',
      viewCount: item.view_count || 0,
      likeCount: item.like_count || 0,
      commentCount: item.comment_count || 0,
      shareCount: item.share_count || 0,
      author: {
        username: item.username || 'unknown',
        followerCount: 0, // Would need additional API call
        isVerified: false,
      },
      createdAt: new Date(item.create_time * 1000),
      hashtags,
      isLive: false,
    };
  });
}

/**
 * Convert TikTok video to our SocialMention format
 */
export function tiktokVideoToMention(
  video: TikTokVideo,
  venueId: string
): SocialMention {
  const engagement = calculateEngagement(video);

  return {
    id: `tt_${video.id}`,
    platform: 'tiktok',
    venueId,
    postId: video.id,
    postUrl: `https://tiktok.com/@${video.author.username}/video/${video.videoId}`,
    authorUsername: video.author.username,
    authorFollowers: video.author.followerCount,
    content: video.description,
    hashtags: video.hashtags,
    likeCount: video.likeCount,
    commentCount: video.commentCount,
    shareCount: video.shareCount,
    viewCount: video.viewCount,
    mediaType: 'video',
    postedAt: video.createdAt,
    fetchedAt: new Date(),
    engagementScore: engagement,
    isLive: video.isLive,
    locationTagged: !!video.location,
  };
}

/**
 * Calculate engagement score for TikTok video
 * TikTok emphasizes views and shares more than other platforms
 */
function calculateEngagement(video: TikTokVideo): number {
  const { viewCount, likeCount, commentCount, shareCount, author } = video;

  // TikTok engagement formula:
  // Views are baseline, likes/comments/shares are multipliers
  let engagement = viewCount * 0.001; // Base from views
  engagement += likeCount * 0.5;
  engagement += commentCount * 2; // Comments are valuable
  engagement += shareCount * 5; // Shares are most valuable on TikTok

  // Engagement rate boost
  if (viewCount > 0) {
    const engagementRate = (likeCount + commentCount + shareCount) / viewCount;
    if (engagementRate > 0.1) {
      engagement *= 2.5; // Viral-level engagement
    } else if (engagementRate > 0.05) {
      engagement *= 1.5;
    }
  }

  // Viral thresholds
  if (viewCount > 1000000) {
    engagement *= 3; // Million+ views
  } else if (viewCount > 100000) {
    engagement *= 2;
  } else if (viewCount > 10000) {
    engagement *= 1.5;
  }

  // Normalize to 0-100 scale
  return Math.min(100, Math.log10(engagement + 1) * 15);
}

/**
 * Extract hashtags from description
 */
function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u0080-\uFFFF]+/g) || [];
  return matches.map((tag) => tag.slice(1).toLowerCase());
}

/**
 * Deduplicate videos by ID
 */
function deduplicateVideos(videos: TikTokVideo[]): TikTokVideo[] {
  const seen = new Set<string>();
  return videos.filter((video) => {
    if (seen.has(video.id)) {
      return false;
    }
    seen.add(video.id);
    return true;
  });
}

/**
 * Filter videos for relevant venue content
 */
function filterRelevantVideos(
  videos: TikTokVideo[],
  venueNames: string[]
): TikTokVideo[] {
  const venuePatterns = venueNames.map((name) =>
    new RegExp(name.replace(/[^a-z0-9]/gi, '.?'), 'i')
  );

  return videos.filter((video) => {
    const content = video.description.toLowerCase();

    // Check if description mentions venue name
    for (const pattern of venuePatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }

    // Check for SATX nightlife hashtags
    const satxHashtags = SATX_VENUE_HASHTAGS.map((h) => h.toLowerCase());
    for (const hashtag of video.hashtags) {
      if (satxHashtags.includes(hashtag.toLowerCase())) {
        return true;
      }
    }

    // Check if location tagged
    if (video.location) {
      return true;
    }

    return false;
  });
}

/**
 * Rate limiter
 */
async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;

  if (elapsed < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - elapsed)
    );
  }

  lastRequestTime = Date.now();
}

/**
 * Check for active TikTok Lives at venues
 */
export async function checkTikTokLive(
  venueHandle: string
): Promise<{ isLive: boolean; viewerCount: number; roomId: string } | null> {
  await rateLimit();

  try {
    // TikTok Live check - requires specific API access
    const response = await fetch(
      `${TIKTOK_API_BASE}/user/info/?username=${venueHandle}`,
      {
        headers: {
          'Authorization': `Bearer ${TIKTOK_ACCESS_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const isLive = data.data?.user?.is_live || false;

    return {
      isLive,
      viewerCount: data.data?.user?.live_room?.viewer_count || 0,
      roomId: data.data?.user?.live_room?.room_id || '',
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get trending TikTok sounds used at nightlife venues
 * Useful for detecting what's popular
 */
export async function getTrendingSounds(): Promise<
  Array<{ id: string; title: string; useCount: number }>
> {
  await rateLimit();

  try {
    // Trending sounds in nightlife category
    const response = await fetch(`${TIKTOK_API_BASE}/research/music/query/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TIKTOK_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        max_count: 20,
        fields: ['id', 'title', 'video_count'],
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data.data?.music || []).map((sound: any) => ({
      id: sound.id,
      title: sound.title,
      useCount: sound.video_count,
    }));
  } catch (error) {
    console.error('TikTok trending sounds error:', error);
    return [];
  }
}

/**
 * Get videos from the last hour for real-time pulse
 */
export async function getRecentVideosForVenue(
  query: SocialSearchQuery,
  hoursBack: number = 1
): Promise<TikTokVideo[]> {
  const allVideos = await searchTikTokForVenue(query);
  const cutoffTime = Date.now() - hoursBack * 60 * 60 * 1000;

  return allVideos.filter((video) => video.createdAt.getTime() > cutoffTime);
}

// Helper functions for date formatting
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}
