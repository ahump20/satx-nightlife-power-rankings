'use client';

import { useRef, useState, useCallback } from 'react';
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
  'st-marys-strip': 'St. Mary\'s Strip',
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

// 3D Tilt hook for card interactions
function use3DTilt(maxTilt: number = 8) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    // Calculate rotation
    const rotateY = (mouseX / (rect.width / 2)) * maxTilt;
    const rotateX = -(mouseY / (rect.height / 2)) * maxTilt;

    // Calculate glow position (percentage)
    const glowX = ((e.clientX - rect.left) / rect.width) * 100;
    const glowY = ((e.clientY - rect.top) / rect.height) * 100;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    setGlowPosition({ x: glowX, y: glowY });
  }, [maxTilt]);

  const handleMouseLeave = useCallback(() => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlowPosition({ x: 50, y: 50 });
  }, []);

  return { cardRef, transform, glowPosition, handleMouseMove, handleMouseLeave };
}

export function VenueCard({
  venue,
  rank,
  distance,
  variant = 'default',
}: VenueCardProps) {
  const isOpen = true;
  const imageUrl = venue.photos[0]?.url;
  const priceDisplay = getPriceDisplay(venue.priceLevel);
  const { cardRef, transform, glowPosition, handleMouseMove, handleMouseLeave } = use3DTilt();

  if (variant === 'compact') {
    return (
      <Link
        href={`/venue/${venue.slug}`}
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="card card-glow flex gap-4 p-3 hover:border-copper/30 relative overflow-hidden ripple"
        style={{
          transform,
          transition: 'transform 0.15s ease-out, box-shadow 0.25s ease',
        }}
      >
        {/* Dynamic glow effect */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(184, 115, 51, 0.15) 0%, transparent 50%)`,
          }}
        />

        {/* Thumbnail */}
        <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-slate">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={venue.name}
              fill
              className="object-cover img-zoom"
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
              <div className="score-display text-lg score-display-glow">{venue.score.toFixed(1)}</div>
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
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="card group relative overflow-hidden"
        style={{
          transform,
          transition: 'transform 0.15s ease-out, box-shadow 0.25s ease',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Dynamic glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          style={{
            background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(184, 115, 51, 0.2) 0%, transparent 50%)`,
          }}
        />

        {/* Image */}
        <div className="relative aspect-[16/10] bg-slate overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={venue.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              <MapPin className="w-12 h-12" />
            </div>
          )}
          <div className="gradient-overlay" />

          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 shimmer-highlight opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Rank badge */}
          {rank && (
            <div className="absolute top-3 left-3 z-20">
              <RankBadge rank={rank} size="lg" />
            </div>
          )}

          {/* Status */}
          <div className="absolute top-3 right-3 z-20">
            <StatusBadge isOpen={isOpen} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 relative">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-xl font-semibold text-ivory truncate group-hover:text-copper transition-colors">
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

  // Default variant with 3D tilt
  return (
    <Link
      href={`/venue/${venue.slug}`}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="card group relative overflow-hidden"
      style={{
        transform,
        transition: 'transform 0.15s ease-out, box-shadow 0.25s ease',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Dynamic glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
        style={{
          background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(184, 115, 51, 0.2) 0%, transparent 50%)`,
        }}
      />

      {/* Image */}
      <div className="relative aspect-[4/3] bg-slate overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={venue.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted">
            <MapPin className="w-10 h-10" />
          </div>
        )}
        <div className="gradient-overlay-light" />

        {/* Shimmer sweep effect */}
        <div className="absolute inset-0 shimmer-highlight opacity-0 group-hover:opacity-100 transition-opacity" />

        {rank && (
          <div className="absolute top-2 left-2 z-20">
            <RankBadge rank={rank} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 relative">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-ivory truncate group-hover:text-copper transition-colors">
              {venue.name}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              {areaDisplayNames[venue.area] || venue.area}
            </p>
          </div>
          <div className="score-display text-lg flex-shrink-0 score-display-glow">
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
