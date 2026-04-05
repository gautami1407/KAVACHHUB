import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Profile, Role } from '@/lib/database.types';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: Role) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data as Profile | null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      else setProfile(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, fullName: string, role: Role) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        role,
        full_name: fullName,
      });
      if (profileError) return { error: profileError.message };

      if (role === 'patient') {
        const emergencyCode = `JS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await supabase.from('patients').insert({
          user_id: data.user.id,
          emergency_id_code: emergencyCode,
        } as any);
      } else if (role === 'hospital') {
        const { data: newHospital } = await supabase.from('hospitals').insert({
          name: fullName + " Hospital",
          lat: 19.0760,
          lng: 72.8777,
          phone: "9999999999",
          icu_beds_total: 20,
          icu_beds_available: 5,
          general_beds_total: 100,
          general_beds_available: 45,
          emergency_beds_total: 10,
          emergency_beds_available: 3
        } as any).select().single() as any;

        if (newHospital) {
          // Add some dummy doctors for the staff allocation visuals
          await supabase.from('doctors').insert([
            { hospital_id: newHospital.id, name: 'Dr. Sharma', specialty: 'Cardiologist', status: 'available' },
            { hospital_id: newHospital.id, name: 'Dr. Gupta', specialty: 'Neurologist', status: 'busy' },
            { hospital_id: newHospital.id, name: 'Dr. Patel', specialty: 'Orthopedics', status: 'available' },
            { hospital_id: newHospital.id, name: 'Dr. Reddy', specialty: 'General Surgery', status: 'busy' },
          ] as any);

          // Create a dummy emergency to populate 'Incoming Patients'
          const { data: dummyAmbulance } = await supabase.from('ambulances').insert({
            unit_code: `AMB-${Math.floor(100 + Math.random() * 900)}`,
            status: 'enroute',
            lat: 19.0600,
            lng: 72.8900,
            current_speed: 60
          } as any).select().single() as any;

          await supabase.from('emergencies').insert({
            hospital_id: newHospital.id,
            ambulance_id: dummyAmbulance?.id,
            severity: 'critical',
            emergency_type: 'Cardiac Arrest',
            status: 'enroute',
            location_lat: 19.0500,
            location_lng: 72.9000,
            location_text: "Near BKC Junction",
            triggered_at: new Date().toISOString()
          } as any);
        }
      } else if (role === 'ambulance') {
        await supabase.from('ambulances').insert({
          unit_code: `AMB-${Math.floor(100 + Math.random() * 900)}`,
          driver_id: data.user.id,
          status: 'available',
          lat: 19.0760,
          lng: 72.8777,
        } as any);
      } else if (role === 'traffic') {
        await supabase.from('traffic_signals').insert({
          signal_code: `SIG-${Math.floor(100 + Math.random() * 900)}`,
          location: "Main Junction",
          lat: 19.0760,
          lng: 72.8777,
          mode: 'normal'
        } as any);
      }
    }
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
