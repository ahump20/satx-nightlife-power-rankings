/**
 * Geolocation utilities for finding nearby venues
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// San Antonio coordinates (default fallback)
export const SATX_CENTER: Coordinates = {
  latitude: 29.4241,
  longitude: -98.4936,
};

// NW San Antonio / Boerne area (focus area)
export const NW_SATX_CENTER: Coordinates = {
  latitude: 29.6797,
  longitude: -98.7281,
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
      Math.cos(toRad(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get user's current location using browser geolocation API
 */
export async function getCurrentLocation(): Promise<Coordinates | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Check if coordinates are within San Antonio metro area
 */
export function isInSATXMetro(coords: Coordinates): boolean {
  const distance = calculateDistance(coords, SATX_CENTER);
  return distance <= 50; // Within 50 miles of downtown SA
}

/**
 * Generate bounding box for database queries
 */
export function getBoundingBox(
  center: Coordinates,
  radiusMiles: number
): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  const latDegreePerMile = 1 / 69;
  const lngDegreePerMile = 1 / (69 * Math.cos(toRad(center.latitude)));

  return {
    minLat: center.latitude - radiusMiles * latDegreePerMile,
    maxLat: center.latitude + radiusMiles * latDegreePerMile,
    minLng: center.longitude - radiusMiles * lngDegreePerMile,
    maxLng: center.longitude + radiusMiles * lngDegreePerMile,
  };
}
