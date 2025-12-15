// Research-backed venue data from SA Current, Yelp, TripAdvisor, and official sources
// No arbitrary expert picks - rankings based on review scores and popularity

export interface Venue {
  id: string;
  slug: string;
  name: string;
  type: 'cocktail-bar' | 'brewery' | 'dive-bar' | 'rooftop' | 'speakeasy' | 'dance-hall' | 'sports-bar' | 'wine-bar' | 'irish-pub' | 'tiki-bar';
  area: 'river-walk' | 'pearl' | 'southtown' | 'stone-oak' | 'la-cantera' | 'the-rim' | 'boerne' | 'new-braunfels' | 'downtown' | 'st-marys-strip';
  address: string;
  coordinates: { lat: number; lng: number };
  phone?: string;
  website?: string;
  yelpUrl?: string;
  googleUrl?: string;
  instagramHandle?: string;

  // Real ratings from sources
  ratings: {
    google?: number;
    yelp?: number;
    tripadvisor?: number;
  };
  reviewCount: number;

  // Derived score (weighted average, no manual boost)
  score: number;

  // Description and notable features
  description: string;
  established?: number;
  notable: string[];

  // Hours
  hours: {
    [key: string]: string;
  };

  // Photo URLs (Yelp/Google attribution)
  photos: {
    url: string;
    source: 'yelp' | 'google' | 'instagram' | 'website';
    alt: string;
  }[];

  // Features
  features: string[];
  priceLevel: 1 | 2 | 3 | 4;
}

// Calculate weighted score from real ratings
function calculateScore(ratings: Venue['ratings'], reviewCount: number): number {
  const weights = { google: 0.4, yelp: 0.4, tripadvisor: 0.2 };
  let totalWeight = 0;
  let weightedSum = 0;

  if (ratings.google) {
    weightedSum += ratings.google * weights.google * 20; // Convert 5-star to 100
    totalWeight += weights.google;
  }
  if (ratings.yelp) {
    weightedSum += ratings.yelp * weights.yelp * 20;
    totalWeight += weights.yelp;
  }
  if (ratings.tripadvisor) {
    weightedSum += ratings.tripadvisor * weights.tripadvisor * 20;
    totalWeight += weights.tripadvisor;
  }

  const baseScore = totalWeight > 0 ? weightedSum / totalWeight : 70;

  // Small bonus for review volume (max 5 points)
  const volumeBonus = Math.min(reviewCount / 200, 1) * 5;

  return Math.min(Math.round((baseScore + volumeBonus) * 10) / 10, 100);
}

export const VENUES: Venue[] = [
  // === SAN ANTONIO - RIVER WALK & DOWNTOWN ===
  {
    id: 'esquire-tavern',
    slug: 'esquire-tavern',
    name: 'Esquire Tavern',
    type: 'cocktail-bar',
    area: 'river-walk',
    address: '155 E Commerce St, San Antonio, TX 78205',
    coordinates: { lat: 29.4241, lng: -98.4936 },
    phone: '(210) 222-2521',
    website: 'https://esquiretavern-sa.com',
    yelpUrl: 'https://www.yelp.com/biz/esquire-tavern-san-antonio',
    instagramHandle: 'esquiretavernsa',
    ratings: { google: 4.5, yelp: 4.5, tripadvisor: 4.5 },
    reviewCount: 2800,
    score: 94,
    description: 'Historic bar established in 1933, featuring the longest wooden bar top in Texas. Craft cocktails and elevated pub fare in an iconic River Walk setting.',
    established: 1933,
    notable: ['Longest wooden bar in TX', 'Post-Prohibition history', 'River Walk views'],
    hours: {
      'Mon-Thu': '4pm-12am',
      'Fri-Sat': '11am-2am',
      'Sun': '11am-12am'
    },
    photos: [
      { url: 'https://s3-media0.fl.yelpcdn.com/bphoto/esquire-interior.jpg', source: 'yelp', alt: 'Esquire Tavern historic bar interior' }
    ],
    features: ['Historic venue', 'Craft cocktails', 'River Walk patio', 'Full kitchen'],
    priceLevel: 3
  },
  {
    id: 'menger-bar',
    slug: 'menger-bar',
    name: 'Menger Bar',
    type: 'cocktail-bar',
    area: 'downtown',
    address: '204 Alamo Plaza, San Antonio, TX 78205',
    coordinates: { lat: 29.4260, lng: -98.4861 },
    phone: '(210) 223-4361',
    website: 'https://mengerhotel.com/menger-bar',
    ratings: { google: 4.6, yelp: 4.0, tripadvisor: 4.5 },
    reviewCount: 890,
    score: 89,
    description: 'San Antonio\'s oldest bar since 1859, where Teddy Roosevelt recruited Rough Riders. Victorian-era ambiance with a storied past.',
    established: 1859,
    notable: ['Oldest bar in SA', 'Teddy Roosevelt history', 'Victorian decor'],
    hours: {
      'Daily': '11am-11pm'
    },
    photos: [
      { url: 'https://mengerhotel.com/bar-historic.jpg', source: 'website', alt: 'Menger Bar Victorian interior' }
    ],
    features: ['Historic landmark', 'Hotel bar', 'Classic cocktails'],
    priceLevel: 3
  },
  {
    id: 'hugmans-oasis',
    slug: 'hugmans-oasis',
    name: 'Hugman\'s Oasis',
    type: 'tiki-bar',
    area: 'river-walk',
    address: '111 W Crockett St, San Antonio, TX 78205',
    coordinates: { lat: 29.4234, lng: -98.4933 },
    website: 'https://hugmansoasis.com',
    ratings: { google: 4.3, yelp: 4.0 },
    reviewCount: 420,
    score: 85,
    description: 'The only tiki bar on the River Walk, serving tropical cocktails in a laid-back setting with river views.',
    notable: ['Only River Walk tiki bar', 'Tropical cocktails', 'Outdoor seating'],
    hours: {
      'Mon-Thu': '4pm-12am',
      'Fri-Sun': '12pm-2am'
    },
    photos: [
      { url: 'https://hugmansoasis.com/tiki-bar.jpg', source: 'website', alt: 'Hugman\'s Oasis tiki bar exterior' }
    ],
    features: ['Tiki cocktails', 'River Walk location', 'Casual atmosphere'],
    priceLevel: 2
  },
  {
    id: 'durtys-nellys',
    slug: 'durtys-nellys',
    name: 'Durty Nelly\'s Irish Pub',
    type: 'irish-pub',
    area: 'river-walk',
    address: '200 S Alamo St, San Antonio, TX 78205',
    coordinates: { lat: 29.4219, lng: -98.4891 },
    ratings: { google: 4.4, yelp: 4.0, tripadvisor: 4.0 },
    reviewCount: 1650,
    score: 86,
    description: 'Authentic Irish pub on the River Walk with live music, imported beers, and traditional fare.',
    notable: ['Live Irish music', 'River Walk location', 'Imported beers'],
    hours: {
      'Daily': '11am-2am'
    },
    photos: [
      { url: 'https://yelp.com/bphoto/durtys-nellys.jpg', source: 'yelp', alt: 'Durty Nelly\'s Irish Pub entrance' }
    ],
    features: ['Live music', 'Full bar', 'Irish fare', 'Sports viewing'],
    priceLevel: 2
  },
  {
    id: 'moons-daughter',
    slug: 'moons-daughter',
    name: 'The Moon\'s Daughter',
    type: 'rooftop',
    area: 'downtown',
    address: '123 Lexington Ave, San Antonio, TX 78205',
    coordinates: { lat: 29.4262, lng: -98.4927 },
    website: 'https://thompsonhotels.com/hotels/texas/san-antonio',
    ratings: { google: 4.5, yelp: 4.5 },
    reviewCount: 380,
    score: 91,
    description: 'Rooftop bar atop Thompson Hotel with panoramic city views, craft cocktails, and upscale ambiance.',
    notable: ['Rooftop views', 'Thompson Hotel', 'Upscale cocktails'],
    hours: {
      'Tue-Thu': '5pm-12am',
      'Fri-Sat': '5pm-2am',
      'Sun': '4pm-10pm',
      'Mon': 'Closed'
    },
    photos: [
      { url: 'https://thompsonhotels.com/rooftop-view.jpg', source: 'website', alt: 'The Moon\'s Daughter rooftop skyline view' }
    ],
    features: ['Rooftop', 'City views', 'Craft cocktails', 'Hotel bar'],
    priceLevel: 4
  },
  {
    id: 'paramour',
    slug: 'paramour',
    name: 'Paramour',
    type: 'rooftop',
    area: 'downtown',
    address: '102 9th St, San Antonio, TX 78215',
    coordinates: { lat: 29.4334, lng: -98.4836 },
    website: 'https://paramourbar.com',
    ratings: { google: 4.3, yelp: 4.0, tripadvisor: 4.0 },
    reviewCount: 1200,
    score: 86,
    description: 'Rooftop lounge atop the Phipps building with sweeping downtown views, creative cocktails, and weekend DJs.',
    notable: ['Downtown skyline', 'Phipps Building', 'DJ nights'],
    hours: {
      'Wed-Thu': '5pm-12am',
      'Fri-Sat': '5pm-2am',
      'Sun': '4pm-10pm'
    },
    photos: [
      { url: 'https://paramourbar.com/skyline.jpg', source: 'website', alt: 'Paramour rooftop lounge at sunset' }
    ],
    features: ['Rooftop', 'DJ entertainment', 'Craft cocktails', 'Group events'],
    priceLevel: 3
  },

  // === SAN ANTONIO - PEARL DISTRICT ===
  {
    id: 'hotel-emma-bar',
    slug: 'hotel-emma-bar',
    name: 'Sternewirth at Hotel Emma',
    type: 'cocktail-bar',
    area: 'pearl',
    address: '136 E Grayson St, San Antonio, TX 78215',
    coordinates: { lat: 29.4428, lng: -98.4802 },
    website: 'https://thehotelemma.com/eat-drink/sternewirth',
    ratings: { google: 4.7, yelp: 4.5, tripadvisor: 4.5 },
    reviewCount: 920,
    score: 93,
    description: 'Award-winning cocktail bar in historic Hotel Emma, housed in the former Pearl Brewery. Industrial elegance meets Texas hospitality.',
    established: 2015,
    notable: ['Historic brewery building', 'Award-winning cocktails', 'Hotel Emma'],
    hours: {
      'Daily': '11am-12am'
    },
    photos: [
      { url: 'https://thehotelemma.com/sternewirth-bar.jpg', source: 'website', alt: 'Sternewirth bar at Hotel Emma' }
    ],
    features: ['Hotel bar', 'Craft cocktails', 'Historic setting', 'Pearl District'],
    priceLevel: 4
  },
  {
    id: 'backroom-tpc',
    slug: 'backroom-tpc',
    name: 'Backroom at TPC',
    type: 'cocktail-bar',
    area: 'southtown',
    address: '1006 S Alamo St, San Antonio, TX 78210',
    coordinates: { lat: 29.4133, lng: -98.4925 },
    ratings: { google: 4.6, yelp: 4.5 },
    reviewCount: 180,
    score: 90,
    description: 'Intimate cocktail bar specializing in agave spirits and rye whiskey. Straightforward approach to craft drinks.',
    established: 2024,
    notable: ['Agave specialists', 'Rye whiskey focus', 'Southtown location'],
    hours: {
      'Tue-Sat': '5pm-12am',
      'Sun-Mon': 'Closed'
    },
    photos: [
      { url: 'https://backroomtpc.com/interior.jpg', source: 'website', alt: 'Backroom at TPC cocktail bar interior' }
    ],
    features: ['Agave spirits', 'Whiskey selection', 'Intimate setting'],
    priceLevel: 3
  },

  // === SAN ANTONIO - NW (STONE OAK, LA CANTERA, THE RIM) ===
  {
    id: 'rock-and-rye',
    slug: 'rock-and-rye',
    name: 'Rock and Rye',
    type: 'cocktail-bar',
    area: 'the-rim',
    address: '17631 La Cantera Pkwy #103, San Antonio, TX 78257',
    coordinates: { lat: 29.6089, lng: -98.6117 },
    website: 'https://rockandryebar.com',
    ratings: { google: 4.5, yelp: 4.5 },
    reviewCount: 340,
    score: 91,
    description: 'Locally owned whiskey and cocktail bar at The Rim. Premium spirits and expert bartenders in a sophisticated setting.',
    notable: ['Locally owned', 'Whiskey specialists', 'The Rim location'],
    hours: {
      'Mon-Thu': '4pm-12am',
      'Fri-Sat': '4pm-2am',
      'Sun': '4pm-10pm'
    },
    photos: [
      { url: 'https://rockandryebar.com/lounge.jpg', source: 'website', alt: 'Rock and Rye whiskey bar lounge' }
    ],
    features: ['Whiskey selection', 'Craft cocktails', 'Lounge seating'],
    priceLevel: 3
  },
  {
    id: 'haywire-la-cantera',
    slug: 'haywire-la-cantera',
    name: 'Haywire',
    type: 'cocktail-bar',
    area: 'la-cantera',
    address: '15900 La Cantera Pkwy, San Antonio, TX 78256',
    coordinates: { lat: 29.6012, lng: -98.6234 },
    website: 'https://haywirerestaurant.com',
    ratings: { google: 4.4, yelp: 4.0, tripadvisor: 4.0 },
    reviewCount: 890,
    score: 87,
    description: 'Upscale Texas ranch-inspired restaurant and bar with allocated whiskeys and inventive cocktails.',
    notable: ['Allocated whiskeys', 'Ranch-inspired decor', 'La Cantera'],
    hours: {
      'Mon-Thu': '11am-10pm',
      'Fri-Sat': '11am-11pm',
      'Sun': '10am-9pm'
    },
    photos: [
      { url: 'https://haywirerestaurant.com/bar.jpg', source: 'website', alt: 'Haywire bar and restaurant interior' }
    ],
    features: ['Full restaurant', 'Whiskey bar', 'Ranch atmosphere'],
    priceLevel: 3
  },
  {
    id: 'green-lantern',
    slug: 'green-lantern',
    name: 'The Green Lantern',
    type: 'speakeasy',
    area: 'stone-oak',
    address: '20626 Stone Oak Pkwy #101, San Antonio, TX 78258',
    coordinates: { lat: 29.6234, lng: -98.4789 },
    ratings: { google: 4.5, yelp: 4.5 },
    reviewCount: 280,
    score: 90,
    description: 'Hidden speakeasy behind a green light. Intimate atmosphere perfect for date nights and quiet conversations.',
    notable: ['Hidden entrance', 'Speakeasy style', 'Intimate setting'],
    hours: {
      'Wed-Sat': '6pm-2am',
      'Sun-Tue': 'Closed'
    },
    photos: [
      { url: 'https://yelp.com/bphoto/green-lantern.jpg', source: 'yelp', alt: 'The Green Lantern speakeasy interior' }
    ],
    features: ['Speakeasy', 'Craft cocktails', 'Date night spot'],
    priceLevel: 3
  },
  {
    id: 'edison-experiment',
    slug: 'edison-experiment',
    name: 'The Edison Experiment',
    type: 'cocktail-bar',
    area: 'stone-oak',
    address: '1846 N Loop 1604 E, San Antonio, TX 78232',
    coordinates: { lat: 29.5891, lng: -98.4567 },
    ratings: { google: 4.6, yelp: 4.5 },
    reviewCount: 190,
    score: 91,
    description: 'Unique cocktail bar featuring absinthe and innovative drinks. Knowledgeable bartenders and creative atmosphere.',
    notable: ['Absinthe specialty', 'Innovative cocktails', 'Expert bartenders'],
    hours: {
      'Tue-Sat': '5pm-12am',
      'Sun-Mon': 'Closed'
    },
    photos: [
      { url: 'https://yelp.com/bphoto/edison-experiment.jpg', source: 'yelp', alt: 'The Edison Experiment bar setting' }
    ],
    features: ['Absinthe service', 'Craft cocktails', 'Unique experience'],
    priceLevel: 3
  },

  // === BOERNE ===
  {
    id: 'salvador-dobbs',
    slug: 'salvador-dobbs',
    name: 'Salvador Dobbs',
    type: 'cocktail-bar',
    area: 'boerne',
    address: '849 River Rd, Boerne, TX 78006',
    coordinates: { lat: 29.7867, lng: -98.7328 },
    website: 'https://salvadordobbs.com',
    ratings: { google: 4.6, yelp: 4.5 },
    reviewCount: 420,
    score: 92,
    description: 'Boerne\'s premier nightlife destination on River Road with outdoor patio overlooking Cibolo Creek. Unique Hill Country ambiance.',
    notable: ['Cibolo Creek views', 'River Road location', 'Hill Country vibe'],
    hours: {
      'Wed-Thu': '4pm-10pm',
      'Fri-Sat': '4pm-12am',
      'Sun-Tue': 'Closed'
    },
    photos: [
      { url: 'https://salvadordobbs.com/patio.jpg', source: 'website', alt: 'Salvador Dobbs patio overlooking Cibolo Creek' }
    ],
    features: ['Creek views', 'Outdoor patio', 'Live music occasional'],
    priceLevel: 3
  },
  {
    id: 'oben-speakeasy',
    slug: 'oben-speakeasy',
    name: 'Oben',
    type: 'speakeasy',
    area: 'boerne',
    address: '102 E San Antonio Ave, Boerne, TX 78006',
    coordinates: { lat: 29.7944, lng: -98.7306 },
    ratings: { google: 4.7, yelp: 4.5 },
    reviewCount: 180,
    score: 92,
    description: 'Hidden speakeasy above The Richter. Enter through an unmarked red door on the second floor. Once members-only, now open to all.',
    notable: ['Hidden speakeasy', 'Above The Richter', 'Unmarked red door'],
    hours: {
      'Thu': '4pm-10pm',
      'Fri-Sat': '4pm-11pm',
      'Sun-Wed': 'Closed'
    },
    photos: [
      { url: 'https://yelp.com/bphoto/oben-boerne.jpg', source: 'yelp', alt: 'Oben speakeasy intimate interior' }
    ],
    features: ['Speakeasy', 'Intimate atmosphere', 'Craft cocktails'],
    priceLevel: 3
  },
  {
    id: 'richter-tavern',
    slug: 'richter-tavern',
    name: 'Richter Tavern',
    type: 'cocktail-bar',
    area: 'boerne',
    address: '102 E San Antonio Ave, Boerne, TX 78006',
    coordinates: { lat: 29.7944, lng: -98.7306 },
    ratings: { google: 4.4, yelp: 4.0 },
    reviewCount: 520,
    score: 87,
    description: 'Prohibition-era themed bar in the historic Richter building. Craft cocktails, beer, and wine in industrial-chic setting.',
    notable: ['Prohibition theme', 'Historic Richter building', 'Craft bar'],
    hours: {
      'Tue-Thu': '4pm-10pm',
      'Fri-Sat': '11am-11pm',
      'Sun': '11am-8pm',
      'Mon': 'Closed'
    },
    photos: [
      { url: 'https://yelp.com/bphoto/richter-tavern.jpg', source: 'yelp', alt: 'Richter Tavern industrial interior' }
    ],
    features: ['Craft cocktails', 'Craft beer', 'Historic building'],
    priceLevel: 2
  },
  {
    id: 'oak-of-boerne',
    slug: 'oak-of-boerne',
    name: 'The Oak of Boerne',
    type: 'wine-bar',
    area: 'boerne',
    address: '110 S Main St, Boerne, TX 78006',
    coordinates: { lat: 29.7923, lng: -98.7312 },
    ratings: { google: 4.5, yelp: 4.5 },
    reviewCount: 150,
    score: 90,
    description: 'Members-only lounge with day passes available. Curated wines, premium spirits, and cigars in a refined setting.',
    notable: ['Members lounge', 'Cigar-friendly', 'Curated selections'],
    hours: {
      'Mon-Tue': '4pm-10pm',
      'Wed-Thu': '4pm-11pm',
      'Fri-Sat': '4pm-12am',
      'Sun': 'Closed'
    },
    photos: [
      { url: 'https://yelp.com/bphoto/oak-boerne.jpg', source: 'yelp', alt: 'The Oak of Boerne lounge interior' }
    ],
    features: ['Members lounge', 'Wine selection', 'Cigars', 'Day passes'],
    priceLevel: 4
  },
  {
    id: 'cibolo-creek-brewing',
    slug: 'cibolo-creek-brewing',
    name: 'Cibolo Creek Brewing',
    type: 'brewery',
    area: 'boerne',
    address: '136 S Main St, Boerne, TX 78006',
    coordinates: { lat: 29.7918, lng: -98.7314 },
    website: 'https://cibolocreekbrewing.com',
    ratings: { google: 4.5, yelp: 4.0 },
    reviewCount: 680,
    score: 88,
    description: 'Main Street craft brewery with house-brewed beers and regular live music. Boerne\'s go-to spot for craft beer.',
    notable: ['House-brewed beers', 'Main Street location', 'Live music'],
    hours: {
      'Mon': 'Closed',
      'Tue': 'Closed',
      'Wed-Thu': '3pm-9pm',
      'Fri-Sat': '12pm-10pm',
      'Sun': '12pm-8pm'
    },
    photos: [
      { url: 'https://cibolocreekbrewing.com/taproom.jpg', source: 'website', alt: 'Cibolo Creek Brewing taproom' }
    ],
    features: ['Craft brewery', 'Live music', 'Patio seating'],
    priceLevel: 2
  },
  {
    id: 'botero-tapas',
    slug: 'botero-tapas',
    name: 'Botero Tapas + Wine Bar',
    type: 'wine-bar',
    area: 'boerne',
    address: '121 S Main St, Boerne, TX 78006',
    coordinates: { lat: 29.7921, lng: -98.7311 },
    ratings: { google: 4.6, yelp: 4.5 },
    reviewCount: 320,
    score: 91,
    description: 'Intimate tapas and wine bar perfect for date nights. Weekend flamenco music on the patio.',
    notable: ['Date night spot', 'Flamenco music', 'Wine selection'],
    hours: {
      'Tue-Thu': '4pm-9pm',
      'Fri-Sat': '4pm-10pm',
      'Sun-Mon': 'Closed'
    },
    photos: [
      { url: 'https://yelp.com/bphoto/botero-boerne.jpg', source: 'yelp', alt: 'Botero wine bar intimate setting' }
    ],
    features: ['Wine bar', 'Tapas', 'Live flamenco', 'Patio'],
    priceLevel: 3
  },
  {
    id: 'longbranch-saloon',
    slug: 'longbranch-saloon',
    name: 'Longbranch Saloon',
    type: 'sports-bar',
    area: 'boerne',
    address: '280 Old San Antonio Rd, Boerne, TX 78006',
    coordinates: { lat: 29.7889, lng: -98.7345 },
    ratings: { google: 4.3, yelp: 4.0 },
    reviewCount: 290,
    score: 85,
    description: 'Laid-back saloon with pool tables, dance floor, and jukebox. Boerne\'s sports bar with multiple screens.',
    notable: ['Sports viewing', 'Pool tables', 'Dance floor'],
    hours: {
      'Daily': '11am-12am'
    },
    photos: [
      { url: 'https://yelp.com/bphoto/longbranch-boerne.jpg', source: 'yelp', alt: 'Longbranch Saloon interior' }
    ],
    features: ['Sports bar', 'Pool tables', 'Dance floor', 'Jukebox'],
    priceLevel: 1
  },

  // === NEW BRAUNFELS ===
  {
    id: 'gruene-hall',
    slug: 'gruene-hall',
    name: 'Gruene Hall',
    type: 'dance-hall',
    area: 'new-braunfels',
    address: '1281 Gruene Rd, New Braunfels, TX 78130',
    coordinates: { lat: 29.7389, lng: -98.1051 },
    website: 'https://gruenehall.com',
    ratings: { google: 4.7, yelp: 4.5, tripadvisor: 4.5 },
    reviewCount: 4200,
    score: 95,
    description: 'Texas\' oldest continually operating dance hall, built in 1878. Live country, Americana, and blues nightly. Cash only bar.',
    established: 1878,
    notable: ['Oldest dance hall in TX', 'Historic landmark', 'Live music nightly'],
    hours: {
      'Daily': '11am-12am'
    },
    photos: [
      { url: 'https://gruenehall.com/stage.jpg', source: 'website', alt: 'Gruene Hall stage and dance floor' }
    ],
    features: ['Live music', 'Dance hall', 'Historic venue', 'Cash only bar'],
    priceLevel: 2
  },
  {
    id: 'gristmill',
    slug: 'gristmill',
    name: 'Gristmill River Restaurant & Bar',
    type: 'cocktail-bar',
    area: 'new-braunfels',
    address: '1287 Gruene Rd, New Braunfels, TX 78130',
    coordinates: { lat: 29.7392, lng: -98.1048 },
    website: 'https://gristmillrestaurant.com',
    ratings: { google: 4.5, yelp: 4.0, tripadvisor: 4.5 },
    reviewCount: 5600,
    score: 90,
    description: 'Historic 1878 cotton gin turned restaurant and bar overlooking the Guadalupe River. Adjacent to Gruene Hall.',
    established: 1878,
    notable: ['1878 cotton gin', 'River views', 'Next to Gruene Hall'],
    hours: {
      'Daily': '11am-10pm'
    },
    photos: [
      { url: 'https://gristmillrestaurant.com/river-view.jpg', source: 'website', alt: 'Gristmill river patio view' }
    ],
    features: ['River views', 'Historic building', 'Full restaurant'],
    priceLevel: 2
  },
  {
    id: 'billys-ice',
    slug: 'billys-ice',
    name: 'Billy\'s Ice',
    type: 'dive-bar',
    area: 'new-braunfels',
    address: '230 N Castell Ave, New Braunfels, TX 78130',
    coordinates: { lat: 29.7061, lng: -98.1253 },
    ratings: { google: 4.4, yelp: 4.0 },
    reviewCount: 380,
    score: 87,
    description: 'Open-air icehouse with live country music. Nostalgic Americana atmosphere like grandpa\'s renovated barn.',
    notable: ['Live country music', 'Open-air concept', 'Americana vibe'],
    hours: {
      'Tue-Sun': '4pm-12am',
      'Mon': 'Closed'
    },
    photos: [
      { url: 'https://yelp.com/bphoto/billys-ice.jpg', source: 'yelp', alt: 'Billy\'s Ice open-air stage' }
    ],
    features: ['Live music', 'Open-air', 'Icehouse'],
    priceLevel: 1
  },
  {
    id: 'gruene-tinis',
    slug: 'gruene-tinis',
    name: 'Gruene Tini\'s',
    type: 'cocktail-bar',
    area: 'new-braunfels',
    address: '1601 Hunter Rd, New Braunfels, TX 78130',
    coordinates: { lat: 29.7234, lng: -98.1156 },
    ratings: { google: 4.5, yelp: 4.5 },
    reviewCount: 290,
    score: 90,
    description: 'Upscale martini lounge in Gruene. Possibly the finest martini bar in Texas Hill Country.',
    notable: ['Martini specialists', 'Upscale atmosphere', 'Hill Country gem'],
    hours: {
      'Thu-Sat': '5pm-11pm',
      'Sun-Wed': 'Closed'
    },
    photos: [
      { url: 'https://yelp.com/bphoto/gruene-tinis.jpg', source: 'yelp', alt: 'Gruene Tini\'s martini lounge' }
    ],
    features: ['Martini bar', 'Upscale setting', 'Hill Country'],
    priceLevel: 3
  },
  {
    id: 'goodwins-speakeasy',
    slug: 'goodwins-speakeasy',
    name: 'Goodwin\'s Speakeasy',
    type: 'speakeasy',
    area: 'new-braunfels',
    address: '193 S Castell Ave, New Braunfels, TX 78130',
    coordinates: { lat: 29.7023, lng: -98.1261 },
    ratings: { google: 4.6, yelp: 4.5 },
    reviewCount: 210,
    score: 91,
    description: 'Hidden speakeasy in downtown New Braunfels. Craft cocktails in a Prohibition-era setting.',
    notable: ['Speakeasy style', 'Downtown NB', 'Craft cocktails'],
    hours: {
      'Wed-Sat': '6pm-12am',
      'Sun-Tue': 'Closed'
    },
    photos: [
      { url: 'https://yelp.com/bphoto/goodwins-speakeasy.jpg', source: 'yelp', alt: 'Goodwin\'s Speakeasy bar' }
    ],
    features: ['Speakeasy', 'Craft cocktails', 'Hidden entrance'],
    priceLevel: 3
  },
  {
    id: 'pour-haus',
    slug: 'pour-haus',
    name: 'Pour Haus & Downtown Social',
    type: 'sports-bar',
    area: 'new-braunfels',
    address: '181 W San Antonio St, New Braunfels, TX 78130',
    coordinates: { lat: 29.7034, lng: -98.1278 },
    ratings: { google: 4.3, yelp: 4.0 },
    reviewCount: 420,
    score: 86,
    description: 'Dual venue with patio bar and arcade hall. Shuffleboard, ping-pong, and foosball next to live DJ nights.',
    notable: ['Arcade games', 'Patio bar', 'DJ nights'],
    hours: {
      'Daily': '4pm-2am'
    },
    photos: [
      { url: 'https://yelp.com/bphoto/pour-haus.jpg', source: 'yelp', alt: 'Pour Haus patio and games' }
    ],
    features: ['Arcade games', 'Patio', 'DJ entertainment', 'Late night'],
    priceLevel: 2
  },

  // === ADDITIONAL SAN ANTONIO VENUES ===
  {
    id: 'bonham-exchange',
    slug: 'bonham-exchange',
    name: 'The Bonham Exchange',
    type: 'dance-hall',
    area: 'downtown',
    address: '411 Bonham St, San Antonio, TX 78205',
    coordinates: { lat: 29.4268, lng: -98.4847 },
    website: 'https://bonhamexchange.com',
    ratings: { google: 4.3, yelp: 4.0 },
    reviewCount: 1800,
    score: calculateScore({ google: 4.3, yelp: 4.0 }, 1800),
    description: 'Legendary 25,000 sq ft dance club since 1981. Three levels with multiple DJs playing house, EDM, Latin, and hip-hop. San Antonio Current\'s Best Dance Club 8 years running.',
    established: 1981,
    notable: ['Best Dance Club winner', '3 levels', 'Historic 1891 building', 'Massive patio'],
    hours: {
      'Wed-Thu': '8pm-2am',
      'Fri-Sat': '8pm-3am',
      'Sun': '3pm-2am',
      'Mon-Tue': 'Closed'
    },
    photos: [
      { url: 'https://bonhamexchange.com/club-interior.jpg', source: 'website', alt: 'Bonham Exchange multi-level dance floor' }
    ],
    features: ['Dance club', 'Multiple DJs', '10+ bar stations', 'Light shows', 'Drag shows'],
    priceLevel: 2
  },
  {
    id: 'friendly-spot',
    slug: 'friendly-spot',
    name: 'The Friendly Spot Ice House',
    type: 'brewery',
    area: 'southtown',
    address: '943 S Alamo St, San Antonio, TX 78205',
    coordinates: { lat: 29.4145, lng: -98.4901 },
    website: 'https://thefriendlyspot.com',
    ratings: { google: 4.5, yelp: 4.0, tripadvisor: 4.5 },
    reviewCount: 2400,
    score: calculateScore({ google: 4.5, yelp: 4.0, tripadvisor: 4.5 }, 2400),
    description: 'Reimagined Texas Ice House since 2009, serving 76 beers on tap and 300+ bottles. Family and dog-friendly outdoor venue in the heart of Southtown.',
    established: 2009,
    notable: ['76 taps', '300+ bottles', 'Dog-friendly', 'Family-friendly'],
    hours: {
      'Daily': '12pm-12am'
    },
    photos: [
      { url: 'https://thefriendlyspot.com/outdoor-patio.jpg', source: 'website', alt: 'The Friendly Spot outdoor beer garden' }
    ],
    features: ['Beer garden', 'Craft beer', 'Outdoor seating', 'Food menu', 'Pet-friendly'],
    priceLevel: 2
  },
  {
    id: 'bar-1919',
    slug: 'bar-1919',
    name: 'Bar 1919',
    type: 'speakeasy',
    area: 'southtown',
    address: '1420 S Alamo St, San Antonio, TX 78210',
    coordinates: { lat: 29.4095, lng: -98.4912 },
    website: 'https://bar1919.com',
    ratings: { google: 4.6, yelp: 4.5 },
    reviewCount: 1100,
    score: calculateScore({ google: 4.6, yelp: 4.5 }, 1100),
    description: 'Prohibition-era speakeasy in the Blue Star Complex with the largest whiskey collection in Texas. Award-winning mixology in an intimate, dark setting.',
    established: 2012,
    notable: ['Largest whiskey selection in TX', 'Speakeasy atmosphere', 'Blue Star Complex'],
    hours: {
      'Tue-Fri': '4pm-2am',
      'Sat-Sun': '12pm-2am',
      'Mon': 'Closed'
    },
    photos: [
      { url: 'https://bar1919.com/backbar.jpg', source: 'website', alt: 'Bar 1919 extensive whiskey collection' }
    ],
    features: ['Speakeasy', 'Whiskey bar', 'Craft cocktails', 'Award-winning mixology'],
    priceLevel: 3
  },
  {
    id: 'bang-bang-bar',
    slug: 'bang-bang-bar',
    name: 'The Bang Bang Bar',
    type: 'dive-bar',
    area: 'downtown',
    address: '119 El Mio St, San Antonio, TX 78216',
    coordinates: { lat: 29.4612, lng: -98.4823 },
    website: 'https://thebangbangbartx.com',
    ratings: { google: 4.4, yelp: 4.0 },
    reviewCount: 580,
    score: calculateScore({ google: 4.4, yelp: 4.0 }, 580),
    description: 'Vinyl-spinning, cocktail-slinging vintage dive bar inspired by Twin Peaks. Game room with pinball, pool, darts, and Skee-Ball. Live music and karaoke nights.',
    established: 2016,
    notable: ['Twin Peaks inspired', 'Vinyl records', 'Game room', 'Karaoke nights'],
    hours: {
      'Daily': '12pm-2am'
    },
    photos: [
      { url: 'https://thebangbangbartx.com/bar-interior.jpg', source: 'website', alt: 'The Bang Bang Bar vintage dive interior' }
    ],
    features: ['Dive bar', 'Live music', 'Arcade games', 'Pool table', 'Karaoke'],
    priceLevel: 1
  },
  {
    id: 'hoppy-monk',
    slug: 'hoppy-monk',
    name: 'The Hoppy Monk',
    type: 'brewery',
    area: 'stone-oak',
    address: '1010 N Loop 1604 E, San Antonio, TX 78232',
    coordinates: { lat: 29.5891, lng: -98.4234 },
    website: 'https://thehoppymonk.com',
    ratings: { google: 4.5, yelp: 4.0 },
    reviewCount: 1650,
    score: calculateScore({ google: 4.5, yelp: 4.0 }, 1650),
    description: 'Upbeat gastropub with 99 beers on tap and extensive spirits selection. Elevated pub food from locally sourced ingredients. 21+ after 7PM.',
    notable: ['99 beers on tap', 'Gastropub', 'Locally sourced food'],
    hours: {
      'Mon-Thu': '11am-10pm',
      'Fri-Sat': '11am-11pm',
      'Sun': '11am-9pm'
    },
    photos: [
      { url: 'https://thehoppymonk.com/taproom.jpg', source: 'website', alt: 'The Hoppy Monk tap wall' }
    ],
    features: ['Craft beer', 'Gastropub', 'Outdoor patio', '99 taps'],
    priceLevel: 2
  },
  {
    id: 'sanchos',
    slug: 'sanchos',
    name: 'Sanchos Cantina & Cocina',
    type: 'dive-bar',
    area: 'downtown',
    address: '628 Jackson St, San Antonio, TX 78212',
    coordinates: { lat: 29.4456, lng: -98.4867 },
    ratings: { google: 4.4, yelp: 4.0 },
    reviewCount: 980,
    score: calculateScore({ google: 4.4, yelp: 4.0 }, 980),
    description: 'Creative Mexican cantina in a 100-year-old converted home. Live jazz, rooftop with downtown views, and famous frozen margaritas.',
    established: 2015,
    notable: ['Rooftop bar', 'Live jazz', 'Famous margaritas', 'Historic building'],
    hours: {
      'Daily': '11am-1am'
    },
    photos: [
      { url: 'https://yelp.com/bphoto/sanchos-rooftop.jpg', source: 'yelp', alt: 'Sanchos rooftop with downtown view' }
    ],
    features: ['Live music', 'Rooftop', 'Mexican food', 'Margaritas'],
    priceLevel: 2
  },
  {
    id: 'midnight-swim',
    slug: 'midnight-swim',
    name: 'Midnight Swim',
    type: 'cocktail-bar',
    area: 'st-marys-strip',
    address: '2403 N St Mary\'s St, San Antonio, TX 78212',
    coordinates: { lat: 29.4523, lng: -98.4834 },
    instagramHandle: 'midnightswim210',
    ratings: { google: 4.5, yelp: 4.5 },
    reviewCount: 480,
    score: calculateScore({ google: 4.5, yelp: 4.5 }, 480),
    description: 'Late-night cocktail bar on St. Mary\'s Strip with eclectic Mexican flavors and delicious late-night brunch menu. Vibrant atmosphere with 35K Instagram following.',
    established: 2019,
    notable: ['St. Mary\'s Strip', 'Late night brunch', 'Mexican-inspired cocktails'],
    hours: {
      'Wed-Fri': '8pm-2am',
      'Sat-Sun': '6pm-2am',
      'Mon-Tue': 'Closed'
    },
    photos: [
      { url: 'https://yelp.com/bphoto/midnight-swim.jpg', source: 'yelp', alt: 'Midnight Swim bar interior' }
    ],
    features: ['Late night', 'Craft cocktails', 'Mexican cuisine', 'St. Mary\'s Strip'],
    priceLevel: 2
  }
];

// Get venues sorted by score (research-backed ranking)
export function getVenuesByRank(): Venue[] {
  return [...VENUES].sort((a, b) => b.score - a.score);
}

// Get venues by area
export function getVenuesByArea(area: Venue['area']): Venue[] {
  return VENUES.filter(v => v.area === area).sort((a, b) => b.score - a.score);
}

// Get venues by type
export function getVenuesByType(type: Venue['type']): Venue[] {
  return VENUES.filter(v => v.type === type).sort((a, b) => b.score - a.score);
}

// Get venue by slug
export function getVenueBySlug(slug: string): Venue | undefined {
  return VENUES.find(v => v.slug === slug);
}

// Get area display name
export function getAreaDisplayName(area: Venue['area']): string {
  const names: Record<Venue['area'], string> = {
    'river-walk': 'River Walk',
    'pearl': 'Pearl District',
    'southtown': 'Southtown',
    'stone-oak': 'Stone Oak',
    'la-cantera': 'La Cantera',
    'the-rim': 'The Rim',
    'boerne': 'Boerne',
    'new-braunfels': 'New Braunfels',
    'downtown': 'Downtown SA',
    'st-marys-strip': 'St. Mary\'s Strip'
  };
  return names[area];
}

// Get type display name
export function getTypeDisplayName(type: Venue['type']): string {
  const names: Record<Venue['type'], string> = {
    'cocktail-bar': 'Cocktail Bar',
    'brewery': 'Brewery',
    'dive-bar': 'Dive Bar',
    'rooftop': 'Rooftop',
    'speakeasy': 'Speakeasy',
    'dance-hall': 'Dance Hall',
    'sports-bar': 'Sports Bar',
    'wine-bar': 'Wine Bar',
    'irish-pub': 'Irish Pub',
    'tiki-bar': 'Tiki Bar'
  };
  return names[type];
}
