'use client';

import { useTonight } from '@/hooks/useVenues';
import { useGeolocation } from '@/hooks/useGeolocation';
import { RefreshCw, MapPin, Star, TrendingUp, Clock, Tag } from 'lucide-react';
import Link from 'next/link';

export function TonightTopBar() {
  const { latitude, longitude, loading: geoLoading, error: geoError } = useGeolocation();
  const { venues, isLoading, refresh, timestamp } = useTonight(latitude, longitude, 5);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">🌙 Tonight&apos;s Top Picks</span>
            {geoLoading && (
              <span className="text-xs text-purple-300">Finding you...</span>
            )}
            {latitude && longitude && (
              <span className="text-xs text-purple-300 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Near you
              </span>
            )}
          </div>
          <button
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded-full transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            {timestamp && <span>Updated {formatTime(timestamp)}</span>}
          </button>
        </div>

        {/* Error state */}
        {geoError && (
          <p className="text-xs text-yellow-300 mb-2">
            {geoError} - Showing all venues
          </p>
        )}

        {/* Venues scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {isLoading ? (
            // Loading skeleton
            [...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-48 bg-white/10 rounded-lg p-3 animate-pulse"
              >
                <div className="h-4 bg-white/20 rounded mb-2" />
                <div className="h-3 bg-white/20 rounded w-2/3" />
              </div>
            ))
          ) : (
            venues.map((venue: any, index: number) => (
              <Link
                key={venue.id}
                href={`/venue/${venue.slug}`}
                className="flex-shrink-0 w-52 bg-white/10 hover:bg-white/20 rounded-lg p-3 transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-yellow-400">
                      #{index + 1}
                    </span>
                    {venue.isExpertPick && (
                      <span className="text-xs bg-yellow-500 text-black px-1 rounded">
                        ⭐ Pick
                      </span>
                    )}
                  </div>
                  <span className="text-xs bg-purple-500/50 px-1.5 py-0.5 rounded">
                    {venue.liveScore.toFixed(1)}
                  </span>
                </div>

                <h3 className="font-semibold text-sm truncate">{venue.name}</h3>

                <div className="flex items-center gap-2 text-xs text-purple-200 mt-1">
                  {venue.distance !== null && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" />
                      {venue.distance} mi
                    </span>
                  )}
                  {venue.googleRating && (
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {venue.googleRating}
                    </span>
                  )}
                </div>

                {/* Active deals/events */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {venue.happyHourActive && (
                    <span className="text-xs bg-green-500/50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      Happy Hour
                    </span>
                  )}
                  {venue.eventsTonight.length > 0 && (
                    <span className="text-xs bg-blue-500/50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Star className="w-3 h-3" />
                      Live Event
                    </span>
                  )}
                  {venue.activeDeals.length > 0 && !venue.happyHourActive && (
                    <span className="text-xs bg-orange-500/50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Tag className="w-3 h-3" />
                      Deal
                    </span>
                  )}
                </div>

                <p className="text-xs text-purple-300 mt-1 truncate">
                  {venue.scoreExplanation}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
