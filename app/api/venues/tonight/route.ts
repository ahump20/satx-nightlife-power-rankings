import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBoundingBox } from '@/lib/geolocation';

/**
 * "Tonight" endpoint - shows top venues near user with current deals/events
 * Uses SWR pattern for caching
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = parseFloat(searchParams.get('radius') || '15'); // miles
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Get bounding box
    const bbox = getBoundingBox({ latitude, longitude }, radius);

    // Query venues with today's deals and events
    const venues = await prisma.venue.findMany({
      where: {
        latitude: {
          gte: bbox.minLat,
          lte: bbox.maxLat,
        },
        longitude: {
          gte: bbox.minLng,
          lte: bbox.maxLng,
        },
      },
      include: {
        rankings: {
          orderBy: { month: 'desc' },
          take: 1,
        },
        deals: {
          where: {
            isActive: true,
            dayOfWeek: {
              has: dayOfWeek,
            },
          },
        },
        events: {
          where: {
            eventDate: {
              gte: new Date(now.setHours(0, 0, 0, 0)),
              lt: new Date(now.setHours(23, 59, 59, 999)),
            },
          },
        },
      },
    });

    // Calculate distances and sort by ranking score
    const tonightVenues = venues
      .map((venue) => {
        const distance = calculateDistance(
          { latitude, longitude },
          { latitude: venue.latitude, longitude: venue.longitude }
        );
        const score = venue.rankings[0]?.score || 0;
        return {
          ...venue,
          distance,
          hasDealsTonight: venue.deals.length > 0,
          hasEventsTonight: venue.events.length > 0,
        };
      })
      .filter((venue) => venue.distance <= radius)
      .sort((a, b) => {
        // Prioritize venues with deals/events, then by score
        if (a.hasDealsTonight !== b.hasDealsTonight) {
          return a.hasDealsTonight ? -1 : 1;
        }
        if (a.hasEventsTonight !== b.hasEventsTonight) {
          return a.hasEventsTonight ? -1 : 1;
        }
        return (b.rankings[0]?.score || 0) - (a.rankings[0]?.score || 0);
      })
      .slice(0, limit);

    // Set cache headers for SWR
    return NextResponse.json(tonightVenues, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching tonight venues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tonight venues' },
      { status: 500 }
    );
  }
}

function calculateDistance(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number {
  const R = 3959;
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
      Math.cos(toRad(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
