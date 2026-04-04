import { useState, useEffect } from "react";
import { Ambulance, Phone, Navigation, AlertTriangle, CheckCircle, XCircle, Radio, Timer, MapPin } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { RoleHeader } from "@/components/RoleHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { LiveMap } from "@/components/LiveMap";
import { VoiceButton } from "@/components/VoiceButton";
import { EmergencyTimeline } from "@/components/EmergencyTimeline";
import { SeverityIndicator } from "@/components/SeverityIndicator";
import { MiniAnalytics } from "@/components/MiniAnalytics";
import { NotificationPanel } from "@/components/NotificationPanel";
import { NetworkStatus } from "@/components/NetworkStatus";

const signalData = [
  { id: "S1", location: "Sector 62 Junction", distance: "200m", status: "green" as const },
  { id: "S2", location: "NH-24 Crossing", distance: "800m", status: "green" as const },
  { id: "S3", location: "Metro Station", distance: "1.4km", status: "turning" as const },
  { id: "S4", location: "Ring Road", distance: "2.1km", status: "red" as const },
  { id: "S5", location: "Hospital Road", distance: "3.0km", status: "red" as const },
];

export default function AmbulanceDashboard() {
  const [hasAlert, setHasAlert] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [eta, setEta] = useState(7);
  const [distance, setDistance] = useState(4.2);
  const [ambPos, setAmbPos] = useState(5);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [signals, setSignals] = useState(signalData);

  useEffect(() => {
    if (!accepted) return;
    const i = setInterval(() => {
      setEta(e => Math.max(1, e - 1));
      setDistance(d => Math.max(0.3, +(d - 0.5).toFixed(1)));
      setAmbPos(p => Math.min(95, p + 10));
      setElapsedTime(t => t + 3);
      // Progressively turn signals green
      setSignals(prev => {
        const next = [...prev];
        const turningIdx = next.findIndex(s => s.status === "turning");
        if (turningIdx !== -1 && Math.random() > 0.5) {
          next[turningIdx] = { ...next[turningIdx], status: "green" };
          if (turningIdx + 1 < next.length && next[turningIdx + 1].status === "red") {
            next[turningIdx + 1] = { ...next[turningIdx + 1], status: "turning" };
          }
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(i);
  }, [accepted]);

  const timelineSteps = [
    { label: "Alert Received", status: "done" as const },
    { label: "Accepted", status: accepted ? "done" as const : "active" as const },
    { label: "En Route", status: accepted ? "active" as const : "pending" as const },
    { label: "Corridor Active", status: accepted && ambPos > 30 ? "active" as const : "pending" as const },
    { label: "Delivered", status: "pending" as const },
  ];

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-background">
      <RoleHeader title="Ambulance Dashboard" icon={Ambulance}>
        <div className="flex items-center gap-2">
          <NetworkStatus />
          <NotificationPanel />
        </div>
      </RoleHeader>

      {/* Incoming Alert Modal */}
      {hasAlert && !accepted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="bg-card p-6 rounded-2xl border border-destructive/20 shadow-2xl max-w-md w-full">
            <div className="flex items-start gap-4 mb-5">
              <div className="p-3 rounded-xl bg-destructive/10 animate-sos-pulse">
                <AlertTriangle className="w-7 h-7 text-destructive" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg">Incoming Emergency</h3>
                </div>
                <SeverityIndicator level="critical" className="mb-3" />
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Sector 62, Noida</p>
                  <p>🫀 Cardiac Emergency</p>
                  <p>👤 Male, 45 yrs · Blood: O+</p>
                  <p>📏 Distance: 4.2 km</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setAccepted(true)} className="flex-1 py-3.5 rounded-xl bg-success text-success-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-105 transition-all active:scale-[0.98] shadow-lg">
                <CheckCircle className="w-5 h-5" /> Accept Mission
              </button>
              <button onClick={() => setHasAlert(false)} className="flex-1 py-3.5 rounded-xl bg-secondary border border-border text-muted-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-accent transition-all">
                <XCircle className="w-5 h-5" /> Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">
        {accepted && (
          <>
            {/* Timeline */}
            <GlassCard className="animate-fade-in-up">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Mission Timeline</h3>
              <EmergencyTimeline steps={timelineSteps} />
            </GlassCard>

            {/* ETA strip */}
            <div className="grid grid-cols-4 gap-3">
              <GlassCard className="!p-4 text-center" hover>
                <Timer className="w-4 h-4 text-primary mx-auto mb-1" />
                <div className="text-2xl font-black animate-count-pulse">{eta}</div>
                <div className="text-[10px] text-muted-foreground uppercase">ETA min</div>
              </GlassCard>
              <GlassCard className="!p-4 text-center" hover>
                <Navigation className="w-4 h-4 text-primary mx-auto mb-1" />
                <div className="text-2xl font-black">{distance}</div>
                <div className="text-[10px] text-muted-foreground uppercase">km left</div>
              </GlassCard>
              <GlassCard className="!p-4 text-center" hover>
                <Timer className="w-4 h-4 text-warning mx-auto mb-1" />
                <div className="text-2xl font-black font-mono">{formatTime(elapsedTime)}</div>
                <div className="text-[10px] text-muted-foreground uppercase">elapsed</div>
              </GlassCard>
              <GlassCard className="!p-4 text-center" hover>
                <div className="text-2xl font-black text-success">{signals.filter(s => s.status === "green").length}</div>
                <div className="text-[10px] text-muted-foreground uppercase">green signals</div>
              </GlassCard>
            </div>

            {/* Navigation Map */}
            <LiveMap className="h-64 md:h-80" showRoute ambulanceProgress={ambPos} />

            {/* Traffic Signal Strip */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <Navigation className="w-4 h-4 text-success" />
                <h3 className="font-semibold text-sm">Traffic Signal Status</h3>
                <StatusBadge severity="success">Green Corridor</StatusBadge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {signals.map((s) => (
                  <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-500 ${
                    s.status === "green" ? "bg-success/5 border-success/20" :
                    s.status === "turning" ? "bg-warning/5 border-warning/20" :
                    "bg-secondary/50 border-border"
                  }`}>
                    <div className={`w-4 h-4 rounded-full shrink-0 transition-all ${
                      s.status === "green" ? "bg-success shadow-sm shadow-success/50" :
                      s.status === "turning" ? "bg-warning animate-signal-blink" :
                      "bg-destructive"
                    }`} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{s.id}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{s.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Patient Info & Comms & Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <GlassCard>
                <div className="flex items-center gap-2 mb-3">
                  <Radio className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Patient Info</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <Row label="Name" value="Amit Verma" />
                  <Row label="Age" value="45 years" />
                  <Row label="Blood Group" value="O+" />
                  <Row label="Condition" value="Cardiac Arrest" />
                  <Row label="Allergies" value="Penicillin" />
                  <Row label="Emergency ID" value="JS-2024-8847" />
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Communication</h3>
                </div>
                <div className="space-y-3">
                  <button className="w-full py-3 rounded-xl bg-primary/10 border border-primary/15 text-primary text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/15 transition-all active:scale-[0.98]">
                    <Phone className="w-4 h-4" /> Call Patient Contact
                  </button>
                  <button className="w-full py-3 rounded-xl bg-success/10 border border-success/15 text-success text-sm font-medium flex items-center justify-center gap-2 hover:bg-success/15 transition-all active:scale-[0.98]">
                    <Phone className="w-4 h-4" /> Call Hospital
                  </button>
                  <VoiceButton />
                </div>
              </GlassCard>

              <GlassCard>
                <h3 className="font-semibold text-sm mb-3">Trip Analytics</h3>
                <MiniAnalytics metrics={[
                  { label: "Distance Covered", value: `${(4.2 - distance).toFixed(1)} km`, bar: ((4.2 - distance) / 4.2) * 100, color: "bg-primary" },
                  { label: "Signals Overridden", value: `${signals.filter(s => s.status === "green").length}`, bar: (signals.filter(s => s.status === "green").length / signals.length) * 100, color: "bg-success" },
                  { label: "Avg Speed", value: "48 km/h", bar: 65, color: "bg-warning" },
                  { label: "Corridor Status", value: "Active", bar: 100, color: "bg-success" },
                ]} />
              </GlassCard>
            </div>
          </>
        )}

        {!hasAlert && !accepted && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Ambulance className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No active emergencies</p>
            <p className="text-sm">Waiting for incoming alerts…</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
