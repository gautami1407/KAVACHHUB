import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { TrafficSignal, CorridorSignal, GreenCorridor } from '@/lib/database.types';

// Haversine distance in km — accurate for real coordinates
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useTrafficSignals() {
  const [signals, setSignals] = useState<TrafficSignal[]>([]);
  const [corridorSignals, setCorridorSignals] = useState<CorridorSignal[]>([]);
  const [activeCorridors, setActiveCorridors] = useState<GreenCorridor[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasGreenSignals, setHasGreenSignals] = useState(false);

  // Debounce guard to prevent rapid-fire DB updates
  const updateInProgress = useRef(false);

  const fetchSignals = useCallback(async () => {
    const { data } = await supabase
      .from('traffic_signals')
      .select('*')
      .order('signal_code');
    const fetched = (data as TrafficSignal[]) || [];
    setSignals(fetched);
    setHasGreenSignals(fetched.some(s => s.mode === 'corridor'));
    setLoading(false);
  }, []);

  const fetchActiveCorridors = useCallback(async () => {
    const { data } = await supabase
      .from('green_corridors')
      .select('*')
      .eq('status', 'active');
    setActiveCorridors((data as GreenCorridor[]) || []);

    if (data && data.length > 0) {
      const corridorIds = data.map(c => c.id);
      const { data: cs } = await supabase
        .from('corridor_signals')
        .select('*, signal:traffic_signals(*)')
        .in('corridor_id', corridorIds);
      setCorridorSignals((cs as CorridorSignal[]) || []);
    } else {
      setCorridorSignals([]);
    }
  }, []);

  useEffect(() => {
    fetchSignals();
    fetchActiveCorridors();
  }, [fetchSignals, fetchActiveCorridors]);

  // Realtime for signal changes
  useEffect(() => {
    const channel = supabase
      .channel('traffic-signals-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'traffic_signals' }, () => {
        fetchSignals();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'corridor_signals' }, () => {
        fetchActiveCorridors();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'green_corridors' }, () => {
        fetchActiveCorridors();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchSignals, fetchActiveCorridors]);

  // Update signal mode
  const updateSignalMode = useCallback(async (signalId: string, mode: TrafficSignal['mode']) => {
    await supabase
      .from('traffic_signals')
      .update({ mode, updated_at: new Date().toISOString() })
      .eq('id', signalId);
  }, []);

  // Update corridor signal status based on ambulance proximity
  // Now with proper Haversine + signals behind ambulance revert to normal
  const updateCorridorSignalByProximity = useCallback(async (
    ambulanceLat: number,
    ambulanceLng: number,
    thresholdKm: number = 0.5
  ) => {
    if (updateInProgress.current) return;
    updateInProgress.current = true;

    try {
      // Batch: collect all needed updates first, then apply
      const signalUpdates: { id: string; mode: TrafficSignal['mode'] }[] = [];
      const corridorUpdates: { id: string; status: CorridorSignal['status'] }[] = [];

      for (const signal of signals) {
        const dist = haversineKm(signal.lat, signal.lng, ambulanceLat, ambulanceLng);

        if (dist < thresholdKm) {
          // Ambulance is very close → GREEN corridor
          if (signal.mode !== 'corridor') {
            signalUpdates.push({ id: signal.id, mode: 'corridor' });
          }
        } else if (dist < thresholdKm * 2) {
          // Ambulance is approaching → EMERGENCY (turning)
          if (signal.mode !== 'emergency') {
            signalUpdates.push({ id: signal.id, mode: 'emergency' });
          }
        } else {
          // Ambulance has passed or is far away → revert to NORMAL
          if (signal.mode !== 'normal') {
            signalUpdates.push({ id: signal.id, mode: 'normal' });
          }
        }
      }

      // Apply signal mode updates
      for (const u of signalUpdates) {
        await supabase
          .from('traffic_signals')
          .update({ mode: u.mode, updated_at: new Date().toISOString() })
          .eq('id', u.id);
      }

      // Update corridor_signals table too
      for (const cs of corridorSignals) {
        const signal = signals.find(s => s.id === cs.signal_id);
        if (!signal) continue;

        const dist = haversineKm(signal.lat, signal.lng, ambulanceLat, ambulanceLng);

        let newStatus: CorridorSignal['status'] = 'red';
        if (dist < thresholdKm) newStatus = 'green';
        else if (dist < thresholdKm * 2) newStatus = 'turning';

        if (cs.status !== newStatus) {
          corridorUpdates.push({ id: cs.id, status: newStatus });
        }
      }

      // Apply corridor signal updates
      for (const u of corridorUpdates) {
        await supabase
          .from('corridor_signals')
          .update({
            status: u.status,
            ...(u.status === 'green' ? { activated_at: new Date().toISOString() } : {}),
          })
          .eq('id', u.id);
      }

      // Update local green signal state
      const greenCount = signals.filter(s => {
        const dist = haversineKm(s.lat, s.lng, ambulanceLat, ambulanceLng);
        return dist < thresholdKm;
      }).length;
      setHasGreenSignals(greenCount > 0);

    } finally {
      // Allow next update after a short delay
      setTimeout(() => { updateInProgress.current = false; }, 1000);
    }
  }, [signals, corridorSignals]);

  // Reset ALL signals to normal — used when emergency completes
  const resetAllSignals = useCallback(async () => {
    await supabase
      .from('traffic_signals')
      .update({ mode: 'normal', updated_at: new Date().toISOString() })
      .neq('mode', 'normal');
    setHasGreenSignals(false);
  }, []);

  // Manual override for traffic controllers
  const manualOverride = useCallback(async (signalId: string, mode: TrafficSignal['mode']) => {
    await updateSignalMode(signalId, mode);
    await supabase.from('notifications').insert({
      role_target: 'traffic',
      type: 'info',
      title: 'Signal Override',
      message: `Signal manually set to ${mode} mode`,
    });
  }, [updateSignalMode]);

  const corridorCount = signals.filter(s => s.mode === 'corridor').length;
  const emergencyCount = signals.filter(s => s.mode === 'emergency').length;

  return {
    signals,
    corridorSignals,
    activeCorridors,
    loading,
    corridorCount,
    emergencyCount,
    hasGreenSignals,
    updateSignalMode,
    updateCorridorSignalByProximity,
    manualOverride,
    resetAllSignals,
    fetchSignals,
  };
}
