import { useState, useEffect } from "react";
import { Hospital, Bed, Users, BarChart3, Bell, Clock, AlertTriangle, TrendingUp, Activity, MapPin, Heart, Droplets, FileWarning, Timer, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { RoleHeader } from "@/components/RoleHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { MiniAnalytics } from "@/components/MiniAnalytics";
import { PrivacyToggle } from "@/components/PrivacyToggle";
import { LiveMap } from "@/components/LiveMap";
import { NotificationPanel } from "@/components/NotificationPanel";
import { NetworkStatus } from "@/components/NetworkStatus";
import { SeverityIndicator } from "@/components/SeverityIndicator";
import { useAuth } from "@/hooks/useSupabaseAuth";
import { useHospital } from "@/hooks/useHospital";
import type { IncomingPatient } from "@/hooks/useHospital";
import { useNotifications } from "@/hooks/useNotifications";
import { useAmbulanceTracking } from "@/hooks/useAmbulanceTracking";
import { supabase } from "@/lib/supabaseClient";

// Preparation checklist based on emergency type
const PREP_CHECKLISTS: Record<string, string[]> = {
  "Cardiac Arrest": ["Defibrillator ready", "ICU bed prepared", "Cardiologist on standby", "Blood bank notified", "Ventilator available"],
  "Fracture": ["X-Ray room booked", "Orthopedic surgeon notified", "Splinting materials ready", "Pain management prepared"],
  "Stroke": ["CT scanner ready", "Neurologist on standby", "Thrombolytic drugs prepared", "ICU bed reserved"],
  "Allergic Reaction": ["Epinephrine prepared", "Antihistamines ready", "Oxygen support available", "Observation bed ready"],
  "General": ["Emergency bed prepared", "Doctor on standby", "Basic vitals equipment ready", "Medical history form prepared", "Blood work setup"],
};

export default function HospitalDashboard() {
  const { user, profile } = useAuth();
  const [myHospitalId, setMyHospitalId] = useState<string | null>(null);

  // Find hospital for this admin
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("hospitals").select("id").limit(1).single();
      if (data) setMyHospitalId(data.id);
    };
    fetch();
  }, []);

  const { hospital, doctors, incomingPatients, loading, updateBeds, toggleDoctorStatus, getAnalytics } = useHospital(myHospitalId || undefined);
  const { notifications } = useNotifications(user?.id, profile?.role);

  const [privacy, setPrivacy] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [prepChecks, setPrepChecks] = useState<Record<string, boolean>>({});
  const [analytics, setAnalytics] = useState<{ total: number; completed: number; today: number; successRate: string }>({ total: 0, completed: 0, today: 0, successRate: "0%" });

  // Fetch analytics
  useEffect(() => {
    if (!myHospitalId) return;
    getAnalytics(myHospitalId).then(setAnalytics);
  }, [myHospitalId, getAnalytics, incomingPatients]);

  // Get selected patient details
  const selectedEmergency = incomingPatients.find(p => p.id === selectedPatient) as IncomingPatient | undefined;
  const { ambulancePosition } = useAmbulanceTracking(selectedEmergency?.ambulance_id || undefined);

  const ambulanceProgress = (() => {
    if (!ambulancePosition || !selectedEmergency) return 30;
    return Math.min(95, Math.max(5, 50));
  })();

  // Update prep checklist when selected patient changes
  useEffect(() => {
    if (selectedEmergency) {
      const type = selectedEmergency.emergency_type;
      const items = PREP_CHECKLISTS[type] || PREP_CHECKLISTS["General"];
      const checks: Record<string, boolean> = {};
      items.forEach(item => { checks[item] = false; });
      setPrepChecks(checks);
    }
  }, [selectedPatient]); // eslint-disable-line

  const togglePrep = (item: string) => {
    setPrepChecks(prev => ({ ...prev, [item]: !prev[item] }));
  };

  // Alerts from notifications
  const alerts = notifications.slice(0, 6).map(n => ({
    msg: n.message,
    time: new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    type: n.type as "emergency" | "info" | "success",
  }));

  if (loading || !hospital) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Hospital className="w-12 h-12 text-primary/20 mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading hospital data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <RoleHeader title="Hospital Command Center" icon={Hospital}>
        <div className="flex items-center gap-2">
          <NetworkStatus />
          <NotificationPanel />
        </div>
      </RoleHeader>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">{hospital.name}</div>
          <PrivacyToggle enabled={privacy} onToggle={() => setPrivacy(!privacy)} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={Bed} label="ICU Available" value={`${hospital.icu_beds_available}/${hospital.icu_beds_total}`} color="text-destructive" pulse />
          <StatCard icon={Bed} label="General Beds" value={`${hospital.general_beds_available}/${hospital.general_beds_total}`} color="text-primary" />
          <StatCard icon={Bed} label="Emergency" value={`${hospital.emergency_beds_available}/${hospital.emergency_beds_total}`} color="text-warning" />
          <StatCard icon={Activity} label="Cases Today" value={analytics.today.toString()} color="text-warning" />
          <StatCard icon={TrendingUp} label="Success Rate" value={analytics.successRate} color="text-success" />
        </div>

        {/* Selected patient detail view with map + info */}
        {selectedPatient !== null && selectedEmergency && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in-up">
            {/* Map tracking */}
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Tracking Ambulance</h3>
                  {selectedEmergency.ambulanceUnit && (
                    <StatusBadge severity="success">Unit {selectedEmergency.ambulanceUnit}</StatusBadge>
                  )}
                </div>
                <button onClick={() => setSelectedPatient(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
              </div>
              <LiveMap
                className="h-48 md:h-64"
                showRoute
                ambulanceProgress={ambulanceProgress}
                startCoords={[selectedEmergency.location_lat, selectedEmergency.location_lng]}
                endCoords={hospital ? [hospital.lat, hospital.lng] : undefined}
                ambulanceLatLng={
                  selectedEmergency.ambulanceLat && selectedEmergency.ambulanceLng
                    ? [selectedEmergency.ambulanceLat, selectedEmergency.ambulanceLng]
                    : undefined
                }
              />
              {/* ETA overlay */}
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
                  <Timer className="w-4 h-4 text-primary" />
                  <span className="text-lg font-black">{selectedEmergency.etaMinutes ?? '...'}</span>
                  <span className="text-xs text-muted-foreground">min ETA</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary border border-border">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-lg font-black">{selectedEmergency.distanceKm ?? '...'}</span>
                  <span className="text-xs text-muted-foreground">km away</span>
                </div>
                <StatusBadge severity={selectedEmergency.status === 'corridor' ? 'success' : selectedEmergency.status === 'arrived' ? 'success' : 'warning'}>
                  {selectedEmergency.status === 'corridor' ? '🟢 Corridor Active' :
                   selectedEmergency.status === 'arrived' ? '🏥 Arrived' :
                   selectedEmergency.status === 'enroute' ? '🚑 En Route' : selectedEmergency.status}
                </StatusBadge>
              </div>
            </GlassCard>

            {/* Patient details + prep checklist */}
            <div className="space-y-4">
              <GlassCard>
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-4 h-4 text-destructive" />
                  <h3 className="font-semibold text-sm">Patient Details</h3>
                  <SeverityIndicator level={selectedEmergency.severity === 'critical' ? 'critical' : selectedEmergency.severity === 'moderate' ? 'moderate' : 'stable'} className="!py-0.5 !px-2 text-[10px]" />
                </div>
                <div className={`space-y-2 text-sm ${privacy ? 'blur-sm select-none' : ''}`}>
                  <InfoRow icon={<Users className="w-3.5 h-3.5" />} label="Name" value={selectedEmergency.patientName || 'Unknown'} />
                  <InfoRow icon={<Droplets className="w-3.5 h-3.5 text-destructive" />} label="Blood Group" value={selectedEmergency.bloodGroup || 'Unknown'} highlight />
                  <InfoRow icon={<FileWarning className="w-3.5 h-3.5" />} label="Allergies" value={selectedEmergency.allergies || 'None'} />
                  <InfoRow icon={<Activity className="w-3.5 h-3.5" />} label="Condition" value={selectedEmergency.emergency_type} />
                  <InfoRow icon={<FileWarning className="w-3.5 h-3.5" />} label="Medical History" value={selectedEmergency.medicalConditions || 'None'} />
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <h3 className="font-semibold text-sm">Preparation Checklist</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Object.values(prepChecks).filter(Boolean).length}/{Object.keys(prepChecks).length} done
                  </span>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(prepChecks).map(([item, checked]) => (
                    <button
                      key={item}
                      onClick={() => togglePrep(item)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left text-sm transition-all ${
                        checked ? 'bg-success/5 border-success/15 text-foreground' : 'bg-secondary/50 border-border text-muted-foreground hover:border-primary/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        checked ? 'bg-success border-success' : 'border-border'
                      }`}>
                        {checked && <CheckCircle2 className="w-3 h-3 text-success-foreground" />}
                      </div>
                      <span className={checked ? 'line-through opacity-60' : ''}>{item}</span>
                    </button>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Incoming Patients */}
          <div className="lg:col-span-2">
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <h3 className="font-semibold text-sm">Incoming Patients</h3>
                </div>
                <span className="text-xs text-muted-foreground">{incomingPatients.length} en route</span>
              </div>
              <div className="space-y-2">
                {incomingPatients.length > 0 ? incomingPatients.map((p, i) => {
                  const patient = p as IncomingPatient;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPatient(p.id === selectedPatient ? null : p.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer animate-fade-in-up ${
                        p.severity === "critical" ? "bg-destructive/5 border-destructive/15" : "bg-secondary/50 border-border"
                      } ${selectedPatient === p.id ? "ring-2 ring-primary/30" : "hover:border-primary/20"}`}
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                          {p.emergency_type[0]}
                        </div>
                        <div className={privacy ? "blur-sm select-none" : ""}>
                          <div className="text-sm font-medium flex items-center gap-2">
                            {patient.patientName || p.emergency_type}
                            {patient.bloodGroup && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-bold">
                                {patient.bloodGroup}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{p.location_text || "Location pending"}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Real ETA */}
                        {patient.etaMinutes != null && (
                          <div className="text-right">
                            <div className="text-sm font-black text-primary">{patient.etaMinutes} min</div>
                            <div className="text-[10px] text-muted-foreground">{patient.distanceKm} km</div>
                          </div>
                        )}
                        <SeverityIndicator level={p.severity === "critical" ? "critical" : p.severity === "moderate" ? "moderate" : "stable"} className="!py-1 !px-2 text-[10px]" />
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {p.status === 'corridor' ? '🟢' : p.status === 'arrived' ? '🏥' : '🚑'} {p.status}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No incoming patients at this time
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Alerts */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-warning" />
              <h3 className="font-semibold text-sm">Live Alerts</h3>
            </div>
            <div className="space-y-3">
              {alerts.length > 0 ? alerts.map((a, i) => (
                <div key={i} className={`p-3 rounded-xl border text-sm animate-fade-in-up ${
                  a.type === "emergency" ? "bg-destructive/5 border-destructive/15" :
                  a.type === "success" ? "bg-success/5 border-success/15" : "bg-primary/5 border-primary/15"
                }`} style={{ animationDelay: `${i * 0.1}s` }}>
                  <p className="text-sm">{a.msg}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{a.time}</p>
                </div>
              )) : (
                <div className="text-center py-4 text-muted-foreground text-sm">No alerts</div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Staff + Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Staff Allocation</h3>
            </div>
            <div className="space-y-2">
              {doctors.length > 0 ? doctors.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
                  <div>
                    <div className="text-sm font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.specialty}</div>
                  </div>
                  <button onClick={() => toggleDoctorStatus(d.id, d.status === "available" ? "busy" : "available")}>
                    <StatusBadge severity={d.status === "available" ? "success" : "warning"}>
                      {d.status === "available" ? "Available" : "Busy"}
                    </StatusBadge>
                  </button>
                </div>
              )) : (
                <div className="text-center py-4 text-muted-foreground text-sm">No staff data</div>
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Analytics</h3>
            </div>
            <MiniAnalytics metrics={[
              { label: "Total Emergencies", value: analytics.total.toString(), bar: Math.min(100, analytics.total * 2), color: "bg-primary" },
              { label: "Cases Today", value: analytics.today.toString(), bar: Math.min(100, analytics.today * 5), color: "bg-warning" },
              { label: "Success Rate", value: analytics.successRate, bar: parseFloat(analytics.successRate) || 0, color: "bg-success" },
              { label: "Bed Utilization", value: hospital ? `${Math.round(((hospital.icu_beds_total - hospital.icu_beds_available) / Math.max(hospital.icu_beds_total, 1)) * 100)}%` : "0%", bar: hospital ? ((hospital.icu_beds_total - hospital.icu_beds_available) / Math.max(hospital.icu_beds_total, 1)) * 100 : 0, color: "bg-destructive" },
            ]} />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, pulse }: { icon: React.ElementType; label: string; value: string; color: string; pulse?: boolean }) {
  return (
    <GlassCard className="!p-4" hover>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className={`text-2xl font-black ${pulse ? "animate-count-pulse" : ""}`}>{value}</div>
    </GlassCard>
  );
}

function InfoRow({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`font-medium ${highlight ? 'text-destructive font-bold' : ''}`}>{value}</span>
    </div>
  );
}
