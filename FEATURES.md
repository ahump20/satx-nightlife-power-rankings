# Features Overview

## Core Features

### 🌙 Tonight Near You
Real-time discovery of top-rated nightlife venues near your current location.

**Key Features:**
- Geolocation-based venue discovery
- Real-time deals and events for tonight
- Expandable/collapsible view
- Manual refresh capability
- SWR caching for performance (5-minute cache with stale-while-revalidate)
- Distance calculation in miles
- Expert venue highlighting

**User Experience:**
- Collapsed state shows #1 venue with quick info
- Expanded state shows top 10 venues in grid layout
- Mobile-first responsive design
- Smooth animations and transitions

### 🏆 Monthly Power Rankings
Comprehensive ranking system for nightlife venues based on transparent scoring.

**Scoring Algorithm:**
- Check-ins (40%): Venue popularity and foot traffic
- Average Rating (30%): Quality of experience (0-5 scale)
- Review Count (20%): Social proof and engagement  
- Expert Boost (10%): Recognition for curated venues

**Features:**
- Top 20 venues displayed by default
- Visual rank badges (gold, silver, bronze)
- Trend indicators (↑ up, ↓ down, → stable, NEW)
- Venue details including address, score breakdown
- Active deals indicator
- Monthly historical data

**Expert Venues:**
- George's Keep
- Camp 1604
- Kung Fu Saloon
- The Venue

### 📈 Trending Movers
Track venues with the biggest ranking changes.

**Features:**
- Shows venues with most significant rank changes
- Separate filtering for upward/downward movers
- Visual trend arrows and change indicators
- Score progression display
- Expert venue badges

### 📅 Year Timeline
Historical view of rankings throughout the year.

**Features:**
- Month-by-month ranking snapshots
- Top 5 venues per month
- YTD summary statistics
- Future months shown as "Coming Soon"
- Quick navigation between months
- Trend visualization

### 📍 Geolocation
Smart location services for personalized experiences.

**Features:**
- Browser geolocation API integration
- Permission request handling
- Fallback to San Antonio center
- Distance calculations using Haversine formula
- Bounding box queries for efficiency
- San Antonio metro area detection (50-mile radius)

**Focus Areas:**
- Downtown San Antonio (29.4241°N, 98.4936°W)
- NW San Antonio / Boerne (29.6797°N, 98.7281°W)

### 💰 Deals Database
Internal tracking of venue deals and promotions.

**Features:**
- Day-of-week filtering
- Time-based deals (Happy Hour, etc.)
- Active/inactive status
- Multiple deals per venue
- Start/end date support

**Sample Deals:**
- Happy Hour specials
- Taco Tuesday promotions
- Weekend specials
- Event-specific deals

### 🎵 Events Calendar
Upcoming events at nightlife venues.

**Features:**
- Event date and time tracking
- Event descriptions and images
- Ticket URL integration
- Multiple events per venue
- Today's events highlighting

## Technical Features

### Progressive Web App (PWA)
Full PWA capabilities for native-like experience.

**Features:**
- Service worker for offline support
- App manifest for "Add to Home Screen"
- Push notification support (ready)
- Offline fallback pages
- App icons (192x192, 512x512)
- Theme color customization

### Performance Optimization
Built for speed and efficiency.

**Features:**
- SWR (Stale-While-Revalidate) caching
- Incremental Static Regeneration (ISR)
- Image optimization with Next.js Image
- Code splitting and lazy loading
- Edge function API routes
- Turbopack for faster builds

### Database & Geospatial
PostgreSQL with PostGIS for advanced geospatial queries.

**Features:**
- Efficient bounding box queries
- Distance calculations in database
- Indexed geospatial columns
- Relationship mapping (venues, rankings, deals, events)
- Transaction support via Prisma

### API Integrations
Official API integrations with no ToS violations.

**Google Places API:**
- Nearby search (8km radius)
- Place details retrieval
- Ratings and reviews
- Photos and business info
- No scraping, fully compliant

**Yelp Fusion API:**
- Business search
- Category filtering
- Ratings and review counts
- Business details
- Official OAuth authentication

### Mobile-First Design
Optimized for mobile devices first.

**Features:**
- Responsive grid layouts
- Touch-friendly UI elements
- Optimized for small screens
- Progressive enhancement
- Fast loading on 3G/4G

### Security & Privacy
Built with security best practices.

**Features:**
- No client-side secrets
- Environment variable management
- SQL injection prevention via Prisma
- HTTPS required in production
- CORS configuration
- Rate limiting ready

## Developer Features

### Type Safety
Full TypeScript implementation.

**Benefits:**
- Compile-time error detection
- IDE autocomplete
- Refactoring confidence
- Documentation through types

### Database Management
Comprehensive database tooling.

**Scripts:**
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Visual database editor
- `npm run db:seed` - Seed sample data
- `npm run db:sync` - Sync from external APIs

### Developer Experience
Modern tooling and workflows.

**Features:**
- Hot module replacement
- Fast refresh
- TypeScript error overlay
- ESLint integration ready
- Prettier support ready
- Git hooks ready

## Planned Features

### Phase 2 (Future)
- [ ] User accounts and authentication
- [ ] Personal check-in tracking
- [ ] Favorite venues
- [ ] Push notifications for deals
- [ ] Social sharing
- [ ] Venue reviews and ratings
- [ ] Photo uploads
- [ ] Advanced search and filters
- [ ] Map view integration
- [ ] AR venue discovery
- [ ] Loyalty program integration

### Phase 3 (Future)
- [ ] Admin dashboard
- [ ] Venue owner portal
- [ ] Analytics and insights
- [ ] A/B testing framework
- [ ] Multi-city support
- [ ] i18n (internationalization)
- [ ] Advanced ranking algorithms
- [ ] Machine learning recommendations
- [ ] Integration with ticket platforms
- [ ] Partnership with venues

## API Endpoints

### Venues
- `GET /api/venues/nearby` - Get venues near coordinates
  - Query params: `lat`, `lng`, `radius`
- `GET /api/venues/tonight` - Get top venues for tonight
  - Query params: `lat`, `lng`, `limit`

### Rankings
- `GET /api/rankings/monthly` - Get monthly rankings
  - Query params: `month`, `limit`
- `GET /api/rankings/trending` - Get trending venues
  - Query params: `limit`, `direction`

## Compliance & Terms

### API Usage
All data sourced through official APIs with proper authentication:
- Google Places API (Terms compliant)
- Yelp Fusion API (Terms compliant)
- No web scraping
- No ToS violations
- Rate limiting respected

### Data Privacy
- Minimal data collection
- No personal data without consent
- GDPR considerations
- User location only with permission
- No tracking without opt-in

### Licensing
- ISC License
- Open source friendly
- Commercial use allowed
- Attribution appreciated

---

**Built with ❤️ for the San Antonio nightlife community**
