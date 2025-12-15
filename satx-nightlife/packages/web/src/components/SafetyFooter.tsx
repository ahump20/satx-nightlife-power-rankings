import { Car } from 'lucide-react';

const RIDESHARE_LINKS = [
  {
    name: 'Uber',
    url: 'uber://',
    fallback: 'https://m.uber.com',
  },
  {
    name: 'Lyft',
    url: 'lyft://',
    fallback: 'https://www.lyft.com',
  },
];

export function SafetyFooter() {
  const handleRideshareClick = (app: (typeof RIDESHARE_LINKS)[0]) => {
    // Try to open native app, fall back to web
    window.location.href = app.url;
    setTimeout(() => {
      window.location.href = app.fallback;
    }, 500);
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2">
      <div className="rounded-xl bg-dark-800/95 backdrop-blur border border-dark-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-dark-400">
            <Car className="h-4 w-4" />
            <span className="text-xs">Plan a safe ride home</span>
          </div>
          <div className="flex gap-2">
            {RIDESHARE_LINKS.map((app) => (
              <button
                key={app.name}
                onClick={() => handleRideshareClick(app)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                {app.name}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-dark-500">
          Please drink responsibly
        </p>
      </div>
    </div>
  );
}
