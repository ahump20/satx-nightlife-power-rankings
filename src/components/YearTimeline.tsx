'use client';

import { useVenueDetails } from '@/hooks/useVenues';

interface YearTimelineProps {
  slug: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function YearTimeline({ slug }: YearTimelineProps) {
  const { historicalRankings, ytdStats, isLoading } = useVenueDetails(slug);

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl p-4 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-32 bg-gray-700 rounded" />
      </div>
    );
  }

  if (!historicalRankings || historicalRankings.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-gray-400">No historical data available</p>
      </div>
    );
  }

  const maxRank = Math.max(...historicalRankings);
  const minRank = Math.min(...historicalRankings);

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">2024 Timeline</h3>
        {ytdStats && (
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-gray-400">Avg:</span>
              <span className="text-white ml-1">#{ytdStats.avgRank}</span>
            </div>
            <div>
              <span className="text-gray-400">Best:</span>
              <span className="text-green-400 ml-1">#{ytdStats.bestRank}</span>
            </div>
            <div>
              <span className="text-gray-400">Worst:</span>
              <span className="text-red-400 ml-1">#{ytdStats.worstRank}</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="relative h-40">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-500">
          <span>#{minRank}</span>
          <span>#{Math.round((maxRank + minRank) / 2)}</span>
          <span>#{maxRank}</span>
        </div>

        {/* Chart area */}
        <div className="ml-10 h-full flex items-end gap-1">
          {MONTHS.map((month, idx) => {
            const rank = historicalRankings[idx];
            const hasData = rank !== undefined;
            const currentMonth = new Date().getMonth();
            const isFuture = idx > currentMonth;

            // Calculate bar height (inverted - lower rank = taller bar)
            const heightPercent = hasData
              ? ((maxRank - rank + 1) / (maxRank - minRank + 1)) * 100
              : 0;

            const getBarColor = () => {
              if (!hasData || isFuture) return 'bg-gray-700';
              if (rank <= 3) return 'bg-yellow-500';
              if (rank <= 5) return 'bg-purple-500';
              if (rank <= 10) return 'bg-blue-500';
              return 'bg-gray-500';
            };

            return (
              <div key={month} className="flex-1 flex flex-col items-center">
                <div className="w-full h-32 flex items-end">
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${getBarColor()} ${
                      isFuture ? 'opacity-30' : ''
                    }`}
                    style={{ height: `${heightPercent}%` }}
                    title={hasData ? `${month}: #${rank}` : `${month}: No data`}
                  >
                    {hasData && !isFuture && (
                      <div className="text-center text-xs font-bold text-white pt-1">
                        {rank}
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className={`text-xs mt-1 ${
                    isFuture ? 'text-gray-600' : 'text-gray-400'
                  }`}
                >
                  {month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span className="text-gray-400">Top 3</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-purple-500" />
          <span className="text-gray-400">Top 5</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-gray-400">Top 10</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-500" />
          <span className="text-gray-400">10+</span>
        </div>
      </div>
    </div>
  );
}

// Standalone YTD Overview for dashboard
export function YTDOverview() {
  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <h3 className="text-lg font-bold text-white mb-4">2024 YTD Leaders</h3>

      <div className="space-y-3">
        {[
          { name: "George's Keep", avgRank: 1.5, bestRank: 1, trend: 'up' },
          { name: 'Camp 1604', avgRank: 2.7, bestRank: 2, trend: 'up' },
          { name: 'The Venue', avgRank: 4.0, bestRank: 4, trend: 'same' },
          { name: 'Kung Fu Noodle', avgRank: 5.2, bestRank: 3, trend: 'up' },
          { name: 'The Brass Tap', avgRank: 6.5, bestRank: 5, trend: 'down' },
        ].map((venue, idx) => (
          <div
            key={venue.name}
            className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-purple-400">
                #{idx + 1}
              </span>
              <div>
                <h4 className="font-medium text-white">{venue.name}</h4>
                <p className="text-xs text-gray-400">
                  Avg: #{venue.avgRank} • Best: #{venue.bestRank}
                </p>
              </div>
            </div>
            <div
              className={`text-sm ${
                venue.trend === 'up'
                  ? 'text-green-400'
                  : venue.trend === 'down'
                  ? 'text-red-400'
                  : 'text-gray-400'
              }`}
            >
              {venue.trend === 'up' ? '↑' : venue.trend === 'down' ? '↓' : '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
