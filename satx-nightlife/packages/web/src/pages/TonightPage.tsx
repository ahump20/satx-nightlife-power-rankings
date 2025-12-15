import { useState } from 'react';
import { Flame, Award, MapPin, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { useLeaderboard } from '../hooks/useApi';
import { useLocation } from '../context/LocationContext';
import { VenueList } from '../components/VenueCard';
import { LeaderboardSkeleton } from '../components/LoadingScreen';
import { PullToRefresh } from '../components/PullToRefresh';
import { RadiusSlider } from '../components/RadiusSlider';

export default function TonightPage() {
  const { lat, lng, radiusMiles, loading: locationLoading } = useLocation();
  const [expertMode, setExpertMode] = useState(false);
  const [showRadius, setShowRadius] = useState(false);

  const { data, error, isLoading, mutate } = useLeaderboard(
    'tonight',
    lat,
    lng,
    radiusMiles,
    expertMode
  );

  const handleRefresh = async () => {
    await mutate();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <span className="text-4xl mb-4">😕</span>
        <h2 className="text-lg font-semibold text-white mb-2">Something went wrong</h2>
        <p className="text-dark-400 text-sm">{error.message}</p>
        <button onClick={() => mutate()} className="btn-primary mt-4">
          Try again
        </button>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="pb-20">
        {/* Header */}
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-orange-500" />
              <h1 className="text-2xl font-bold">Tonight</h1>
            </div>
            <div className="text-sm text-dark-400">
              {data?.generatedAt && (
                <span>
                  Updated {new Date(data.generatedAt).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          </div>
          <p className="text-dark-400 text-sm mt-1">What's hot in San Antonio right now</p>
        </div>

        {/* Controls */}
        <div className="px-4 mt-4 space-y-3">
          {/* Location & Radius */}
          <button
            onClick={() => setShowRadius(!showRadius)}
            className="flex w-full items-center justify-between card py-3"
          >
            <div className="flex items-center gap-2 text-dark-300">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">Within {radiusMiles} miles</span>
            </div>
            <ChevronDown
              className={clsx(
                'h-4 w-4 text-dark-400 transition-transform',
                showRadius && 'rotate-180'
              )}
            />
          </button>

          {showRadius && (
            <div className="card">
              <RadiusSlider />
            </div>
          )}

          {/* Expert Mode Toggle */}
          <button
            onClick={() => setExpertMode(!expertMode)}
            className={clsx(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all',
              expertMode
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-dark-800 text-dark-400 border border-dark-700'
            )}
          >
            <Award className="h-4 w-4" />
            <span className="text-sm font-medium">Expert Picks</span>
          </button>
        </div>

        {/* Leaderboard */}
        <div className="px-4 mt-6">
          {isLoading || locationLoading ? (
            <LeaderboardSkeleton />
          ) : data?.entries ? (
            <VenueList
              entries={data.entries}
              showRank={true}
              emptyMessage="No venues found nearby. Try expanding your search radius."
            />
          ) : null}
        </div>

        {/* Scoring Info */}
        <div className="px-4 mt-8">
          <div className="card bg-dark-800/50">
            <h3 className="font-semibold text-dark-300 mb-2">How Tonight scores work</h3>
            <p className="text-sm text-dark-400">
              Tonight scores combine real-time signals including ratings, review activity,
              and events. Scores are Bayesian-adjusted to balance popularity with quality.
              {expertMode && (
                <span className="block mt-2 text-amber-400/80">
                  Expert mode highlights curated picks from local nightlife experts.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
}
