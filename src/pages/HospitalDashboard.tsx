import { useState, useEffect } from "react";
import { Hospital, Bed, Users, BarChart3, Bell, Clock, UserCheck, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { RoleHeader } from "@/components/RoleHeader";
import { StatusBadge } from "@/components/StatusBadge";

const patients = [
  { id: 1, name: "Amit Verma", age: 45, condition: "Cardiac Arrest", severity: "critical" as const, eta: "4 min" },
  { id: 2, name: "Suman Devi", age: 62, condition: "Stroke", severity: "critical" as const, eta: "8 min" },
  { id: 3, name: "Raj Patel", age: 30, condition: "Fracture", severity: "moderate" as const, eta: "12 min" },
  { id: 4, name: "Meera Singh", age: 25, condition: "Allergic Reaction", severity: "low" as const, eta: "15 min" },
];

const doctors = [
  { name: "Dr. R. Mehta", specialty: "Cardiology", status: "available" },
  { name: "Dr. S. Gupta", specialty: "Neurology", status: "busy" },
  { name: "Dr. A. Khan", specialty: "Emergency", status: "available" },
  { name: "Dr. P. Joshi", specialty: "Orthopedics", status: "busy" },
];

const alerts = [
  { msg: "Critical patient arriving in 4 min — prepare ICU Bay 3", time: "Just now", type: "emergency" as const },
  { msg: "Ambulance A-12 en route with stroke patient", time: "3 min ago", type: "info" as const },
  { msg: "ICU Bed 7 now available after discharge", time: "10 min ago", type: "success" as const },
];

export default function HospitalDashboard() {
  const [icuBeds, setIcuBeds] = useState({ total: 20, available: 4 });
  const [generalBeds] = useState({ total: 120, available: 23 });
  const [casesToday] = useState(47);
  const [avgResponse] = useState("6.2 min");
  const [successRate] = useState("94.8%");

  useEffect(() => {
    const i = setInterval(() => {
      setIcuBeds(b => ({ ...b, available: Math.max(1, b.available + (Math.random() > 0.5 ? 1 : -1)) }));
    }, 8000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <RoleHeader title="Hospital Command Center" icon={Hospital} />

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Bed} label="ICU Available" value={`${icuBeds.available}/${icuBeds.total}`} color="text-destructive" pulse />
          <StatCard icon={Bed} label="General Beds" value={`${generalBeds.available}/${generalBeds.total}`} color="text-primary" />
          <StatCard icon={Activity} label="Cases Today" value={casesToday.toString()} color="text-warning" />
          <StatCard icon={TrendingUp} label="Success Rate" value={successRate} color="text-success" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Incoming Patients */}
          <div className="lg:col-span-2">
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <h3 className="font-semibold text-sm">Incoming Patients</h3>
                </div>
                <span className="text-xs text-muted-foreground">{patients.length} en route</span>
              </div>
              <div className="space-y-2">
                {patients.map((p, i) => (
                  <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all animate-fade-in-up ${
                    p.severity === "critical" ? "bg-destructive/5 border-destructive/20" : "bg-secondary/50 border-border"
                  }`} style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                        {p.name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{p.name}, {p.age}</div>
                        <div className="text-xs text-muted-foreground">{p.condition}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge severity={p.severity}>{p.severity}</StatusBadge>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {p.eta}
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
                  a.type === "emergency" ? "bg-destructive/5 border-destructive/20" :
                  a.type === "success" ? "bg-success/5 border-success/20" : "bg-primary/5 border-primary/20"
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
            <div className="space-y-4">
              <AnalyticsRow label="Avg Response Time" value={avgResponse} bar={62} color="bg-primary" />
              <AnalyticsRow label="Cases Today" value={casesToday.toString()} bar={47} color="bg-warning" />
              <AnalyticsRow label="Success Rate" value={successRate} bar={95} color="bg-success" />
              <AnalyticsRow label="Bed Utilization" value="82%" bar={82} color="bg-destructive" />
            </div>
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

function AnalyticsRow({ label, value, bar, color }: { label: string; value: string; bar: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${bar}%` }} />
      </div>
    </div>
  );
}
