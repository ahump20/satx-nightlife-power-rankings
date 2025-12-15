'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Trophy, MapPin, TrendingUp, Star, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { VenueCard } from '@/components/ui/VenueCard';
import { ScrollReveal, FadeIn, StaggeredList, StaggeredItem } from '@/components/effects';
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

// Parallax hook for hero
function useParallax() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollY;
}

export default function Home() {
  const topVenues = getVenuesByRank().slice(0, 5);
  const riverWalkVenues = getVenuesByArea('river-walk').slice(0, 3);
  const scrollY = useParallax();
  const heroRef = useRef<HTMLElement>(null);

  // Calculate parallax values
  const parallaxOffset = scrollY * 0.4;
  const heroOpacity = Math.max(0, 1 - scrollY / 500);

  return (
    <div className="min-h-screen">
      {/* Noise overlay for texture */}
      <div className="noise-overlay" />

      {/* Enhanced Hero Section with Parallax */}
      <section
        ref={heroRef}
        className="relative h-[75vh] min-h-[550px] flex items-end overflow-hidden"
      >
        {/* Background image with parallax */}
        <div
          className="absolute inset-0 scale-110"
          style={{
            transform: `translateY(${parallaxOffset}px) scale(1.1)`,
            willChange: 'transform',
          }}
        >
          <Image
            src="/images/san-antonio-skyline.jpg"
            alt="San Antonio skyline at night"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>

        {/* Animated gradient overlay */}
        <div className="hero-gradient-animated" />

        {/* Floating particles effect */}
        <div className="hero-particles" />

        {/* Radial gradient for depth */}
        <div className="gradient-hero absolute inset-0" />

        {/* Main gradient overlay */}
        <div className="gradient-overlay" />

        {/* Vignette effect */}
        <div className="hero-vignette" />

        {/* Hero content */}
        <div
          className="relative z-10 container pb-14"
          style={{ opacity: heroOpacity }}
        >
          <FadeIn delay={0.1}>
            <p className="text-copper text-sm font-mono tracking-widest mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              SAN ANTONIO &middot; BOERNE &middot; NEW BRAUNFELS
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold text-ivory leading-[1.1] tracking-tight">
              Find Your
              <br />
              <span className="bg-gradient-to-r from-copper via-amber to-copper bg-clip-text text-transparent">
                Next Spot
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.3}>
            <p className="text-cream/80 mt-5 max-w-lg text-lg md:text-xl leading-relaxed">
              Research-backed rankings from real ratings.{' '}
              <span className="text-copper font-medium">No bias, no paid placements.</span>
            </p>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link href="/rankings" className="btn btn-primary shimmer-highlight">
                <Trophy className="w-4 h-4" />
                View Rankings
              </Link>
              <Link href="/trending" className="btn btn-secondary">
                <MapPin className="w-4 h-4" />
                Near Me
              </Link>
            </div>
          </FadeIn>

          {/* Stats ticker */}
          <FadeIn delay={0.5}>
            <div className="flex flex-wrap items-center gap-6 mt-10 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-bold text-copper">{VENUES.length}+</span>
                <span className="text-muted">Venues Ranked</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-slate" />
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-bold text-copper">5</span>
                <span className="text-muted">Areas Covered</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-slate" />
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-bold text-live">LIVE</span>
                <span className="text-muted">Data Updates</span>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-6 h-10 border-2 border-cream/30 rounded-full flex justify-center pt-2">
            <motion.div
              className="w-1.5 h-1.5 bg-copper rounded-full"
              animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </section>

      {/* Quick Links */}
      <ScrollReveal>
        <section className="container py-6">
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/rankings"
              className="card card-glow p-4 flex items-center justify-between hover:border-copper/50 group ripple"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-copper/20 flex items-center justify-center group-hover:bg-copper/30 transition-colors">
                  <Trophy className="w-5 h-5 text-copper" />
                </div>
                <div>
                  <h3 className="font-semibold text-ivory group-hover:text-copper transition-colors">Rankings</h3>
                  <p className="text-xs text-muted">Top venues</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted group-hover:text-copper group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/trending"
              className="card card-glow p-4 flex items-center justify-between hover:border-copper/50 group ripple"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-live/20 flex items-center justify-center group-hover:bg-live/30 transition-colors">
                  <MapPin className="w-5 h-5 text-live" />
                </div>
                <div>
                  <h3 className="font-semibold text-ivory group-hover:text-live transition-colors">Near Me</h3>
                  <p className="text-xs text-muted">By distance</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted group-hover:text-live group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </section>
      </ScrollReveal>

      {/* Top 5 This Month */}
      <ScrollReveal direction="up">
        <section className="container py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-ivory">
                Top Ranked
              </h2>
              <p className="text-sm text-muted mt-0.5">Updated weekly</p>
            </div>
            <Link
              href="/rankings"
              className="text-sm text-copper flex items-center gap-1 hover:text-amber group"
            >
              See all <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <StaggeredList className="space-y-3">
            {topVenues.map((venue, index) => (
              <StaggeredItem key={venue.id}>
                <VenueCard
                  venue={venue}
                  rank={index + 1}
                  variant="compact"
                />
              </StaggeredItem>
            ))}
          </StaggeredList>
        </section>
      </ScrollReveal>

      {/* Coverage Areas */}
      <ScrollReveal direction="left">
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
              {coverageAreas.map((area, index) => (
                <motion.div
                  key={area.slug}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={`/rankings?area=${area.slug}`}
                    className="card relative w-44 flex-shrink-0 overflow-hidden group"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <Image
                        src={area.image}
                        alt={`${area.name} nightlife`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="gradient-overlay-light" />
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 shimmer-highlight opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-semibold text-ivory text-sm group-hover:text-copper transition-colors">
                        {area.name}
                      </h3>
                      <p className="text-xs text-muted">{area.venueCount} venues</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Featured Area - River Walk */}
      <ScrollReveal direction="scale">
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
              className="text-sm text-copper flex items-center gap-1 hover:text-amber group"
            >
              View all <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {riverWalkVenues.map((venue, index) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <VenueCard
                  venue={venue}
                  rank={index + 1}
                />
              </motion.div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* How It Works */}
      <ScrollReveal direction="up">
        <section className="container py-8">
          <div className="card card-glow p-6 relative overflow-hidden">
            {/* Subtle gradient background */}
            <div className="absolute inset-0 gradient-radial opacity-50" />

            <div className="relative">
              <h2 className="font-display text-lg font-semibold text-ivory mb-5">
                How Rankings Work
              </h2>
              <div className="space-y-5">
                {[
                  {
                    icon: Star,
                    title: 'Real Ratings',
                    description: 'Weighted average from Google, Yelp & TripAdvisor',
                    color: 'copper',
                  },
                  {
                    icon: TrendingUp,
                    title: 'No Bias',
                    description: 'No paid placements. Rankings based on data only.',
                    color: 'copper',
                  },
                  {
                    icon: MapPin,
                    title: 'Local Focus',
                    description: 'SA, Boerne & New Braunfels. Hill Country roots.',
                    color: 'copper',
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    className="flex gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 }}
                  >
                    <div className={`w-10 h-10 rounded-full bg-${item.color}/20 flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`w-5 h-5 text-${item.color}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-ivory text-sm">{item.title}</h3>
                      <p className="text-xs text-muted mt-0.5">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Bottom CTA */}
      <ScrollReveal>
        <section className="container pb-8">
          <div className="card p-6 text-center bg-gradient-to-br from-charcoal to-slate border-copper/20">
            <h2 className="font-display text-xl font-semibold text-ivory mb-2">
              Ready to explore?
            </h2>
            <p className="text-muted text-sm mb-5">
              Discover the best nightlife spots in the Hill Country
            </p>
            <Link href="/rankings" className="btn btn-primary">
              <Trophy className="w-4 h-4" />
              View Full Rankings
            </Link>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
