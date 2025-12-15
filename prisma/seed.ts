import { PrismaClient } from '@prisma/client';
import { EXPERT_VENUES } from '../lib/scoring';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Expert venues with known information (San Antonio area)
  const expertVenuesData = [
    {
      name: "George's Keep",
      address: "13330 San Pedro Ave",
      city: "San Antonio",
      state: "TX",
      zipCode: "78216",
      latitude: 29.5817,
      longitude: -98.4761,
      category: ['bar', 'sports_bar'],
      phoneNumber: "(210) 222-1865",
      isExpertVenue: true,
      expertBoost: 1.5,
    },
    {
      name: "Camp 1604",
      address: "5890 W Loop 1604 N",
      city: "San Antonio",
      state: "TX",
      zipCode: "78253",
      latitude: 29.5892,
      longitude: -98.6945,
      category: ['bar', 'live_music'],
      isExpertVenue: true,
      expertBoost: 1.5,
    },
    {
      name: "Kung Fu Saloon",
      address: "4931 E Piedras Dr",
      city: "San Antonio",
      state: "TX",
      zipCode: "78228",
      latitude: 29.4894,
      longitude: -98.5854,
      category: ['bar', 'arcade'],
      isExpertVenue: true,
      expertBoost: 1.5,
    },
    {
      name: "The Venue",
      address: "15303 Huebner Rd",
      city: "San Antonio",
      state: "TX",
      zipCode: "78248",
      latitude: 29.5746,
      longitude: -98.6165,
      category: ['nightclub', 'bar'],
      isExpertVenue: true,
      expertBoost: 1.5,
    },
  ];

  // Create expert venues
  for (const venueData of expertVenuesData) {
    const venue = await prisma.venue.upsert({
      where: {
        id: venueData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      },
      update: {},
      create: {
        id: venueData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        ...venueData,
      },
    });
    console.log(`Created/Updated venue: ${venue.name}`);

    // Create sample ranking for current month
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    await prisma.ranking.upsert({
      where: {
        venueId_month: {
          venueId: venue.id,
          month: currentMonth,
        },
      },
      update: {},
      create: {
        venueId: venue.id,
        month: currentMonth,
        score: 85.0 + Math.random() * 10, // 85-95 score range for expert venues
        rank: 0, // Will be recalculated
        checkInCount: Math.floor(Math.random() * 500) + 100,
        reviewCount: Math.floor(Math.random() * 200) + 50,
        avgRating: 4.0 + Math.random() * 0.9,
        trendDirection: 'stable',
        trendChange: 0,
      },
    });

    // Create sample deals
    const deals = [
      {
        title: "Happy Hour Specials",
        description: "$2 off all draft beers and well drinks",
        dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        startTime: '17:00',
        endTime: '19:00',
      },
      {
        title: "Taco Tuesday",
        description: "$2 tacos and $3 margaritas all day",
        dayOfWeek: ['tuesday'],
      },
    ];

    for (const dealData of deals) {
      await prisma.deal.create({
        data: {
          venueId: venue.id,
          ...dealData,
        },
      });
    }
  }

  // Recalculate ranks
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const rankings = await prisma.ranking.findMany({
    where: { month: currentMonth },
    orderBy: { score: 'desc' },
  });

  for (let i = 0; i < rankings.length; i++) {
    await prisma.ranking.update({
      where: { id: rankings[i].id },
      data: { rank: i + 1 },
    });
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
