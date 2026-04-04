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

  // Compute live stats from actual data
  const computeLiveStats = useCallback(async () => {
    // Count active ambulances
    const { count: activeUnits } = await supabase
      .from('ambulances')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'offline');

    // Count completed emergencies
    const { count: totalCompleted } = await supabase
      .from('emergencies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // Count today's corridors
    const today = new Date().toISOString().split('T')[0];
    const { count: corridorsToday } = await supabase
      .from('green_corridors')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    // Update system_stats
    const updates = [
      { key: 'active_units', value: String(activeUnits || 0) },
      { key: 'lives_saved', value: String(totalCompleted || 0) },
      { key: 'total_corridors_today', value: String(corridorsToday || 0) },
    ];

    for (const u of updates) {
      await supabase
        .from('system_stats')
        .update({ stat_value: u.value, updated_at: new Date().toISOString() })
        .eq('stat_key', u.key);
    }

    fetchStats();
  }, [fetchStats]);

  return { stats, loading, fetchStats, computeLiveStats };
}
