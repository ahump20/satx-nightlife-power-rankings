'use client';

import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const defaultOptions: UseGeolocationOptions = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 60000, // Cache position for 1 minute
};

// San Antonio area default coordinates (Alamo)
const DEFAULT_COORDS = {
  latitude: 29.4241,
  longitude: -98.4936,
};

const STORAGE_KEY = 'satx-user-location';

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
    permission: 'unknown',
  });

  const mergedOptions = { ...defaultOptions, ...options };

  // Check stored location from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { latitude, longitude, timestamp } = JSON.parse(stored);
        const age = Date.now() - timestamp;
        // Use cached location if less than 30 minutes old
        if (age < 30 * 60 * 1000) {
          setState((prev) => ({
            ...prev,
            latitude,
            longitude,
          }));
        }
      } catch {
        // Invalid stored data, ignore
      }
    }
  }, []);

  // Check permission status
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.permissions) return;

    navigator.permissions
      .query({ name: 'geolocation' })
      .then((result) => {
        setState((prev) => ({
          ...prev,
          permission: result.state as GeolocationState['permission'],
        }));

        result.onchange = () => {
          setState((prev) => ({
            ...prev,
            permission: result.state as GeolocationState['permission'],
          }));
        };
      })
      .catch(() => {
        // Permission API not supported
      });
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported',
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Store in localStorage
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ latitude, longitude, timestamp: Date.now() })
        );

        setState({
          latitude,
          longitude,
          error: null,
          loading: false,
          permission: 'granted',
        });
      },
      (error) => {
        let errorMessage = 'Unable to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
          permission:
            error.code === error.PERMISSION_DENIED ? 'denied' : prev.permission,
        }));
      },
      {
        enableHighAccuracy: mergedOptions.enableHighAccuracy,
        timeout: mergedOptions.timeout,
        maximumAge: mergedOptions.maximumAge,
      }
    );
  }, [mergedOptions.enableHighAccuracy, mergedOptions.timeout, mergedOptions.maximumAge]);

  const clearLocation = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setState({
      latitude: null,
      longitude: null,
      error: null,
      loading: false,
      permission: 'unknown',
    });
  }, []);

  return {
    ...state,
    requestLocation,
    clearLocation,
    hasLocation: state.latitude !== null && state.longitude !== null,
    defaultCoords: DEFAULT_COORDS,
  };
}
