import { TonightTopBar } from '@/components/TonightTopBar';
import { TrendingMovers } from '@/components/TrendingMovers';
import { ScoringExplainer } from '@/components/ScoringExplainer';
import { YTDOverview } from '@/components/YearTimeline';
import Link from 'next/link';
import { ChevronRight, Trophy, MapPin } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 pb-20">
      {/* Tonight's Top Picks */}
      <TonightTopBar />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/rankings"
            className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-4 flex items-center justify-between hover:from-purple-500 hover:to-purple-700 transition-all"
          >
            <div>
              <Trophy className="w-8 h-8 text-yellow-400 mb-2" />
              <h2 className="font-bold text-white">Power Rankings</h2>
              <p className="text-xs text-purple-200">Monthly leaderboard</p>
            </div>
            <ChevronRight className="w-6 h-6 text-purple-300" />
          </Link>

          <Link
            href="/trending"
            className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-4 flex items-center justify-between hover:from-green-500 hover:to-green-700 transition-all"
          >
            <div>
              <MapPin className="w-8 h-8 text-green-200 mb-2" />
              <h2 className="font-bold text-white">Near Me</h2>
              <p className="text-xs text-green-200">By distance</p>
            </div>
            <ChevronRight className="w-6 h-6 text-green-300" />
          </Link>
        </div>

        {/* Trending Movers */}
        <section>
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            📈 This Month&apos;s Movers
          </h2>
          <TrendingMovers />
        </section>

        {/* YTD Overview */}
        <section>
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            📊 2024 YTD Leaders
          </h2>
          <YTDOverview />
        </section>

        {/* Scoring Explainer */}
        <section>
          <ScoringExplainer />
        </section>

        {/* Area info */}
        <section className="bg-gray-800 rounded-xl p-4">
          <h3 className="font-bold text-white mb-2">Coverage Area</h3>
          <p className="text-sm text-gray-400 mb-3">
            We track bars, breweries, and nightlife venues across the San Antonio
            metro area with a focus on the NW side and Boerne.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'The Rim',
              'La Cantera',
              'Stone Oak',
              'The Pearl',
              'Boerne',
              'Dominion',
            ].map((area) => (
              <span
                key={area}
                className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
              >
                {area}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
