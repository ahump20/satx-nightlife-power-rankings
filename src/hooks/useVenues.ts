'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseVenuesOptions {
  lat?: number | null;
  lng?: number | null;
  category?: string;
  limit?: number;
  sort?: 'rank' | 'distance' | 'rating' | 'score';
}

export function useVenues(options: UseVenuesOptions = {}) {
  const params = new URLSearchParams();

  if (options.lat && options.lng) {
    params.set('lat', options.lat.toString());
    params.set('lng', options.lng.toString());
  }
  if (options.category) params.set('category', options.category);
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.sort) params.set('sort', options.sort);

  const queryString = params.toString();
  const url = `/api/venues${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 30000, // 30 seconds
  });

  return {
    venues: data?.venues || [],
    total: data?.total || 0,
    isLoading,
    error,
    refresh: () => mutate(),
  };
}

export function useTonight(lat?: number | null, lng?: number | null, limit: number = 5) {
  const params = new URLSearchParams();

  if (lat && lng) {
    params.set('lat', lat.toString());
    params.set('lng', lng.toString());
  }
  params.set('limit', limit.toString());

  const url = `/api/tonight?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 300000, // 5 minutes
    dedupingInterval: 60000, // 1 minute
  });

  return {
    venues: data?.venues || [],
    dayOfWeek: data?.dayOfWeek,
    currentHour: data?.currentHour,
    timestamp: data?.timestamp,
    isLoading,
    error,
    refresh: () => mutate(),
  };
}

export function useTrending() {
  const { data, error, isLoading, mutate } = useSWR('/api/trending', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 3600000, // 1 hour
  });

  return {
    moversUp: data?.moversUp || [],
    moversDown: data?.moversDown || [],
    isLoading,
    error,
    refresh: () => mutate(),
  };
}

export function useRankings(period: string = 'monthly', month?: number) {
  const params = new URLSearchParams();
  params.set('period', period);
  if (month !== undefined) params.set('month', month.toString());

  const url = `/api/rankings?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 3600000, // 1 hour
  });

  return {
    rankings: data?.rankings || [],
    periodLabel: data?.periodLabel,
    totalVenues: data?.totalVenues || 0,
    isLoading,
    error,
    refresh: () => mutate(),
  };
}

export function useVenueDetails(slug: string) {
  const { data, error, isLoading } = useSWR(
    slug ? `/api/venues/${slug}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    venue: data?.venue,
    historicalRankings: data?.historicalRankings || [],
    ytdStats: data?.ytdStats,
    isLoading,
    error,
  };
}

export function useScoringMethodology() {
  const { data, error, isLoading } = useSWR('/api/scoring', fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });

  return {
    weights: data?.weights || [],
    categories: data?.categories || {},
    methodology: data?.methodology,
    isLoading,
    error,
  };
}
