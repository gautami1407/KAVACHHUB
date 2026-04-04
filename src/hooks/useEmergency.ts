import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Emergency, Severity, Patient, EmergencyContact, AssistInstruction } from '@/lib/database.types';

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

export function useEmergency(userId?: string) {
  const [activeEmergency, setActiveEmergency] = useState<Emergency | null>(null);
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [assistSteps, setAssistSteps] = useState<AssistInstruction[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch patient data for a user
  const fetchPatientData = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', uid)
      .single();
    if (data) {
      setPatientData(data as Patient);
      // Fetch contacts
      const { data: contacts } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('patient_id', data.id);
      setEmergencyContacts((contacts as EmergencyContact[]) || []);
    }
  }, []);

  // Fetch active emergency for this user
  const fetchActiveEmergency = useCallback(async (uid: string) => {
    // Check as patient
    const { data: patientRow } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', uid)
      .single();

    if (patientRow) {
      const { data } = await supabase
        .from('emergencies')
        .select('*')
        .eq('patient_id', patientRow.id)
        .not('status', 'eq', 'completed')
        .order('triggered_at', { ascending: false })
        .limit(1)
        .single();
      if (data) setActiveEmergency(data as Emergency);
    }

    // Also check as ambulance driver
    const { data: ambRow } = await supabase
      .from('ambulances')
      .select('id')
      .eq('driver_id', uid)
      .single();

    if (ambRow) {
      const { data } = await supabase
        .from('emergencies')
        .select('*')
        .eq('ambulance_id', ambRow.id)
        .not('status', 'eq', 'completed')
        .order('triggered_at', { ascending: false })
        .limit(1)
        .single();
      if (data) setActiveEmergency(data as Emergency);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchPatientData(userId);
      fetchActiveEmergency(userId);
    }
  }, [userId, fetchPatientData, fetchActiveEmergency]);

  // Fetch assist instructions for a given emergency type
  const fetchAssistInstructions = useCallback(async (emergencyType: string) => {
    const { data } = await supabase
      .from('assist_instructions')
      .select('*')
      .eq('emergency_type', emergencyType)
      .order('step_number');
    setAssistSteps((data as AssistInstruction[]) || []);
  }, []);

  // Trigger a new emergency
  const triggerEmergency = useCallback(async (opts: {
    patientId?: string;
    severity: Severity;
    emergencyType: string;
    lat: number;
    lng: number;
    locationText?: string;
  }) => {
    setLoading(true);

    // Find nearest available ambulance using Haversine
    const { data: ambulances } = await supabase
      .from('ambulances')
      .select('*')
      .eq('status', 'available');

    let nearestAmbulance = null;
    let minDist = Infinity;
    if (ambulances) {
      for (const amb of ambulances) {
        if (amb.lat && amb.lng) {
          const dist = haversineKm(amb.lat, amb.lng, opts.lat, opts.lng);
          if (dist < minDist) {
            minDist = dist;
            nearestAmbulance = amb;
          }
        }
      }
    }

    // Find nearest hospital with available emergency beds
    const { data: hospitals } = await supabase
      .from('hospitals')
      .select('*')
      .gt('emergency_beds_available', 0);

    let nearestHospital = null;
    minDist = Infinity;
    if (hospitals) {
      for (const h of hospitals) {
        const dist = haversineKm(h.lat, h.lng, opts.lat, opts.lng);
        if (dist < minDist) {
          minDist = dist;
          nearestHospital = h;
        }
      }
    }

    // Create emergency record
    const { data: emergency, error } = await supabase
      .from('emergencies')
      .insert({
        patient_id: opts.patientId || null,
        ambulance_id: nearestAmbulance?.id || null,
        hospital_id: nearestHospital?.id || null,
        severity: opts.severity,
        emergency_type: opts.emergencyType,
        status: nearestAmbulance ? 'assigned' : 'triggered',
        location_lat: opts.lat,
        location_lng: opts.lng,
        location_text: opts.locationText || null,
        assigned_at: nearestAmbulance ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (emergency && nearestAmbulance) {
      // Mark ambulance as dispatched
      await supabase
        .from('ambulances')
        .update({ status: 'dispatched' })
        .eq('id', nearestAmbulance.id);

      // Send notification to ambulance driver
      if (nearestAmbulance.driver_id) {
        await supabase.from('notifications').insert({
          user_id: nearestAmbulance.driver_id,
          type: 'emergency',
          title: '🚨 Incoming Emergency',
          message: `${opts.emergencyType} — ${opts.locationText || 'Unknown location'}. Severity: ${opts.severity}`,
        });
      }

      // Compute ETA for hospital notification
      let etaMin = '...';
      if (nearestAmbulance.lat && nearestAmbulance.lng) {
        const ambToPatient = haversineKm(nearestAmbulance.lat, nearestAmbulance.lng, opts.lat, opts.lng);
        etaMin = String(Math.ceil((ambToPatient / 40) * 60)); // 40 km/h average
      }

      // Send structured notification to hospital with ETA and details
      await supabase.from('notifications').insert({
        role_target: 'hospital',
        type: 'emergency',
        title: '🏥 Incoming Patient Alert',
        message: `${opts.emergencyType} patient (${opts.severity}) en route via ${nearestAmbulance.unit_code}. ETA: ~${etaMin} min. Location: ${opts.locationText || 'N/A'}`,
      });

      // Notify traffic controllers
      await supabase.from('notifications').insert({
        role_target: 'traffic',
        type: 'emergency',
        title: '🚦 Green Corridor Required',
        message: `Ambulance ${nearestAmbulance.unit_code} dispatched for ${opts.emergencyType}. Prepare corridor.`,
      });

      // Notify emergency contacts
      if (opts.patientId) {
        const { data: contacts } = await supabase
          .from('emergency_contacts')
          .select('*')
          .eq('patient_id', opts.patientId);

        if (contacts) {
          for (const contact of contacts) {
            await supabase
              .from('emergency_contacts')
              .update({ notified: true })
              .eq('id', contact.id);
          }
        }
      }
    }

    if (emergency) {
      setActiveEmergency(emergency as Emergency);
      fetchAssistInstructions(opts.emergencyType);
    }
    setLoading(false);
    return { emergency, error };
  }, [fetchAssistInstructions]);

  // Accept an emergency (ambulance driver)
  const acceptEmergency = useCallback(async (emergencyId: string) => {
    const { data } = await supabase
      .from('emergencies')
      .update({ status: 'enroute' })
      .eq('id', emergencyId)
      .select()
      .single();

    if (data) {
      setActiveEmergency(data as Emergency);

      // Update ambulance status
      if (data.ambulance_id) {
        await supabase
          .from('ambulances')
          .update({ status: 'enroute' })
          .eq('id', data.ambulance_id);
      }

      // Create green corridor
      if (data.ambulance_id) {
        const { data: corridor } = await supabase
          .from('green_corridors')
          .insert({
            emergency_id: emergencyId,
            ambulance_id: data.ambulance_id,
            status: 'active',
          })
          .select()
          .single();

        // Add all signals to corridor
        if (corridor) {
          const { data: signals } = await supabase
            .from('traffic_signals')
            .select('id');
          if (signals) {
            const corridorSignals = signals.map(s => ({
              corridor_id: corridor.id,
              signal_id: s.id,
              status: 'red' as const,
            }));
            await supabase.from('corridor_signals').insert(corridorSignals);
          }
        }
      }

      // Send notification to patient
      await supabase.from('notifications').insert({
        role_target: 'patient',
        type: 'success',
        title: '🚑 Ambulance En Route',
        message: 'Your ambulance is on its way. Green corridor is being prepared.',
      });
    }
    return data as Emergency | null;
  }, []);

  // ──── STATUS TRANSITION: enroute → corridor ────
  // Called by ambulance dashboard when first signal turns green
  const activateCorridorStatus = useCallback(async (emergencyId: string) => {
    const { data } = await supabase
      .from('emergencies')
      .update({ status: 'corridor' })
      .eq('id', emergencyId)
      .select()
      .single();

    if (data) {
      setActiveEmergency(data as Emergency);

      await supabase.from('notifications').insert({
        role_target: 'patient',
        type: 'success',
        title: '🟢 Green Corridor Active',
        message: 'Traffic signals are clearing the path for your ambulance.',
      });
      await supabase.from('notifications').insert({
        role_target: 'hospital',
        type: 'info',
        title: '🟢 Green Corridor Active',
        message: 'Ambulance corridor activated. Patient arrival imminent.',
      });
    }
    return data as Emergency | null;
  }, []);

  // ──── STATUS TRANSITION: corridor/enroute → arrived ────
  // Checks if ambulance is within arrivalThresholdKm of the emergency location
  const checkAndMarkArrived = useCallback(async (
    emergencyId: string,
    ambulanceLat: number,
    ambulanceLng: number,
    targetLat: number,
    targetLng: number,
    arrivalThresholdKm: number = 0.3
  ) => {
    const dist = haversineKm(ambulanceLat, ambulanceLng, targetLat, targetLng);
    if (dist > arrivalThresholdKm) return null;

    const { data } = await supabase
      .from('emergencies')
      .update({ status: 'arrived' })
      .eq('id', emergencyId)
      .select()
      .single();

    if (data) {
      setActiveEmergency(data as Emergency);

      // Update ambulance status
      if (data.ambulance_id) {
        await supabase
          .from('ambulances')
          .update({ status: 'arrived' })
          .eq('id', data.ambulance_id);
      }

      await supabase.from('notifications').insert({
        role_target: 'patient',
        type: 'success',
        title: '🏥 Ambulance Arrived',
        message: 'The ambulance has reached you. Medical help is here.',
      });
      await supabase.from('notifications').insert({
        role_target: 'hospital',
        type: 'success',
        title: '🏥 Patient Arriving',
        message: 'Ambulance has picked up the patient. Prepare for arrival.',
      });
    }
    return data as Emergency | null;
  }, []);

  // Update emergency status — generic
  const updateEmergencyStatus = useCallback(async (emergencyId: string, status: Emergency['status']) => {
    const { data } = await supabase
      .from('emergencies')
      .update({
        status,
        ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
      })
      .eq('id', emergencyId)
      .select()
      .single();

    if (data) {
      setActiveEmergency(data as Emergency);
      if (status === 'completed' && data.ambulance_id) {
        // Reset ambulance
        await supabase
          .from('ambulances')
          .update({ status: 'available' })
          .eq('id', data.ambulance_id);

        // Complete green corridor
        await supabase
          .from('green_corridors')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('emergency_id', emergencyId);

        // Delete corridor signals
        const { data: corridors } = await supabase
          .from('green_corridors')
          .select('id')
          .eq('emergency_id', emergencyId);
        if (corridors) {
          for (const c of corridors) {
            await supabase
              .from('corridor_signals')
              .delete()
              .eq('corridor_id', c.id);
          }
        }

        // Reset traffic signals to normal
        await supabase
          .from('traffic_signals')
          .update({ mode: 'normal', updated_at: new Date().toISOString() })
          .neq('mode', 'normal');

        // Update system stats
        const { data: livesStat } = await supabase
          .from('system_stats')
          .select('stat_value')
          .eq('stat_key', 'lives_saved')
          .single();
        if (livesStat) {
          const current = parseInt(livesStat.stat_value.replace(/,/g, '')) || 0;
          await supabase
            .from('system_stats')
            .update({ stat_value: String(current + 1), updated_at: new Date().toISOString() })
            .eq('stat_key', 'lives_saved');
        }

        // Notify all roles
        await supabase.from('notifications').insert({
          role_target: 'patient',
          type: 'success',
          title: '✅ Emergency Completed',
          message: 'Patient has been delivered to the hospital. Stay safe.',
        });
        await supabase.from('notifications').insert({
          role_target: 'hospital',
          type: 'success',
          title: '✅ Patient Delivered',
          message: 'Ambulance has delivered the patient. Emergency closed.',
        });
        await supabase.from('notifications').insert({
          role_target: 'traffic',
          type: 'info',
          title: '✅ Corridor Deactivated',
          message: 'Green corridor has been deactivated. Signals returning to normal.',
        });
      }
    }
  }, []);

  // Realtime subscription for emergency updates
  useEffect(() => {
    if (!activeEmergency) return;

    const channel = supabase
      .channel('emergency-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'emergencies', filter: `id=eq.${activeEmergency.id}` },
        (payload) => {
          setActiveEmergency(payload.new as Emergency);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeEmergency?.id]);

  // Fetch emergency by ID (for scan page)
  const fetchEmergencyById = useCallback(async (emergencyId: string) => {
    const { data } = await supabase
      .from('emergencies')
      .select('*')
      .eq('id', emergencyId)
      .single();
    return data as Emergency | null;
  }, []);

  // Fetch patient by emergency_id_code (for QR scan)
  const fetchPatientByCode = useCallback(async (code: string) => {
    const { data: patient } = await supabase
      .from('patients')
      .select('*')
      .eq('emergency_id_code', code)
      .single();

    if (patient) {
      const { data: contacts } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('patient_id', patient.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patient.user_id)
        .single();

      return { patient: patient as Patient, contacts: (contacts || []) as EmergencyContact[], profile };
    }
    return null;
  }, []);

  return {
    activeEmergency,
    patientData,
    emergencyContacts,
    assistSteps,
    loading,
    triggerEmergency,
    acceptEmergency,
    activateCorridorStatus,
    checkAndMarkArrived,
    updateEmergencyStatus,
    fetchAssistInstructions,
    fetchEmergencyById,
    fetchPatientByCode,
    fetchActiveEmergency,
  };
}
