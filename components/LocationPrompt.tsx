'use client';

interface LocationPromptProps {
  onEnableLocation: () => void;
}

export default function LocationPrompt({ onEnableLocation }: LocationPromptProps) {
  return (
    <div className="bg-accent/20 border-b border-accent/30 py-3">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📍</span>
            <div>
              <p className="font-semibold">Enable location for personalized recommendations</p>
              <p className="text-sm text-gray-300">
                Find the best venues near you with live deals and events
              </p>
            </div>
          </div>
          <button
            onClick={onEnableLocation}
            className="px-4 py-2 bg-accent hover:bg-accent-light text-black rounded-lg font-semibold transition"
          >
            Enable Location
          </button>
        </div>
      </div>
    </div>
  );
}
