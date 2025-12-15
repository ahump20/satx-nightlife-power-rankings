// Twitter/X Scraper for Real-Time Venue Activity
// Uses Twitter API v2 for trending content and mentions

import {
  TwitterPost,
  SocialMention,
  SocialSearchQuery,
} from './types';
import { analyzeSentiment } from './sentiment';
import { SATX_VENUE_HASHTAGS } from './constants';

const TWITTER_API_BASE = 'https://api.twitter.com/2';
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || '';

// Rate limiting - Twitter has strict limits
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests
let requestsThisWindow = 0;
const MAX_REQUESTS_PER_15_MIN = 450;
let windowStart = Date.now();

interface TwitterSearchResult {
  tweets: TwitterPost[];
  nextToken: string | null;
  resultCount: number;
}

/**
 * Search Twitter for tweets mentioning a venue
 * Uses recent search endpoint with location and hashtag filters
 */
export async function searchTwitterForVenue(
  query: SocialSearchQuery
): Promise<TwitterPost[]> {
  const tweets: TwitterPost[] = [];

  // Build search query
  const searchQuery = buildSearchQuery(query);

  // Search recent tweets (last 7 days)
  const searchResults = await searchRecentTweets(searchQuery);
  tweets.push(...searchResults);

  // Filter for relevant content
  const relevantTweets = filterRelevantTweets(tweets, query.venueNames);

  return relevantTweets;
}

/**
 * Build Twitter search query from our search parameters
 */
function buildSearchQuery(query: SocialSearchQuery): string {
  const parts: string[] = [];

  // Add venue names as keywords (any of them)
  if (query.venueNames.length > 0) {
    const venueQuery = query.venueNames
      .map((name) => `"${name}"`)
      .join(' OR ');
    parts.push(`(${venueQuery})`);
  }

  // Add hashtags
  if (query.hashtags.length > 0) {
    const hashtagQuery = query.hashtags
      .map((tag) => `#${tag.replace('#', '')}`)
      .join(' OR ');
    parts.push(`(${hashtagQuery})`);
  }

  // Geographic filter for San Antonio area
  const { lat, lng, radiusMeters } = query.coordinates;
  const radiusMiles = (radiusMeters / 1609.34).toFixed(1);
  parts.push(`point_radius:[${lng} ${lat} ${radiusMiles}mi]`);

  // Filter for nightlife-related content
  parts.push('(bar OR club OR drinks OR nightlife OR vibes OR party OR lit)');

  // Exclude retweets for original content only
  parts.push('-is:retweet');

  // Include images/videos for better engagement signals
  parts.push('has:media');

  return parts.join(' ');
}

/**
 * Search recent tweets using Twitter API v2
 */
async function searchRecentTweets(
  searchQuery: string,
  nextToken?: string
): Promise<TwitterPost[]> {
  await rateLimit();

  try {
    const params = new URLSearchParams({
      query: searchQuery,
      max_results: '100',
      'tweet.fields': 'created_at,public_metrics,geo,entities,attachments',
      'user.fields': 'username,public_metrics,verified',
      expansions: 'author_id,geo.place_id',
      'place.fields': 'geo,name,full_name',
    });

    if (nextToken) {
      params.set('next_token', nextToken);
    }

    const response = await fetch(
      `${TWITTER_API_BASE}/tweets/search/recent?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`Twitter search failed: ${response.status}`);
      const errorData = await response.json().catch(() => ({}));
      console.error('Twitter error details:', errorData);
      return [];
    }

    const data = await response.json();
    return parseTwitterResponse(data);
  } catch (error) {
    console.error('Twitter search error:', error);
    return [];
  }
}

/**
 * Parse Twitter API v2 response into our TwitterPost format
 */
function parseTwitterResponse(data: any): TwitterPost[] {
  const tweets = data.data || [];
  const users = (data.includes?.users || []).reduce((acc: any, user: any) => {
    acc[user.id] = user;
    return acc;
  }, {});
  const places = (data.includes?.places || []).reduce((acc: any, place: any) => {
    acc[place.id] = place;
    return acc;
  }, {});

  return tweets.map((tweet: any) => {
    const author = users[tweet.author_id] || {};
    const metrics = tweet.public_metrics || {};
    const entities = tweet.entities || {};
    const geo = tweet.geo || {};
    const place = places[geo.place_id];

    // Extract hashtags
    const hashtags = (entities.hashtags || []).map((h: any) => h.tag);

    // Extract mentions
    const mentions = (entities.mentions || []).map((m: any) => m.username);

    // Determine media type
    let mediaType: 'photo' | 'video' | 'gif' | undefined;
    if (tweet.attachments?.media_keys) {
      // Would need media expansion to determine exact type
      mediaType = 'photo';
    }

    return {
      id: tweet.id,
      text: tweet.text,
      likeCount: metrics.like_count || 0,
      retweetCount: metrics.retweet_count || 0,
      replyCount: metrics.reply_count || 0,
      quoteCount: metrics.quote_count || 0,
      viewCount: metrics.impression_count,
      author: {
        username: author.username || 'unknown',
        followerCount: author.public_metrics?.followers_count || 0,
        isVerified: author.verified || false,
      },
      location: place
        ? {
            name: place.full_name || place.name,
            coordinates: place.geo?.bbox
              ? [(place.geo.bbox[0] + place.geo.bbox[2]) / 2, (place.geo.bbox[1] + place.geo.bbox[3]) / 2]
              : undefined,
          }
        : undefined,
      createdAt: new Date(tweet.created_at),
      hashtags,
      mentions,
      mediaType,
    };
  });
}

/**
 * Map Twitter media types to SocialMention media types
 */
function mapTwitterMediaType(
  twitterType?: 'photo' | 'video' | 'gif'
): 'image' | 'video' | 'story' | 'reel' | 'text' {
  switch (twitterType) {
    case 'photo':
      return 'image';
    case 'video':
    case 'gif':
      return 'video';
    default:
      return 'text';
  }
}

/**
 * Convert Twitter post to our SocialMention format
 */
export function twitterPostToMention(
  post: TwitterPost,
  venueId: string
): SocialMention {
  const engagement = calculateEngagement(post);

  return {
    id: `tw_${post.id}`,
    platform: 'twitter',
    venueId,
    postId: post.id,
    postUrl: `https://twitter.com/${post.author.username}/status/${post.id}`,
    authorUsername: post.author.username,
    authorFollowers: post.author.followerCount,
    content: post.text,
    hashtags: post.hashtags,
    likeCount: post.likeCount,
    commentCount: post.replyCount,
    shareCount: post.retweetCount + post.quoteCount,
    viewCount: post.viewCount || null,
    mediaType: mapTwitterMediaType(post.mediaType),
    postedAt: post.createdAt,
    fetchedAt: new Date(),
    engagementScore: engagement,
    isLive: false,
    locationTagged: !!post.location,
  };
}

/**
 * Calculate engagement score for Twitter post
 * Twitter emphasizes retweets and quotes for virality
 */
function calculateEngagement(post: TwitterPost): number {
  const {
    likeCount,
    retweetCount,
    replyCount,
    quoteCount,
    viewCount,
    author,
  } = post;

  // Twitter engagement formula:
  // Retweets and quotes are most valuable for reach
  let engagement = likeCount * 1;
  engagement += retweetCount * 5; // Retweets spread content
  engagement += quoteCount * 8; // Quote tweets drive conversation
  engagement += replyCount * 3; // Replies show engagement

  // Add view weight if available
  if (viewCount) {
    engagement += viewCount * 0.01;
  }

  // Engagement rate boost based on follower count
  if (author.followerCount > 0) {
    const totalActions = likeCount + retweetCount + replyCount + quoteCount;
    const engagementRate = totalActions / author.followerCount;

    if (engagementRate > 0.1) {
      engagement *= 3; // Viral level
    } else if (engagementRate > 0.05) {
      engagement *= 2;
    } else if (engagementRate > 0.02) {
      engagement *= 1.5;
    }
  }

  // Verified account boost
  if (author.isVerified) {
    engagement *= 1.5;
  }

  // Influencer boost
  if (author.followerCount > 100000) {
    engagement *= 2;
  } else if (author.followerCount > 10000) {
    engagement *= 1.5;
  }

  // Normalize to 0-100 scale
  return Math.min(100, Math.log10(engagement + 1) * 18);
}

/**
 * Filter tweets for relevant venue content
 */
function filterRelevantTweets(
  tweets: TwitterPost[],
  venueNames: string[]
): TwitterPost[] {
  const venuePatterns = venueNames.map((name) =>
    new RegExp(name.replace(/[^a-z0-9]/gi, '.?'), 'i')
  );

  return tweets.filter((tweet) => {
    const content = tweet.text.toLowerCase();

    // Check if tweet mentions venue name
    for (const pattern of venuePatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }

    // Check for SATX nightlife hashtags
    const satxHashtags = SATX_VENUE_HASHTAGS.map((h) => h.toLowerCase());
    for (const hashtag of tweet.hashtags) {
      if (satxHashtags.includes(hashtag.toLowerCase())) {
        return true;
      }
    }

    // Check if location tagged in San Antonio
    if (tweet.location?.name?.toLowerCase().includes('san antonio')) {
      return true;
    }

    return false;
  });
}

/**
 * Rate limiter with window tracking
 */
async function rateLimit(): Promise<void> {
  const now = Date.now();

  // Reset window if 15 minutes have passed
  if (now - windowStart > 15 * 60 * 1000) {
    windowStart = now;
    requestsThisWindow = 0;
  }

  // Check if we've hit the limit
  if (requestsThisWindow >= MAX_REQUESTS_PER_15_MIN) {
    const waitTime = 15 * 60 * 1000 - (now - windowStart);
    console.log(`Twitter rate limit reached. Waiting ${waitTime}ms`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    windowStart = Date.now();
    requestsThisWindow = 0;
  }

  // Ensure minimum interval between requests
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - elapsed)
    );
  }

  lastRequestTime = Date.now();
  requestsThisWindow++;
}

/**
 * Get trending topics in San Antonio
 */
export async function getSATXTrendingTopics(): Promise<
  Array<{ name: string; tweetVolume: number | null }>
> {
  await rateLimit();

  try {
    // San Antonio WOEID: 2487796
    const response = await fetch(
      `${TWITTER_API_BASE}/trends/place.json?id=2487796`,
      {
        headers: {
          Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`Twitter trends failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const trends = data[0]?.trends || [];

    return trends.map((trend: any) => ({
      name: trend.name,
      tweetVolume: trend.tweet_volume,
    }));
  } catch (error) {
    console.error('Twitter trends error:', error);
    return [];
  }
}

/**
 * Stream real-time tweets for venues
 * Uses Twitter Filtered Stream API for live updates
 */
export async function setupVenueStream(
  venueNames: string[],
  hashtags: string[],
  onTweet: (tweet: TwitterPost) => void
): Promise<{ stop: () => void }> {
  // Build stream rules
  const rules = [
    ...venueNames.map((name) => ({ value: `"${name}" -is:retweet` })),
    ...hashtags.map((tag) => ({ value: `#${tag} -is:retweet` })),
  ];

  try {
    // Delete existing rules
    const existingRulesResponse = await fetch(
      `${TWITTER_API_BASE}/tweets/search/stream/rules`,
      {
        headers: {
          Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
        },
      }
    );

    if (existingRulesResponse.ok) {
      const existingRules = await existingRulesResponse.json();
      if (existingRules.data?.length > 0) {
        await fetch(`${TWITTER_API_BASE}/tweets/search/stream/rules`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            delete: { ids: existingRules.data.map((r: any) => r.id) },
          }),
        });
      }
    }

    // Add new rules
    await fetch(`${TWITTER_API_BASE}/tweets/search/stream/rules`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ add: rules }),
    });

    // Connect to stream
    const streamResponse = await fetch(
      `${TWITTER_API_BASE}/tweets/search/stream?tweet.fields=created_at,public_metrics,geo&user.fields=username,public_metrics&expansions=author_id`,
      {
        headers: {
          Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
        },
      }
    );

    if (!streamResponse.ok || !streamResponse.body) {
      throw new Error('Failed to connect to Twitter stream');
    }

    let isRunning = true;
    const reader = streamResponse.body.getReader();
    const decoder = new TextDecoder();

    // Process stream in background
    (async () => {
      while (isRunning) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            const tweets = parseTwitterResponse({ data: [data.data], includes: data.includes });
            if (tweets.length > 0) {
              onTweet(tweets[0]);
            }
          } catch {
            // Skip non-JSON lines (keep-alive signals)
          }
        }
      }
    })();

    return {
      stop: () => {
        isRunning = false;
        reader.cancel();
      },
    };
  } catch (error) {
    console.error('Twitter stream setup error:', error);
    return { stop: () => {} };
  }
}

/**
 * Get tweets from the last hour for real-time pulse
 */
export async function getRecentTweetsForVenue(
  query: SocialSearchQuery,
  hoursBack: number = 1
): Promise<TwitterPost[]> {
  const allTweets = await searchTwitterForVenue(query);
  const cutoffTime = Date.now() - hoursBack * 60 * 60 * 1000;

  return allTweets.filter((tweet) => tweet.createdAt.getTime() > cutoffTime);
}

/**
 * Search for Twitter Spaces (audio rooms) happening at venues
 */
export async function searchTwitterSpaces(
  query: string
): Promise<Array<{ id: string; title: string; participantCount: number; hostUsername: string }>> {
  await rateLimit();

  try {
    const params = new URLSearchParams({
      query,
      state: 'live',
      'space.fields': 'title,participant_count,host_ids',
      expansions: 'host_ids',
      'user.fields': 'username',
    });

    const response = await fetch(
      `${TWITTER_API_BASE}/spaces/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const spaces = data.data || [];
    const users = (data.includes?.users || []).reduce((acc: any, user: any) => {
      acc[user.id] = user;
      return acc;
    }, {});

    return spaces.map((space: any) => ({
      id: space.id,
      title: space.title,
      participantCount: space.participant_count || 0,
      hostUsername: users[space.host_ids?.[0]]?.username || 'unknown',
    }));
  } catch (error) {
    console.error('Twitter Spaces search error:', error);
    return [];
  }
}
