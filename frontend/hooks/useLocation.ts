"use client";
import { useState, useEffect } from "react";

export interface LocationState {
  lat: number | null;
  lng: number | null;
  loading: boolean;
  error: string | null;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    lat: null,
    lng: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, loading: false, error: "Geolocation not supported" }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          loading: false,
          error: null,
        });
      },
      (err) => {
        // Default to Delhi if denied
        setState({ lat: 28.6139, lng: 77.209, loading: false, error: err.message });
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, []);

  return state;
}
