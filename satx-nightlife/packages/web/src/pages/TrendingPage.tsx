import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useLeaderboard } from '../hooks/useApi';
import { useLocation } from '../context/LocationContext';
import { VenueList } from '../components/VenueCard';
import { LeaderboardSkeleton } from '../components/LoadingScreen';
import { PullToRefresh } from '../components/PullToRefresh';
import type { LeaderboardEntry } from '../types';

export default function TrendingPage() {
  const { lat, lng, radiusMiles } = useLocation();

  const { data, error, isLoading, mutate } = useLeaderboard(
    'trending',
    lat,
    lng,
    radiusMiles
  );

  const handleRefresh = async () => {
    await mutate();
  };

  // Separate movers into risers and fallers
  const risers: LeaderboardEntry[] = [];
  const fallers: LeaderboardEntry[] = [];
  const stable: LeaderboardEntry[] = [];

  if (data?.entries) {
    for (const entry of data.entries) {
      if (entry.change && entry.change > 0) {
        risers.push(entry);
      } else if (entry.change && entry.change < 0) {
        fallers.push(entry);
      } else {
        stable.push(entry);
      }
    }
  }

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
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-500" />
            <h1 className="text-2xl font-bold">Trending</h1>
          </div>
          <p className="text-dark-400 text-sm mt-1">Who's rising and falling this week</p>
        </div>

        {isLoading ? (
          <div className="px-4 mt-6">
            <LeaderboardSkeleton />
          </div>
        ) : (
          <>
            {/* Rising */}
            {risers.length > 0 && (
              <div className="mt-6">
                <div className="px-4 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <h2 className="font-semibold text-emerald-400">Rising</h2>
                </div>
                <div className="px-4">
                  <VenueList
                    entries={risers}
                    showRank={false}
                    showTrend={true}
                  />
                </div>
              </div>
            )}

            {/* Falling */}
            {fallers.length > 0 && (
              <div className="mt-8">
                <div className="px-4 mb-3 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-400" />
                  <h2 className="font-semibold text-red-400">Falling</h2>
                </div>
                <div className="px-4">
                  <VenueList
                    entries={fallers}
                    showRank={false}
                    showTrend={true}
                  />
                </div>
              </div>
            )}

            {/* Stable */}
            {stable.length > 0 && (
              <div className="mt-8">
                <div className="px-4 mb-3 flex items-center gap-2">
                  <Minus className="h-5 w-5 text-dark-400" />
                  <h2 className="font-semibold text-dark-400">Holding Steady</h2>
                </div>
                <div className="px-4">
                  <VenueList
                    entries={stable}
                    showRank={false}
                    showTrend={true}
                  />
                </div>
              </div>
            )}

            {risers.length === 0 && fallers.length === 0 && stable.length === 0 && (
              <div className="px-4 mt-6">
                <div className="flex flex-col items-center justify-center py-12 text-dark-400">
                  <span className="text-4xl mb-4">📊</span>
                  <p>Not enough data yet to show trends.</p>
                  <p className="text-sm mt-2">Check back after a week of activity.</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Info */}
        <div className="px-4 mt-8">
          <div className="card bg-dark-800/50">
            <h3 className="font-semibold text-dark-300 mb-2">About Trending</h3>
            <p className="text-sm text-dark-400">
              Trending scores compare the last 7 days to the previous 3 weeks,
              measuring momentum in ratings and review activity. Big movers
              indicate venues on the rise or in decline.
            </p>
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
}
