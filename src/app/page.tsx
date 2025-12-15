import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Trophy, MapPin, TrendingUp, Star } from 'lucide-react';
import { VenueCard } from '@/components/ui/VenueCard';
import { getVenuesByRank, getVenuesByArea, VENUES } from '@/lib/data/venues-research';

// Coverage areas with real data
const coverageAreas = [
  {
    name: 'River Walk',
    slug: 'river-walk',
    description: 'Downtown nightlife hub',
    image: '/images/riverwalk-night.jpg',
    venueCount: VENUES.filter((v) => v.area === 'river-walk').length,
  },
  {
    name: 'Pearl District',
    slug: 'pearl',
    description: 'Upscale dining & craft cocktails',
    image: '/images/pearl-district.jpg',
    venueCount: VENUES.filter((v) => v.area === 'pearl' || v.area === 'southtown').length,
  },
  {
    name: 'The Rim / La Cantera',
    slug: 'the-rim',
    description: 'NW SA entertainment district',
    image: '/images/bar-interior.jpg',
    venueCount: VENUES.filter((v) => ['the-rim', 'la-cantera', 'stone-oak'].includes(v.area)).length,
  },
  {
    name: 'Boerne',
    slug: 'boerne',
    description: 'Hill Country charm',
    image: '/images/texas-hill-country.jpg',
    venueCount: VENUES.filter((v) => v.area === 'boerne').length,
  },
  {
    name: 'New Braunfels',
    slug: 'new-braunfels',
    description: 'Gruene Hall & beyond',
    image: '/images/downtown-night.jpg',
    venueCount: VENUES.filter((v) => v.area === 'new-braunfels').length,
  },
];

export default function Home() {
  const topVenues = getVenuesByRank().slice(0, 5);
  const riverWalkVenues = getVenuesByArea('river-walk').slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] flex items-end">
        <Image
          src="/images/san-antonio-skyline.jpg"
          alt="San Antonio skyline at night"
          fill
          priority
          className="object-cover"
        />
        <div className="gradient-overlay" />
        <div className="relative z-10 container pb-12">
          <p className="text-copper text-sm font-mono tracking-wider mb-3">
            SAN ANTONIO &middot; BOERNE &middot; NEW BRAUNFELS
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-ivory leading-tight">
            Find Your
            <br />
            Next Spot
          </h1>
          <p className="text-cream/80 mt-4 max-w-md text-lg">
            Research-backed rankings from real ratings. No bias, no paid placements.
          </p>
          <div className="flex gap-3 mt-6">
            <Link
              href="/rankings"
              className="btn btn-primary"
            >
              View Rankings
            </Link>
            <Link
              href="/trending"
              className="btn btn-secondary"
            >
              Near Me
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="container py-6">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/rankings"
            className="card p-4 flex items-center justify-between hover:border-copper/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-copper/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-copper" />
              </div>
              <div>
                <h3 className="font-semibold text-ivory">Rankings</h3>
                <p className="text-xs text-muted">Top venues</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted" />
          </Link>

          <Link
            href="/trending"
            className="card p-4 flex items-center justify-between hover:border-copper/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-live/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-live" />
              </div>
              <div>
                <h3 className="font-semibold text-ivory">Near Me</h3>
                <p className="text-xs text-muted">By distance</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted" />
          </Link>
        </div>
      </section>

      {/* Top 5 This Month */}
      <section className="container py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-ivory">
            Top Ranked
          </h2>
          <Link
            href="/rankings"
            className="text-sm text-copper flex items-center gap-1 hover:text-amber"
          >
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {topVenues.map((venue, index) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              rank={index + 1}
              variant="compact"
            />
          ))}
        </div>
      </section>

      {/* Coverage Areas */}
      <section className="py-6">
        <div className="container mb-4">
          <h2 className="font-display text-xl font-semibold text-ivory">
            Explore Areas
          </h2>
          <p className="text-sm text-muted mt-1">
            San Antonio metro, Hill Country & beyond
          </p>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 px-4 pb-2" style={{ width: 'max-content' }}>
            {coverageAreas.map((area) => (
              <Link
                key={area.slug}
                href={`/rankings?area=${area.slug}`}
                className="card relative w-44 flex-shrink-0 overflow-hidden group"
              >
                <div className="aspect-[4/3] relative">
                  <Image
                    src={area.image}
                    alt={`${area.name} nightlife`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="gradient-overlay-light" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-semibold text-ivory text-sm">{area.name}</h3>
                  <p className="text-xs text-muted">{area.venueCount} venues</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Area - River Walk */}
      <section className="container py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-ivory">
              River Walk Picks
            </h2>
            <p className="text-sm text-muted">Downtown San Antonio</p>
          </div>
          <Link
            href="/rankings?area=river-walk"
            className="text-sm text-copper flex items-center gap-1 hover:text-amber"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {riverWalkVenues.map((venue, index) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              rank={index + 1}
            />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-8">
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold text-ivory mb-4">
            How Rankings Work
          </h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-copper/20 flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-copper" />
              </div>
              <div>
                <h3 className="font-medium text-ivory text-sm">Real Ratings</h3>
                <p className="text-xs text-muted">
                  Weighted average from Google, Yelp & TripAdvisor
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-copper/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-copper" />
              </div>
              <div>
                <h3 className="font-medium text-ivory text-sm">No Bias</h3>
                <p className="text-xs text-muted">
                  No paid placements. Rankings based on data only.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-copper/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-copper" />
              </div>
              <div>
                <h3 className="font-medium text-ivory text-sm">Local Focus</h3>
                <p className="text-xs text-muted">
                  SA, Boerne & New Braunfels. Hill Country roots.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
