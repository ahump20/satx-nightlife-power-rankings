'use client';

interface RankBadgeProps {
  rank: number;
  size?: 'sm' | 'md' | 'lg';
}

export function RankBadge({ rank, size = 'md' }: RankBadgeProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  // Special styling for top 3
  const getRankClass = () => {
    if (rank === 1) return 'rank-badge-1';
    if (rank === 2) return 'rank-badge-2';
    if (rank === 3) return 'rank-badge-3';
    return '';
  };

  return (
    <div
      className={`rank-badge ${sizeClasses[size]} ${getRankClass()}`}
      aria-label={`Ranked #${rank}`}
    >
      <span className="relative z-10">{rank}</span>
    </div>
  );
}
