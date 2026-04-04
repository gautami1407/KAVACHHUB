-- ============================================
-- JEEVAN SETU – Complete Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. PROFILES ───
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('patient', 'ambulance', 'hospital', 'traffic')),
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Service role can insert profiles" ON profiles FOR INSERT WITH CHECK (true);

-- ─── 2. PATIENTS ───
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blood_group TEXT,
  allergies TEXT,
  medical_conditions TEXT,
  emergency_id_code TEXT NOT NULL UNIQUE,
  date_of_birth DATE,
  gender TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can view own data" ON patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Patients can update own data" ON patients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can view patients" ON patients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Service role insert patients" ON patients FOR INSERT WITH CHECK (true);

-- ─── 3. EMERGENCY CONTACTS ───
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relation TEXT NOT NULL,
  phone TEXT NOT NULL,
  notified BOOLEAN DEFAULT false
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view contacts" ON emergency_contacts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Patients can manage own contacts" ON emergency_contacts FOR ALL USING (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);
CREATE POLICY "Service insert contacts" ON emergency_contacts FOR INSERT WITH CHECK (true);

-- ─── 4. AMBULANCES ───
CREATE TABLE IF NOT EXISTS ambulances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_code TEXT NOT NULL UNIQUE,
  driver_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'dispatched', 'enroute', 'arrived', 'offline')),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  current_speed DOUBLE PRECISION,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ambulances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view ambulances" ON ambulances FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Drivers can update own ambulance" ON ambulances FOR UPDATE USING (driver_id = auth.uid());
CREATE POLICY "Service insert ambulances" ON ambulances FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update ambulances" ON ambulances FOR UPDATE USING (true);

-- ─── 5. HOSPITALS ───
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  phone TEXT,
  icu_beds_total INTEGER NOT NULL DEFAULT 0,
  icu_beds_available INTEGER NOT NULL DEFAULT 0,
  general_beds_total INTEGER NOT NULL DEFAULT 0,
  general_beds_available INTEGER NOT NULL DEFAULT 0,
  emergency_beds_total INTEGER NOT NULL DEFAULT 0,
  emergency_beds_available INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view hospitals" ON hospitals FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Hospital admin can update" ON hospitals FOR UPDATE USING (true);
CREATE POLICY "Service insert hospitals" ON hospitals FOR INSERT WITH CHECK (true);

-- ─── 6. DOCTORS ───
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy')),
  phone TEXT
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view doctors" ON doctors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Service manage doctors" ON doctors FOR ALL USING (true);

-- ─── 7. EMERGENCIES ───
CREATE TABLE IF NOT EXISTS emergencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  ambulance_id UUID REFERENCES ambulances(id),
  hospital_id UUID REFERENCES hospitals(id),
  severity TEXT NOT NULL DEFAULT 'moderate' CHECK (severity IN ('critical', 'moderate', 'low')),
  emergency_type TEXT NOT NULL DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'triggered' CHECK (status IN ('triggered', 'assigned', 'enroute', 'corridor', 'arrived', 'completed')),
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  location_text TEXT,
  triggered_at TIMESTAMPTZ DEFAULT now(),
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT
);

ALTER TABLE emergencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view emergencies" ON emergencies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Service manage emergencies" ON emergencies FOR ALL USING (true);
CREATE POLICY "Authenticated insert emergencies" ON emergencies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update emergencies" ON emergencies FOR UPDATE USING (auth.role() = 'authenticated');

-- ─── 8. TRAFFIC SIGNALS ───
CREATE TABLE IF NOT EXISTS traffic_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signal_code TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  mode TEXT NOT NULL DEFAULT 'normal' CHECK (mode IN ('normal', 'emergency', 'corridor')),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE traffic_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view signals" ON traffic_signals FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Traffic controllers can update" ON traffic_signals FOR UPDATE USING (true);
CREATE POLICY "Service manage signals" ON traffic_signals FOR ALL USING (true);

-- ─── 9. GREEN CORRIDORS ───
CREATE TABLE IF NOT EXISTS green_corridors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emergency_id UUID NOT NULL REFERENCES emergencies(id) ON DELETE CASCADE,
  ambulance_id UUID NOT NULL REFERENCES ambulances(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE green_corridors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view corridors" ON green_corridors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Service manage corridors" ON green_corridors FOR ALL USING (true);

-- ─── 10. CORRIDOR SIGNALS ───
CREATE TABLE IF NOT EXISTS corridor_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corridor_id UUID NOT NULL REFERENCES green_corridors(id) ON DELETE CASCADE,
  signal_id UUID NOT NULL REFERENCES traffic_signals(id),
  status TEXT NOT NULL DEFAULT 'red' CHECK (status IN ('red', 'turning', 'green')),
  activated_at TIMESTAMPTZ
);

ALTER TABLE corridor_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view corridor signals" ON corridor_signals FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Service manage corridor signals" ON corridor_signals FOR ALL USING (true);

-- ─── 11. NOTIFICATIONS ───
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  role_target TEXT CHECK (role_target IN ('patient', 'ambulance', 'hospital', 'traffic')),
  type TEXT NOT NULL CHECK (type IN ('emergency', 'info', 'success')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (
  auth.uid() = user_id OR role_target IN (SELECT role FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Service manage notifications" ON notifications FOR ALL USING (true);
CREATE POLICY "Authenticated insert notifications" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ─── 12. SYSTEM STATS ───
CREATE TABLE IF NOT EXISTS system_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_key TEXT NOT NULL UNIQUE,
  stat_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE system_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view stats" ON system_stats FOR SELECT USING (true);
CREATE POLICY "Service manage stats" ON system_stats FOR ALL USING (true);

-- ─── 13. ASSIST INSTRUCTIONS ───
CREATE TABLE IF NOT EXISTS assist_instructions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emergency_type TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  instruction_text TEXT NOT NULL,
  UNIQUE(emergency_type, step_number)
);

ALTER TABLE assist_instructions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view instructions" ON assist_instructions FOR SELECT USING (true);

-- ============================================
-- SEED DATA
-- ============================================

-- System Stats
INSERT INTO system_stats (stat_key, stat_value) VALUES
  ('avg_response_time', '4.2 min'),
  ('lives_saved', '12,847'),
  ('active_units', '342'),
  ('total_corridors_today', '6'),
  ('signals_overridden_today', '14'),
  ('system_uptime', '99.9%')
ON CONFLICT (stat_key) DO NOTHING;

-- Traffic Signals (Delhi/Noida area)
INSERT INTO traffic_signals (signal_code, location, lat, lng, mode) VALUES
  ('TL-01', 'Sector 62 Junction', 28.6280, 77.3649, 'normal'),
  ('TL-02', 'NH-24 Crossing', 28.6220, 77.3580, 'normal'),
  ('TL-03', 'Metro Station Signal', 28.6150, 77.3510, 'normal'),
  ('TL-04', 'City Center', 28.6100, 77.3450, 'normal'),
  ('TL-05', 'Hospital Road', 28.6040, 77.3390, 'normal'),
  ('TL-06', 'Ring Road East', 28.5980, 77.3320, 'normal'),
  ('TL-07', 'Railway Crossing', 28.5920, 77.3260, 'normal'),
  ('TL-08', 'Industrial Area', 28.5860, 77.3200, 'normal')
ON CONFLICT (signal_code) DO NOTHING;

-- Assist Instructions
INSERT INTO assist_instructions (emergency_type, step_number, instruction_text) VALUES
  ('Cardiac Arrest', 1, 'Call for help and ask someone to bring a defibrillator (AED)'),
  ('Cardiac Arrest', 2, 'Check if the person is responsive and breathing'),
  ('Cardiac Arrest', 3, 'Begin chest compressions: 30 compressions, 2 breaths'),
  ('Cardiac Arrest', 4, 'Use AED if available, follow voice prompts'),
  ('Cardiac Arrest', 5, 'Continue CPR until ambulance arrives'),
  ('Fracture', 1, 'Do NOT move the injured limb'),
  ('Fracture', 2, 'Apply ice wrapped in cloth to reduce swelling'),
  ('Fracture', 3, 'Immobilize the area with a splint if possible'),
  ('Fracture', 4, 'Keep the person calm and still until help arrives'),
  ('Stroke', 1, 'Use FAST test: Face drooping, Arm weakness, Speech difficulty, Time to call'),
  ('Stroke', 2, 'Note the time symptoms started'),
  ('Stroke', 3, 'Keep the person lying down with head slightly elevated'),
  ('Stroke', 4, 'Do NOT give food or water'),
  ('Stroke', 5, 'Wait for ambulance — do NOT drive them yourself'),
  ('Allergic Reaction', 1, 'Ask if they have an EpiPen and help them use it'),
  ('Allergic Reaction', 2, 'Help them sit upright to ease breathing'),
  ('Allergic Reaction', 3, 'Loosen tight clothing'),
  ('Allergic Reaction', 4, 'If they become unresponsive, begin CPR'),
  ('General', 1, 'Check if the person is breathing normally'),
  ('General', 2, 'Apply pressure to any visible bleeding wound'),
  ('General', 3, 'Keep the person calm and still'),
  ('General', 4, 'Do NOT move them unless there is immediate danger'),
  ('General', 5, 'Wait for ambulance to arrive')
ON CONFLICT (emergency_type, step_number) DO NOTHING;

-- Sample Hospital
INSERT INTO hospitals (name, address, lat, lng, phone, icu_beds_total, icu_beds_available, general_beds_total, general_beds_available, emergency_beds_total, emergency_beds_available) VALUES
  ('AIIMS Delhi', 'Sri Aurobindo Marg, Ansari Nagar, New Delhi', 28.5672, 77.2100, '+91-11-26588500', 20, 4, 120, 23, 30, 8),
  ('Max Super Speciality Hospital', 'Sector 19, Noida, UP', 28.5825, 77.3210, '+91-120-4300000', 15, 3, 80, 15, 20, 5),
  ('Fortis Hospital Noida', 'B-22, Sector 62, Noida, UP', 28.6268, 77.3649, '+91-120-2400444', 18, 5, 100, 20, 25, 7)
ON CONFLICT DO NOTHING;

-- Sample Doctors (linked to first hospital)
-- Note: These will be linked after hospital insert. Use a DO block:
DO $$
DECLARE
  h_id UUID;
BEGIN
  SELECT id INTO h_id FROM hospitals WHERE name = 'AIIMS Delhi' LIMIT 1;
  IF h_id IS NOT NULL THEN
    INSERT INTO doctors (hospital_id, name, specialty, status, phone) VALUES
      (h_id, 'Dr. R. Mehta', 'Cardiology', 'available', '+91-98765-43210'),
      (h_id, 'Dr. S. Gupta', 'Neurology', 'busy', '+91-98765-43211'),
      (h_id, 'Dr. A. Khan', 'Emergency Medicine', 'available', '+91-98765-43212'),
      (h_id, 'Dr. P. Joshi', 'Orthopedics', 'busy', '+91-98765-43213'),
      (h_id, 'Dr. L. Nair', 'ICU', 'available', '+91-98765-43214')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Sample Ambulances
INSERT INTO ambulances (unit_code, status, lat, lng) VALUES
  ('A-12', 'available', 28.6139, 77.2090),
  ('A-15', 'available', 28.6200, 77.3500),
  ('A-22', 'available', 28.5900, 77.3100),
  ('A-08', 'offline', 28.5700, 77.2200)
ON CONFLICT (unit_code) DO NOTHING;

-- Enable Realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE emergencies;
ALTER PUBLICATION supabase_realtime ADD TABLE ambulances;
ALTER PUBLICATION supabase_realtime ADD TABLE traffic_signals;
ALTER PUBLICATION supabase_realtime ADD TABLE corridor_signals;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE hospitals;
ALTER PUBLICATION supabase_realtime ADD TABLE green_corridors;
