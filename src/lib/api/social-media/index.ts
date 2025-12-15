// Social Media Module - Real-Time Trending for SATX Nightlife
// Aggregates Instagram, TikTok, and Twitter/X to show what's popping

export * from './types';
export * from './constants';
export * from './sentiment';
export * from './buzz-engine';

// Platform-specific exports
export {
  searchInstagramForVenue,
  instagramPostToMention,
  getRecentPostsForVenue as getRecentInstagramPosts,
  checkInstagramLive,
} from './instagram-scraper';

export {
  searchTikTokForVenue,
  tiktokVideoToMention,
  getRecentVideosForVenue as getRecentTikTokVideos,
  checkTikTokLive,
  getTrendingSounds,
} from './tiktok-scraper';

export {
  searchTwitterForVenue,
  twitterPostToMention,
  getRecentTweetsForVenue as getRecentTwitterPosts,
  getSATXTrendingTopics,
  setupVenueStream,
  searchTwitterSpaces,
} from './twitter-scraper';
