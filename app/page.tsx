'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { getCurrentLocation, SATX_CENTER } from '@/lib/geolocation';
import TonightBar from '@/components/TonightBar';
import MonthlyRankings from '@/components/MonthlyRankings';
import TrendingMovers from '@/components/TrendingMovers';
import LocationPrompt from '@/components/LocationPrompt';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  useEffect(() => {
    // Try to get user location on mount
    async function getLocation() {
      const location = await getCurrentLocation();
      if (location) {
        setCoordinates({
          lat: location.latitude,
          lng: location.longitude,
        });
      } else {
        // Use default SATX center if geolocation fails
        setCoordinates({
          lat: SATX_CENTER.latitude,
          lng: SATX_CENTER.longitude,
        });
        setShowLocationPrompt(true);
      }
    }
    getLocation();
  }, []);

  const handleLocationUpdate = async () => {
    const location = await getCurrentLocation();
    if (location) {
      setCoordinates({
        lat: location.latitude,
        lng: location.longitude,
      });
      setShowLocationPrompt(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            SATX Nightlife Power Rankings
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            San Antonio's premier nightlife discovery platform
          </p>
        </div>
      </header>

      {/* Location Prompt */}
      {showLocationPrompt && (
        <LocationPrompt onEnableLocation={handleLocationUpdate} />
      )}

      {/* Tonight Top Bar */}
      {coordinates && <TonightBar coordinates={coordinates} />}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Trending Movers Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="mr-2">📈</span>
            Trending Movers
          </h2>
          <TrendingMovers />
        </section>

        {/* Monthly Rankings Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center">
              <span className="mr-2">🏆</span>
              Monthly Power Rankings
            </h2>
            <Link 
              href="/timeline" 
              className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg font-semibold transition text-sm"
            >
              View Timeline →
            </Link>
          </div>
          <MonthlyRankings />
        </section>

        {/* Info Section */}
        <section className="bg-gray-800/50 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-3">How Rankings Work</h3>
          <div className="space-y-3 text-gray-300">
            <p>
              <strong>Transparent Scoring:</strong> Rankings are calculated using check-ins (40%), 
              average ratings (30%), review count (20%), and expert boost (10%).
            </p>
            <p>
              <strong>Expert Venues:</strong> George's Keep, Camp 1604, Kung Fu Saloon, and 
              The Venue receive a special boost based on expert knowledge of the local scene.
            </p>
            <p>
              <strong>Data Sources:</strong> We use official APIs from Google Places and Yelp, 
              plus our internal deals database. No scraping, all above-board.
            </p>
            <p>
              <strong>Location Focus:</strong> Optimized for San Antonio metro, with special 
              attention to NW San Antonio and Boerne areas.
            </p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>© 2024 SATX Nightlife Power Rankings</p>
          <p className="text-sm mt-2">
            Data sourced from Google Places API, Yelp Fusion API, and internal database
          </p>
        </div>
      </footer>
    </main>
  );
}
