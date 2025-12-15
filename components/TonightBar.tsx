'use client';

import { useState } from 'react';
import useSWR from 'swr';

interface TonightBarProps {
  coordinates: { lat: number; lng: number };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TonightBar({ coordinates }: TonightBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data, error, isLoading, mutate } = useSWR(
    `/api/venues/tonight?lat=${coordinates.lat}&lng=${coordinates.lng}&limit=10`,
    fetcher,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: true,
    }
  );

  const handleRefresh = () => {
    mutate();
  };

  if (isLoading) {
    return (
      <div className="bg-primary/20 backdrop-blur-sm py-4 border-b border-primary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🌙</span>
              <div>
                <h2 className="text-lg font-bold">Tonight Near You</h2>
                <p className="text-sm text-gray-300">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="bg-primary/20 backdrop-blur-sm py-4 border-b border-primary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🌙</span>
              <div>
                <h2 className="text-lg font-bold">Tonight Near You</h2>
                <p className="text-sm text-gray-300">
                  No venues found nearby. Try adjusting your location.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const topVenue = data[0];

  return (
    <div className="bg-gradient-to-r from-primary/30 to-accent/20 backdrop-blur-sm border-b border-primary/30">
      <div className="container mx-auto px-4 py-4">
        {/* Collapsed View */}
        {!isExpanded && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <span className="text-2xl">🌙</span>
              <div className="flex-1">
                <h2 className="text-lg font-bold">Tonight Near You</h2>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-semibold text-accent">{topVenue.name}</span>
                  <span className="text-gray-300">• {topVenue.distance} mi</span>
                  {topVenue.hasDealsTonight && (
                    <span className="bg-accent text-black px-2 py-0.5 rounded text-xs font-bold">
                      DEALS
                    </span>
                  )}
                  {topVenue.hasEventsTonight && (
                    <span className="bg-primary text-white px-2 py-0.5 rounded text-xs font-bold">
                      EVENT
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-white/10 rounded-full transition"
                title="Refresh"
              >
                <span className="text-xl">🔄</span>
              </button>
              <button
                onClick={() => setIsExpanded(true)}
                className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg font-semibold transition"
              >
                See All
              </button>
            </div>
          </div>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🌙</span>
                <div>
                  <h2 className="text-lg font-bold">Tonight Near You</h2>
                  <p className="text-sm text-gray-300">
                    Top {data.length} venues with deals & events
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  className="p-2 hover:bg-white/10 rounded-full transition"
                  title="Refresh"
                >
                  <span className="text-xl">🔄</span>
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition"
                >
                  Collapse
                </button>
              </div>
            </div>

            {/* Venue List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.map((venue: any) => (
                <div
                  key={venue.id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 hover:bg-gray-800/70 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg">{venue.name}</h3>
                    <span className="text-sm text-gray-400">{venue.distance} mi</span>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-2">{venue.address}</p>
                  
                  {venue.rankings[0] && (
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs bg-primary/30 px-2 py-1 rounded">
                        Rank #{venue.rankings[0].rank}
                      </span>
                      <span className="text-xs bg-accent/30 px-2 py-1 rounded">
                        Score: {venue.rankings[0].score.toFixed(1)}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {venue.hasDealsTonight && (
                      <span className="bg-accent text-black px-2 py-1 rounded text-xs font-bold">
                        🎉 {venue.deals.length} Deal{venue.deals.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {venue.hasEventsTonight && (
                      <span className="bg-primary text-white px-2 py-1 rounded text-xs font-bold">
                        🎵 Event Tonight
                      </span>
                    )}
                    {venue.isExpertVenue && (
                      <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">
                        ⭐ Expert Pick
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
