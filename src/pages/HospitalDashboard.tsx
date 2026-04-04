import { useState, useEffect } from "react";
import { Hospital, Bed, Users, BarChart3, Bell, Clock, AlertTriangle, TrendingUp, Activity, MapPin } from "lucide-react";
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
import { useNotifications } from "@/hooks/useNotifications";
import { useAmbulanceTracking } from "@/hooks/useAmbulanceTracking";
import { supabase } from "@/lib/supabaseClient";
import type { Emergency } from "@/lib/database.types";

export default function HospitalDashboard() {
  const { user, profile } = useAuth();
  const [myHospitalId, setMyHospitalId] = useState<string | null>(null);

  // Find hospital for this admin (use first hospital as default)
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
  const [analytics, setAnalytics] = useState<{ total: number; completed: number; today: number; successRate: string }>({ total: 0, completed: 0, today: 0, successRate: "0%" });

  // Fetch analytics
  useEffect(() => {
    if (!myHospitalId) return;
    getAnalytics(myHospitalId).then(setAnalytics);
  }, [myHospitalId, getAnalytics, incomingPatients]);

  // Get ambulance progress for selected patient
  const selectedEmergency = incomingPatients.find(p => p.id === selectedPatient);
  const { ambulancePosition } = useAmbulanceTracking(selectedEmergency?.ambulance_id || undefined);

  const ambulanceProgress = (() => {
    if (!ambulancePosition || !selectedEmergency) return 30;
    return Math.min(95, Math.max(5, 50));
  })();

  // Alerts from notifications
  const alerts = notifications.slice(0, 4).map(n => ({
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

        {/* Incoming ambulance map for selected patient */}
        {selectedPatient !== null && selectedEmergency && (
          <GlassCard className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Tracking Emergency</h3>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
            </div>
            <LiveMap
              className="h-48 md:h-64"
              showRoute
              ambulanceProgress={ambulanceProgress}
              startCoords={[selectedEmergency.location_lat, selectedEmergency.location_lng]}
            />
          </GlassCard>
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
                {incomingPatients.length > 0 ? incomingPatients.map((p, i) => (
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
                        <div className="text-sm font-medium">{p.emergency_type}</div>
                        <div className="text-xs text-muted-foreground">{p.location_text || "Location pending"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <SeverityIndicator level={p.severity === "critical" ? "critical" : p.severity === "moderate" ? "moderate" : "stable"} className="!py-1 !px-2 text-[10px]" />
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {p.status}
                      </div>
                    </div>
                  </div>
                )) : (
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
              { label: "Bed Utilization", value: hospital ? `${Math.round(((hospital.icu_beds_total - hospital.icu_beds_available) / hospital.icu_beds_total) * 100)}%` : "0%", bar: hospital ? ((hospital.icu_beds_total - hospital.icu_beds_available) / hospital.icu_beds_total) * 100 : 0, color: "bg-destructive" },
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
