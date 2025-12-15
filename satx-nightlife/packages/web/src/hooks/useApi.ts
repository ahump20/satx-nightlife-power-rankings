import useSWR, { SWRConfiguration } from 'swr';
import type { ApiResponse, Leaderboard, Venue, Deal } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  const data: ApiResponse<T> = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Request failed');
  }
  return data.data!;
}

// SWR options for stale-while-revalidate behavior
const swrOptions: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 30000, // 30 seconds
  errorRetryCount: 3,
};

export function useLeaderboard(
  type: 'tonight' | 'monthly' | 'trending' | 'year',
  lat?: number | null,
  lng?: number | null,
  radiusMiles?: number,
  expertMode?: boolean
) {
  const params = new URLSearchParams();
  if (lat !== null && lat !== undefined) params.set('lat', String(lat));
  if (lng !== null && lng !== undefined) params.set('lng', String(lng));
  if (radiusMiles) params.set('radius_miles', String(radiusMiles));
  if (expertMode) params.set('expert_mode', 'true');

  const url = `${API_BASE}/leaderboards/${type}?${params.toString()}`;

  return useSWR<Leaderboard>(lat && lng ? url : null, fetcher, {
    ...swrOptions,
    refreshInterval: type === 'tonight' ? 60000 : 300000, // 1 min for tonight, 5 min for others
  });
}

export function useVenue(id: string | undefined) {
  return useSWR<Venue>(id ? `${API_BASE}/venues/${id}` : null, fetcher, swrOptions);
}

export function useVenueSearch(query: string, lat?: number | null, lng?: number | null) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (lat !== null && lat !== undefined) params.set('lat', String(lat));
  if (lng !== null && lng !== undefined) params.set('lng', String(lng));

  const url = `${API_BASE}/venues/search?${params.toString()}`;

  return useSWR<Venue[]>(query.length >= 2 ? url : null, fetcher, {
    ...swrOptions,
    dedupingInterval: 5000,
  });
}

export function useDeals(
  lat?: number | null,
  lng?: number | null,
  radiusMiles?: number,
  dayOfWeek?: number
) {
  const params = new URLSearchParams();
  if (lat !== null && lat !== undefined) params.set('lat', String(lat));
  if (lng !== null && lng !== undefined) params.set('lng', String(lng));
  if (radiusMiles) params.set('radius_miles', String(radiusMiles));
  if (dayOfWeek !== undefined) params.set('day_of_week', String(dayOfWeek));

  const url = `${API_BASE}/deals?${params.toString()}`;

  return useSWR<Deal[]>(lat && lng ? url : null, fetcher, {
    ...swrOptions,
    refreshInterval: 300000, // 5 minutes
  });
}

// Manual fetch functions for mutations
export async function submitDeal(deal: Omit<Deal, 'id' | 'verified'>): Promise<Deal> {
  const response = await fetch(`${API_BASE}/deals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deal),
  });

  const data: ApiResponse<Deal> = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to submit deal');
  }
  return data.data!;
}
