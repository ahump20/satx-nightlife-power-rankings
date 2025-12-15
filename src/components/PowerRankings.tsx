'use client';

import { useState } from 'react';
import { useRankings } from '@/hooks/useVenues';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  ChevronRight,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function PowerRankings() {
  const currentMonth = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showFilters, setShowFilters] = useState(false);

  const { rankings, periodLabel, isLoading } = useRankings('monthly', selectedMonth);

  const getRankChangeIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (change < 0) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500 text-black';
      case 2:
        return 'bg-gray-300 text-black';
      case 3:
        return 'bg-amber-600 text-white';
      default:
        return 'bg-gray-700 text-white';
    }
  };

  const getPriceLabel = (level: number | null) => {
    if (!level) return '';
    return '$'.repeat(level);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Power Rankings</h1>
              <p className="text-gray-400 text-sm">{periodLabel}</p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {/* Month selector */}
          {showFilters && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {MONTHS.map((month, idx) => (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(idx)}
                  disabled={idx > currentMonth}
                  className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                    selectedMonth === idx
                      ? 'bg-purple-600 text-white'
                      : idx > currentMonth
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {month.slice(0, 3)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rankings list */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-800 rounded-lg p-4 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-700 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {rankings.map((venue: any) => (
              <Link
                key={venue.id}
                href={`/venue/${venue.slug}`}
                className="block bg-gray-800 hover:bg-gray-750 rounded-lg p-4 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Rank badge */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${getRankBadgeColor(
                      venue.currentRank
                    )}`}
                  >
                    {venue.currentRank}
                  </div>

                  {/* Venue info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{venue.name}</h3>
                      {venue.isExpertPick && (
                        <span className="flex-shrink-0 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded">
                          ⭐ Expert Pick
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                      <span className="capitalize">
                        {venue.category.replace(/_/g, ' ')}
                      </span>
                      <span>{venue.city}</span>
                      {venue.priceLevel && (
                        <span className="text-green-400">
                          {getPriceLabel(venue.priceLevel)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    {/* Rank change */}
                    <div className="flex items-center gap-1">
                      {getRankChangeIcon(venue.rankChange)}
                      <span
                        className={
                          venue.rankChange > 0
                            ? 'text-green-500'
                            : venue.rankChange < 0
                            ? 'text-red-500'
                            : 'text-gray-400'
                        }
                      >
                        {venue.rankChange > 0 && '+'}
                        {venue.rankChange !== 0 ? venue.rankChange : '—'}
                      </span>
                    </div>

                    {/* Power score */}
                    <div className="text-right">
                      <div className="font-semibold text-purple-400">
                        {venue.powerScore.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">score</div>
                    </div>

                    {/* Rating */}
                    {venue.googleRating && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-4 h-4 fill-current" />
                        <span>{venue.googleRating}</span>
                      </div>
                    )}

                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </div>
                </div>

                {/* Mini chart - YTD sparkline */}
                {venue.monthlyHistory && venue.monthlyHistory.length > 1 && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-gray-500">YTD:</span>
                    <div className="flex items-end gap-0.5 h-4">
                      {venue.monthlyHistory.slice(0, selectedMonth + 1).map((m: any, idx: number) => (
                        <div
                          key={idx}
                          className={`w-2 rounded-t ${
                            m.rank <= 3
                              ? 'bg-yellow-500'
                              : m.rank <= 5
                              ? 'bg-purple-500'
                              : 'bg-gray-600'
                          }`}
                          style={{
                            height: `${Math.max(20, 100 - m.rank * 8)}%`,
                          }}
                          title={`${m.month}: #${m.rank}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      Avg: #{venue.avgYTDRank}
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
