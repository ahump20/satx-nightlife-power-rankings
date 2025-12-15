/**
 * SATX Nightlife Power Rankings API
 * Cloudflare Worker using Hono framework
 *
 * Endpoints:
 * - GET /api/venues - List venues with filters
 * - GET /api/venues/:slug - Get single venue by slug
 * - GET /api/rankings - Get venues sorted by score
 * - GET /api/areas - Get coverage areas with venue counts
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { cache } from 'hono/cache';

// =============================================================================
// TYPES
// =============================================================================

interface Env {
  CACHE?: KVNamespace;
  ENVIRONMENT?: string;
}

type VenueType =
  | 'cocktail-bar'
  | 'brewery'
  | 'dive-bar'
  | 'rooftop'
  | 'speakeasy'
  | 'dance-hall'
  | 'sports-bar'
  | 'wine-bar'
  | 'irish-pub'
  | 'tiki-bar';

type VenueArea =
  | 'river-walk'
  | 'pearl'
  | 'southtown'
  | 'stone-oak'
  | 'la-cantera'
  | 'the-rim'
  | 'boerne'
  | 'new-braunfels'
  | 'downtown';

interface Venue {
  id: string;
  slug: string;
  name: string;
  type: VenueType;
  area: VenueArea;
  address: string;
  coordinates: { lat: number; lng: number };
  phone?: string;
  website?: string;
  yelpUrl?: string;
  googleUrl?: string;
  instagramHandle?: string;
  ratings: {
    google?: number;
    yelp?: number;
    tripadvisor?: number;
  };
  reviewCount: number;
  score: number;
  description: string;
  established?: number;
  notable: string[];
  hours: Record<string, string>;
  photos: {
    url: string;
    source: 'yelp' | 'google' | 'instagram' | 'website';
    alt: string;
  }[];
  features: string[];
  priceLevel: 1 | 2 | 3 | 4;
}

interface AreaInfo {
  id: VenueArea;
  name: string;
  venueCount: number;
  topVenue?: string;
}

interface APIResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
    timestamp: string;
  };
}

interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// =============================================================================
// STATIC VENUE DATA
// =============================================================================

const VENUES: Venue[] = [
  // SAN ANTONIO - RIVER WALK & DOWNTOWN
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
    description:
      "Historic bar established in 1933, featuring the longest wooden bar top in Texas. Craft cocktails and elevated pub fare in an iconic River Walk setting.",
    established: 1933,
    notable: ['Longest wooden bar in TX', 'Post-Prohibition history', 'River Walk views'],
    hours: { 'Mon-Thu': '4pm-12am', 'Fri-Sat': '11am-2am', Sun: '11am-12am' },
    photos: [
      {
        url: 'https://s3-media0.fl.yelpcdn.com/bphoto/esquire-interior.jpg',
        source: 'yelp',
        alt: 'Esquire Tavern historic bar interior',
      },
    ],
    features: ['Historic venue', 'Craft cocktails', 'River Walk patio', 'Full kitchen'],
    priceLevel: 3,
  },
  {
    id: 'menger-bar',
    slug: 'menger-bar',
    name: 'Menger Bar',
    type: 'cocktail-bar',
    area: 'downtown',
    address: '204 Alamo Plaza, San Antonio, TX 78205',
    coordinates: { lat: 29.426, lng: -98.4861 },
    phone: '(210) 223-4361',
    website: 'https://mengerhotel.com/menger-bar',
    ratings: { google: 4.6, yelp: 4.0, tripadvisor: 4.5 },
    reviewCount: 890,
    score: 89,
    description:
      "San Antonio's oldest bar since 1859, where Teddy Roosevelt recruited Rough Riders. Victorian-era ambiance with a storied past.",
    established: 1859,
    notable: ['Oldest bar in SA', 'Teddy Roosevelt history', 'Victorian decor'],
    hours: { Daily: '11am-11pm' },
    photos: [
      {
        url: 'https://mengerhotel.com/bar-historic.jpg',
        source: 'website',
        alt: 'Menger Bar Victorian interior',
      },
    ],
    features: ['Historic landmark', 'Hotel bar', 'Classic cocktails'],
    priceLevel: 3,
  },
  {
    id: 'hugmans-oasis',
    slug: 'hugmans-oasis',
    name: "Hugman's Oasis",
    type: 'tiki-bar',
    area: 'river-walk',
    address: '111 W Crockett St, San Antonio, TX 78205',
    coordinates: { lat: 29.4234, lng: -98.4933 },
    website: 'https://hugmansoasis.com',
    ratings: { google: 4.3, yelp: 4.0 },
    reviewCount: 420,
    score: 85,
    description:
      'The only tiki bar on the River Walk, serving tropical cocktails in a laid-back setting with river views.',
    notable: ['Only River Walk tiki bar', 'Tropical cocktails', 'Outdoor seating'],
    hours: { 'Mon-Thu': '4pm-12am', 'Fri-Sun': '12pm-2am' },
    photos: [
      {
        url: 'https://hugmansoasis.com/tiki-bar.jpg',
        source: 'website',
        alt: "Hugman's Oasis tiki bar exterior",
      },
    ],
    features: ['Tiki cocktails', 'River Walk location', 'Casual atmosphere'],
    priceLevel: 2,
  },
  {
    id: 'durtys-nellys',
    slug: 'durtys-nellys',
    name: "Durty Nelly's Irish Pub",
    type: 'irish-pub',
    area: 'river-walk',
    address: '200 S Alamo St, San Antonio, TX 78205',
    coordinates: { lat: 29.4219, lng: -98.4891 },
    ratings: { google: 4.4, yelp: 4.0, tripadvisor: 4.0 },
    reviewCount: 1650,
    score: 86,
    description:
      'Authentic Irish pub on the River Walk with live music, imported beers, and traditional fare.',
    notable: ['Live Irish music', 'River Walk location', 'Imported beers'],
    hours: { Daily: '11am-2am' },
    photos: [
      {
        url: 'https://yelp.com/bphoto/durtys-nellys.jpg',
        source: 'yelp',
        alt: "Durty Nelly's Irish Pub entrance",
      },
    ],
    features: ['Live music', 'Full bar', 'Irish fare', 'Sports viewing'],
    priceLevel: 2,
  },
  {
    id: 'moons-daughter',
    slug: 'moons-daughter',
    name: "The Moon's Daughter",
    type: 'rooftop',
    area: 'downtown',
    address: '123 Lexington Ave, San Antonio, TX 78205',
    coordinates: { lat: 29.4262, lng: -98.4927 },
    website: 'https://thompsonhotels.com/hotels/texas/san-antonio',
    ratings: { google: 4.5, yelp: 4.5 },
    reviewCount: 380,
    score: 91,
    description:
      'Rooftop bar atop Thompson Hotel with panoramic city views, craft cocktails, and upscale ambiance.',
    notable: ['Rooftop views', 'Thompson Hotel', 'Upscale cocktails'],
    hours: { 'Tue-Thu': '5pm-12am', 'Fri-Sat': '5pm-2am', Sun: '4pm-10pm', Mon: 'Closed' },
    photos: [
      {
        url: 'https://thompsonhotels.com/rooftop-view.jpg',
        source: 'website',
        alt: "The Moon's Daughter rooftop skyline view",
      },
    ],
    features: ['Rooftop', 'City views', 'Craft cocktails', 'Hotel bar'],
    priceLevel: 4,
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
    description:
      'Rooftop lounge atop the Phipps building with sweeping downtown views, creative cocktails, and weekend DJs.',
    notable: ['Downtown skyline', 'Phipps Building', 'DJ nights'],
    hours: { 'Wed-Thu': '5pm-12am', 'Fri-Sat': '5pm-2am', Sun: '4pm-10pm' },
    photos: [
      {
        url: 'https://paramourbar.com/skyline.jpg',
        source: 'website',
        alt: 'Paramour rooftop lounge at sunset',
      },
    ],
    features: ['Rooftop', 'DJ entertainment', 'Craft cocktails', 'Group events'],
    priceLevel: 3,
  },
  // PEARL DISTRICT
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
    description:
      'Award-winning cocktail bar in historic Hotel Emma, housed in the former Pearl Brewery. Industrial elegance meets Texas hospitality.',
    established: 2015,
    notable: ['Historic brewery building', 'Award-winning cocktails', 'Hotel Emma'],
    hours: { Daily: '11am-12am' },
    photos: [
      {
        url: 'https://thehotelemma.com/sternewirth-bar.jpg',
        source: 'website',
        alt: 'Sternewirth bar at Hotel Emma',
      },
    ],
    features: ['Hotel bar', 'Craft cocktails', 'Historic setting', 'Pearl District'],
    priceLevel: 4,
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
    description:
      'Intimate cocktail bar specializing in agave spirits and rye whiskey. Straightforward approach to craft drinks.',
    established: 2024,
    notable: ['Agave specialists', 'Rye whiskey focus', 'Southtown location'],
    hours: { 'Tue-Sat': '5pm-12am', 'Sun-Mon': 'Closed' },
    photos: [
      {
        url: 'https://backroomtpc.com/interior.jpg',
        source: 'website',
        alt: 'Backroom at TPC cocktail bar interior',
      },
    ],
    features: ['Agave spirits', 'Whiskey selection', 'Intimate setting'],
    priceLevel: 3,
  },
  // NW SAN ANTONIO
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
    description:
      'Locally owned whiskey and cocktail bar at The Rim. Premium spirits and expert bartenders in a sophisticated setting.',
    notable: ['Locally owned', 'Whiskey specialists', 'The Rim location'],
    hours: { 'Mon-Thu': '4pm-12am', 'Fri-Sat': '4pm-2am', Sun: '4pm-10pm' },
    photos: [
      {
        url: 'https://rockandryebar.com/lounge.jpg',
        source: 'website',
        alt: 'Rock and Rye whiskey bar lounge',
      },
    ],
    features: ['Whiskey selection', 'Craft cocktails', 'Lounge seating'],
    priceLevel: 3,
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
    description:
      'Upscale Texas ranch-inspired restaurant and bar with allocated whiskeys and inventive cocktails.',
    notable: ['Allocated whiskeys', 'Ranch-inspired decor', 'La Cantera'],
    hours: { 'Mon-Thu': '11am-10pm', 'Fri-Sat': '11am-11pm', Sun: '10am-9pm' },
    photos: [
      {
        url: 'https://haywirerestaurant.com/bar.jpg',
        source: 'website',
        alt: 'Haywire bar and restaurant interior',
      },
    ],
    features: ['Full restaurant', 'Whiskey bar', 'Ranch atmosphere'],
    priceLevel: 3,
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
    description:
      'Hidden speakeasy behind a green light. Intimate atmosphere perfect for date nights and quiet conversations.',
    notable: ['Hidden entrance', 'Speakeasy style', 'Intimate setting'],
    hours: { 'Wed-Sat': '6pm-2am', 'Sun-Tue': 'Closed' },
    photos: [
      {
        url: 'https://yelp.com/bphoto/green-lantern.jpg',
        source: 'yelp',
        alt: 'The Green Lantern speakeasy interior',
      },
    ],
    features: ['Speakeasy', 'Craft cocktails', 'Date night spot'],
    priceLevel: 3,
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
    description:
      'Unique cocktail bar featuring absinthe and innovative drinks. Knowledgeable bartenders and creative atmosphere.',
    notable: ['Absinthe specialty', 'Innovative cocktails', 'Expert bartenders'],
    hours: { 'Tue-Sat': '5pm-12am', 'Sun-Mon': 'Closed' },
    photos: [
      {
        url: 'https://yelp.com/bphoto/edison-experiment.jpg',
        source: 'yelp',
        alt: 'The Edison Experiment bar setting',
      },
    ],
    features: ['Absinthe service', 'Craft cocktails', 'Unique experience'],
    priceLevel: 3,
  },
  // BOERNE
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
    description:
      "Boerne's premier nightlife destination on River Road with outdoor patio overlooking Cibolo Creek. Unique Hill Country ambiance.",
    notable: ['Cibolo Creek views', 'River Road location', 'Hill Country vibe'],
    hours: { 'Wed-Thu': '4pm-10pm', 'Fri-Sat': '4pm-12am', 'Sun-Tue': 'Closed' },
    photos: [
      {
        url: 'https://salvadordobbs.com/patio.jpg',
        source: 'website',
        alt: 'Salvador Dobbs patio overlooking Cibolo Creek',
      },
    ],
    features: ['Creek views', 'Outdoor patio', 'Live music occasional'],
    priceLevel: 3,
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
    description:
      'Hidden speakeasy above The Richter. Enter through an unmarked red door on the second floor. Once members-only, now open to all.',
    notable: ['Hidden speakeasy', 'Above The Richter', 'Unmarked red door'],
    hours: { Thu: '4pm-10pm', 'Fri-Sat': '4pm-11pm', 'Sun-Wed': 'Closed' },
    photos: [
      {
        url: 'https://yelp.com/bphoto/oben-boerne.jpg',
        source: 'yelp',
        alt: 'Oben speakeasy intimate interior',
      },
    ],
    features: ['Speakeasy', 'Intimate atmosphere', 'Craft cocktails'],
    priceLevel: 3,
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
    description:
      'Prohibition-era themed bar in the historic Richter building. Craft cocktails, beer, and wine in industrial-chic setting.',
    notable: ['Prohibition theme', 'Historic Richter building', 'Craft bar'],
    hours: {
      'Tue-Thu': '4pm-10pm',
      'Fri-Sat': '11am-11pm',
      Sun: '11am-8pm',
      Mon: 'Closed',
    },
    photos: [
      {
        url: 'https://yelp.com/bphoto/richter-tavern.jpg',
        source: 'yelp',
        alt: 'Richter Tavern industrial interior',
      },
    ],
    features: ['Craft cocktails', 'Craft beer', 'Historic building'],
    priceLevel: 2,
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
    description:
      'Members-only lounge with day passes available. Curated wines, premium spirits, and cigars in a refined setting.',
    notable: ['Members lounge', 'Cigar-friendly', 'Curated selections'],
    hours: {
      'Mon-Tue': '4pm-10pm',
      'Wed-Thu': '4pm-11pm',
      'Fri-Sat': '4pm-12am',
      Sun: 'Closed',
    },
    photos: [
      {
        url: 'https://yelp.com/bphoto/oak-boerne.jpg',
        source: 'yelp',
        alt: 'The Oak of Boerne lounge interior',
      },
    ],
    features: ['Members lounge', 'Wine selection', 'Cigars', 'Day passes'],
    priceLevel: 4,
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
    description:
      "Main Street craft brewery with house-brewed beers and regular live music. Boerne's go-to spot for craft beer.",
    notable: ['House-brewed beers', 'Main Street location', 'Live music'],
    hours: {
      Mon: 'Closed',
      Tue: 'Closed',
      'Wed-Thu': '3pm-9pm',
      'Fri-Sat': '12pm-10pm',
      Sun: '12pm-8pm',
    },
    photos: [
      {
        url: 'https://cibolocreekbrewing.com/taproom.jpg',
        source: 'website',
        alt: 'Cibolo Creek Brewing taproom',
      },
    ],
    features: ['Craft brewery', 'Live music', 'Patio seating'],
    priceLevel: 2,
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
    description:
      'Intimate tapas and wine bar perfect for date nights. Weekend flamenco music on the patio.',
    notable: ['Date night spot', 'Flamenco music', 'Wine selection'],
    hours: { 'Tue-Thu': '4pm-9pm', 'Fri-Sat': '4pm-10pm', 'Sun-Mon': 'Closed' },
    photos: [
      {
        url: 'https://yelp.com/bphoto/botero-boerne.jpg',
        source: 'yelp',
        alt: 'Botero wine bar intimate setting',
      },
    ],
    features: ['Wine bar', 'Tapas', 'Live flamenco', 'Patio'],
    priceLevel: 3,
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
    description:
      "Laid-back saloon with pool tables, dance floor, and jukebox. Boerne's sports bar with multiple screens.",
    notable: ['Sports viewing', 'Pool tables', 'Dance floor'],
    hours: { Daily: '11am-12am' },
    photos: [
      {
        url: 'https://yelp.com/bphoto/longbranch-boerne.jpg',
        source: 'yelp',
        alt: 'Longbranch Saloon interior',
      },
    ],
    features: ['Sports bar', 'Pool tables', 'Dance floor', 'Jukebox'],
    priceLevel: 1,
  },
  // NEW BRAUNFELS
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
    description:
      "Texas' oldest continually operating dance hall, built in 1878. Live country, Americana, and blues nightly. Cash only bar.",
    established: 1878,
    notable: ['Oldest dance hall in TX', 'Historic landmark', 'Live music nightly'],
    hours: { Daily: '11am-12am' },
    photos: [
      {
        url: 'https://gruenehall.com/stage.jpg',
        source: 'website',
        alt: 'Gruene Hall stage and dance floor',
      },
    ],
    features: ['Live music', 'Dance hall', 'Historic venue', 'Cash only bar'],
    priceLevel: 2,
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
    description:
      'Historic 1878 cotton gin turned restaurant and bar overlooking the Guadalupe River. Adjacent to Gruene Hall.',
    established: 1878,
    notable: ['1878 cotton gin', 'River views', 'Next to Gruene Hall'],
    hours: { Daily: '11am-10pm' },
    photos: [
      {
        url: 'https://gristmillrestaurant.com/river-view.jpg',
        source: 'website',
        alt: 'Gristmill river patio view',
      },
    ],
    features: ['River views', 'Historic building', 'Full restaurant'],
    priceLevel: 2,
  },
  {
    id: 'billys-ice',
    slug: 'billys-ice',
    name: "Billy's Ice",
    type: 'dive-bar',
    area: 'new-braunfels',
    address: '230 N Castell Ave, New Braunfels, TX 78130',
    coordinates: { lat: 29.7061, lng: -98.1253 },
    ratings: { google: 4.4, yelp: 4.0 },
    reviewCount: 380,
    score: 87,
    description:
      "Open-air icehouse with live country music. Nostalgic Americana atmosphere like grandpa's renovated barn.",
    notable: ['Live country music', 'Open-air concept', 'Americana vibe'],
    hours: { 'Tue-Sun': '4pm-12am', Mon: 'Closed' },
    photos: [
      {
        url: 'https://yelp.com/bphoto/billys-ice.jpg',
        source: 'yelp',
        alt: "Billy's Ice open-air stage",
      },
    ],
    features: ['Live music', 'Open-air', 'Icehouse'],
    priceLevel: 1,
  },
  {
    id: 'gruene-tinis',
    slug: 'gruene-tinis',
    name: "Gruene Tini's",
    type: 'cocktail-bar',
    area: 'new-braunfels',
    address: '1601 Hunter Rd, New Braunfels, TX 78130',
    coordinates: { lat: 29.7234, lng: -98.1156 },
    ratings: { google: 4.5, yelp: 4.5 },
    reviewCount: 290,
    score: 90,
    description:
      'Upscale martini lounge in Gruene. Possibly the finest martini bar in Texas Hill Country.',
    notable: ['Martini specialists', 'Upscale atmosphere', 'Hill Country gem'],
    hours: { 'Thu-Sat': '5pm-11pm', 'Sun-Wed': 'Closed' },
    photos: [
      {
        url: 'https://yelp.com/bphoto/gruene-tinis.jpg',
        source: 'yelp',
        alt: "Gruene Tini's martini lounge",
      },
    ],
    features: ['Martini bar', 'Upscale setting', 'Hill Country'],
    priceLevel: 3,
  },
  {
    id: 'goodwins-speakeasy',
    slug: 'goodwins-speakeasy',
    name: "Goodwin's Speakeasy",
    type: 'speakeasy',
    area: 'new-braunfels',
    address: '193 S Castell Ave, New Braunfels, TX 78130',
    coordinates: { lat: 29.7023, lng: -98.1261 },
    ratings: { google: 4.6, yelp: 4.5 },
    reviewCount: 210,
    score: 91,
    description:
      'Hidden speakeasy in downtown New Braunfels. Craft cocktails in a Prohibition-era setting.',
    notable: ['Speakeasy style', 'Downtown NB', 'Craft cocktails'],
    hours: { 'Wed-Sat': '6pm-12am', 'Sun-Tue': 'Closed' },
    photos: [
      {
        url: 'https://yelp.com/bphoto/goodwins-speakeasy.jpg',
        source: 'yelp',
        alt: "Goodwin's Speakeasy bar",
      },
    ],
    features: ['Speakeasy', 'Craft cocktails', 'Hidden entrance'],
    priceLevel: 3,
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
    description:
      'Dual venue with patio bar and arcade hall. Shuffleboard, ping-pong, and foosball next to live DJ nights.',
    notable: ['Arcade games', 'Patio bar', 'DJ nights'],
    hours: { Daily: '4pm-2am' },
    photos: [
      {
        url: 'https://yelp.com/bphoto/pour-haus.jpg',
        source: 'yelp',
        alt: 'Pour Haus patio and games',
      },
    ],
    features: ['Arcade games', 'Patio', 'DJ entertainment', 'Late night'],
    priceLevel: 2,
  },
];

// Area display names
const AREA_NAMES: Record<VenueArea, string> = {
  'river-walk': 'River Walk',
  pearl: 'Pearl District',
  southtown: 'Southtown',
  'stone-oak': 'Stone Oak',
  'la-cantera': 'La Cantera',
  'the-rim': 'The Rim',
  boerne: 'Boerne',
  'new-braunfels': 'New Braunfels',
  downtown: 'Downtown SA',
};

// Type display names
const TYPE_NAMES: Record<VenueType, string> = {
  'cocktail-bar': 'Cocktail Bar',
  brewery: 'Brewery',
  'dive-bar': 'Dive Bar',
  rooftop: 'Rooftop',
  speakeasy: 'Speakeasy',
  'dance-hall': 'Dance Hall',
  'sports-bar': 'Sports Bar',
  'wine-bar': 'Wine Bar',
  'irish-pub': 'Irish Pub',
  'tiki-bar': 'Tiki Bar',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function jsonResponse<T>(data: T, meta?: APIResponse<T>['meta']): Response {
  const response: APIResponse<T> = {
    success: true,
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
    },
  };
  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(code: string, message: string, status: number = 400): Response {
  const response: APIError = {
    success: false,
    error: { code, message },
  };
  return new Response(JSON.stringify(response), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// =============================================================================
// HONO APP
// =============================================================================

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use(
  '*',
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://satx-nightlife.pages.dev',
      'https://satxnightlife.app',
    ],
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    exposeHeaders: ['X-Cache-Status'],
    maxAge: 86400,
  })
);

// Cache middleware for GET requests (1 hour)
app.use(
  '/api/*',
  cache({
    cacheName: 'satx-nightlife-api',
    cacheControl: 'public, max-age=3600',
  })
);

// =============================================================================
// ROUTES
// =============================================================================

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    venueCount: VENUES.length,
  });
});

// API root
app.get('/', (c) => {
  return c.json({
    name: 'SATX Nightlife Power Rankings API',
    version: '1.0.0',
    endpoints: {
      venues: {
        list: 'GET /api/venues',
        single: 'GET /api/venues/:slug',
      },
      rankings: 'GET /api/rankings',
      areas: 'GET /api/areas',
    },
  });
});

/**
 * GET /api/venues
 * Returns all venues with optional filters
 * Query params: area, type, limit, sort (score|name|distance), lat, lng
 */
app.get('/api/venues', (c) => {
  const area = c.req.query('area') as VenueArea | undefined;
  const type = c.req.query('type') as VenueType | undefined;
  const limit = parseInt(c.req.query('limit') || '50', 10);
  const sort = c.req.query('sort') || 'score';
  const lat = parseFloat(c.req.query('lat') || '0');
  const lng = parseFloat(c.req.query('lng') || '0');

  let venues = [...VENUES];

  // Filter by area
  if (area && AREA_NAMES[area]) {
    venues = venues.filter((v) => v.area === area);
  }

  // Filter by type
  if (type && TYPE_NAMES[type]) {
    venues = venues.filter((v) => v.type === type);
  }

  // Sort
  switch (sort) {
    case 'name':
      venues.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'distance':
      if (lat && lng) {
        venues.sort((a, b) => {
          const distA = haversineDistance(lat, lng, a.coordinates.lat, a.coordinates.lng);
          const distB = haversineDistance(lat, lng, b.coordinates.lat, b.coordinates.lng);
          return distA - distB;
        });
      }
      break;
    case 'score':
    default:
      venues.sort((a, b) => b.score - a.score);
      break;
  }

  // Limit results
  const total = venues.length;
  venues = venues.slice(0, Math.min(limit, 100));

  return jsonResponse(venues, { total, limit });
});

/**
 * GET /api/venues/:slug
 * Returns single venue by slug
 */
app.get('/api/venues/:slug', (c) => {
  const slug = c.req.param('slug');
  const venue = VENUES.find((v) => v.slug === slug);

  if (!venue) {
    return errorResponse('VENUE_NOT_FOUND', `Venue with slug "${slug}" not found`, 404);
  }

  return jsonResponse(venue);
});

/**
 * GET /api/rankings
 * Returns venues sorted by score (power rankings)
 * Query params: limit (default 10), area
 */
app.get('/api/rankings', (c) => {
  const limit = parseInt(c.req.query('limit') || '10', 10);
  const area = c.req.query('area') as VenueArea | undefined;

  let venues = [...VENUES];

  // Filter by area if provided
  if (area && AREA_NAMES[area]) {
    venues = venues.filter((v) => v.area === area);
  }

  // Sort by score descending
  venues.sort((a, b) => b.score - a.score);

  // Add rank to each venue
  const ranked = venues.slice(0, Math.min(limit, 50)).map((venue, index) => ({
    rank: index + 1,
    ...venue,
  }));

  return jsonResponse(ranked, { total: venues.length, limit });
});

/**
 * GET /api/areas
 * Returns list of coverage areas with venue counts
 */
app.get('/api/areas', (c) => {
  const areas: AreaInfo[] = Object.entries(AREA_NAMES).map(([id, name]) => {
    const areaVenues = VENUES.filter((v) => v.area === id);
    const topVenue = areaVenues.sort((a, b) => b.score - a.score)[0];

    return {
      id: id as VenueArea,
      name,
      venueCount: areaVenues.length,
      topVenue: topVenue?.name,
    };
  });

  // Sort by venue count descending
  areas.sort((a, b) => b.venueCount - a.venueCount);

  return jsonResponse(areas);
});

// 404 handler
app.notFound((c) => {
  return errorResponse(
    'NOT_FOUND',
    `Route ${c.req.method} ${c.req.path} not found`,
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error('[API Error]', err);
  return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
});

// =============================================================================
// EXPORT
// =============================================================================

export default app;
