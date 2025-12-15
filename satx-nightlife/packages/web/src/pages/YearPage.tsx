import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLeaderboard } from '../hooks/useApi';
import { useLocation } from '../context/LocationContext';
import { VenueList } from '../components/VenueCard';
import { LeaderboardSkeleton } from '../components/LoadingScreen';
import { PullToRefresh } from '../components/PullToRefresh';

export default function YearPage() {
  const { lat, lng, radiusMiles } = useLocation();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const currentYear = new Date().getFullYear();

  const { data, error, isLoading, mutate } = useLeaderboard(
    'year',
    lat,
    lng,
    radiusMiles
  );

  const handleRefresh = async () => {
    await mutate();
  };

  const handlePrevYear = () => {
    setSelectedYear((prev) => prev - 1);
  };

  const handleNextYear = () => {
    if (selectedYear < currentYear) {
      setSelectedYear((prev) => prev + 1);
    }
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
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-500" />
            <h1 className="text-2xl font-bold">Year in Review</h1>
          </div>
          <p className="text-dark-400 text-sm mt-1">YTD standings and timeline</p>
        </div>

        {/* Year Selector */}
        <div className="px-4 mt-4">
          <div className="card flex items-center justify-between py-3">
            <button
              onClick={handlePrevYear}
              className="btn-ghost p-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="font-semibold text-lg">{selectedYear}</span>
            <button
              onClick={handleNextYear}
              disabled={selectedYear >= currentYear}
              className="btn-ghost p-2 disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        {data && (
          <div className="px-4 mt-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="card text-center">
                <div className="text-2xl font-bold text-primary-400">
                  {data.entries.length}
                </div>
                <div className="text-xs text-dark-400 mt-1">Venues Ranked</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  {new Date().getMonth() + 1}
                </div>
                <div className="text-xs text-dark-400 mt-1">Months</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-amber-400">
                  {data.entries.filter(e => e.venue.isExpertPick).length}
                </div>
                <div className="text-xs text-dark-400 mt-1">Expert Picks</div>
              </div>
            </div>
          </div>
        )}

        {/* YTD Leaderboard */}
        <div className="px-4 mt-6">
          <h2 className="font-semibold text-dark-300 mb-3">YTD Standings</h2>
          {isLoading ? (
            <LeaderboardSkeleton />
          ) : data?.entries ? (
            <VenueList
              entries={data.entries}
              showRank={true}
              showTrend={true}
              emptyMessage="No year data available yet."
            />
          ) : null}
        </div>

        {/* Info */}
        <div className="px-4 mt-8">
          <div className="card bg-dark-800/50">
            <h3 className="font-semibold text-dark-300 mb-2">YTD Standings</h3>
            <p className="text-sm text-dark-400">
              Year-to-date standings average monthly power scores across all
              ranked months. Venues must have at least one month of data to
              appear in yearly standings.
            </p>
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
}
