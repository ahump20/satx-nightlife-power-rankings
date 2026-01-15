'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ChevronRight, Trophy, MapPin, RefreshCw, ShieldCheck, Navigation } from 'lucide-react';
import { TonightTopBar } from '@/components/TonightTopBar';
import { TrendingMovers } from '@/components/TrendingMovers';
import { ScoringExplainer } from '@/components/ScoringExplainer';
import { YTDOverview } from '@/components/YearTimeline';
import { NearbyVenuesGrid } from '@/components/NearbyVenuesGrid';
import { useGeolocation } from '@/hooks/useGeolocation';

export default function Home() {
  const { latitude, longitude } = useGeolocation();
  const hasLocation = useMemo(() => latitude && longitude, [latitude, longitude]);

  return (
    <main className="min-h-screen bg-gray-900 pb-24">
      <TonightTopBar />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <section className="bg-gradient-to-br from-purple-900/70 via-gray-900 to-indigo-900 rounded-3xl p-5 border border-purple-800/50 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.2),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.25),transparent_25%),radial-gradient(circle_at_40%_80%,rgba(16,185,129,0.2),transparent_30%)]" />
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-purple-200 uppercase tracking-wide">Live tonight</p>
                <h1 className="text-2xl font-bold text-white leading-tight">
                  SATX Nightlife Power Rankings
                </h1>
                <p className="text-sm text-purple-100 max-w-xl mt-2">
                  Real-time, transparent rankings for bars and nightlife across NW San Antonio and Boerne. Optimized for fast refreshes, thumb-friendly controls, and installable as a PWA.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 bg-white/10 text-white px-3 py-2 rounded-full text-xs border border-white/20">
                <ShieldCheck className="w-4 h-4 text-green-300" />
                Verified signals
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {[{
                label: 'Location aware',
                value: hasLocation ? 'Using your position' : 'NW SA default',
              }, {
                label: 'Refresh on demand',
                value: 'Pull or tap refresh',
              }, {
                label: 'Expert mode ready',
                value: 'Curated priors applied',
              }, {
                label: 'Safety first',
                value: 'Rideshare + tips included',
              }].map((item) => (
                <div key={item.label} className="bg-black/20 rounded-xl p-3 border border-white/10">
                  <p className="text-[11px] uppercase text-gray-300 tracking-wide">{item.label}</p>
                  <p className="text-white font-semibold mt-1">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/rankings"
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-full font-semibold shadow-lg"
              >
                View monthly board
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/trending"
                className="inline-flex items-center gap-2 bg-purple-600/80 text-white px-4 py-2 rounded-full border border-purple-400/50"
              >
                Trending movers
                <ChevronRight className="w-4 h-4" />
              </Link>
              <div className="inline-flex items-center gap-2 text-xs text-purple-100 bg-white/10 px-3 py-2 rounded-full border border-white/10">
                <RefreshCw className="w-4 h-4" /> Live cache tuned for 60–300s
              </div>
            </div>
          </div>
        </section>

        <div className="grid md:grid-cols-[2fr,1fr] gap-4">
          <NearbyVenuesGrid title="Top near you" />

          <div className="space-y-4">
            <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-400" /> Quick links
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/rankings"
                  className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-3 flex items-center justify-between hover:from-purple-500 hover:to-purple-700 transition-all"
                >
                  <div>
                    <Trophy className="w-8 h-8 text-yellow-400 mb-1" />
                    <p className="font-bold text-white">Power Rankings</p>
                    <p className="text-[11px] text-purple-200">Monthly leaderboard</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-purple-300" />
                </Link>
                <Link
                  href="/trending"
                  className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-3 flex items-center justify-between hover:from-green-500 hover:to-green-700 transition-all"
                >
                  <div>
                    <Navigation className="w-8 h-8 text-green-200 mb-1" />
                    <p className="font-bold text-white">Trending</p>
                    <p className="text-[11px] text-green-200">Movers & surges</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-green-300" />
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-gray-700">
              <h3 className="font-bold text-white mb-2">Responsible rides</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>Use the nearest rideshare pickup spots to keep nights safe.</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Uber', href: 'https://m.uber.com/looking', color: 'bg-gray-100 text-gray-900' },
                    { name: 'Lyft', href: 'https://ride.lyft.com', color: 'bg-pink-500 text-white' },
                    { name: 'VIA Transit', href: 'https://www.viainfo.net', color: 'bg-blue-500 text-white' },
                  ].map((ride) => (
                    <a
                      key={ride.name}
                      href={ride.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${ride.color} hover:opacity-90`}
                    >
                      {ride.name}
                    </a>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400">Drink responsibly. Call a friend, a rideshare, or VIA.</p>
              </div>
            </div>
          </div>
        </div>

        <section>
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            📈 This Month&apos;s Movers
          </h2>
          <TrendingMovers />
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            📊 2024 YTD Leaders
          </h2>
          <YTDOverview />
        </section>

        <section>
          <ScoringExplainer />
        </section>

        <section className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white mb-1">Coverage Area</h3>
              <p className="text-sm text-gray-400">
                Focused on NW San Antonio through Boerne with flexible radius controls.
              </p>
            </div>
            <span className="text-xs bg-purple-500/20 text-purple-200 px-2 py-1 rounded-full">Real-time filterable</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {["The Rim", "La Cantera", "Stone Oak", "The Pearl", "Boerne", "Dominion"].map((area) => (
              <span key={area} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                {area}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
