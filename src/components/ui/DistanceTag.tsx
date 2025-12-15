import { MapPin } from 'lucide-react';

interface DistanceTagProps {
  distance: string;
  size?: 'sm' | 'md';
}

export function DistanceTag({ distance, size = 'md' }: DistanceTagProps) {
  const sizeClasses = {
    sm: 'text-xs gap-0.5',
    md: 'text-sm gap-1',
  };

  return (
    <span className={`inline-flex items-center text-muted ${sizeClasses[size]}`}>
      <MapPin className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {distance}
    </span>
  );
}
