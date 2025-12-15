# Deployment Guide

This guide covers deploying the SATX Nightlife Power Rankings PWA to production.

## Recommended Platform: Vercel

Vercel is the recommended platform as it's built by the Next.js team and provides:
- Automatic deployments from Git
- Edge functions for API routes
- Built-in SSL/HTTPS
- Global CDN
- Zero configuration needed

### Vercel Deployment Steps

#### 1. Prepare Your Database

You'll need a PostgreSQL database with PostGIS. Recommended providers:

**Option A: Neon (Recommended)**
- Serverless PostgreSQL with PostGIS support
- Free tier available
- Sign up at [neon.tech](https://neon.tech)
- Create a new project
- Copy the connection string

**Option B: Supabase**
- Open source Firebase alternative
- Includes PostGIS
- Sign up at [supabase.com](https://supabase.com)
- Create a new project
- Enable PostGIS: Run `CREATE EXTENSION IF NOT EXISTS postgis;` in SQL editor
- Copy the connection string (URI format)

**Option C: Railway**
- Simple PostgreSQL hosting
- Sign up at [railway.app](https://railway.app)
- Create PostgreSQL service
- Install PostGIS extension
- Copy the connection string

#### 2. Deploy to Vercel

1. **Sign up / Log in to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Your Repository**
   - Click "Add New" → "Project"
   - Import `satx-nightlife-power-rankings` repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   
   Add these in the Vercel project settings:

   ```env
   DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
   GOOGLE_PLACES_API_KEY=your_google_api_key
   YELP_API_KEY=your_yelp_api_key
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   EXPERT_VENUE_BOOST=1.5
   ```

   **Important:** Make sure your database URL includes `?sslmode=require` for secure connections.

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (2-3 minutes)
   - Your app will be live!

#### 3. Initialize Database

After deployment, you need to push the schema and seed data:

**Option A: Using Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Set up database (one-time)
vercel env pull .env.local
npm run db:push
npm run db:seed
```

**Option B: Using GitHub Actions**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Database

on:
  workflow_dispatch: # Manual trigger

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run db:push
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      - run: npm run db:seed
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

#### 4. Set Up Cron Jobs (Optional)

To automatically sync venue data and update rankings:

1. **Install Vercel Cron**
   
   Add to `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/sync",
       "schedule": "0 2 * * *"
     }]
   }
   ```

2. **Create Cron Endpoint**
   
   Create `app/api/cron/sync/route.ts`:
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { exec } from 'child_process';
   import { promisify } from 'util';

   const execAsync = promisify(exec);

   export async function GET(request: NextRequest) {
     // Verify cron secret
     const authHeader = request.headers.get('authorization');
     if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }

     try {
       await execAsync('npm run db:sync');
       return NextResponse.json({ success: true });
     } catch (error) {
       console.error('Sync failed:', error);
       return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
     }
   }
   ```

## Alternative Platforms

### Netlify

1. Sign in to [netlify.com](https://netlify.com)
2. Import your Git repository
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Add environment variables
5. Deploy

### DigitalOcean App Platform

1. Sign in to [digitalocean.com](https://digitalocean.com)
2. Create new app from GitHub repo
3. Configure build settings
4. Add PostgreSQL database
5. Deploy

### Self-Hosting (Docker)

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t satx-nightlife .
docker run -p 3000:3000 --env-file .env satx-nightlife
```

## Post-Deployment Checklist

- [ ] Database is accessible and PostGIS is enabled
- [ ] Environment variables are set correctly
- [ ] App loads and displays correctly
- [ ] API endpoints return data
- [ ] PWA manifest is accessible
- [ ] Service worker registers properly
- [ ] "Add to Home Screen" works on mobile
- [ ] Geolocation permission prompts work
- [ ] Google Places API quota is sufficient
- [ ] Yelp API quota is sufficient

## Monitoring and Maintenance

### Vercel Analytics

Enable in Vercel dashboard for:
- Page views
- Performance metrics
- Real user monitoring

### Database Monitoring

Monitor your database for:
- Connection count
- Query performance
- Storage usage

Set up alerts for:
- API rate limits
- Database connection errors
- Build failures

### Regular Maintenance

**Weekly:**
- Check API quota usage
- Review error logs
- Monitor performance

**Monthly:**
- Update dependencies: `npm update`
- Review and optimize database queries
- Analyze user feedback

**Quarterly:**
- Review scoring algorithm effectiveness
- Update expert venue list
- Audit and clean old data

## Troubleshooting

### Build Fails

Check logs for:
- Missing environment variables
- Database connection issues
- Dependency conflicts

### API Routes Return 500

- Verify DATABASE_URL is correct
- Check database is accessible from Vercel
- Enable `sslmode=require` in connection string

### PWA Not Installing

- Ensure HTTPS is enabled
- Check manifest.json is accessible
- Verify service worker registration

### Slow API Responses

- Add database indexes
- Enable connection pooling
- Use edge caching for rankings

## Security Best Practices

1. **Never commit secrets**
   - Use environment variables
   - Add `.env` to `.gitignore`

2. **Secure your database**
   - Use SSL connections
   - Restrict IP access if possible
   - Use strong passwords

3. **Rate limit API endpoints**
   - Implement rate limiting middleware
   - Monitor for abuse

4. **Keep dependencies updated**
   - Run `npm audit` regularly
   - Update packages with security fixes

## Support

For deployment issues:
- Check the [Vercel documentation](https://vercel.com/docs)
- Review [Next.js deployment docs](https://nextjs.org/docs/deployment)
- Open an issue on GitHub

Good luck with your deployment! 🚀
