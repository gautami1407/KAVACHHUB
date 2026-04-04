export type Role = 'patient' | 'ambulance' | 'hospital' | 'traffic';
export type EmergencyStatus = 'triggered' | 'assigned' | 'enroute' | 'corridor' | 'arrived' | 'completed';
export type Severity = 'critical' | 'moderate' | 'low';
export type AmbulanceStatus = 'available' | 'dispatched' | 'enroute' | 'arrived' | 'offline';
export type SignalMode = 'normal' | 'emergency' | 'corridor';
export type CorridorSignalStatus = 'red' | 'turning' | 'green';

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Patient {
  id: string;
  user_id: string;
  blood_group: string | null;
  allergies: string | null;
  medical_conditions: string | null;
  emergency_id_code: string;
  date_of_birth: string | null;
  gender: string | null;
  created_at: string;
}

export interface EmergencyContact {
  id: string;
  patient_id: string;
  name: string;
  relation: string;
  phone: string;
  notified: boolean;
}

export interface Ambulance {
  id: string;
  unit_code: string;
  driver_id: string | null;
  status: AmbulanceStatus;
  lat: number | null;
  lng: number | null;
  current_speed: number | null;
  updated_at: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  icu_beds_total: number;
  icu_beds_available: number;
  general_beds_total: number;
  general_beds_available: number;
  emergency_beds_total: number;
  emergency_beds_available: number;
  updated_at: string;
}

export interface Doctor {
  id: string;
  hospital_id: string;
  name: string;
  specialty: string;
  status: 'available' | 'busy';
  phone: string | null;
}

export interface Emergency {
  id: string;
  patient_id: string | null;
  ambulance_id: string | null;
  hospital_id: string | null;
  severity: Severity;
  emergency_type: string;
  status: EmergencyStatus;
  location_lat: number;
  location_lng: number;
  location_text: string | null;
  triggered_at: string;
  assigned_at: string | null;
  completed_at: string | null;
  notes: string | null;
  // Joined data
  patient?: Patient;
  ambulance?: Ambulance;
  hospital?: Hospital;
}

export interface TrafficSignal {
  id: string;
  signal_code: string;
  location: string;
  lat: number;
  lng: number;
  mode: SignalMode;
  updated_at: string;
}

export interface GreenCorridor {
  id: string;
  emergency_id: string;
  ambulance_id: string;
  status: 'active' | 'completed';
  created_at: string;
  completed_at: string | null;
}

export interface CorridorSignal {
  id: string;
  corridor_id: string;
  signal_id: string;
  status: CorridorSignalStatus;
  activated_at: string | null;
  signal?: TrafficSignal;
}

export interface Notification {
  id: string;
  user_id: string | null;
  role_target: Role | null;
  type: 'emergency' | 'info' | 'success';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface SystemStat {
  id: string;
  stat_key: string;
  stat_value: string;
  updated_at: string;
}

export interface AssistInstruction {
  id: string;
  emergency_type: string;
  step_number: number;
  instruction_text: string;
}

// Supabase Database type wrapper
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; role: Role; full_name: string }; Update: Partial<Profile> };
      patients: { Row: Patient; Insert: Partial<Patient> & { user_id: string; emergency_id_code: string }; Update: Partial<Patient> };
      emergency_contacts: { Row: EmergencyContact; Insert: Partial<EmergencyContact> & { patient_id: string; name: string; relation: string; phone: string }; Update: Partial<EmergencyContact> };
      ambulances: { Row: Ambulance; Insert: Partial<Ambulance> & { unit_code: string }; Update: Partial<Ambulance> };
      hospitals: { Row: Hospital; Insert: Partial<Hospital> & { name: string; lat: number; lng: number }; Update: Partial<Hospital> };
      doctors: { Row: Doctor; Insert: Partial<Doctor> & { hospital_id: string; name: string; specialty: string }; Update: Partial<Doctor> };
      emergencies: { Row: Emergency; Insert: Partial<Emergency> & { severity: Severity; emergency_type: string; location_lat: number; location_lng: number }; Update: Partial<Emergency> };
      traffic_signals: { Row: TrafficSignal; Insert: Partial<TrafficSignal> & { signal_code: string; location: string; lat: number; lng: number }; Update: Partial<TrafficSignal> };
      green_corridors: { Row: GreenCorridor; Insert: Partial<GreenCorridor> & { emergency_id: string; ambulance_id: string }; Update: Partial<GreenCorridor> };
      corridor_signals: { Row: CorridorSignal; Insert: Partial<CorridorSignal> & { corridor_id: string; signal_id: string }; Update: Partial<CorridorSignal> };
      notifications: { Row: Notification; Insert: Partial<Notification> & { type: 'emergency' | 'info' | 'success'; title: string; message: string }; Update: Partial<Notification> };
      system_stats: { Row: SystemStat; Insert: Partial<SystemStat> & { stat_key: string; stat_value: string }; Update: Partial<SystemStat> };
      assist_instructions: { Row: AssistInstruction; Insert: Partial<AssistInstruction> & { emergency_type: string; step_number: number; instruction_text: string }; Update: Partial<AssistInstruction> };
    };
  };
}
