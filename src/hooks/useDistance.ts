'use client';

import { useMemo } from 'react';
import type { Venue } from '@/lib/data/venues-research';

// Haversine formula for calculating distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Format distance for display
export function formatDistance(miles: number): string {
  if (miles < 0.1) {
    const feet = Math.round(miles * 5280);
    return `${feet} ft`;
  }
  if (miles < 10) {
    return `${miles.toFixed(1)} mi`;
  }
  return `${Math.round(miles)} mi`;
}

interface UseDistanceProps {
  userLat: number | null;
  userLng: number | null;
  venueLat: number;
  venueLng: number;
}

export function useDistance({
  userLat,
  userLng,
  venueLat,
  venueLng,
}: UseDistanceProps) {
  const distance = useMemo(() => {
    if (userLat === null || userLng === null) return null;
    return calculateDistance(userLat, userLng, venueLat, venueLng);
  }, [userLat, userLng, venueLat, venueLng]);

  const formattedDistance = useMemo(() => {
    if (distance === null) return null;
    return formatDistance(distance);
  }, [distance]);

  return {
    distance,
    formattedDistance,
    hasDistance: distance !== null,
  };
}

// Hook to sort venues by distance
export function useVenuesByDistance(
  venues: Venue[],
  userLat: number | null,
  userLng: number | null
) {
  return useMemo(() => {
    if (userLat === null || userLng === null) {
      return venues.map((venue) => ({
        venue,
        distance: null,
        formattedDistance: null,
      }));
    }

    return venues
      .map((venue) => {
        const distance = calculateDistance(
          userLat,
          userLng,
          venue.coordinates.lat,
          venue.coordinates.lng
        );
        return {
          venue,
          distance,
          formattedDistance: formatDistance(distance),
        };
      })
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }, [venues, userLat, userLng]);
}
