'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Filter, Star, ChevronRight, MapPin } from 'lucide-react';
import { VenueCard } from '@/components/ui/VenueCard';
import { RankBadge } from '@/components/ui/RankBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ScoreGauge } from '@/components/ui/ScoreGauge';
import {
  getVenuesByRank,
  getVenuesByArea,
  getAreaDisplayName,
  getTypeDisplayName,
  type Venue,
} from '@/lib/data/venues-research';

const AREA_FILTERS = [
  { value: 'all', label: 'All Areas' },
  { value: 'river-walk', label: 'River Walk' },
  { value: 'pearl', label: 'Pearl District' },
  { value: 'southtown', label: 'Southtown' },
  { value: 'stone-oak', label: 'Stone Oak' },
  { value: 'la-cantera', label: 'La Cantera' },
  { value: 'the-rim', label: 'The Rim' },
  { value: 'boerne', label: 'Boerne' },
  { value: 'new-braunfels', label: 'New Braunfels' },
];

const TYPE_FILTERS = [
  { value: 'all', label: 'All Types' },
  { value: 'cocktail-bar', label: 'Cocktail Bar' },
  { value: 'brewery', label: 'Brewery' },
  { value: 'speakeasy', label: 'Speakeasy' },
  { value: 'rooftop', label: 'Rooftop' },
  { value: 'dance-hall', label: 'Dance Hall' },
  { value: 'wine-bar', label: 'Wine Bar' },
  { value: 'sports-bar', label: 'Sports Bar' },
  { value: 'irish-pub', label: 'Irish Pub' },
  { value: 'tiki-bar', label: 'Tiki Bar' },
];

export function PowerRankings() {
  const [showFilters, setShowFilters] = useState(false);
  const [areaFilter, setAreaFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'compact'>('list');

  const allVenues = useMemo(() => getVenuesByRank(), []);

  const filteredVenues = useMemo(() => {
    let venues = allVenues;

    if (areaFilter !== 'all') {
      venues = venues.filter((v) => v.area === areaFilter);
    }

    if (typeFilter !== 'all') {
      venues = venues.filter((v) => v.type === typeFilter);
    }

    return venues;
  }, [allVenues, areaFilter, typeFilter]);

  const hasActiveFilters = areaFilter !== 'all' || typeFilter !== 'all';

  return (
    <div className="min-h-screen bg-midnight">
      {/* Header */}
      <div className="sticky top-16 z-30 glass">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-ivory">
                Power Rankings
              </h1>
              <p className="text-sm text-muted mt-0.5">
                {filteredVenues.length} venues
                {hasActiveFilters && ' (filtered)'}
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${
                showFilters || hasActiveFilters
                  ? 'btn-primary'
                  : 'btn-secondary'
              } text-sm`}
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 space-y-3">
              {/* Area filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {AREA_FILTERS.map((area) => (
                  <button
                    key={area.value}
                    onClick={() => setAreaFilter(area.value)}
                    className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                      areaFilter === area.value
                        ? 'bg-copper text-midnight'
                        : 'bg-slate text-cream hover:bg-stone'
                    }`}
                  >
                    {area.label}
                  </button>
                ))}
              </div>

              {/* Type filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {TYPE_FILTERS.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setTypeFilter(type.value)}
                    className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                      typeFilter === type.value
                        ? 'bg-copper text-midnight'
                        : 'bg-slate text-cream hover:bg-stone'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setAreaFilter('all');
                    setTypeFilter('all');
                  }}
                  className="text-sm text-copper hover:text-amber"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rankings list */}
      <div className="container py-4">
        {filteredVenues.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted">No venues match your filters</p>
            <button
              onClick={() => {
                setAreaFilter('all');
                setTypeFilter('all');
              }}
              className="text-copper hover:text-amber mt-2"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVenues.map((venue, index) => (
              <RankingCard
                key={venue.id}
                venue={venue}
                rank={index + 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Methodology note */}
      <div className="container pb-8">
        <div className="card p-4">
          <h3 className="font-semibold text-ivory text-sm mb-2">
            How Rankings Are Calculated
          </h3>
          <p className="text-xs text-muted">
            Rankings are based on weighted averages of real ratings from Google
            (40%), Yelp (40%), and TripAdvisor (20%). Review volume provides a
            small bonus (up to 5 points). No paid placements or arbitrary boosts.
          </p>
        </div>
      </div>
    </div>
  );
}

interface RankingCardProps {
  venue: Venue;
  rank: number;
}

function RankingCard({ venue, rank }: RankingCardProps) {
  const imageUrl = venue.photos[0]?.url;
  const priceDisplay = '$'.repeat(venue.priceLevel);

  return (
    <Link
      href={`/venue/${venue.slug}`}
      className="card flex gap-4 p-4 hover:border-copper/30 transition-colors"
    >
      {/* Rank */}
      <div className="flex flex-col items-center gap-1">
        <RankBadge rank={rank} size="lg" />
      </div>

      {/* Venue info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-ivory truncate">{venue.name}</h3>
        <p className="text-sm text-muted mt-0.5">
          {getTypeDisplayName(venue.type)} &middot;{' '}
          {getAreaDisplayName(venue.area)}
        </p>

        <div className="flex items-center gap-3 mt-2 text-sm">
          <span className="flex items-center gap-1 text-copper">
            <Star className="w-3.5 h-3.5" />
            {venue.ratings.google?.toFixed(1) || venue.ratings.yelp?.toFixed(1)}
          </span>
          <span className="text-muted">{priceDisplay}</span>
          <StatusBadge isOpen={true} size="sm" />
        </div>

        {/* Notable feature */}
        {venue.notable[0] && (
          <p className="text-xs text-muted mt-2 line-clamp-1">
            {venue.notable[0]}
          </p>
        )}
      </div>

      {/* Score */}
      <div className="flex items-center gap-3">
        <ScoreGauge score={venue.score} size="md" />
        <ChevronRight className="w-5 h-5 text-muted" />
      </div>
    </Link>
  );
}
