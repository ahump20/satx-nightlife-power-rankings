/**
 * Geographic Utilities
 * Distance calculations and bounding box helpers
 */

const EARTH_RADIUS_MILES = 3959;

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in miles
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_MILES * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Calculate bounding box for a center point and radius
 */
export function getBoundingBox(
  lat: number,
  lng: number,
  radiusMiles: number
): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  const latDelta = radiusMiles / 69; // Approximate miles per degree of latitude
  const lngDelta = radiusMiles / (69 * Math.cos(toRad(lat)));

  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east: lng + lngDelta,
    west: lng - lngDelta,
  };
}

/**
 * Check if a point is within a bounding box
 */
export function isInBoundingBox(
  lat: number,
  lng: number,
  box: { north: number; south: number; east: number; west: number }
): boolean {
  return lat >= box.south && lat <= box.north && lng >= box.west && lng <= box.east;
}

/**
 * Convert miles to meters
 */
export function milesToMeters(miles: number): number {
  return miles * 1609.34;
}

/**
 * Convert meters to miles
 */
export function metersToMiles(meters: number): number {
  return meters / 1609.34;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Get center point of San Antonio NW / La Cantera area
 * Used as default when user location is unavailable
 */
export const DEFAULT_CENTER = {
  lat: 29.5964,
  lng: -98.6183,
};

/**
 * Check if coordinates are within the SATX metro area
 */
export function isInSATXMetro(lat: number, lng: number): boolean {
  // Approximate bounds for San Antonio metro + Boerne
  const metroBounds = {
    north: 30.0,
    south: 29.2,
    east: -98.2,
    west: -99.0,
  };

  return isInBoundingBox(lat, lng, metroBounds);
}

/**
 * Format distance for display
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) {
    return 'nearby';
  }
  if (miles < 1) {
    return `${Math.round(miles * 5280)} ft`;
  }
  return `${miles.toFixed(1)} mi`;
}
