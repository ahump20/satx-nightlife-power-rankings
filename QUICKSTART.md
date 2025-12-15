# Quick Start Guide

This guide will help you get the SATX Nightlife Power Rankings PWA running on your local machine in under 10 minutes.

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL 14+** - [Download here](https://www.postgresql.org/download/)
- **PostGIS Extension** - Required for geospatial queries
- **API Keys** (optional for basic testing):
  - Google Places API key - [Get one here](https://developers.google.com/maps/documentation/places/web-service/get-api-key)
  - Yelp Fusion API key - [Get one here](https://www.yelp.com/developers/v3/manage_app)

## Step-by-Step Setup

### 1. Clone and Install

```bash
git clone https://github.com/ahump20/satx-nightlife-power-rankings.git
cd satx-nightlife-power-rankings
npm install
```

### 2. Database Setup

#### Install PostgreSQL and PostGIS

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql-14 postgresql-14-postgis-3
```

**macOS (with Homebrew):**
```bash
brew install postgresql postgis
brew services start postgresql
```

**Windows:**
Download and install PostgreSQL with PostGIS from [here](https://www.postgresql.org/download/windows/)

#### Create Database

```bash
# Access PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE satx_nightlife;

# Connect to the database
\c satx_nightlife

# Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

# Exit
\q
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Database connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/satx_nightlife?schema=public"

# API Keys (optional - app will work without them but with limited data)
GOOGLE_PLACES_API_KEY="your_key_here"
YELP_API_KEY="your_key_here"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Expert venue boost multiplier
EXPERT_VENUE_BOOST=1.5
```

### 4. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. 🎉

## Optional: Sync Real Data

If you have API keys configured, you can sync real venue data:

```bash
npm run db:sync
```

This will:
- Fetch venues from Google Places API
- Fetch venues from Yelp Fusion API
- Calculate and update power rankings

## Testing the PWA

1. Open the app in Chrome/Edge
2. Open DevTools (F12)
3. Go to Application → Service Workers
4. You should see the service worker registered
5. Test "Add to Home Screen" functionality

## Common Issues

### PostgreSQL Connection Failed

Make sure PostgreSQL is running:
```bash
# Ubuntu/Debian
sudo systemctl status postgresql

# macOS
brew services list

# Start if not running
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS
```

### PostGIS Extension Not Found

Install PostGIS for your PostgreSQL version:
```bash
# Find your PostgreSQL version
psql --version

# Install matching PostGIS (example for PG 14)
sudo apt-get install postgresql-14-postgis-3
```

### Build Errors

Clear Next.js cache and rebuild:
```bash
rm -rf .next
npm run build
```

## Next Steps

- Add your own venues to the database
- Configure Google Places and Yelp API keys for real data
- Customize the scoring algorithm in `lib/scoring.ts`
- Deploy to Vercel for production

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio (DB GUI)
npm run db:seed      # Seed database with sample data
npm run db:sync      # Sync real data from APIs
```

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
- Open an issue on GitHub for bugs or questions

Happy coding! 🚀
