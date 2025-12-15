'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MonthlyRankings() {
  const { data, error, isLoading } = useSWR('/api/rankings/monthly?limit=20', fetcher);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-800/50 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !data || !data.rankings) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 text-center text-gray-400">
        Failed to load rankings. Please try again later.
      </div>
    );
  }

  const monthName = new Date(data.month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div>
      <div className="mb-4 text-gray-400">
        Rankings for {monthName}
      </div>
      
      <div className="space-y-3">
        {data.rankings.map((ranking: any) => (
          <div
            key={ranking.id}
            className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 hover:bg-gray-800/70 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                {/* Rank Badge */}
                <div
                  className={`
                    flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                    ${ranking.rank === 1 ? 'bg-yellow-500 text-black' : ''}
                    ${ranking.rank === 2 ? 'bg-gray-400 text-black' : ''}
                    ${ranking.rank === 3 ? 'bg-orange-600 text-white' : ''}
                    ${ranking.rank > 3 ? 'bg-gray-700 text-white' : ''}
                  `}
                >
                  {ranking.rank}
                </div>

                {/* Venue Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-bold text-lg">{ranking.venue.name}</h3>
                    {ranking.venue.isExpertVenue && (
                      <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                        ⭐ Expert
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-2">{ranking.venue.address}</p>
                  
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-primary/30 px-2 py-1 rounded">
                      Score: {ranking.score.toFixed(1)}
                    </span>
                    <span className="bg-blue-900/30 px-2 py-1 rounded">
                      ⭐ {ranking.avgRating.toFixed(1)} ({ranking.reviewCount} reviews)
                    </span>
                    <span className="bg-green-900/30 px-2 py-1 rounded">
                      👥 {ranking.checkInCount} check-ins
                    </span>
                  </div>

                  {/* Active Deals */}
                  {ranking.venue.deals && ranking.venue.deals.length > 0 && (
                    <div className="mt-2 text-sm text-accent">
                      🎉 {ranking.venue.deals.length} active deal{ranking.venue.deals.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Trend Indicator */}
                <div className="flex-shrink-0">
                  {ranking.trendDirection === 'up' && (
                    <div className="text-green-500 text-center">
                      <div className="text-2xl">↑</div>
                      <div className="text-xs">+{ranking.trendChange}</div>
                    </div>
                  )}
                  {ranking.trendDirection === 'down' && (
                    <div className="text-red-500 text-center">
                      <div className="text-2xl">↓</div>
                      <div className="text-xs">-{ranking.trendChange}</div>
                    </div>
                  )}
                  {ranking.trendDirection === 'stable' && (
                    <div className="text-gray-500 text-center">
                      <div className="text-2xl">→</div>
                      <div className="text-xs">—</div>
                    </div>
                  )}
                  {ranking.trendDirection === 'new' && (
                    <div className="text-accent text-center">
                      <div className="text-xl font-bold">NEW</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
