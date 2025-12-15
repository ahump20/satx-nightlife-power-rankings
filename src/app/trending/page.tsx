'use client';

import { TrendingMovers } from '@/components/TrendingMovers';
import { useTrending } from '@/hooks/useVenues';
import { RefreshCw, TrendingUp } from 'lucide-react';

export default function TrendingPage() {
  const { refresh, isLoading } = useTrending();

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <h1 className="text-2xl font-bold text-white">Trending</h1>
            </div>
            <button
              onClick={refresh}
              disabled={isLoading}
              className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            See which venues are rising and falling in the rankings
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <TrendingMovers />

        <div className="mt-8 bg-gray-800 rounded-xl p-4">
          <h2 className="font-bold text-white mb-2">How Trending Works</h2>
          <p className="text-sm text-gray-400">
            Trending is calculated by comparing a venue&apos;s current monthly rank
            to their previous month&apos;s rank. Large movements indicate significant
            changes in popularity, reviews, events, or deals.
          </p>
        </div>
      </div>
    </div>
  );
}
