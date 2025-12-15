// Instagram Scraper for Real-Time Venue Activity
// Uses Instagram's public endpoints and Graph API where available

import {
  InstagramPost,
  SocialMention,
  SocialSearchQuery,
  SentimentResult,
} from './types';
import { analyzeSentiment } from './sentiment';
import { SATX_VENUE_HASHTAGS, SATX_LOCATION_IDS } from './constants';

const INSTAGRAM_API_BASE = 'https://graph.instagram.com/v18.0';
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || '';
const INSTAGRAM_BUSINESS_ID = process.env.INSTAGRAM_BUSINESS_ID || '';

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

interface InstagramSearchResult {
  posts: InstagramPost[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Search Instagram for posts mentioning a venue
 * Uses hashtag search and location-based discovery
 */
export async function searchInstagramForVenue(
  query: SocialSearchQuery
): Promise<InstagramPost[]> {
  const posts: InstagramPost[] = [];

  // Search by hashtags
  for (const hashtag of query.hashtags) {
    const hashtagPosts = await searchByHashtag(hashtag);
    posts.push(...hashtagPosts);
  }

  // Search by location if available
  if (query.locationIds.instagram) {
    const locationPosts = await searchByLocation(query.locationIds.instagram);
    posts.push(...locationPosts);
  }

  // Search by geo-coordinates for recent posts
  const geoPosts = await searchByGeoLocation(
    query.coordinates.lat,
    query.coordinates.lng,
    query.coordinates.radiusMeters
  );
  posts.push(...geoPosts);

  // Deduplicate by post ID
  const uniquePosts = deduplicatePosts(posts);

  // Filter for relevant content
  const relevantPosts = filterRelevantPosts(uniquePosts, query.venueNames);

  return relevantPosts;
}

/**
 * Search posts by hashtag using Instagram Graph API
 */
async function searchByHashtag(hashtag: string): Promise<InstagramPost[]> {
  await rateLimit();

  try {
    // First, get the hashtag ID
    const hashtagIdResponse = await fetch(
      `${INSTAGRAM_API_BASE}/ig_hashtag_search?user_id=${INSTAGRAM_BUSINESS_ID}&q=${encodeURIComponent(hashtag)}&access_token=${INSTAGRAM_ACCESS_TOKEN}`
    );

    if (!hashtagIdResponse.ok) {
      console.error(`Instagram hashtag search failed: ${hashtagIdResponse.status}`);
      return [];
    }

    const hashtagData = await hashtagIdResponse.json();
    if (!hashtagData.data?.[0]?.id) {
      return [];
    }

    const hashtagId = hashtagData.data[0].id;

    // Get recent media for this hashtag
    const mediaResponse = await fetch(
      `${INSTAGRAM_API_BASE}/${hashtagId}/recent_media?user_id=${INSTAGRAM_BUSINESS_ID}&fields=id,caption,media_type,like_count,comments_count,timestamp,permalink&access_token=${INSTAGRAM_ACCESS_TOKEN}`
    );

    if (!mediaResponse.ok) {
      console.error(`Instagram media fetch failed: ${mediaResponse.status}`);
      return [];
    }

    const mediaData = await mediaResponse.json();
    return parseInstagramMedia(mediaData.data || []);
  } catch (error) {
    console.error('Instagram hashtag search error:', error);
    return [];
  }
}

/**
 * Search posts by Instagram location ID
 */
async function searchByLocation(locationId: string): Promise<InstagramPost[]> {
  await rateLimit();

  try {
    const response = await fetch(
      `${INSTAGRAM_API_BASE}/${locationId}/media?fields=id,caption,media_type,like_count,comments_count,timestamp,permalink&access_token=${INSTAGRAM_ACCESS_TOKEN}`
    );

    if (!response.ok) {
      console.error(`Instagram location search failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return parseInstagramMedia(data.data || []);
  } catch (error) {
    console.error('Instagram location search error:', error);
    return [];
  }
}

/**
 * Search for posts by geographic coordinates
 * Uses Instagram's location search API
 */
async function searchByGeoLocation(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<InstagramPost[]> {
  await rateLimit();

  try {
    // Search for location IDs near coordinates
    const locationSearchResponse = await fetch(
      `${INSTAGRAM_API_BASE}/search?type=place&center=${lat},${lng}&distance=${radiusMeters}&access_token=${INSTAGRAM_ACCESS_TOKEN}`
    );

    if (!locationSearchResponse.ok) {
      return [];
    }

    const locationData = await locationSearchResponse.json();
    const posts: InstagramPost[] = [];

    // Get media from each nearby location
    for (const location of (locationData.data || []).slice(0, 5)) {
      const locationPosts = await searchByLocation(location.id);
      posts.push(...locationPosts);
    }

    return posts;
  } catch (error) {
    console.error('Instagram geo search error:', error);
    return [];
  }
}

/**
 * Parse Instagram API response into our InstagramPost format
 */
function parseInstagramMedia(mediaItems: any[]): InstagramPost[] {
  return mediaItems.map((item) => {
    const caption = item.caption || '';
    const hashtags = extractHashtags(caption);
    const mentions = extractMentions(caption);

    return {
      id: item.id,
      shortcode: item.permalink?.split('/p/')?.[1]?.replace('/', '') || item.id,
      type: mapMediaType(item.media_type),
      caption,
      likeCount: item.like_count || 0,
      commentCount: item.comments_count || 0,
      viewCount: item.video_views || undefined,
      owner: {
        username: item.username || 'unknown',
        followerCount: 0, // Would need additional API call
        isVerified: false,
      },
      takenAt: new Date(item.timestamp),
      hashtags,
      mentions,
    };
  });
}

/**
 * Convert Instagram post to our SocialMention format
 */
export function instagramPostToMention(
  post: InstagramPost,
  venueId: string
): SocialMention {
  const engagement = calculateEngagement(post);
  const sentiment = analyzeSentiment(post.caption);

  return {
    id: `ig_${post.id}`,
    platform: 'instagram',
    venueId,
    postId: post.id,
    postUrl: `https://instagram.com/p/${post.shortcode}`,
    authorUsername: post.owner.username,
    authorFollowers: post.owner.followerCount,
    content: post.caption,
    hashtags: post.hashtags,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    shareCount: 0, // Instagram doesn't expose share count
    viewCount: post.viewCount || null,
    mediaType: post.type === 'reel' ? 'reel' : post.type === 'video' ? 'video' : 'image',
    postedAt: post.takenAt,
    fetchedAt: new Date(),
    engagementScore: engagement,
    isLive: false,
    locationTagged: !!post.location,
  };
}

/**
 * Calculate engagement score for Instagram post
 * Considers likes, comments, views, and follower count
 */
function calculateEngagement(post: InstagramPost): number {
  const { likeCount, commentCount, viewCount, owner } = post;

  // Base engagement = likes + comments * 2 (comments are more valuable)
  let engagement = likeCount + commentCount * 2;

  // Add view weight for video content
  if (viewCount) {
    engagement += viewCount * 0.01;
  }

  // Normalize by follower count if available
  if (owner.followerCount > 0) {
    const engagementRate = (likeCount + commentCount) / owner.followerCount;
    // Boost posts with high engagement rate
    if (engagementRate > 0.1) {
      engagement *= 2;
    } else if (engagementRate > 0.05) {
      engagement *= 1.5;
    }
  }

  // Cap and normalize to 0-100 scale
  return Math.min(100, Math.log10(engagement + 1) * 20);
}

/**
 * Extract hashtags from caption
 */
function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u0080-\uFFFF]+/g) || [];
  return matches.map((tag) => tag.slice(1).toLowerCase());
}

/**
 * Extract @mentions from caption
 */
function extractMentions(text: string): string[] {
  const matches = text.match(/@[\w.]+/g) || [];
  return matches.map((mention) => mention.slice(1).toLowerCase());
}

/**
 * Map Instagram media type to our format
 */
function mapMediaType(mediaType: string): 'image' | 'video' | 'carousel' | 'reel' | 'story' {
  switch (mediaType?.toUpperCase()) {
    case 'VIDEO':
      return 'video';
    case 'CAROUSEL_ALBUM':
      return 'carousel';
    case 'REELS':
      return 'reel';
    default:
      return 'image';
  }
}

/**
 * Deduplicate posts by ID
 */
function deduplicatePosts(posts: InstagramPost[]): InstagramPost[] {
  const seen = new Set<string>();
  return posts.filter((post) => {
    if (seen.has(post.id)) {
      return false;
    }
    seen.add(post.id);
    return true;
  });
}

/**
 * Filter posts for relevant venue content
 */
function filterRelevantPosts(
  posts: InstagramPost[],
  venueNames: string[]
): InstagramPost[] {
  const venuePatterns = venueNames.map((name) =>
    new RegExp(name.replace(/[^a-z0-9]/gi, '.?'), 'i')
  );

  return posts.filter((post) => {
    const content = post.caption.toLowerCase();

    // Check if caption mentions venue name
    for (const pattern of venuePatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }

    // Check for SATX nightlife hashtags
    const satxHashtags = SATX_VENUE_HASHTAGS.map((h) => h.toLowerCase());
    for (const hashtag of post.hashtags) {
      if (satxHashtags.includes(hashtag.toLowerCase())) {
        return true;
      }
    }

    // Check if location tagged
    if (post.location) {
      return true;
    }

    return false;
  });
}

/**
 * Rate limiter to avoid API throttling
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
 * Check for active Instagram Live streams at venues
 */
export async function checkInstagramLive(
  venueHandle: string
): Promise<{ isLive: boolean; viewerCount: number } | null> {
  await rateLimit();

  try {
    // Instagram Live check requires specific API access
    // This is a placeholder for when access is available
    const response = await fetch(
      `${INSTAGRAM_API_BASE}/${venueHandle}?fields=live_media&access_token=${INSTAGRAM_ACCESS_TOKEN}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      isLive: !!data.live_media,
      viewerCount: data.live_media?.viewer_count || 0,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get posts from the last hour for real-time pulse
 */
export async function getRecentPostsForVenue(
  query: SocialSearchQuery,
  hoursBack: number = 1
): Promise<InstagramPost[]> {
  const allPosts = await searchInstagramForVenue(query);
  const cutoffTime = Date.now() - hoursBack * 60 * 60 * 1000;

  return allPosts.filter((post) => post.takenAt.getTime() > cutoffTime);
}
