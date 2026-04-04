import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Hospital, Doctor, Emergency } from '@/lib/database.types';

// Haversine distance in km
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

// Extended emergency type with patient and ambulance details
export interface IncomingPatient extends Emergency {
  patientName?: string;
  bloodGroup?: string;
  allergies?: string;
  medicalConditions?: string;
  ambulanceUnit?: string;
  ambulanceLat?: number;
  ambulanceLng?: number;
  etaMinutes?: number;
  distanceKm?: number;
}

export function useHospital(hospitalId?: string) {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [incomingPatients, setIncomingPatients] = useState<IncomingPatient[]>([]);
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

  // Fetch incoming patients with full joined details
  const fetchIncomingPatients = useCallback(async (hId: string) => {
    const { data: emergencies } = await supabase
      .from('emergencies')
      .select('*')
      .eq('hospital_id', hId)
      .not('status', 'eq', 'completed')
      .order('triggered_at', { ascending: false });

    if (!emergencies || emergencies.length === 0) {
      setIncomingPatients([]);
      return;
    }

    // For each emergency, fetch patient and ambulance details
    const enriched: IncomingPatient[] = await Promise.all(
      emergencies.map(async (e) => {
        const base: IncomingPatient = { ...e };

        // Fetch patient details
        if (e.patient_id) {
          const { data: patient } = await supabase
            .from('patients')
            .select('blood_group, allergies, medical_conditions, user_id')
            .eq('id', e.patient_id)
            .single();

          if (patient) {
            base.bloodGroup = patient.blood_group || 'Unknown';
            base.allergies = patient.allergies || 'None';
            base.medicalConditions = patient.medical_conditions || 'None';

            // Fetch profile name
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', patient.user_id)
              .single();
            base.patientName = profile?.full_name || 'Unknown';
          }
        }

        // Fetch ambulance details and compute ETA
        if (e.ambulance_id) {
          const { data: amb } = await supabase
            .from('ambulances')
            .select('unit_code, lat, lng, current_speed')
            .eq('id', e.ambulance_id)
            .single();

          if (amb) {
            base.ambulanceUnit = amb.unit_code;
            base.ambulanceLat = amb.lat;
            base.ambulanceLng = amb.lng;

            // Compute distance and ETA from ambulance to hospital
            if (amb.lat && amb.lng && hospitalId) {
              const { data: hosp } = await supabase
                .from('hospitals')
                .select('lat, lng')
                .eq('id', hId)
                .single();
              if (hosp) {
                const dist = haversineKm(amb.lat, amb.lng, hosp.lat, hosp.lng);
                base.distanceKm = Math.round(dist * 10) / 10;
                const speed = amb.current_speed && amb.current_speed > 0 ? amb.current_speed : 40;
                base.etaMinutes = Math.ceil((dist / speed) * 60);
              }
            }
          }
        }

        return base;
      })
    );

    setIncomingPatients(enriched);
  }, [hospitalId]);

  useEffect(() => {
    fetchHospitals();
    if (hospitalId) {
      fetchDoctors(hospitalId);
      fetchIncomingPatients(hospitalId);
    }
  }, [hospitalId, fetchHospitals, fetchDoctors, fetchIncomingPatients]);

  // Realtime for hospital updates — refresh every time any related table changes
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ambulances' }, () => {
        // Re-fetch to get updated ambulance positions and ETAs
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
    fetchIncomingPatients,
  };
}
