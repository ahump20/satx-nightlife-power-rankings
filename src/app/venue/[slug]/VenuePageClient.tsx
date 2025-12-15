'use client';

import { useVenueDetails } from '@/hooks/useVenues';
import { YearTimeline } from '@/components/YearTimeline';
import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Globe,
  Clock,
  Tag,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

export default function VenuePageClient({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { venue, ytdStats, isLoading, error } = useVenueDetails(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 pb-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-1/3" />
            <div className="h-48 bg-gray-800 rounded-xl" />
            <div className="h-32 bg-gray-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-gray-900 pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Venue not found</p>
          <Link href="/" className="text-purple-400 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const googleRating = venue.ratings?.find(
    (r: any) => r.source === 'google'
  );
  const yelpRating = venue.ratings?.find((r: any) => r.source === 'yelp');
  const rankChange =
    (venue.currentRanking?.previousRank || 0) -
    (venue.currentRanking?.rank || 0);

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-white truncate">{venue.name}</h1>
            <p className="text-xs text-gray-400">{venue.city}</p>
          </div>
          {venue.isExpertPick && (
            <span className="flex-shrink-0 bg-yellow-500 text-black text-xs px-2 py-1 rounded">
              Expert Pick
            </span>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Main stats card */}
        <div className="bg-gradient-to-br from-purple-900/50 to-gray-800 rounded-xl p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-4xl font-bold ${
                    venue.currentRanking?.rank <= 3
                      ? 'text-yellow-400'
                      : 'text-white'
                  }`}
                >
                  #{venue.currentRanking?.rank || '—'}
                </span>
                {rankChange !== 0 && (
                  <div
                    className={`flex items-center gap-1 ${
                      rankChange > 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {rankChange > 0 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                    <span className="text-sm font-bold">
                      {rankChange > 0 && '+'}
                      {rankChange}
                    </span>
                  </div>
                )}
                {rankChange === 0 && (
                  <Minus className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <p className="text-sm text-gray-400">Current Rank</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-purple-400">
                {venue.currentRanking?.powerScore?.toFixed(1) || '—'}
              </span>
              <p className="text-sm text-gray-400">Power Score</p>
            </div>
          </div>

          {/* Ratings */}
          <div className="flex gap-4">
            {googleRating && (
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <div>
                  <span className="font-bold text-white">
                    {googleRating.rating}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">
                    ({googleRating.reviewCount})
                  </span>
                </div>
                <span className="text-xs text-gray-500">Google</span>
              </div>
            )}
            {yelpRating && (
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <Star className="w-5 h-5 text-red-400 fill-red-400" />
                <div>
                  <span className="font-bold text-white">
                    {yelpRating.rating}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">
                    ({yelpRating.reviewCount})
                  </span>
                </div>
                <span className="text-xs text-gray-500">Yelp</span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-gray-800 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white">{venue.address}</p>
              <p className="text-sm text-gray-400">
                {venue.city}, TX {venue.zipCode}
              </p>
            </div>
          </div>

          {venue.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <a
                href={`tel:${venue.phone}`}
                className="text-purple-400 hover:underline"
              >
                {venue.phone}
              </a>
            </div>
          )}

          {venue.website && (
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-400" />
              <a
                href={venue.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline truncate"
              >
                {venue.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Tag className="w-5 h-5 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded capitalize">
                {venue.category.replace(/_/g, ' ')}
              </span>
              {venue.subCategory && (
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                  {venue.subCategory}
                </span>
              )}
              {venue.priceLevel && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                  {'$'.repeat(venue.priceLevel)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Active deals */}
        {venue.deals && venue.deals.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-4">
            <h2 className="font-bold text-white mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-400" />
              Active Deals
            </h2>
            <div className="space-y-2">
              {venue.deals
                .filter((d: any) => d.isActive)
                .map((deal: any) => (
                  <div
                    key={deal.id}
                    className="bg-green-500/10 border border-green-500/30 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white">{deal.title}</h3>
                      {deal.dealType === 'happy_hour' && (
                        <span className="text-xs bg-green-500 text-black px-2 py-0.5 rounded">
                          Happy Hour
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {deal.description}
                    </p>
                    {deal.startTime && deal.endTime && (
                      <p className="text-xs text-gray-500 mt-1">
                        {deal.startTime} - {deal.endTime}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Score breakdown */}
        {venue.currentRanking?.scoreBreakdown && (
          <div className="bg-gray-800 rounded-xl p-4">
            <h2 className="font-bold text-white mb-3">Score Breakdown</h2>
            <div className="space-y-2">
              {Object.entries(venue.currentRanking.scoreBreakdown)
                .filter(([key]) => key !== 'totalWeightedScore')
                .map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${Math.min(100, value as number)}%` }}
                        />
                      </div>
                      <span className="text-sm text-white w-8 text-right">
                        {(value as number).toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* YTD Stats */}
        {ytdStats && (
          <div className="bg-gray-800 rounded-xl p-4">
            <h2 className="font-bold text-white mb-3">2024 Performance</h2>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <p className="text-2xl font-bold text-purple-400">
                  #{ytdStats.avgRank}
                </p>
                <p className="text-xs text-gray-400">Avg Rank</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">
                  #{ytdStats.bestRank}
                </p>
                <p className="text-xs text-gray-400">Best</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">
                  #{ytdStats.worstRank}
                </p>
                <p className="text-xs text-gray-400">Worst</p>
              </div>
            </div>
            <YearTimeline slug={slug} />
          </div>
        )}
      </div>
    </div>
  );
}
