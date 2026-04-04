import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { TrafficSignal, CorridorSignal, GreenCorridor } from '@/lib/database.types';

export function useTrafficSignals() {
  const [signals, setSignals] = useState<TrafficSignal[]>([]);
  const [corridorSignals, setCorridorSignals] = useState<CorridorSignal[]>([]);
  const [activeCorridors, setActiveCorridors] = useState<GreenCorridor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSignals = useCallback(async () => {
    const { data } = await supabase
      .from('traffic_signals')
      .select('*')
      .order('signal_code');
    setSignals((data as TrafficSignal[]) || []);
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
  const updateCorridorSignalByProximity = useCallback(async (
    ambulanceLat: number,
    ambulanceLng: number,
    thresholdKm: number = 0.5
  ) => {
    for (const signal of signals) {
      const dist = Math.sqrt(
        Math.pow(signal.lat - ambulanceLat, 2) + Math.pow(signal.lng - ambulanceLng, 2)
      ) * 111; // rough km conversion

      if (dist < thresholdKm) {
        if (signal.mode !== 'corridor') {
          await updateSignalMode(signal.id, 'corridor');
        }
      } else if (dist < thresholdKm * 2) {
        if (signal.mode !== 'emergency') {
          await updateSignalMode(signal.id, 'emergency');
        }
      }
    }

    // Update corridor_signals table too
    for (const cs of corridorSignals) {
      const signal = signals.find(s => s.id === cs.signal_id);
      if (!signal) continue;

      const dist = Math.sqrt(
        Math.pow(signal.lat - ambulanceLat, 2) + Math.pow(signal.lng - ambulanceLng, 2)
      ) * 111;

      let newStatus: CorridorSignal['status'] = 'red';
      if (dist < thresholdKm) newStatus = 'green';
      else if (dist < thresholdKm * 2) newStatus = 'turning';

      if (cs.status !== newStatus) {
        await supabase
          .from('corridor_signals')
          .update({
            status: newStatus,
            ...(newStatus === 'green' ? { activated_at: new Date().toISOString() } : {}),
          })
          .eq('id', cs.id);
      }
    }
  }, [signals, corridorSignals, updateSignalMode]);

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
    updateSignalMode,
    updateCorridorSignalByProximity,
    manualOverride,
    fetchSignals,
  };
}
