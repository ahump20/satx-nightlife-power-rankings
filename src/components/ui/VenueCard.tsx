'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import { RankBadge } from './RankBadge';
import { StatusBadge } from './StatusBadge';
import { ScoreGauge } from './ScoreGauge';
import type { Venue } from '@/lib/data/venues-research';

interface VenueCardProps {
  venue: Venue;
  rank?: number;
  distance?: string;
  variant?: 'default' | 'compact' | 'featured';
}

const areaDisplayNames: Record<string, string> = {
  'river-walk': 'River Walk',
  'pearl': 'Pearl District',
  'southtown': 'Southtown',
  'stone-oak': 'Stone Oak',
  'la-cantera': 'La Cantera',
  'the-rim': 'The Rim',
  'boerne': 'Boerne',
  'new-braunfels': 'New Braunfels',
  'downtown': 'Downtown SA',
};

const typeDisplayNames: Record<string, string> = {
  'cocktail-bar': 'Cocktail Bar',
  'brewery': 'Brewery',
  'dive-bar': 'Dive Bar',
  'rooftop': 'Rooftop',
  'speakeasy': 'Speakeasy',
  'dance-hall': 'Dance Hall',
  'sports-bar': 'Sports Bar',
  'wine-bar': 'Wine Bar',
  'irish-pub': 'Irish Pub',
  'tiki-bar': 'Tiki Bar',
};

function getPriceDisplay(priceLevel: number): string {
  return '$'.repeat(priceLevel);
}

export function VenueCard({
  venue,
  rank,
  distance,
  variant = 'default',
}: VenueCardProps) {
  const isOpen = true; // Would be calculated from hours
  const imageUrl = venue.photos[0]?.url;
  const priceDisplay = getPriceDisplay(venue.priceLevel);

  if (variant === 'compact') {
    return (
      <Link
        href={`/venue/${venue.slug}`}
        className="card flex gap-4 p-3 hover:border-copper/30"
      >
        {/* Thumbnail */}
        <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-slate">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={venue.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              <MapPin className="w-6 h-6" />
            </div>
          )}
          {rank && (
            <div className="absolute top-1 left-1">
              <RankBadge rank={rank} size="sm" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-ivory truncate">{venue.name}</h3>
              <p className="text-sm text-muted">
                {typeDisplayNames[venue.type] || venue.type}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="score-display text-lg">{venue.score.toFixed(1)}</div>
              {distance && (
                <p className="text-xs text-muted">{distance}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge isOpen={isOpen} />
            <span className="text-xs text-muted">{priceDisplay}</span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link
        href={`/venue/${venue.slug}`}
        className="card group relative overflow-hidden"
      >
        {/* Image */}
        <div className="relative aspect-[16/10] bg-slate">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={venue.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              <MapPin className="w-12 h-12" />
            </div>
          )}
          <div className="gradient-overlay" />

          {/* Rank badge */}
          {rank && (
            <div className="absolute top-3 left-3">
              <RankBadge rank={rank} size="lg" />
            </div>
          )}

          {/* Status */}
          <div className="absolute top-3 right-3">
            <StatusBadge isOpen={isOpen} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-xl font-semibold text-ivory truncate">
                {venue.name}
              </h3>
              <p className="text-sm text-muted mt-1">
                {typeDisplayNames[venue.type] || venue.type} &middot;{' '}
                {areaDisplayNames[venue.area] || venue.area}
              </p>
            </div>
            <ScoreGauge score={venue.score} size="md" />
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-muted">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-copper" />
              {venue.ratings.google?.toFixed(1) || venue.ratings.yelp?.toFixed(1)}
            </span>
            <span>{priceDisplay}</span>
            {distance && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {distance}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link
      href={`/venue/${venue.slug}`}
      className="card group relative overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-slate">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={venue.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted">
            <MapPin className="w-10 h-10" />
          </div>
        )}
        <div className="gradient-overlay-light" />

        {rank && (
          <div className="absolute top-2 left-2">
            <RankBadge rank={rank} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-ivory truncate">{venue.name}</h3>
            <p className="text-xs text-muted mt-0.5">
              {areaDisplayNames[venue.area] || venue.area}
            </p>
          </div>
          <div className="score-display text-lg flex-shrink-0">
            {venue.score.toFixed(1)}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <StatusBadge isOpen={isOpen} size="sm" />
          {distance && (
            <span className="text-xs text-muted">{distance}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
