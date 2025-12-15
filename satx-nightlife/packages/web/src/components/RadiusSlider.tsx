import { useLocation } from '../context/LocationContext';

export function RadiusSlider() {
  const { radiusMiles, setRadiusMiles } = useLocation();

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-dark-400">Search radius</span>
        <span className="text-sm font-medium text-primary-400">{radiusMiles} miles</span>
      </div>
      <input
        type="range"
        min="1"
        max="25"
        value={radiusMiles}
        onChange={(e) => setRadiusMiles(parseInt(e.target.value, 10))}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-dark-500 mt-1">
        <span>1 mi</span>
        <span>25 mi</span>
      </div>
    </div>
  );
}
