import { TonightTopBar } from '@/components/TonightTopBar';
import { TrendingMovers } from '@/components/TrendingMovers';
import { ScoringExplainer } from '@/components/ScoringExplainer';
import { YTDOverview } from '@/components/YearTimeline';
import { HeroSection } from '@/components/HeroSection';
import { CoverageArea } from '@/components/CoverageArea';
import Link from 'next/link';
import { ChevronRight, Trophy, MapPin } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 pb-20">
      {/* Hero with rotating local photos */}
      <HeroSection />

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

        {/* Coverage Areas with Photos */}
        <CoverageArea />

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
            📊 2025 YTD Leaders
          </h2>
          <YTDOverview />
        </section>

        {/* Scoring Explainer */}
        <section>
          <ScoringExplainer />
        </section>
      </div>
    </main>
  );
}
