# SATX Nightlife Power Rankings

A platform for ranking and discovering the best nightlife venues in San Antonio, Texas. This repository contains two implementations:

1. **Static UI/UX Prototype** (this branch) - Simple HTML/CSS/JS demo
2. **Full PWA Application** (main branch) - Next.js/TypeScript production app

---

## 🎨 Static Prototype (Current Branch)

A modern, responsive web application demonstrating the UI/UX design for the nightlife power rankings platform.

### Features

- **Power Rankings Dashboard**: View rankings of bars, clubs, lounges, and live music venues
- **Category Filtering**: Filter venues by type (Bars, Clubs, Lounges, Live Music)
- **Search Functionality**: Search venues by name, location, or category
- **Sorting Options**: Sort by rank, rating, or name
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop devices
- **Interactive UI**: Modern dark theme with smooth animations and transitions

### Quick Start

Simply open `index.html` in any modern web browser:

1. Navigate to the project directory
2. Double-click `index.html` or right-click and select "Open with Browser"
3. Alternatively, use a local server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (http-server)
   npx http-server
   ```
4. Open your browser to `http://localhost:8000`

### Project Structure (Prototype)

```
├── index.html          # Main HTML structure
├── styles.css          # CSS styling and responsive design
├── script.js           # JavaScript functionality and data
└── README.md          # Project documentation
```

### Technology Stack (Prototype)

- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with CSS Grid, Flexbox, and CSS Variables
- **JavaScript (Vanilla)**: Interactive functionality without dependencies
- **Responsive Design**: Mobile-first approach with media queries

### Customization

#### Adding New Venues

Edit the `venuesData` array in `script.js`:

```javascript
{
    id: 13,
    name: "New Venue Name",
    category: "bars", // or "clubs", "lounges", "live-music"
    location: "Street Address",
    rank: 13,
    rating: 4.5,
    vibe: 85,
    crowd: 88,
    music: 80,
    service: 87
}
```

#### Styling

Modify CSS variables in `styles.css` to customize colors:

```css
:root {
    --primary-color: #6200ea;
    --secondary-color: #03dac6;
    --accent-color: #ff6b35;
    --dark-bg: #121212;
}
```

---

## 🚀 Full PWA Application (Main Branch)

A mobile-first Progressive Web App (PWA) for transparent, data-driven nightlife rankings in San Antonio NW and Boerne.

### Features (Production App)

- **Tonight's Top Picks**: Geolocation-based recommendations with live scoring
- **Monthly Power Rankings**: Transparent rankings updated daily
- **Trending Movers**: See which venues are rising and falling
- **Year Timeline/YTD**: Track venue performance throughout the year
- **Transparent Scoring**: Fully documented scoring methodology with visible weights
- **Expert Picks**: Curated recommendations with transparent boost factors

### Expert-Picked Venues

- **George's Keep** - Award-winning craft cocktail bar (+15% boost)
- **Camp 1604** - Premier NW SA destination (+12% boost)
- **Kung Fu Noodle** - Unique late-night spot (+10% boost)
- **The Venue** - Top Boerne entertainment (+10% boost)

### Tech Stack (Production)

- **Frontend**: Next.js 14+ with TypeScript
- **Styling**: Tailwind CSS (mobile-first)
- **Data Fetching**: SWR with stale-while-revalidate caching
- **Database**: PostgreSQL with PostGIS extension
- **APIs**: Google Places API, Yelp Fusion API (ToS compliant)
- **PWA**: Service Worker, Web App Manifest, offline support

### Scoring Methodology

Our power score combines multiple factors with transparent weights:

| Factor | Weight | Description |
|--------|--------|-------------|
| Google Rating | 20% | Official Google Places rating |
| Yelp Rating | 15% | Official Yelp Fusion rating |
| Review Momentum | 5% | Recent review activity trend |
| Deals & Specials | 10% | Active happy hours and promotions |
| Events Tonight | 10% | Live events happening now |
| Social Buzz | 5% | Social media activity (where permitted) |
| Proximity | 10% | Distance from user location |
| Open Now | 5% | Currently open bonus |
| Expert Pick | 10% | Curated expert recommendations |
| Trending | 10% | Week-over-week momentum |

**Formula**: `Power Score = (Weighted Factor Sum) × Expert Boost Multiplier`

### Getting Started (Production)

#### Prerequisites

- Node.js 18+
- PostgreSQL with PostGIS extension
- Google Places API key
- Yelp Fusion API key

#### Installation

```bash
# Checkout main branch
git checkout main

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your API keys
```

#### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

#### Production Build

```bash
npm run build
npm start
```

### API Routes

| Endpoint | Description |
|----------|-------------|
| `GET /api/tonight` | Tonight's top picks with live scoring |
| `GET /api/venues` | All venues with optional filters |
| `GET /api/venues/[slug]` | Single venue details with YTD stats |
| `GET /api/rankings` | Monthly power rankings |
| `GET /api/trending` | Trending movers up/down |
| `GET /api/scoring` | Scoring methodology documentation |

### Coverage Area

San Antonio metro area with focus on:
- The Rim
- La Cantera
- Stone Oak
- The Pearl
- Boerne
- Dominion

### Data Sources

All data is collected via official APIs in compliance with Terms of Service:
- **Google Places API** - Ratings, reviews, business info
- **Yelp Fusion API** - Ratings, reviews, categories
- **Internal Database** - Curated deals, events, expert picks

**No web scraping or ToS violations.**

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT License
