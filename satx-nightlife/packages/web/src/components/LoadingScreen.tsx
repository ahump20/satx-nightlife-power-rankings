export function LoadingScreen() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary-500/30" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary-500">
            <span className="text-2xl">🌃</span>
          </div>
        </div>
        <p className="text-dark-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export function VenueCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-full bg-dark-700" />
        <div className="flex-1">
          <div className="h-5 w-32 rounded bg-dark-700" />
          <div className="mt-2 h-4 w-24 rounded bg-dark-700" />
        </div>
        <div className="h-8 w-16 rounded-lg bg-dark-700" />
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <VenueCardSkeleton key={i} />
      ))}
    </div>
  );
}
