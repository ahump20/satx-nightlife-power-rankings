import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, MapPin, Star } from 'lucide-react';
import { useVenueSearch } from '../hooks/useApi';
import { useLocation } from '../context/LocationContext';
import type { Venue } from '../types';

export default function SearchPage() {
  const { lat, lng } = useLocation();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: results, isLoading } = useVenueSearch(debouncedQuery, lat, lng);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const clearSearch = () => {
    setQuery('');
    setDebouncedQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="pb-20">
      {/* Search Header */}
      <div className="sticky top-[57px] z-40 glass px-4 py-3 border-b border-dark-800">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search venues..."
            className="input pl-12 pr-12"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-dark-700"
            >
              <X className="h-4 w-4 text-dark-400" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 mt-4">
        {isLoading && debouncedQuery && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        )}

        {!isLoading && results && results.length > 0 && (
          <div className="space-y-2">
            {results.map((venue) => (
              <SearchResult key={venue.id} venue={venue} />
            ))}
          </div>
        )}

        {!isLoading && debouncedQuery && results && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-dark-400">
            <span className="text-4xl mb-4">🔍</span>
            <p>No results for "{debouncedQuery}"</p>
            <p className="text-sm mt-2">Try a different search term</p>
          </div>
        )}

        {!debouncedQuery && (
          <div className="flex flex-col items-center justify-center py-12 text-dark-400">
            <Search className="h-12 w-12 mb-4 opacity-50" />
            <p>Search for bars, clubs, and nightlife venues</p>
            <p className="text-sm mt-2">in the San Antonio area</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResult({ venue }: { venue: Venue }) {
  return (
    <Link
      to={`/venue/${venue.id}`}
      className="card card-hover flex items-center gap-3"
    >
      {/* Photo */}
      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-dark-700">
        {venue.photoUrl ? (
          <img
            src={venue.photoUrl}
            alt={venue.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl">
            🍸
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-white truncate">{venue.name}</h3>
        <div className="flex items-center gap-3 text-sm text-dark-400 mt-1">
          <span className="truncate">{venue.category}</span>
          {venue.distance !== undefined && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              <MapPin className="h-3 w-3" />
              {venue.distance.toFixed(1)} mi
            </span>
          )}
        </div>
      </div>

      {/* Rating */}
      {venue.scores.rating && (
        <div className="flex items-center gap-1 text-amber-400">
          <Star className="h-4 w-4 fill-current" />
          <span className="text-sm font-medium">{venue.scores.rating.toFixed(1)}</span>
        </div>
      )}
    </Link>
  );
}
