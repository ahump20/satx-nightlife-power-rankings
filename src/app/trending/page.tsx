'use client';

import { useEffect } from 'react';
import { MapPin, Navigation, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useVenuesByDistance } from '@/hooks/useDistance';
import { VENUES } from '@/lib/data/venues-research';
import { VenueCard } from '@/components/ui/VenueCard';

export default function NearMePage() {
  const {
    latitude,
    longitude,
    loading,
    error,
    permission,
    requestLocation,
    hasLocation,
  } = useGeolocation();

  const venuesWithDistance = useVenuesByDistance(VENUES, latitude, longitude);

  // Auto-request location if permission was previously granted
  useEffect(() => {
    if (permission === 'granted' && !hasLocation && !loading) {
      requestLocation();
    }
  }, [permission, hasLocation, loading, requestLocation]);

  return (
    <div className="min-h-screen bg-midnight pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-midnight/95 backdrop-blur-sm z-10 border-b border-slate">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-copper" />
              <h1 className="text-2xl font-bold text-ivory">Near Me</h1>
            </div>
            {hasLocation && (
              <button
                onClick={requestLocation}
                disabled={loading}
                className="flex items-center gap-2 bg-slate px-3 py-2 rounded-lg text-muted hover:bg-charcoal transition-colors"
                aria-label="Refresh location"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                />
                Update
              </button>
            )}
          </div>
          <p className="text-muted text-sm mt-1">
            Find the best bars closest to you
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Permission Prompt State */}
        {!hasLocation && permission !== 'denied' && !loading && (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-copper/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Navigation className="w-8 h-8 text-copper" />
            </div>
            <h2 className="text-xl font-semibold text-ivory mb-2">
              Find Bars Near You
            </h2>
            <p className="text-muted mb-6 max-w-md mx-auto">
              Enable location access to see bars sorted by distance from your current location.
            </p>
            <button
              onClick={requestLocation}
              className="btn-primary inline-flex items-center gap-2"
            >
              <MapPin className="w-5 h-5" />
              Enable Location
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="card p-8 text-center">
            <Loader2 className="w-10 h-10 text-copper animate-spin mx-auto mb-4" />
            <p className="text-muted">Finding your location...</p>
          </div>
        )}

        {/* Permission Denied State */}
        {permission === 'denied' && (
          <div className="card p-8 text-center border-red-500/20">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-ivory mb-2">
              Location Access Denied
            </h2>
            <p className="text-muted mb-4 max-w-md mx-auto">
              You&apos;ve denied location access. To use this feature, please enable location permissions in your browser settings.
            </p>
            <div className="bg-slate rounded-lg p-4 text-left text-sm text-muted max-w-md mx-auto">
              <p className="font-medium text-ivory mb-2">How to enable:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click the lock/info icon in your browser&apos;s address bar</li>
                <li>Find &quot;Location&quot; in the permissions list</li>
                <li>Change it to &quot;Allow&quot;</li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && permission !== 'denied' && (
          <div className="card p-6 border-amber-500/20 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-ivory font-medium">Location Error</p>
                <p className="text-muted text-sm">{error}</p>
                <button
                  onClick={requestLocation}
                  className="text-copper text-sm mt-2 hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Venues List - sorted by distance */}
        {hasLocation && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-copper" />
              <span className="text-sm text-muted">
                Showing {venuesWithDistance.length} venues sorted by distance
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {venuesWithDistance.map(({ venue, formattedDistance }, index) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  rank={index + 1}
                  distance={formattedDistance ?? undefined}
                  variant="default"
                />
              ))}
            </div>
          </>
        )}

        {/* Info Card */}
        <div className="mt-8 card p-4">
          <h2 className="font-bold text-ivory mb-2">About Near Me</h2>
          <p className="text-sm text-muted">
            Distances are calculated using your current location. The ranking order
            reflects how close each venue is to you, not their overall score. Your
            location data stays on your device and is never sent to our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
