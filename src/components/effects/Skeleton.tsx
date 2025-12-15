'use client';

import { ReactNode } from 'react';

interface SkeletonProps {
  className?: string;
  children?: ReactNode;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

// Skeleton for venue cards
export function VenueCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'featured' }) {
  if (variant === 'compact') {
    return (
      <div className="card flex gap-4 p-3">
        <Skeleton className="w-20 h-20 flex-shrink-0 rounded-md" />
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-8 rounded" />
          </div>
        </div>
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div className="card overflow-hidden">
        <Skeleton className="aspect-[16/10]" />
        <div className="p-4">
          <div className="flex justify-between gap-3">
            <div className="flex-1">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
          </div>
          <div className="flex gap-4 mt-4">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="card overflow-hidden">
      <Skeleton className="aspect-[4/3]" />
      <div className="p-3">
        <div className="flex justify-between gap-2">
          <div className="flex-1">
            <Skeleton className="h-5 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="w-10 h-6 rounded flex-shrink-0" />
        </div>
        <div className="flex justify-between mt-2">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

// Skeleton for the rankings list
export function RankingsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <VenueCardSkeleton key={i} variant="compact" />
      ))}
    </div>
  );
}

// Skeleton for area cards in horizontal scroll
export function AreaCardSkeleton() {
  return (
    <div className="card relative w-44 flex-shrink-0 overflow-hidden">
      <Skeleton className="aspect-[4/3]" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <Skeleton className="h-4 w-3/4 mb-1" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

// Skeleton for hero section
export function HeroSkeleton() {
  return (
    <div className="relative h-[70vh] min-h-[500px] bg-charcoal">
      <div className="absolute inset-0 skeleton" />
      <div className="gradient-overlay" />
      <div className="relative z-10 container h-full flex flex-col justify-end pb-12">
        <Skeleton className="h-4 w-48 mb-3" />
        <Skeleton className="h-12 w-3/4 mb-2" />
        <Skeleton className="h-12 w-1/2 mb-4" />
        <Skeleton className="h-5 w-96 max-w-full mb-6" />
        <div className="flex gap-3">
          <Skeleton className="h-11 w-32 rounded-md" />
          <Skeleton className="h-11 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}

// Skeleton for venue detail page
export function VenueDetailSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Hero image */}
      <div className="relative h-64 md:h-80">
        <Skeleton className="absolute inset-0" />
      </div>

      {/* Content */}
      <div className="container py-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-5 w-1/2" />
          </div>
          <Skeleton className="w-20 h-20 rounded-full" />
        </div>

        {/* Quick info */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>

        {/* Description */}
        <div className="space-y-2 mb-8">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Ratings */}
        <div className="card p-4 mb-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Skeleton className="h-12 w-12 rounded-full mx-auto mb-2" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
            <div className="text-center">
              <Skeleton className="h-12 w-12 rounded-full mx-auto mb-2" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
            <div className="text-center">
              <Skeleton className="h-12 w-12 rounded-full mx-auto mb-2" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
          </div>
        </div>

        {/* Hours */}
        <div className="card p-4">
          <Skeleton className="h-5 w-24 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading spinner
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-slate border-t-copper rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
}

// Full page loading
export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-midnight/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted text-sm">Loading...</p>
      </div>
    </div>
  );
}
