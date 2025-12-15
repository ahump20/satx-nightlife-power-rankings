import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBoundingBox } from '@/lib/geolocation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = parseFloat(searchParams.get('radius') || '10'); // miles

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Get bounding box for efficient query
    const bbox = getBoundingBox({ latitude, longitude }, radius);

    // Query venues within bounding box
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
          where: { isActive: true },
        },
        events: {
          where: {
            eventDate: {
              gte: new Date(),
            },
          },
          orderBy: { eventDate: 'asc' },
          take: 5,
        },
      },
    });

    // Calculate actual distances and filter
    const venuesWithDistance = venues
      .map((venue) => {
        const distance = calculateDistance(
          { latitude, longitude },
          { latitude: venue.latitude, longitude: venue.longitude }
        );
        return { ...venue, distance };
      })
      .filter((venue) => venue.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return NextResponse.json(venuesWithDistance);
  } catch (error) {
    console.error('Error fetching nearby venues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venues' },
      { status: 500 }
    );
  }
}

function calculateDistance(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
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
  return Math.round(R * c * 100) / 100;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
