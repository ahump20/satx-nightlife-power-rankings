'use client';

import { useTrending } from '@/hooks/useVenues';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';

export function TrendingMovers() {
  const { moversUp, moversDown, isLoading } = useTrending();

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Movers Up */}
      <div className="bg-gradient-to-br from-green-900/50 to-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-bold text-white">Hot Movers</h2>
        </div>

        {moversUp.length === 0 ? (
          <p className="text-gray-400 text-sm">No upward movers this period</p>
        ) : (
          <div className="space-y-2">
            {moversUp.map((venue: any) => (
              <Link
                key={venue.id}
                href={`/venue/${venue.slug}`}
                className="flex items-center justify-between bg-gray-800/50 hover:bg-gray-700/50 rounded-lg p-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-green-400">
                    <ArrowUp className="w-4 h-4" />
                    <span className="font-bold">+{venue.rankChange}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-sm">
                      {venue.name}
                    </h3>
                    <p className="text-xs text-gray-400">
                      #{venue.previousRank} → #{venue.currentRank}
                    </p>
                  </div>
                </div>
                {venue.isExpertPick && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                    ⭐ Pick
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Movers Down */}
      <div className="bg-gradient-to-br from-red-900/30 to-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-5 h-5 text-red-400" />
          <h2 className="text-lg font-bold text-white">Cooling Off</h2>
        </div>

        {moversDown.length === 0 ? (
          <p className="text-gray-400 text-sm">No downward movers this period</p>
        ) : (
          <div className="space-y-2">
            {moversDown.map((venue: any) => (
              <Link
                key={venue.id}
                href={`/venue/${venue.slug}`}
                className="flex items-center justify-between bg-gray-800/50 hover:bg-gray-700/50 rounded-lg p-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-red-400">
                    <ArrowDown className="w-4 h-4" />
                    <span className="font-bold">{venue.rankChange}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-sm">
                      {venue.name}
                    </h3>
                    <p className="text-xs text-gray-400">
                      #{venue.previousRank} → #{venue.currentRank}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
