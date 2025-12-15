'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Globe,
  Clock,
  ExternalLink,
  Instagram,
} from 'lucide-react';
import { ScoreGauge } from '@/components/ui/ScoreGauge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  getVenueBySlug,
  getVenuesByRank,
  getAreaDisplayName,
  getTypeDisplayName,
  type Venue,
} from '@/lib/data/venues-research';

export default function VenuePageClient({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const venue = useMemo(() => getVenueBySlug(slug), [slug]);
  const allVenues = useMemo(() => getVenuesByRank(), []);

  // Calculate rank
  const rank = useMemo(() => {
    if (!venue) return null;
    const index = allVenues.findIndex((v) => v.id === venue.id);
    return index >= 0 ? index + 1 : null;
  }, [venue, allVenues]);

  if (!venue) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted mb-4">Venue not found</p>
          <Link href="/" className="text-copper hover:text-amber">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const priceDisplay = '$'.repeat(venue.priceLevel);
  const imageUrl = venue.photos[0]?.url;

  return (
    <div className="min-h-screen bg-midnight">
      {/* Header with back button */}
      <div className="sticky top-16 z-30 glass">
        <div className="container py-3 flex items-center gap-3">
          <Link
            href="/rankings"
            className="btn-ghost p-2 rounded-lg touch-target"
            aria-label="Back to rankings"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-ivory truncate">{venue.name}</h1>
            <p className="text-xs text-muted">{getAreaDisplayName(venue.area)}</p>
          </div>
          <StatusBadge isOpen={true} />
        </div>
      </div>

      {/* Hero image */}
      <div className="relative aspect-[16/9] bg-slate">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={venue.name}
            fill
            priority
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted">
            <MapPin className="w-16 h-16" />
          </div>
        )}
        <div className="gradient-overlay" />

        {/* Score overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div>
            {rank && (
              <div className="inline-block bg-copper text-midnight font-mono font-bold px-3 py-1 rounded-lg text-lg mb-2">
                #{rank}
              </div>
            )}
            <h2 className="font-display text-2xl font-bold text-ivory">
              {venue.name}
            </h2>
            <p className="text-cream/80 text-sm mt-1">
              {getTypeDisplayName(venue.type)} &middot; {priceDisplay}
            </p>
          </div>
          <ScoreGauge score={venue.score} size="lg" />
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* Ratings card */}
        <div className="card p-4">
          <h3 className="font-semibold text-ivory text-sm mb-3">Ratings</h3>
          <div className="flex gap-4">
            {venue.ratings.google && (
              <div className="flex items-center gap-2 bg-slate rounded-lg px-3 py-2">
                <Star className="w-5 h-5 text-copper" />
                <div>
                  <span className="font-mono font-bold text-ivory">
                    {venue.ratings.google.toFixed(1)}
                  </span>
                </div>
                <span className="text-xs text-muted">Google</span>
              </div>
            )}
            {venue.ratings.yelp && (
              <div className="flex items-center gap-2 bg-slate rounded-lg px-3 py-2">
                <Star className="w-5 h-5 text-live" />
                <div>
                  <span className="font-mono font-bold text-ivory">
                    {venue.ratings.yelp.toFixed(1)}
                  </span>
                </div>
                <span className="text-xs text-muted">Yelp</span>
              </div>
            )}
            {venue.ratings.tripadvisor && (
              <div className="flex items-center gap-2 bg-slate rounded-lg px-3 py-2">
                <Star className="w-5 h-5 text-busy" />
                <div>
                  <span className="font-mono font-bold text-ivory">
                    {venue.ratings.tripadvisor.toFixed(1)}
                  </span>
                </div>
                <span className="text-xs text-muted">TripAdvisor</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted mt-3">
            {venue.reviewCount.toLocaleString()} total reviews
          </p>
        </div>

        {/* Description */}
        <div className="card p-4">
          <h3 className="font-semibold text-ivory text-sm mb-2">About</h3>
          <p className="text-cream/80 text-sm leading-relaxed">
            {venue.description}
          </p>
          {venue.established && (
            <p className="text-xs text-muted mt-2">
              Established {venue.established}
            </p>
          )}
        </div>

        {/* Notable features */}
        {venue.notable.length > 0 && (
          <div className="card p-4">
            <h3 className="font-semibold text-ivory text-sm mb-3">
              What Makes It Special
            </h3>
            <ul className="space-y-2">
              {venue.notable.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-cream/80">
                  <span className="text-copper">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contact info */}
        <div className="card p-4 space-y-3">
          <h3 className="font-semibold text-ivory text-sm mb-3">Contact</h3>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-cream/80 text-sm">{venue.address}</p>
              <a
                href={venue.googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-copper hover:text-amber inline-flex items-center gap-1 mt-1"
              >
                Open in Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {venue.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted" />
              <a
                href={`tel:${venue.phone}`}
                className="text-copper hover:text-amber text-sm"
              >
                {venue.phone}
              </a>
            </div>
          )}

          {venue.website && (
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted" />
              <a
                href={venue.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-copper hover:text-amber text-sm truncate"
              >
                {venue.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            </div>
          )}

          {venue.instagramHandle && (
            <div className="flex items-center gap-3">
              <Instagram className="w-5 h-5 text-muted" />
              <a
                href={`https://instagram.com/${venue.instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-copper hover:text-amber text-sm"
              >
                @{venue.instagramHandle}
              </a>
            </div>
          )}
        </div>

        {/* Hours */}
        <div className="card p-4">
          <h3 className="font-semibold text-ivory text-sm mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Hours
          </h3>
          <div className="space-y-2">
            {Object.entries(venue.hours).map(([day, hours]) => (
              <div key={day} className="flex justify-between text-sm">
                <span className="text-muted capitalize">{day}</span>
                <span className="text-cream/80">{hours}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        {venue.features.length > 0 && (
          <div className="card p-4">
            <h3 className="font-semibold text-ivory text-sm mb-3">Features</h3>
            <div className="flex flex-wrap gap-2">
              {venue.features.map((feature, i) => (
                <span
                  key={i}
                  className="text-xs bg-slate text-cream/80 px-2.5 py-1 rounded-full"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* External links */}
        <div className="flex gap-3">
          {venue.yelpUrl && (
            <a
              href={venue.yelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary flex-1 text-sm"
            >
              View on Yelp
            </a>
          )}
          {venue.googleUrl && (
            <a
              href={venue.googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary flex-1 text-sm"
            >
              View on Google
            </a>
          )}
        </div>

        {/* Data attribution */}
        <p className="text-xs text-muted text-center pt-4">
          Ratings and data aggregated from Google, Yelp, and TripAdvisor.
          <br />
          Last updated December 2025.
        </p>
      </div>
    </div>
  );
}
