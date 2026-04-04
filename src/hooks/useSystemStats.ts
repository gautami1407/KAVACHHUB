import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { SystemStat } from '@/lib/database.types';

export function useSystemStats() {
  const [stats, setStats] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const { data } = await supabase.from('system_stats').select('*');
    if (data) {
      const statMap: Record<string, string> = {};
      (data as SystemStat[]).forEach(s => {
        statMap[s.stat_key] = s.stat_value;
      });
      setStats(statMap);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Realtime subscription so all dashboards update live when any stat changes
  useEffect(() => {
    const channel = supabase
      .channel('system-stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_stats' }, (payload) => {
        const updated = payload.new as SystemStat;
        if (updated?.stat_key) {
          setStats(prev => ({ ...prev, [updated.stat_key]: updated.stat_value }));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Increment a stat by 1
  const incrementStat = useCallback(async (key: string) => {
    const current = parseInt((stats[key] || '0').replace(/,/g, '')) || 0;
    const newValue = String(current + 1);
    await supabase
      .from('system_stats')
      .update({ stat_value: newValue, updated_at: new Date().toISOString() })
      .eq('stat_key', key);
    setStats(prev => ({ ...prev, [key]: newValue }));
  }, [stats]);

  // Set a stat to a specific value
  const setStat = useCallback(async (key: string, value: string) => {
    await supabase
      .from('system_stats')
      .update({ stat_value: value, updated_at: new Date().toISOString() })
      .eq('stat_key', key);
    setStats(prev => ({ ...prev, [key]: value }));
  }, []);

  // Compute live stats from actual data and push to DB
  const computeLiveStats = useCallback(async () => {
    const { count: activeUnits } = await supabase
      .from('ambulances')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'offline');

    const { count: totalCompleted } = await supabase
      .from('emergencies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    const today = new Date().toISOString().split('T')[0];
    const { count: corridorsToday } = await supabase
      .from('green_corridors')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    const { count: signalsOverridden } = await supabase
      .from('traffic_signals')
      .select('*', { count: 'exact', head: true })
      .neq('mode', 'normal');

    const updates = [
      { key: 'active_units', value: String(activeUnits || 0) },
      { key: 'lives_saved', value: String(totalCompleted || 0) },
      { key: 'total_corridors_today', value: String(corridorsToday || 0) },
      { key: 'signals_overridden_today', value: String(signalsOverridden || 0) },
    ];

    for (const u of updates) {
      await supabase
        .from('system_stats')
        .update({ stat_value: u.value, updated_at: new Date().toISOString() })
        .eq('stat_key', u.key);
    }

    fetchStats();
  }, [fetchStats]);

  return { stats, loading, fetchStats, computeLiveStats, incrementStat, setStat };
}
