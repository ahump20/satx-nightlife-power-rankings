'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TrendingMovers() {
  const { data, error, isLoading } = useSWR('/api/rankings/trending?limit=5', fetcher);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-800/50 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !data || !data.trending || data.trending.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 text-center text-gray-400">
        No trending data available yet. Check back soon!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.trending.map((ranking: any) => (
        <div
          key={ranking.id}
          className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm rounded-lg p-5 hover:from-gray-800/90 hover:to-gray-900/90 transition border border-primary/20"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">{ranking.venue.name}</h3>
              <p className="text-sm text-gray-400">{ranking.venue.address}</p>
            </div>
            
            {/* Trend Arrow */}
            <div
              className={`
                flex-shrink-0 ml-3 text-3xl
                ${ranking.trendDirection === 'up' ? 'text-green-500' : ''}
                ${ranking.trendDirection === 'down' ? 'text-red-500' : ''}
              `}
            >
              {ranking.trendDirection === 'up' && '↑'}
              {ranking.trendDirection === 'down' && '↓'}
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Current Rank</span>
              <span className="font-bold text-primary">#{ranking.rank}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Change</span>
              <span
                className={`
                  font-bold
                  ${ranking.trendDirection === 'up' ? 'text-green-500' : ''}
                  ${ranking.trendDirection === 'down' ? 'text-red-500' : ''}
                `}
              >
                {ranking.trendDirection === 'up' ? '+' : '-'}
                {ranking.trendChange} spots
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Score</span>
              <span className="font-bold text-accent">{ranking.score.toFixed(1)}</span>
            </div>
          </div>

          {/* Badge */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center space-x-2">
              {ranking.venue.isExpertVenue && (
                <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded font-semibold">
                  ⭐ Expert Pick
                </span>
              )}
              <span
                className={`
                  text-xs px-2 py-1 rounded font-semibold
                  ${ranking.trendDirection === 'up' ? 'bg-green-900/50 text-green-300' : ''}
                  ${ranking.trendDirection === 'down' ? 'bg-red-900/50 text-red-300' : ''}
                `}
              >
                {ranking.trendDirection === 'up' ? '🔥 Hot' : '📉 Trending'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
