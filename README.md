# SATX Nightlife Power Rankings

A mobile-first Progressive Web App (PWA) for discovering and ranking nightlife venues in the San Antonio metropolitan area, with special focus on NW San Antonio and Boerne.

## Features

- 🌙 **Tonight Bar**: Real-time top venues near you with current deals and events (SWR cached)
- 🏆 **Monthly Power Rankings**: Transparent scoring system based on check-ins, ratings, and reviews
- 📈 **Trending Movers**: Track venues with the biggest rank changes
- 📍 **Geolocation**: Find venues near your current location
- 💰 **Deals Database**: Internal deals tracking for special offers
- 🎵 **Events Integration**: Upcoming events at venues
- ⭐ **Expert Boosts**: Special recognition for George's Keep, Camp 1604, Kung Fu Saloon, and The Venue
- 📱 **PWA**: Install as a mobile app for offline access

## Tech Stack

- **Frontend**: Next.js 16 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with PostGIS extension for geospatial queries
- **ORM**: Prisma
- **Data Fetching**: SWR (Stale-While-Revalidate) for caching
- **APIs**: Google Places API, Yelp Fusion API (official APIs only, no scraping)
- **PWA**: next-pwa for service worker and offline support

## Scoring Algorithm

The power ranking score is calculated using a transparent formula:

- **Check-ins (40%)**: Venue popularity and foot traffic
- **Average Rating (30%)**: Quality of experience (0-5 scale)
- **Review Count (20%)**: Social proof and engagement
- **Expert Boost (10%)**: Special recognition for expert-curated venues

Expert venues (George's Keep, Camp 1604, Kung Fu Saloon, The Venue) receive an additional boost factor to reflect local expertise.

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ with PostGIS extension
- Google Places API key
- Yelp Fusion API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ahump20/satx-nightlife-power-rankings.git
cd satx-nightlife-power-rankings
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/satx_nightlife?schema=public"
GOOGLE_PLACES_API_KEY="your_google_places_api_key"
YELP_API_KEY="your_yelp_api_key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EXPERT_VENUE_BOOST=1.5
```

4. Set up the database:

First, ensure PostgreSQL is running and PostGIS is installed:
```bash
# On Ubuntu/Debian
sudo apt-get install postgresql-14-postgis-3

# On macOS with Homebrew
brew install postgis
```

Then, enable PostGIS in your database:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

5. Generate Prisma client and push schema:
```bash
npm run db:generate
npm run db:push
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Seeding Data

To populate the database with initial venue data, you can create a seed script that:

1. Fetches venues from Google Places API and Yelp API in the San Antonio area
2. Marks expert venues (George's Keep, Camp 1604, Kung Fu Saloon, The Venue)
3. Creates initial rankings and sample deals

### Production Deployment

The app is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

For the database, consider using:
- [Neon](https://neon.tech/) - Serverless Postgres with PostGIS support
- [Supabase](https://supabase.com/) - Open source Firebase alternative with PostGIS
- [Railway](https://railway.app/) - Simple PostgreSQL hosting

## API Endpoints

### Venues

- `GET /api/venues/nearby?lat={lat}&lng={lng}&radius={miles}` - Get venues near coordinates
- `GET /api/venues/tonight?lat={lat}&lng={lng}&limit={num}` - Get top venues for tonight with deals/events

### Rankings

- `GET /api/rankings/monthly?month={YYYY-MM}&limit={num}` - Get monthly power rankings
- `GET /api/rankings/trending?limit={num}&direction={up|down}` - Get trending movers

## Data Sources

All data is sourced through official APIs with proper authentication:

- **Google Places API**: Venue information, ratings, reviews, photos
- **Yelp Fusion API**: Business details, ratings, categories
- **Internal Database**: Custom deals, events, check-ins

**No scraping or Terms of Service violations.**

## Development

### Database Management

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Building for Production

```bash
npm run build
npm start
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.
