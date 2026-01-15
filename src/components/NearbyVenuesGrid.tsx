'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Star,
  Navigation,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  SlidersHorizontal,
  LocateFixed,
} from 'lucide-react';
import { useVenues } from '@/hooks/useVenues';
import { useGeolocation } from '@/hooks/useGeolocation';
import { SATX_NW_BOUNDS, Venue } from '@/lib/db/schema';

interface NearbyVenuesGridProps {
  title?: string;
}

const radiusSteps = [1, 3, 5, 10, 15, 25];

type HydratedVenue = Venue & {
  distance?: number | null;
  liveScore?: number | null;
  ratings?: { rating: number }[];
  currentRanking?: { rank?: number | null } | null;
};

export function NearbyVenuesGrid({ title = 'Near You' }: NearbyVenuesGridProps) {
  const [radius, setRadius] = useState<number>(5);
  const [showMap, setShowMap] = useState<boolean>(false);
  const { latitude, longitude, loading: geoLoading, error: geoError, refresh } =
    useGeolocation();

  const { venues, refresh: refreshVenues, total } = useVenues({
    lat: latitude ?? undefined,
    lng: longitude ?? undefined,
    limit: 50,
    sort: 'distance',
  });

  useEffect(() => {
    if (latitude && longitude) {
      refreshVenues();
    }
  }, [latitude, longitude, refreshVenues]);

  const filteredVenues = useMemo(() => {
    if (!venues) return [];
    if (!latitude || !longitude) return venues;
    return venues.filter((venue: HydratedVenue) => {
      if (venue.distance == null) {
        // When geolocation is available and a radius is selected,
        // exclude venues with no distance data from the filtered list.
        return false;
      }
      return venue.distance <= radius;
    });
  }, [venues, latitude, longitude, radius]);

  const renderMapDots = (venuesToRender: HydratedVenue[]) => {
    const latRange = SATX_NW_BOUNDS.north - SATX_NW_BOUNDS.south;
    const lngRange = SATX_NW_BOUNDS.east - SATX_NW_BOUNDS.west;

    return venuesToRender.map((venue) => {
      const top =
        ((SATX_NW_BOUNDS.north - venue.latitude) / latRange) * 100;
      const left =
        ((venue.longitude - SATX_NW_BOUNDS.west) / lngRange) * 100;

      return (
        <Link
          key={venue.id}
          href={`/venue/${venue.slug}`}
          className="absolute block"
          style={{ top: `${top}%`, left: `${left}%` }}
        >
          <span className="flex items-center gap-1 bg-white/90 text-gray-900 text-[11px] font-semibold px-2 py-1 rounded-full shadow-lg">
            <span
              className={`w-2 h-2 rounded-full ${
                venue.isExpertPick ? 'bg-yellow-500' : 'bg-purple-500'
              }`}
            />
            {venue.name}
          </span>
        </Link>
      );
    });
  };

  return (
    <section className="bg-gray-800 rounded-2xl p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-purple-300">Live search</p>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-400" />
            {title}
          </h2>
          {geoError ? (
            <p className="text-xs text-yellow-300">{geoError}</p>
          ) : (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <LocateFixed className="w-3 h-3" />
              {geoLoading ? 'Detecting location…' : 'Auto-centering on your position'}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            refresh();
            refreshVenues();
          }}
          className="text-xs bg-white/10 hover:bg-white/15 text-white px-3 py-2 rounded-lg"
        >
          Refresh
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl p-3">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-2 font-semibold text-gray-200">
            <SlidersHorizontal className="w-4 h-4 text-purple-400" /> Radius
          </span>
          <span className="text-purple-300 font-semibold">{radius} mi</span>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
          {radiusSteps.map((step) => (
            <button
              key={step}
              onClick={() => setRadius(step)}
              className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                radius === step
                  ? 'bg-purple-600 border-purple-400 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-200 hover:border-purple-400'
              }`}
            >
              {step} mi
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          Showing {filteredVenues.length} of {total} venues
        </span>
        <button
          onClick={() => setShowMap(!showMap)}
          className="flex items-center gap-1 text-purple-300"
        >
          {showMap ? 'List view' : 'Map view'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {showMap ? (
        <div className="relative h-72 rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 border border-gray-700">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.25),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(59,130,246,0.25),transparent_35%),radial-gradient(circle_at_40%_80%,rgba(16,185,129,0.25),transparent_30%)]" />
          <div className="absolute inset-0 text-[11px] text-gray-500 p-3 flex flex-col justify-between">
            <div className="flex justify-between">
              <span>Boerne</span>
              <span>Stone Oak</span>
            </div>
            <div className="flex justify-between items-end">
              <span>The Rim</span>
              <span>Downtown</span>
            </div>
          </div>
          {renderMapDots(filteredVenues)}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVenues.map((venue: HydratedVenue) => (
            <Link
              key={venue.id}
              href={`/venue/${venue.slug}`}
              className="block bg-gray-900 rounded-xl p-3 border border-gray-800 hover:border-purple-500/60 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white truncate">{venue.name}</p>
                    {venue.isExpertPick && (
                      <span className="text-[11px] bg-yellow-500 text-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Expert
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {venue.city}
                    {venue.distance !== undefined && venue.distance !== null && (
                      <span className="text-gray-500">• {venue.distance.toFixed(1)} mi</span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  {venue.liveScore && (
                    <p className="text-sm font-semibold text-purple-300">{venue.liveScore.toFixed(1)}</p>
                  )}
                  <p className="text-[11px] text-gray-500">Power</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                {venue.priceLevel && (
                  <span className="text-green-300">{'$'.repeat(venue.priceLevel)}</span>
                )}
                {venue.currentRanking?.rank && (
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-purple-300" />
                    #{venue.currentRanking.rank}
                  </span>
                )}
                {venue.ratings?.[0]?.rating != null && (
                  <span className="flex items-center gap-1 text-yellow-300">
                    <Star className="w-3 h-3 fill-current" />
                    {venue.ratings?.[0]?.rating}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-1 text-purple-300">
                  <Navigation className="w-3 h-3" />
                  Open map
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
