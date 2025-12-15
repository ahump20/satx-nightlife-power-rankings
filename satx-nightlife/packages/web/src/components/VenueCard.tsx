import { Link } from 'react-router-dom';
import { MapPin, Star, TrendingUp, TrendingDown, Award, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import type { LeaderboardEntry } from '../types';

interface VenueCardProps {
  entry: LeaderboardEntry;
  showRank?: boolean;
  showTrend?: boolean;
  onClick?: () => void;
}

export function VenueCard({ entry, showRank = true, showTrend = false, onClick }: VenueCardProps) {
  const { rank, venue, score, change } = entry;

  const rankClass =
    rank === 1
      ? 'rank-1'
      : rank === 2
      ? 'rank-2'
      : rank === 3
      ? 'rank-3'
      : 'rank-default';

  const trendIcon =
    change && change > 0 ? (
      <TrendingUp className="h-4 w-4 text-emerald-400" />
    ) : change && change < 0 ? (
      <TrendingDown className="h-4 w-4 text-red-400" />
    ) : null;

  return (
    <Link
      to={`/venue/${venue.id}`}
      onClick={onClick}
      className="card card-hover flex items-center gap-3 animate-slide-up"
    >
      {/* Rank Badge */}
      {showRank && <div className={rankClass}>{rank}</div>}

      {/* Venue Photo */}
      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-dark-700">
        {venue.photoUrl ? (
          <img
            src={venue.photoUrl}
            alt={venue.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">
            🍸
          </div>
        )}
        {venue.isExpertPick && (
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs">
            <Award className="h-3 w-3 text-white" />
          </div>
        )}
      </div>

      {/* Venue Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-white">{venue.name}</h3>
        <div className="mt-1 flex items-center gap-3 text-sm text-dark-400">
          <span className="truncate">{venue.category}</span>
          {venue.distance !== undefined && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              <MapPin className="h-3 w-3" />
              {venue.distance.toFixed(1)} mi
            </span>
          )}
        </div>
        {/* Rating and Reviews */}
        <div className="mt-1 flex items-center gap-2 text-sm">
          {venue.scores.rating && (
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="h-3 w-3 fill-current" />
              {venue.scores.rating.toFixed(1)}
            </span>
          )}
          {venue.scores.reviewCount && (
            <span className="text-dark-500">({venue.scores.reviewCount} reviews)</span>
          )}
        </div>
      </div>

      {/* Score & Trend */}
      <div className="flex flex-col items-end gap-1">
        <div className="rounded-lg bg-primary-500/20 px-2.5 py-1">
          <span className="font-bold text-primary-400">{Math.round(score)}</span>
        </div>
        {showTrend && trendIcon && (
          <div className="flex items-center gap-1 text-xs">
            {trendIcon}
            <span
              className={clsx(
                change && change > 0 && 'text-emerald-400',
                change && change < 0 && 'text-red-400'
              )}
            >
              {change && Math.abs(change)}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

interface VenueListProps {
  entries: LeaderboardEntry[];
  showRank?: boolean;
  showTrend?: boolean;
  emptyMessage?: string;
}

export function VenueList({
  entries,
  showRank = true,
  showTrend = false,
  emptyMessage = 'No venues found',
}: VenueListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-dark-400">
        <span className="text-4xl mb-4">🔍</span>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => (
        <VenueCard
          key={entry.venue.id}
          entry={entry}
          showRank={showRank}
          showTrend={showTrend}
        />
      ))}
    </div>
  );
}
