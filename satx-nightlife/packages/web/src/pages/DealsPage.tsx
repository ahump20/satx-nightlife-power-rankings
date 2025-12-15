import { useState } from 'react';
import { Gift, MapPin, Clock, Check } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { useDeals } from '../hooks/useApi';
import { useLocation } from '../context/LocationContext';
import { LoadingScreen } from '../components/LoadingScreen';
import { PullToRefresh } from '../components/PullToRefresh';
import type { Deal } from '../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DealsPage() {
  const { lat, lng, radiusMiles } = useLocation();
  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState<number | undefined>(today);

  const { data: deals, error, isLoading, mutate } = useDeals(
    lat,
    lng,
    radiusMiles,
    selectedDay
  );

  const handleRefresh = async () => {
    await mutate();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <span className="text-4xl mb-4">😕</span>
        <h2 className="text-lg font-semibold text-white mb-2">Something went wrong</h2>
        <p className="text-dark-400 text-sm">{error.message}</p>
        <button onClick={() => mutate()} className="btn-primary mt-4">
          Try again
        </button>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="pb-20">
        {/* Header */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-pink-500" />
            <h1 className="text-2xl font-bold">Deals</h1>
          </div>
          <p className="text-dark-400 text-sm mt-1">Happy hours and specials near you</p>
        </div>

        {/* Day Filter */}
        <div className="px-4 mt-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedDay(undefined)}
              className={clsx(
                'flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all',
                selectedDay === undefined
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
              )}
            >
              All
            </button>
            {DAYS.map((day, index) => (
              <button
                key={day}
                onClick={() => setSelectedDay(index)}
                className={clsx(
                  'flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all',
                  selectedDay === index
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-800 text-dark-400 hover:bg-dark-700',
                  index === today && selectedDay !== index && 'ring-1 ring-primary-500/50'
                )}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Deals List */}
        <div className="px-4 mt-6">
          {isLoading ? (
            <LoadingScreen />
          ) : deals && deals.length > 0 ? (
            <div className="space-y-3">
              {deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-dark-400">
              <span className="text-4xl mb-4">🎁</span>
              <p>No deals found for this day.</p>
              <p className="text-sm mt-2">Try selecting a different day.</p>
            </div>
          )}
        </div>

        {/* Submit CTA */}
        <div className="px-4 mt-8">
          <div className="card bg-gradient-to-br from-primary-900/50 to-dark-800 border-primary-800">
            <h3 className="font-semibold text-white mb-2">Know a deal?</h3>
            <p className="text-sm text-dark-300 mb-4">
              Help the community by submitting deals you know about.
              All submissions are verified before publishing.
            </p>
            <button className="btn-primary w-full">
              Submit a Deal
            </button>
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{deal.title}</h3>
          <p className="text-sm text-dark-400 mt-1">{deal.venueName}</p>
        </div>
        {deal.verified && (
          <div className="badge-success flex items-center gap-1">
            <Check className="h-3 w-3" />
            <span>Verified</span>
          </div>
        )}
      </div>

      <p className="text-dark-300 text-sm mt-3">{deal.description}</p>

      <div className="flex items-center gap-4 mt-3 text-xs text-dark-400">
        {deal.dayOfWeek !== undefined && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {DAYS[deal.dayOfWeek]}
            {deal.startTime && deal.endTime && (
              <span>
                {' '}
                {deal.startTime} - {deal.endTime}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
