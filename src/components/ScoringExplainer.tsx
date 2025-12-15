'use client';

import { useState } from 'react';
import { useScoringMethodology } from '@/hooks/useVenues';
import { Info, ChevronDown, ChevronUp, Star, Scale } from 'lucide-react';

export function ScoringExplainer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { weights, categories, methodology, isLoading } = useScoringMethodology();

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl p-4 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-purple-400" />
          <span className="font-bold text-white">How We Score</span>
          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
            Transparent
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-6">
          {/* Methodology overview */}
          {methodology && (
            <div className="bg-gray-700/30 rounded-lg p-3">
              <p className="text-sm text-gray-300">{methodology.description}</p>
              <code className="block mt-2 text-xs text-purple-400 bg-black/30 p-2 rounded">
                {methodology.formula}
              </code>
              <p className="text-xs text-gray-500 mt-2">{methodology.updates}</p>
            </div>
          )}

          {/* Weight categories */}
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(categories).map(([category, categoryWeights]: [string, any]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-400 uppercase">
                  {category === 'quality'
                    ? '📊 Review Quality'
                    : category === 'engagement'
                    ? '🎯 Engagement'
                    : category === 'convenience'
                    ? '📍 Convenience'
                    : '⭐ Special'}
                </h4>
                <div className="space-y-1">
                  {categoryWeights.map((weight: any) => (
                    <div
                      key={weight.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-300">{weight.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${weight.percentage}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-xs w-8">
                          {weight.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* No bias notice */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-green-400 mb-2">
              100% Data-Driven Rankings
            </h4>
            <p className="text-xs text-gray-400">
              No expert picks or arbitrary boosts. Every venue is scored purely
              on aggregated ratings from verified sources. The algorithm treats
              all venues equally.
            </p>
          </div>

          {/* Data sources */}
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">
              Data Sources
            </h4>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                Google Places API
              </span>
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                Yelp Fusion API
              </span>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                Internal Deals DB
              </span>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                No Paid Placements
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              All data is fetched from official APIs. No ToS-violating scraping.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
