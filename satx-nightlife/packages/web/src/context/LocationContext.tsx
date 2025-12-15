import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { LocationState } from '../types';

interface LocationContextType extends LocationState {
  setRadiusMiles: (miles: number) => void;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | null>(null);

// Default to downtown San Antonio
const DEFAULT_LOCATION = {
  lat: 29.4241,
  lng: -98.4936,
};

const STORAGE_KEY = 'satx-nightlife-radius';

export function LocationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LocationState>({
    lat: null,
    lng: null,
    loading: true,
    error: null,
    radiusMiles: parseInt(localStorage.getItem(STORAGE_KEY) || '10', 10),
  });

  const getLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        lat: DEFAULT_LOCATION.lat,
        lng: DEFAULT_LOCATION.lng,
        loading: false,
        error: 'Geolocation not supported',
      }));
      return;
    }

    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState((prev) => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            loading: false,
            error: null,
          }));
          resolve();
        },
        (error) => {
          console.error('Geolocation error:', error);
          setState((prev) => ({
            ...prev,
            lat: DEFAULT_LOCATION.lat,
            lng: DEFAULT_LOCATION.lng,
            loading: false,
            error: error.message,
          }));
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }, []);

  const setRadiusMiles = useCallback((miles: number) => {
    const clamped = Math.max(1, Math.min(25, miles));
    localStorage.setItem(STORAGE_KEY, String(clamped));
    setState((prev) => ({ ...prev, radiusMiles: clamped }));
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return (
    <LocationContext.Provider
      value={{
        ...state,
        setRadiusMiles,
        refreshLocation: getLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
