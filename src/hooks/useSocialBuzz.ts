// React hook for fetching real-time social buzz data
// Shows what's popping on Instagram, TikTok, and Twitter/X

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface VenueSocialBuzz {
  id: string;
  name: string;
  slug: string;
  category: string;
  address: string;
  city: string;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  currentPulse: number;
  hourlyTrend: 'exploding' | 'rising' | 'steady' | 'falling' | 'dead';
  socialScore: number;
  totalMentionsToday: number;
  totalMentionsHour: number;
  activePlatforms: ('instagram' | 'tiktok' | 'twitter')[];
  liveNow: boolean;
  peakHour: number;
  activityLevel: string;
  lastUpdated: string;
  topPost?: {
    platform: 'instagram' | 'tiktok' | 'twitter';
    postUrl: string;
    engagement: number;
    content: string;
  };
}

export interface BuzzingSummary {
  nightlifeStatus: string;
  explodingCount: number;
  risingCount: number;
  liveNowCount: number;
  topVenue: {
    name: string;
    pulse: number;
    trend: string;
  } | null;
  message: string;
}

export interface BuzzingResponse {
  venues: VenueSocialBuzz[];
  meta: {
    timestamp: string;
    currentHour: number;
    dayOfWeek: number;
    dayName: string;
    totalVenues: number;
    buzzingVenues: number;
  };
  summary: BuzzingSummary;
}

/**
 * Fetch all venues sorted by current social buzz
 * Perfect for "What's popping RIGHT NOW" feature
 */
export function useBuzzingVenues(options?: {
  limit?: number;
  minPulse?: number;
  includeDetails?: boolean;
}) {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.minPulse) params.set('minPulse', options.minPulse.toString());
  if (options?.includeDetails) params.set('details', 'true');

  const queryString = params.toString();
  const url = `/api/social/buzzing${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<BuzzingResponse>(url, fetcher, {
    refreshInterval: 60 * 1000, // Refresh every minute for real-time feel
    revalidateOnFocus: true,
    dedupingInterval: 30 * 1000,
  });

  return {
    venues: data?.venues || [],
    summary: data?.summary || null,
    meta: data?.meta || null,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}

/**
 * Fetch social stats for a specific venue
 */
export function useVenueSocialStats(slug: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    slug ? `/api/social/venue/${slug}` : null,
    fetcher,
    {
      refreshInterval: 2 * 60 * 1000, // Refresh every 2 minutes
      revalidateOnFocus: true,
    }
  );

  return {
    venue: data?.venue || null,
    social: data?.social || null,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}

/**
 * Hook for getting venues that are "exploding" right now
 * Use this for featured/hero sections
 */
export function useExplodingVenues(limit: number = 3) {
  const { venues, isLoading, isError } = useBuzzingVenues({
    limit: limit * 2, // Get extra in case some aren't exploding
    minPulse: 70,
    includeDetails: true,
  });

  const exploding = venues.filter(
    (v) => v.hourlyTrend === 'exploding' || v.hourlyTrend === 'rising'
  ).slice(0, limit);

  return {
    venues: exploding,
    isLoading,
    isError,
  };
}

/**
 * Hook for getting venues with live streams happening now
 */
export function useLiveNowVenues() {
  const { venues, isLoading, isError } = useBuzzingVenues({
    limit: 50,
    includeDetails: true,
  });

  const liveVenues = venues.filter((v) => v.liveNow);

  return {
    venues: liveVenues,
    count: liveVenues.length,
    isLoading,
    isError,
  };
}

/**
 * Get the current nightlife status summary
 */
export function useNightlifeStatus() {
  const { summary, meta, isLoading, isError } = useBuzzingVenues({ limit: 20 });

  return {
    status: summary?.nightlifeStatus || 'LOADING',
    message: summary?.message || '',
    explodingCount: summary?.explodingCount || 0,
    risingCount: summary?.risingCount || 0,
    liveCount: summary?.liveNowCount || 0,
    topVenue: summary?.topVenue || null,
    currentHour: meta?.currentHour || null,
    dayName: meta?.dayName || '',
    isLoading,
    isError,
  };
}

/**
 * Format pulse score for display
 */
export function formatPulseScore(pulse: number): {
  label: string;
  emoji: string;
  color: string;
} {
  if (pulse >= 85) return { label: 'EXPLODING', emoji: '🔥', color: 'text-red-500' };
  if (pulse >= 70) return { label: 'PACKED', emoji: '🎉', color: 'text-orange-500' };
  if (pulse >= 50) return { label: 'BUZZING', emoji: '⚡', color: 'text-yellow-500' };
  if (pulse >= 30) return { label: 'MODERATE', emoji: '👍', color: 'text-green-500' };
  if (pulse >= 10) return { label: 'SLOW', emoji: '😴', color: 'text-blue-500' };
  return { label: 'QUIET', emoji: '🌙', color: 'text-gray-500' };
}

/**
 * Format trend for display
 */
export function formatTrend(trend: VenueSocialBuzz['hourlyTrend']): {
  label: string;
  arrow: string;
  color: string;
} {
  switch (trend) {
    case 'exploding':
      return { label: 'Exploding', arrow: '🚀', color: 'text-red-500' };
    case 'rising':
      return { label: 'Rising', arrow: '📈', color: 'text-green-500' };
    case 'steady':
      return { label: 'Steady', arrow: '➡️', color: 'text-blue-500' };
    case 'falling':
      return { label: 'Falling', arrow: '📉', color: 'text-orange-500' };
    case 'dead':
      return { label: 'Dead', arrow: '💀', color: 'text-gray-500' };
  }
}

/**
 * Format platform list for display
 */
export function formatPlatforms(platforms: VenueSocialBuzz['activePlatforms']): string {
  const platformNames: Record<string, string> = {
    instagram: 'IG',
    tiktok: 'TikTok',
    twitter: 'X',
  };

  return platforms.map((p) => platformNames[p]).join(' • ');
}
