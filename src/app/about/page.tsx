import { ScoringExplainer } from '@/components/ScoringExplainer';
import { Info, Github, Mail } from 'lucide-react';

export const metadata = {
  title: 'About | SATX Nightlife Power Rankings',
  description: 'Learn about how we rank San Antonio nightlife venues',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">About</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Mission */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h2 className="font-bold text-white mb-3">Our Mission</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            SATX Nightlife Power Rankings provides transparent, data-driven
            rankings for bars, breweries, and nightlife venues across the San
            Antonio metro area. We focus on the NW side and Boerne, bringing
            visibility to both established favorites and hidden gems.
          </p>
        </div>

        {/* Scoring methodology (expanded by default) */}
        <ScoringExplainer />

        {/* Data sources */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h2 className="font-bold text-white mb-3">Data Sources</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 font-bold">G</span>
              </div>
              <div>
                <h3 className="font-medium text-white">Google Places API</h3>
                <p className="text-gray-400">
                  Official ratings, review counts, and business information via
                  Google&apos;s Places API.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-red-400 font-bold">Y</span>
              </div>
              <div>
                <h3 className="font-medium text-white">Yelp Fusion API</h3>
                <p className="text-gray-400">
                  Ratings and reviews from Yelp&apos;s official API with proper
                  attribution.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-green-400 font-bold">D</span>
              </div>
              <div>
                <h3 className="font-medium text-white">Internal Deals Database</h3>
                <p className="text-gray-400">
                  Curated happy hours, events, and specials maintained by our
                  team.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-400">
              <strong className="text-gray-300">Privacy & Compliance:</strong> We
              only use official APIs and do not scrape websites. All data is
              collected in compliance with API Terms of Service.
            </p>
          </div>
        </div>

        {/* Expert picks */}
        <div className="bg-gradient-to-br from-yellow-900/30 to-gray-800 rounded-xl p-4">
          <h2 className="font-bold text-white mb-3">⭐ Expert Picks</h2>
          <p className="text-gray-300 text-sm mb-4">
            Our expert picks receive a transparent scoring boost. These venues
            have been selected based on quality, atmosphere, and contribution to
            the local nightlife scene.
          </p>
          <div className="grid gap-2">
            {[
              {
                name: "George's Keep",
                reason: 'Award-winning craft cocktail bar',
              },
              {
                name: 'Camp 1604',
                reason: 'Premier NW SA destination',
              },
              {
                name: 'Kung Fu Noodle',
                reason: 'Unique late-night atmosphere',
              },
              {
                name: 'The Venue',
                reason: 'Top Boerne entertainment',
              },
            ].map((pick) => (
              <div
                key={pick.name}
                className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3"
              >
                <div>
                  <h3 className="font-medium text-white">{pick.name}</h3>
                  <p className="text-xs text-gray-400">{pick.reason}</p>
                </div>
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                  +10-15%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h2 className="font-bold text-white mb-3">Built With</h2>
          <div className="flex flex-wrap gap-2">
            {[
              'Next.js 14',
              'TypeScript',
              'Tailwind CSS',
              'PostgreSQL',
              'PostGIS',
              'SWR',
              'PWA',
            ].map((tech) => (
              <span
                key={tech}
                className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h2 className="font-bold text-white mb-3">Contact</h2>
          <div className="space-y-2">
            <a
              href="mailto:hello@satxnightlife.app"
              className="flex items-center gap-2 text-purple-400 hover:underline"
            >
              <Mail className="w-4 h-4" />
              hello@satxnightlife.app
            </a>
            <p className="text-xs text-gray-400 mt-2">
              Are you a venue owner? Want to update your listing or add deals?
              Get in touch!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
