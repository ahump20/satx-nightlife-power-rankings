# Project Summary: SATX Nightlife Power Rankings

## Overview
A mobile-first Progressive Web App (PWA) for discovering and ranking nightlife venues in the San Antonio metropolitan area, with focus on NW San Antonio and Boerne.

## Technology Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Data Fetching**: SWR (Stale-While-Revalidate)
- **PWA**: next-pwa for service worker and offline support

### Backend
- **API Routes**: Next.js API Routes (Edge Functions)
- **Database**: PostgreSQL with PostGIS extension
- **ORM**: Prisma v6
- **External APIs**: Google Places API, Yelp Fusion API

### Deployment
- **Platform**: Vercel (recommended)
- **Alternatives**: Netlify, DigitalOcean, Docker

## Key Features Implemented

### 1. Tonight Near You (Mobile-First Feature)
- Real-time geolocation-based venue discovery
- Shows top venues with tonight's deals and events
- SWR caching with 5-minute refresh
- Expandable/collapsible UI
- Distance calculation in miles

### 2. Monthly Power Rankings
- Transparent scoring algorithm:
  - Check-ins: 40%
  - Ratings: 30%
  - Reviews: 20%
  - Expert Boost: 10%
- Top 20 venues displayed
- Trend indicators (↑↓→ NEW)
- Visual rank badges

### 3. Trending Movers
- Tracks biggest ranking changes
- Separate up/down filtering
- Visual trend indicators
- Score progression display

### 4. Year Timeline
- Month-by-month historical rankings
- YTD summary statistics
- Top 5 venues per month
- Future months placeholder

### 5. Expert Venue Recognition
Special boost for curated venues:
- George's Keep
- Camp 1604
- Kung Fu Saloon
- The Venue

### 6. Geolocation Services
- Browser geolocation API
- Haversine distance calculations
- Bounding box queries
- Focus areas: Downtown SA & NW SA/Boerne

### 7. PWA Capabilities
- Offline support via service worker
- "Add to Home Screen" functionality
- App manifest
- Custom icons (192x192, 512x512)
- Mobile-optimized

## Project Structure

```
satx-nightlife-power-rankings/
├── app/
│   ├── api/
│   │   ├── rankings/
│   │   │   ├── monthly/route.ts
│   │   │   └── trending/route.ts
│   │   └── venues/
│   │       ├── nearby/route.ts
│   │       └── tonight/route.ts
│   ├── timeline/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── LocationPrompt.tsx
│   ├── MonthlyRankings.tsx
│   ├── TonightBar.tsx
│   └── TrendingMovers.tsx
├── lib/
│   ├── geolocation.ts
│   ├── google-places.ts
│   ├── prisma.ts
│   ├── scoring.ts
│   └── yelp.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── sync.ts
├── public/
│   ├── manifest.json
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   └── robots.txt
├── CONTRIBUTING.md
├── DEPLOYMENT.md
├── FEATURES.md
├── QUICKSTART.md
├── README.md
└── package.json
```

## Database Schema

### Tables
1. **Venue** - Core venue information with geolocation
2. **Ranking** - Monthly power ranking snapshots
3. **Review** - Aggregated reviews from multiple sources
4. **Deal** - Deals and promotions database
5. **Event** - Upcoming events at venues
6. **CheckIn** - User check-in tracking

### Key Indexes
- Latitude/Longitude for geospatial queries
- Google Place ID (unique)
- Yelp Business ID (unique)
- Month for rankings
- Event dates

## API Endpoints

### Venues
- `GET /api/venues/nearby?lat={lat}&lng={lng}&radius={miles}`
- `GET /api/venues/tonight?lat={lat}&lng={lng}&limit={num}`

### Rankings
- `GET /api/rankings/monthly?month={YYYY-MM}&limit={num}`
- `GET /api/rankings/trending?limit={num}&direction={up|down}`

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio (GUI)
npm run db:seed      # Seed database with sample data
npm run db:sync      # Sync from external APIs
```

## Environment Variables

Required:
```env
DATABASE_URL="postgresql://..."
GOOGLE_PLACES_API_KEY="..."
YELP_API_KEY="..."
NEXT_PUBLIC_APP_URL="https://..."
EXPERT_VENUE_BOOST=1.5
```

## Compliance & Ethics

### Data Sources
- ✅ Google Places API (official, authenticated)
- ✅ Yelp Fusion API (official, authenticated)
- ✅ Internal deals database
- ❌ NO web scraping
- ❌ NO ToS violations

### Privacy
- Minimal data collection
- Location permission required
- No user tracking without consent
- GDPR considerations implemented

## Documentation

1. **README.md** - Main documentation
2. **QUICKSTART.md** - 10-minute setup guide
3. **DEPLOYMENT.md** - Production deployment guide
4. **FEATURES.md** - Detailed feature documentation
5. **CONTRIBUTING.md** - Contribution guidelines

## Performance

### Optimizations
- SWR caching (5-min with stale-while-revalidate)
- Edge functions for API routes
- Image optimization
- Code splitting
- Lazy loading
- PostGIS spatial indexes

### Metrics (Expected)
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Lighthouse Score: 90+
- Mobile-optimized: Yes

## Security

- No secrets in client code
- Environment variables for sensitive data
- SQL injection prevention via Prisma
- HTTPS required in production
- CORS configured
- Rate limiting ready

## Future Enhancements

### Phase 2
- User authentication
- Personal check-in tracking
- Favorite venues
- Push notifications
- Social sharing
- User reviews

### Phase 3
- Admin dashboard
- Venue owner portal
- Analytics
- Multi-city support
- ML recommendations
- A/B testing

## Build Status

✅ TypeScript compilation: Success
✅ Production build: Success
✅ All routes configured: Success
✅ PWA manifest: Valid
✅ Database schema: Complete

## Getting Started

See [QUICKSTART.md](QUICKSTART.md) for setup instructions.

## License

ISC License - Open source, commercial use allowed.

---

**Status**: Production Ready ✅
**Last Updated**: December 2024
**Maintained**: Yes
