import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Hospital, Doctor, Emergency } from '@/lib/database.types';

export function useHospital(hospitalId?: string) {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [incomingPatients, setIncomingPatients] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all hospitals
  const fetchHospitals = useCallback(async () => {
    const { data } = await supabase.from('hospitals').select('*');
    setHospitals((data as Hospital[]) || []);
    if (hospitalId && data) {
      const h = data.find(h => h.id === hospitalId);
      if (h) setHospital(h as Hospital);
    }
    setLoading(false);
  }, [hospitalId]);

  // Fetch doctors for a hospital
  const fetchDoctors = useCallback(async (hId: string) => {
    const { data } = await supabase
      .from('doctors')
      .select('*')
      .eq('hospital_id', hId);
    setDoctors((data as Doctor[]) || []);
  }, []);

  // Fetch incoming patients (emergencies assigned to this hospital)
  const fetchIncomingPatients = useCallback(async (hId: string) => {
    const { data } = await supabase
      .from('emergencies')
      .select('*')
      .eq('hospital_id', hId)
      .not('status', 'eq', 'completed')
      .order('triggered_at', { ascending: false });
    setIncomingPatients((data as Emergency[]) || []);
  }, []);

  useEffect(() => {
    fetchHospitals();
    if (hospitalId) {
      fetchDoctors(hospitalId);
      fetchIncomingPatients(hospitalId);
    }
  }, [hospitalId, fetchHospitals, fetchDoctors, fetchIncomingPatients]);

  // Realtime for hospital updates
  useEffect(() => {
    const channel = supabase
      .channel('hospital-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hospitals' }, () => {
        fetchHospitals();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, () => {
        if (hospitalId) fetchDoctors(hospitalId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies' }, () => {
        if (hospitalId) fetchIncomingPatients(hospitalId);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [hospitalId, fetchHospitals, fetchDoctors, fetchIncomingPatients]);

  // Update bed counts
  const updateBeds = useCallback(async (hId: string, field: string, value: number) => {
    await supabase
      .from('hospitals')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', hId);
  }, []);

  // Toggle doctor status
  const toggleDoctorStatus = useCallback(async (doctorId: string, status: 'available' | 'busy') => {
    await supabase
      .from('doctors')
      .update({ status })
      .eq('id', doctorId);
  }, []);

  // Get analytics
  const getAnalytics = useCallback(async (hId: string) => {
    const { data: allEmergencies } = await supabase
      .from('emergencies')
      .select('*')
      .eq('hospital_id', hId);

    const total = allEmergencies?.length || 0;
    const completed = allEmergencies?.filter(e => e.status === 'completed').length || 0;
    const today = allEmergencies?.filter(e => {
      const d = new Date(e.triggered_at);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length || 0;

    const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';

    return { total, completed, today, successRate: `${successRate}%` };
  }, []);

  return {
    hospital,
    hospitals,
    doctors,
    incomingPatients,
    loading,
    updateBeds,
    toggleDoctorStatus,
    getAnalytics,
    fetchHospitals,
  };
}
