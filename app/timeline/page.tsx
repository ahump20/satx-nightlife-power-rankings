'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TimelinePage() {
  const [selectedYear] = useState(new Date().getFullYear());
  
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(selectedYear, i, 1);
    return {
      date,
      name: date.toLocaleDateString('en-US', { month: 'long' }),
      shortName: date.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-primary hover:text-primary-dark text-sm mb-2 inline-block">
                ← Back to Home
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold">
                Year Timeline - {selectedYear}
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Track venue rankings throughout the year
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* YTD Summary */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-primary/30 to-accent/20 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Year to Date Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-accent text-3xl font-bold mb-2">-</div>
                <div className="text-gray-300">Total Venues Ranked</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-primary text-3xl font-bold mb-2">-</div>
                <div className="text-gray-300">Total Check-ins</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-green-500 text-3xl font-bold mb-2">-</div>
                <div className="text-gray-300">Active Venues</div>
              </div>
            </div>
          </div>
        </section>

        {/* Monthly Timeline */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Monthly Rankings</h2>
          <div className="space-y-6">
            {months.map((month) => (
              <MonthCard key={month.name} month={month} />
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>© {selectedYear} SATX Nightlife Power Rankings</p>
        </div>
      </footer>
    </main>
  );
}

interface MonthCardProps {
  month: {
    date: Date;
    name: string;
    shortName: string;
  };
}

function MonthCard({ month }: MonthCardProps) {
  const isFuture = month.date > new Date();
  const monthStr = month.date.toISOString().slice(0, 7);
  
  const { data, error, isLoading } = useSWR(
    !isFuture ? `/api/rankings/monthly?month=${monthStr}&limit=5` : null,
    fetcher
  );

  if (isFuture) {
    return (
      <div className="bg-gray-800/30 rounded-lg p-6 opacity-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{month.name}</h3>
          <span className="text-sm text-gray-500">Coming Soon</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data || !data.rankings || data.rankings.length === 0) {
    return (
      <div className="bg-gray-800/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{month.name}</h3>
          <span className="text-sm text-gray-500">No data yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 hover:bg-gray-800/70 transition">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">{month.name}</h3>
        <span className="text-sm text-gray-400">
          {data.rankings.length} venues ranked
        </span>
      </div>

      {/* Top 5 venues */}
      <div className="space-y-3">
        {data.rankings.slice(0, 5).map((ranking: any) => (
          <div
            key={ranking.id}
            className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0"
          >
            <div className="flex items-center space-x-3">
              <span
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${ranking.rank === 1 ? 'bg-yellow-500 text-black' : ''}
                  ${ranking.rank === 2 ? 'bg-gray-400 text-black' : ''}
                  ${ranking.rank === 3 ? 'bg-orange-600 text-white' : ''}
                  ${ranking.rank > 3 ? 'bg-gray-700 text-white' : ''}
                `}
              >
                {ranking.rank}
              </span>
              <div>
                <div className="font-semibold">{ranking.venue.name}</div>
                <div className="text-xs text-gray-400">
                  Score: {ranking.score.toFixed(1)}
                </div>
              </div>
            </div>
            
            {ranking.trendDirection !== 'stable' && ranking.trendDirection !== 'new' && (
              <div
                className={`text-sm ${
                  ranking.trendDirection === 'up' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {ranking.trendDirection === 'up' ? '↑' : '↓'}
                {ranking.trendChange}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
