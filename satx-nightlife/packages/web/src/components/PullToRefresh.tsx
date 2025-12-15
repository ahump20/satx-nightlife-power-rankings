import { useState, useRef, useCallback, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

const THRESHOLD = 80;

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;

    if (distance > 0 && window.scrollY === 0) {
      // Apply resistance to pull
      const resistedDistance = Math.min(distance * 0.5, THRESHOLD * 1.5);
      setPullDistance(resistedDistance);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    isPulling.current = false;

    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [pullDistance, isRefreshing, onRefresh]);

  const showIndicator = pullDistance > 10 || isRefreshing;
  const isReady = pullDistance >= THRESHOLD;

  return (
    <div
      className="touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={clsx(
          'pull-indicator flex items-center justify-center py-4 transition-opacity duration-200',
          showIndicator ? 'opacity-100' : 'opacity-0'
        )}
        style={{ height: pullDistance || (isRefreshing ? 60 : 0) }}
      >
        <RefreshCw
          className={clsx(
            'h-6 w-6 text-primary-400 transition-transform',
            isRefreshing && 'refresh-spinner',
            isReady && !isRefreshing && 'scale-110'
          )}
          style={{
            transform: !isRefreshing
              ? `rotate(${pullDistance * 2}deg)`
              : undefined,
          }}
        />
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling.current ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
