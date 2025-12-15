'use client';

import Image from 'next/image';
import Link from 'next/link';

const coverageAreas = [
  {
    name: 'The Pearl',
    description: 'Upscale dining & craft cocktails',
    image: '/images/pearl-district.jpg',
    venueCount: 12,
  },
  {
    name: 'River Walk',
    description: 'Downtown nightlife hub',
    image: '/images/riverwalk-night.jpg',
    venueCount: 25,
  },
  {
    name: 'The Rim / La Cantera',
    description: 'NW SA entertainment district',
    image: '/images/bar-interior.jpg',
    venueCount: 18,
  },
  {
    name: 'Stone Oak',
    description: 'Upscale suburban scene',
    image: '/images/cocktail-bar.jpg',
    venueCount: 14,
  },
  {
    name: 'Boerne',
    description: 'Hill Country charm',
    image: '/images/texas-hill-country.jpg',
    venueCount: 8,
  },
  {
    name: 'New Braunfels',
    description: 'Gruene Hall & beyond',
    image: '/images/downtown-night.jpg',
    venueCount: 10,
  },
];

export function CoverageArea() {
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h3 className="font-bold text-white">Coverage Areas</h3>
        <p className="text-sm text-gray-400 mt-1">
          San Antonio metro, Hill Country & beyond
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-gray-700">
        {coverageAreas.map((area) => (
          <Link
            key={area.name}
            href={`/rankings?area=${encodeURIComponent(area.name)}`}
            className="relative group bg-gray-800 overflow-hidden"
          >
            <div className="aspect-[4/3] relative">
              <Image
                src={area.image}
                alt={`${area.name} nightlife scene`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h4 className="font-semibold text-white text-sm">{area.name}</h4>
              <p className="text-xs text-gray-300">{area.description}</p>
              <span className="text-xs text-purple-400 mt-1 inline-block">
                {area.venueCount} venues
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
