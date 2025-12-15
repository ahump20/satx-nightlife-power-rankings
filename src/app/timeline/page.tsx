'use client';

import { useState } from 'react';
import { useRankings } from '@/hooks/useVenues';
import { YearTimeline } from '@/components/YearTimeline';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

export default function TimelinePage() {
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const { rankings, isLoading } = useRankings('monthly');

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">2024 Timeline</h1>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Track venue rankings throughout the year
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Top venues with expandable timeline */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-800 rounded-xl p-4 animate-pulse h-20"
              />
            ))}
          </div>
        ) : (
          rankings.slice(0, 10).map((venue: any) => (
            <div
              key={venue.id}
              className="bg-gray-800 rounded-xl overflow-hidden"
            >
              <button
                onClick={() =>
                  setSelectedVenue(
                    selectedVenue === venue.slug ? null : venue.slug
                  )
                }
                className="w-full p-4 flex items-center justify-between hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      venue.currentRank <= 3
                        ? 'bg-yellow-500 text-black'
                        : 'bg-gray-700 text-white'
                    }`}
                  >
                    {venue.currentRank}
                  </span>
                  <div className="text-left">
                    <h3 className="font-semibold text-white">{venue.name}</h3>
                    <p className="text-xs text-gray-400">
                      Avg: #{venue.avgYTDRank} • Best: #{venue.bestRank}
                    </p>
                  </div>
                </div>
                {selectedVenue === venue.slug ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {selectedVenue === venue.slug && (
                <div className="px-4 pb-4">
                  <YearTimeline slug={venue.slug} />
                  <Link
                    href={`/venue/${venue.slug}`}
                    className="mt-3 block text-center text-sm text-purple-400 hover:text-purple-300"
                  >
                    View full venue details →
                  </Link>
                </div>
              )}
            </div>
          ))
        )}

        {/* Overall stats */}
        <div className="bg-gradient-to-br from-purple-900/50 to-gray-800 rounded-xl p-4">
          <h2 className="font-bold text-white mb-3">2024 Season Stats</h2>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-purple-400">
                {rankings.length}
              </p>
              <p className="text-xs text-gray-400">Venues Tracked</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">12</p>
              <p className="text-xs text-gray-400">Months of Data</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-yellow-400">4</p>
              <p className="text-xs text-gray-400">Expert Picks</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-400">Live</p>
              <p className="text-xs text-gray-400">Data Updates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
