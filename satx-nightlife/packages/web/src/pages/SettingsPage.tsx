import { useState } from 'react';
import { Settings, MapPin, Bell, Moon, Info, ExternalLink, RefreshCw } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { RadiusSlider } from '../components/RadiusSlider';

export default function SettingsPage() {
  const { lat, lng, error: locationError, refreshLocation, loading } = useLocation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const handleEnableNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    }
  };

  const handleRefreshLocation = async () => {
    await refreshLocation();
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-dark-400" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>

      {/* Location Settings */}
      <div className="px-4 mt-6">
        <h2 className="text-sm font-medium text-dark-400 uppercase tracking-wider mb-3">
          Location
        </h2>
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-dark-400" />
              <div>
                <p className="font-medium">Current Location</p>
                {lat && lng ? (
                  <p className="text-sm text-dark-400">
                    {lat.toFixed(4)}, {lng.toFixed(4)}
                  </p>
                ) : locationError ? (
                  <p className="text-sm text-red-400">{locationError}</p>
                ) : (
                  <p className="text-sm text-dark-400">Loading...</p>
                )}
              </div>
            </div>
            <button
              onClick={handleRefreshLocation}
              disabled={loading}
              className="btn-ghost p-2"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="border-t border-dark-700 pt-4">
            <RadiusSlider />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="px-4 mt-6">
        <h2 className="text-sm font-medium text-dark-400 uppercase tracking-wider mb-3">
          Notifications
        </h2>
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-dark-400" />
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-dark-400">
                  Get alerts for trending venues
                </p>
              </div>
            </div>
            <button
              onClick={handleEnableNotifications}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                notificationsEnabled ? 'bg-primary-500' : 'bg-dark-600'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  notificationsEnabled ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="px-4 mt-6">
        <h2 className="text-sm font-medium text-dark-400 uppercase tracking-wider mb-3">
          About
        </h2>
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-dark-400" />
            <div>
              <p className="font-medium">SATX Nightlife Power Rankings</p>
              <p className="text-sm text-dark-400">Version 1.0.0</p>
            </div>
          </div>

          <div className="border-t border-dark-700 pt-4 space-y-3">
            <a
              href="https://github.com/satx-nightlife"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-sm text-dark-300 hover:text-white"
            >
              <span>Source Code</span>
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href="/privacy"
              className="flex items-center justify-between text-sm text-dark-300 hover:text-white"
            >
              <span>Privacy Policy</span>
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href="/terms"
              className="flex items-center justify-between text-sm text-dark-300 hover:text-white"
            >
              <span>Terms of Service</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="px-4 mt-6">
        <h2 className="text-sm font-medium text-dark-400 uppercase tracking-wider mb-3">
          Data Sources
        </h2>
        <div className="card">
          <p className="text-sm text-dark-400">
            Venue data is sourced from Google Places API and Yelp Fusion API in
            compliance with their respective Terms of Service. Event data comes
            from Eventbrite where available.
          </p>
          <p className="text-sm text-dark-400 mt-3">
            Scores are calculated using publicly available ratings, review counts,
            and event information. No personal data is scraped or collected without
            consent.
          </p>
        </div>
      </div>

      {/* Safety Reminder */}
      <div className="px-4 mt-6 mb-8">
        <div className="card bg-gradient-to-br from-amber-900/30 to-dark-800 border-amber-800/50">
          <h3 className="font-semibold text-amber-400 mb-2">🚗 Safety First</h3>
          <p className="text-sm text-dark-300">
            Always plan a safe ride home before heading out. Use rideshare
            services like Uber or Lyft, or designate a sober driver.
          </p>
          <p className="text-xs text-dark-400 mt-2">
            Please drink responsibly.
          </p>
        </div>
      </div>
    </div>
  );
}
