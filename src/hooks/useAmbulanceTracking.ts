import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Ambulance } from '@/lib/database.types';

interface Position {
  lat: number;
  lng: number;
  speed: number | null;
}

export function useAmbulanceTracking(ambulanceId?: string, isDriver: boolean = false) {
  const [ambulancePosition, setAmbulancePosition] = useState<Position | null>(null);
  const [allAmbulances, setAllAmbulances] = useState<Ambulance[]>([]);
  const [eta, setEta] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Calculate ETA based on distance and speed
  const calculateETA = useCallback((distKm: number, speedKmh: number | null): number => {
    const avgSpeed = speedKmh && speedKmh > 0 ? speedKmh : 40; // Default 40 km/h
    return Math.ceil((distKm / avgSpeed) * 60); // minutes
  }, []);

  // Start broadcasting position (ambulance driver)
  const startTracking = useCallback(async () => {
    if (!isDriver || !ambulanceId) return;
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, speed } = position.coords;
        const speedKmh = speed ? speed * 3.6 : null; // m/s to km/h

        setAmbulancePosition({ lat: latitude, lng: longitude, speed: speedKmh });

        // Update ambulance position in DB
        await supabase
          .from('ambulances')
          .update({
            lat: latitude,
            lng: longitude,
            current_speed: speedKmh,
            updated_at: new Date().toISOString(),
          })
          .eq('id', ambulanceId);
      },
      (error) => console.error('Geolocation error:', error),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
    );
  }, [isDriver, ambulanceId]);

  // Stop broadcasting
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Subscribe to ambulance position changes (for patient/hospital/traffic dashboards)
  useEffect(() => {
    if (!ambulanceId || isDriver) return;

    // Initial fetch
    const fetchPosition = async () => {
      const { data } = await supabase
        .from('ambulances')
        .select('*')
        .eq('id', ambulanceId)
        .single();
      if (data && data.lat && data.lng) {
        setAmbulancePosition({ lat: data.lat, lng: data.lng, speed: data.current_speed });
      }
    };
    fetchPosition();

    // Realtime subscription
    const channel = supabase
      .channel(`ambulance-${ambulanceId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ambulances', filter: `id=eq.${ambulanceId}` },
        (payload) => {
          const amb = payload.new as Ambulance;
          if (amb.lat && amb.lng) {
            setAmbulancePosition({ lat: amb.lat, lng: amb.lng, speed: amb.current_speed });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ambulanceId, isDriver]);

  // Update ETA when position changes
  const updateETA = useCallback((destLat: number, destLng: number) => {
    if (!ambulancePosition) return;
    const dist = calculateDistance(ambulancePosition.lat, ambulancePosition.lng, destLat, destLng);
    setDistance(Math.round(dist * 10) / 10);
    setEta(calculateETA(dist, ambulancePosition.speed));
  }, [ambulancePosition, calculateDistance, calculateETA]);

  // Fetch all active ambulances (for traffic dashboard)
  const fetchAllAmbulances = useCallback(async () => {
    const { data } = await supabase
      .from('ambulances')
      .select('*')
      .neq('status', 'offline');
    setAllAmbulances((data as Ambulance[]) || []);
  }, []);

  // Realtime for all ambulances
  useEffect(() => {
    fetchAllAmbulances();
    const channel = supabase
      .channel('all-ambulances')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ambulances' },
        () => { fetchAllAmbulances(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAllAmbulances]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopTracking();
  }, [stopTracking]);

  return {
    ambulancePosition,
    allAmbulances,
    eta,
    distance,
    startTracking,
    stopTracking,
    updateETA,
    calculateDistance,
  };
}
