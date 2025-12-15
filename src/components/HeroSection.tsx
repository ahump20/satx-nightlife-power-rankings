'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

const heroImages = [
  {
    src: '/images/riverwalk-night.jpg',
    alt: 'San Antonio River Walk at night with colorful lights reflecting on water',
    location: 'River Walk, San Antonio',
  },
  {
    src: '/images/pearl-district.jpg',
    alt: 'The Pearl District restaurant and bar scene',
    location: 'The Pearl District',
  },
  {
    src: '/images/bar-interior.jpg',
    alt: 'Upscale bar interior with ambient lighting',
    location: 'Local Craft Bar',
  },
  {
    src: '/images/texas-hill-country.jpg',
    alt: 'Texas Hill Country sunset landscape near Boerne',
    location: 'Hill Country',
  },
];

export function HeroSection() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-64 md:h-80 overflow-hidden">
      {heroImages.map((image, index) => (
        <div
          key={image.src}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentImage ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover"
            priority={index === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
        </div>
      ))}

      {/* Hero content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        <div className="max-w-7xl mx-auto w-full">
          <p className="text-purple-400 text-sm font-medium mb-1">
            San Antonio • Boerne • New Braunfels
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Discover Tonight&apos;s Best Spots
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-lg">
            Real-time rankings powered by reviews, social buzz, and local intel
          </p>
        </div>
      </div>

      {/* Image indicators */}
      <div className="absolute bottom-4 right-4 flex gap-1.5">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImage(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentImage
                ? 'bg-purple-400 w-4'
                : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`View image ${index + 1}`}
          />
        ))}
      </div>

      {/* Current location tag */}
      <div className="absolute bottom-4 left-4">
        <span className="text-xs bg-black/50 text-white px-2 py-1 rounded backdrop-blur-sm">
          📍 {heroImages[currentImage].location}
        </span>
      </div>
    </div>
  );
}
