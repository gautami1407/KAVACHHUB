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

const patients = [
  { id: 1, name: "Amit Verma", age: 45, condition: "Cardiac Arrest", severity: "critical" as const, eta: 4, ambProgress: 60 },
  { id: 2, name: "Suman Devi", age: 62, condition: "Stroke", severity: "critical" as const, eta: 8, ambProgress: 30 },
  { id: 3, name: "Raj Patel", age: 30, condition: "Fracture", severity: "moderate" as const, eta: 12, ambProgress: 15 },
  { id: 4, name: "Meera Singh", age: 25, condition: "Allergic Reaction", severity: "low" as const, eta: 15, ambProgress: 8 },
];

const doctors = [
  { name: "Dr. R. Mehta", specialty: "Cardiology", status: "available" },
  { name: "Dr. S. Gupta", specialty: "Neurology", status: "busy" },
  { name: "Dr. A. Khan", specialty: "Emergency", status: "available" },
  { name: "Dr. P. Joshi", specialty: "Orthopedics", status: "busy" },
  { name: "Dr. L. Nair", specialty: "ICU", status: "available" },
];

const alerts = [
  { msg: "Critical patient arriving in 4 min — prepare ICU Bay 3", time: "Just now", type: "emergency" as const },
  { msg: "Ambulance A-12 en route with cardiac arrest patient", time: "2 min ago", type: "info" as const },
  { msg: "Green corridor active on NH-24", time: "3 min ago", type: "success" as const },
  { msg: "ICU Bed 7 now available after discharge", time: "10 min ago", type: "success" as const },
];

export default function HospitalDashboard() {
  const [icuBeds, setIcuBeds] = useState({ total: 20, available: 4 });
  const [generalBeds] = useState({ total: 120, available: 23 });
  const [emergencyBeds] = useState({ total: 30, available: 8 });
  const [casesToday] = useState(47);
  const [successRate] = useState("94.8%");
  const [privacy, setPrivacy] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [patientList, setPatientList] = useState(patients);

  useEffect(() => {
    const i = setInterval(() => {
      setIcuBeds(b => ({ ...b, available: Math.max(1, b.available + (Math.random() > 0.5 ? 1 : -1)) }));
      setPatientList(prev => prev.map(p => ({
        ...p,
        eta: Math.max(1, p.eta - 1),
        ambProgress: Math.min(95, p.ambProgress + 5),
      })));
    }, 5000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <RoleHeader title="Hospital Command Center" icon={Hospital}>
        <div className="flex items-center gap-2">
          <NetworkStatus />
          <NotificationPanel />
        </div>
      </RoleHeader>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
        <div className="flex justify-end">
          <PrivacyToggle enabled={privacy} onToggle={() => setPrivacy(!privacy)} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={Bed} label="ICU Available" value={`${icuBeds.available}/${icuBeds.total}`} color="text-destructive" pulse />
          <StatCard icon={Bed} label="General Beds" value={`${generalBeds.available}/${generalBeds.total}`} color="text-primary" />
          <StatCard icon={Bed} label="Emergency" value={`${emergencyBeds.available}/${emergencyBeds.total}`} color="text-warning" />
          <StatCard icon={Activity} label="Cases Today" value={casesToday.toString()} color="text-warning" />
          <StatCard icon={TrendingUp} label="Success Rate" value={successRate} color="text-success" />
        </div>

        {/* Incoming ambulance map for selected patient */}
        {selectedPatient !== null && (
          <GlassCard className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Tracking: {patientList.find(p => p.id === selectedPatient)?.name}</h3>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
            </div>
            <LiveMap
              className="h-48 md:h-64"
              showRoute
              ambulanceProgress={patientList.find(p => p.id === selectedPatient)?.ambProgress ?? 0}
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
                <span className="text-xs text-muted-foreground">{patientList.length} en route</span>
              </div>
              <div className="space-y-2">
                {patientList.map((p, i) => (
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
                        {p.name[0]}
                      </div>
                      <div className={privacy ? "blur-sm select-none" : ""}>
                        <div className="text-sm font-medium">{p.name}, {p.age}</div>
                        <div className="text-xs text-muted-foreground">{p.condition}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <SeverityIndicator level={p.severity === "critical" ? "critical" : p.severity === "moderate" ? "moderate" : "stable"} className="!py-1 !px-2 text-[10px]" />
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {p.eta} min
                      </div>
                    </div>
                  </div>
                ))}
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
              {alerts.map((a, i) => (
                <div key={i} className={`p-3 rounded-xl border text-sm animate-fade-in-up ${
                  a.type === "emergency" ? "bg-destructive/5 border-destructive/15" :
                  a.type === "success" ? "bg-success/5 border-success/15" : "bg-primary/5 border-primary/15"
                }`} style={{ animationDelay: `${i * 0.1}s` }}>
                  <p className="text-sm">{a.msg}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{a.time}</p>
                </div>
              ))}
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
              {doctors.map((d) => (
                <div key={d.name} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
                  <div>
                    <div className="text-sm font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.specialty}</div>
                  </div>
                  <StatusBadge severity={d.status === "available" ? "success" : "warning"}>
                    {d.status === "available" ? "Available" : "Busy"}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Analytics</h3>
            </div>
            <MiniAnalytics metrics={[
              { label: "Avg Response Time", value: "6.2 min", bar: 62, color: "bg-primary" },
              { label: "Cases Today", value: casesToday.toString(), bar: 47, color: "bg-warning" },
              { label: "Success Rate", value: successRate, bar: 95, color: "bg-success" },
              { label: "Bed Utilization", value: "82%", bar: 82, color: "bg-destructive" },
              { label: "Green Corridors Today", value: "6", bar: 60, color: "bg-success" },
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
