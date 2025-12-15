import { useState } from 'react';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subMonths, addMonths, isSameMonth } from 'date-fns';
import { useLeaderboard } from '../hooks/useApi';
import { useLocation } from '../context/LocationContext';
import { VenueList } from '../components/VenueCard';
import { LeaderboardSkeleton } from '../components/LoadingScreen';
import { PullToRefresh } from '../components/PullToRefresh';

export default function MonthlyPage() {
  const { lat, lng, radiusMiles } = useLocation();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const { data, error, isLoading, mutate } = useLeaderboard(
    'monthly',
    lat,
    lng,
    radiusMiles
  );

  const handleRefresh = async () => {
    await mutate();
  };

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    const next = addMonths(selectedMonth, 1);
    if (next <= new Date()) {
      setSelectedMonth(next);
    }
  };

  const isCurrentMonth = isSameMonth(selectedMonth, new Date());

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
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h1 className="text-2xl font-bold">Power Rankings</h1>
          </div>
          <p className="text-dark-400 text-sm mt-1">Monthly leaderboard standings</p>
        </div>

        {/* Month Selector */}
        <div className="px-4 mt-4">
          <div className="card flex items-center justify-between py-3">
            <button
              onClick={handlePrevMonth}
              className="btn-ghost p-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="font-semibold">
              {format(selectedMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
              className="btn-ghost p-2 disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="px-4 mt-6">
          {isLoading ? (
            <LeaderboardSkeleton />
          ) : data?.entries ? (
            <VenueList
              entries={data.entries}
              showRank={true}
              showTrend={true}
              emptyMessage="No rankings available for this month yet."
            />
          ) : null}
        </div>

        {/* Scoring Info */}
        <div className="px-4 mt-8">
          <div className="card bg-dark-800/50">
            <h3 className="font-semibold text-dark-300 mb-2">Monthly Power Score</h3>
            <p className="text-sm text-dark-400">
              Power rankings combine ratings (60%), engagement (20%),
              consistency (10%), and events (10%) over the month.
              Bayesian adjustment ensures fair comparison between new and
              established venues.
            </p>
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
}
