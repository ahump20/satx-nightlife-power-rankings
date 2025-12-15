import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Star,
  Phone,
  Globe,
  Clock,
  Award,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import { useVenue } from '../hooks/useApi';
import { LoadingScreen } from '../components/LoadingScreen';

export default function VenuePage() {
  const { id } = useParams<{ id: string }>();
  const { data: venue, error, isLoading } = useVenue(id);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !venue) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <span className="text-4xl mb-4">😕</span>
        <h2 className="text-lg font-semibold text-white mb-2">Venue not found</h2>
        <p className="text-dark-400 text-sm">{error?.message || 'Unable to load venue details'}</p>
        <Link to="/" className="btn-primary mt-4">
          Back to Home
        </Link>
      </div>
    );
  }

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${venue.location.lat},${venue.location.lng}`;

  return (
    <div className="pb-20">
      {/* Back Button */}
      <div className="px-4 pt-4">
        <Link to="/" className="btn-ghost inline-flex items-center gap-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </Link>
      </div>

      {/* Hero Image */}
      <div className="relative mt-4 aspect-video w-full bg-dark-800">
        {venue.photoUrl ? (
          <img
            src={venue.photoUrl}
            alt={venue.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl">
            🍸
          </div>
        )}
        {venue.isExpertPick && (
          <div className="absolute top-4 right-4 badge-warning flex items-center gap-1 px-3 py-1.5">
            <Award className="h-4 w-4" />
            <span>Expert Pick #{venue.expertRank}</span>
          </div>
        )}
      </div>

      {/* Venue Info */}
      <div className="px-4 mt-4">
        <h1 className="text-2xl font-bold">{venue.name}</h1>
        <div className="flex items-center gap-3 mt-2 text-dark-400">
          <span>{venue.category}</span>
          {venue.priceLevel && (
            <span>{'$'.repeat(venue.priceLevel)}</span>
          )}
        </div>

        {/* Scores */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {venue.scores.tonight !== undefined && (
            <div className="card text-center">
              <div className="text-2xl font-bold text-primary-400">
                {Math.round(venue.scores.tonight)}
              </div>
              <div className="text-xs text-dark-400 mt-1">Tonight</div>
            </div>
          )}
          {venue.scores.monthly !== undefined && (
            <div className="card text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {Math.round(venue.scores.monthly)}
              </div>
              <div className="text-xs text-dark-400 mt-1">Power Score</div>
            </div>
          )}
          {venue.scores.rating !== undefined && (
            <div className="card text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="h-5 w-5 text-amber-400 fill-current" />
                <span className="text-2xl font-bold">{venue.scores.rating.toFixed(1)}</span>
              </div>
              <div className="text-xs text-dark-400 mt-1">
                {venue.scores.reviewCount} reviews
              </div>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="card mt-6">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-dark-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-dark-300">{venue.address}</p>
              {venue.distance !== undefined && (
                <p className="text-dark-500 text-sm mt-1">
                  {venue.distance.toFixed(1)} miles away
                </p>
              )}
            </div>
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
          >
            <Navigation className="h-4 w-4" />
            Get Directions
          </a>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="card card-hover flex items-center gap-3"
          >
            <Globe className="h-5 w-5 text-dark-400" />
            <span className="flex-1">View on Google Maps</span>
            <ExternalLink className="h-4 w-4 text-dark-500" />
          </a>
        </div>

        {/* Scoring Transparency */}
        <div className="card bg-dark-800/50 mt-8">
          <h3 className="font-semibold text-dark-300 mb-3">Score Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-dark-400">Base Rating</span>
              <span className="text-dark-300">
                {venue.scores.rating?.toFixed(1) || 'N/A'} / 5.0
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Review Count</span>
              <span className="text-dark-300">{venue.scores.reviewCount || 0}</span>
            </div>
            {venue.isExpertPick && (
              <div className="flex justify-between">
                <span className="text-dark-400">Expert Pick Bonus</span>
                <span className="text-amber-400">+{15 - ((venue.expertRank || 1) - 1) * 3}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-dark-500 mt-4">
            Scores use Bayesian adjustment for fair comparison across venues
            with different review counts.
          </p>
        </div>
      </div>
    </div>
  );
}
