import { PrismaClient } from '@prisma/client';
import { searchNearbyPlaces, getPlaceDetails } from '../lib/google-places';
import { searchYelpBusinesses } from '../lib/yelp';
import { calculateVenueScore, EXPERT_VENUES } from '../lib/scoring';
import { NW_SATX_CENTER, SATX_CENTER } from '../lib/geolocation';

const prisma = new PrismaClient();

/**
 * Sync venues from external APIs (Google Places, Yelp)
 * This script fetches venue data from official APIs and updates the database
 */
async function syncVenues() {
  console.log('Starting venue sync from external APIs...');

  const searchAreas = [
    { name: 'Downtown San Antonio', ...SATX_CENTER },
    { name: 'NW San Antonio / Boerne', ...NW_SATX_CENTER },
  ];

  for (const area of searchAreas) {
    console.log(`\nSearching in ${area.name}...`);

    // Fetch from Google Places
    try {
      const googlePlaces = await searchNearbyPlaces(
        area.latitude,
        area.longitude,
        8000 // 8km radius
      );
      console.log(`Found ${googlePlaces.length} venues from Google Places`);

      for (const place of googlePlaces) {
        const isExpert = EXPERT_VENUES.some(name => 
          place.name.toLowerCase().includes(name.toLowerCase())
        );

        await prisma.venue.upsert({
          where: { googlePlaceId: place.placeId },
          update: {
            name: place.name,
            address: place.address,
            latitude: place.latitude,
            longitude: place.longitude,
            googlePlaceId: place.placeId,
            priceLevel: place.priceLevel,
            isExpertVenue: isExpert,
            expertBoost: isExpert ? 1.5 : 0,
            category: place.types || [],
          },
          create: {
            name: place.name,
            address: place.address,
            latitude: place.latitude,
            longitude: place.longitude,
            googlePlaceId: place.placeId,
            priceLevel: place.priceLevel,
            isExpertVenue: isExpert,
            expertBoost: isExpert ? 1.5 : 0,
            category: place.types || [],
          },
        });
      }
    } catch (error) {
      console.error('Error fetching from Google Places:', error);
    }

    // Fetch from Yelp
    try {
      const yelpBusinesses = await searchYelpBusinesses(
        area.latitude,
        area.longitude,
        8000
      );
      console.log(`Found ${yelpBusinesses.length} venues from Yelp`);

      for (const business of yelpBusinesses) {
        const isExpert = EXPERT_VENUES.some(name => 
          business.name.toLowerCase().includes(name.toLowerCase())
        );

        await prisma.venue.upsert({
          where: { yelpBusinessId: business.id },
          update: {
            name: business.name,
            address: business.address,
            city: business.city,
            state: business.state,
            zipCode: business.zipCode,
            latitude: business.latitude,
            longitude: business.longitude,
            yelpBusinessId: business.id,
            phoneNumber: business.phone,
            website: business.url,
            imageUrl: business.imageUrl,
            isExpertVenue: isExpert,
            expertBoost: isExpert ? 1.5 : 0,
            category: business.categories,
          },
          create: {
            name: business.name,
            address: business.address,
            city: business.city,
            state: business.state,
            zipCode: business.zipCode,
            latitude: business.latitude,
            longitude: business.longitude,
            yelpBusinessId: business.id,
            phoneNumber: business.phone,
            website: business.url,
            imageUrl: business.imageUrl,
            isExpertVenue: isExpert,
            expertBoost: isExpert ? 1.5 : 0,
            category: business.categories,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching from Yelp:', error);
    }
  }

  console.log('\nVenue sync completed!');
}

/**
 * Calculate and update rankings for current month
 */
async function updateRankings() {
  console.log('\nUpdating rankings...');

  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const venues = await prisma.venue.findMany();

  for (const venue of venues) {
    // Get aggregated data
    const checkInCount = await prisma.checkIn.count({
      where: {
        venueId: venue.id,
        checkInTime: {
          gte: currentMonth,
        },
      },
    });

    const reviews = await prisma.review.findMany({
      where: { venueId: venue.id },
    });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Calculate score
    const score = calculateVenueScore({
      checkInCount,
      avgRating,
      reviewCount: reviews.length,
      expertBoost: venue.expertBoost,
      isExpertVenue: venue.isExpertVenue,
    });

    // Get previous month's ranking
    const previousMonth = new Date(currentMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    
    const previousRanking = await prisma.ranking.findUnique({
      where: {
        venueId_month: {
          venueId: venue.id,
          month: previousMonth,
        },
      },
    });

    await prisma.ranking.upsert({
      where: {
        venueId_month: {
          venueId: venue.id,
          month: currentMonth,
        },
      },
      update: {
        score,
        checkInCount,
        reviewCount: reviews.length,
        avgRating,
      },
      create: {
        venueId: venue.id,
        month: currentMonth,
        score,
        rank: 0, // Will be calculated next
        checkInCount,
        reviewCount: reviews.length,
        avgRating,
        trendDirection: 'new',
        trendChange: 0,
      },
    });
  }

  // Calculate ranks and trends
  const rankings = await prisma.ranking.findMany({
    where: { month: currentMonth },
    orderBy: { score: 'desc' },
  });

  for (let i = 0; i < rankings.length; i++) {
    const previousMonth = new Date(currentMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    
    const previousRanking = await prisma.ranking.findUnique({
      where: {
        venueId_month: {
          venueId: rankings[i].venueId,
          month: previousMonth,
        },
      },
    });

    const newRank = i + 1;
    const previousRank = previousRanking?.rank;

    let trendDirection: 'up' | 'down' | 'stable' | 'new' = 'new';
    let trendChange = 0;

    if (previousRank !== null && previousRank !== undefined) {
      const change = previousRank - newRank;
      if (change > 0) {
        trendDirection = 'up';
        trendChange = change;
      } else if (change < 0) {
        trendDirection = 'down';
        trendChange = Math.abs(change);
      } else {
        trendDirection = 'stable';
        trendChange = 0;
      }
    }

    await prisma.ranking.update({
      where: { id: rankings[i].id },
      data: {
        rank: newRank,
        trendDirection,
        trendChange,
      },
    });
  }

  console.log(`Updated rankings for ${rankings.length} venues`);
}

async function main() {
  console.log('=== SATX Nightlife Data Sync ===\n');

  // Check for API keys
  if (!process.env.GOOGLE_PLACES_API_KEY && !process.env.YELP_API_KEY) {
    console.warn('WARNING: No API keys configured. Skipping external API sync.');
    console.log('Set GOOGLE_PLACES_API_KEY and/or YELP_API_KEY in .env to enable sync.\n');
  } else {
    await syncVenues();
  }

  await updateRankings();

  console.log('\n=== Sync Complete ===');
}

main()
  .catch((e) => {
    console.error('Error during sync:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
