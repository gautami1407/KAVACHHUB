import { useState, useEffect } from "react";
import { Ambulance, Phone, Navigation, AlertTriangle, CheckCircle, XCircle, Radio } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { RoleHeader } from "@/components/RoleHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { MapPlaceholder } from "@/components/MapPlaceholder";
import { VoiceButton } from "@/components/VoiceButton";
import { EmergencyTimeline } from "@/components/EmergencyTimeline";
import { SeverityIndicator } from "@/components/SeverityIndicator";
import { MiniAnalytics } from "@/components/MiniAnalytics";

const signals = [
  { id: "S1", distance: "200m", status: "green" as const },
  { id: "S2", distance: "800m", status: "green" as const },
  { id: "S3", distance: "1.4km", status: "turning" as const },
  { id: "S4", distance: "2.1km", status: "red" as const },
];

export default function AmbulanceDashboard() {
  const [hasAlert, setHasAlert] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [eta, setEta] = useState(7);
  const [distance, setDistance] = useState(4.2);
  const [ambPos, setAmbPos] = useState(5);

  useEffect(() => {
    if (!accepted) return;
    const i = setInterval(() => {
      setEta(e => Math.max(1, e - 1));
      setDistance(d => Math.max(0.3, +(d - 0.6).toFixed(1)));
      setAmbPos(p => Math.min(95, p + 12));
    }, 3000);
    return () => clearInterval(i);
  }, [accepted]);

  const timelineSteps = [
    { label: "Alert Received", status: "done" as const },
    { label: "Accepted", status: accepted ? "done" as const : "active" as const },
    { label: "En Route", status: accepted ? "active" as const : "pending" as const },
    { label: "Corridor Active", status: "pending" as const },
    { label: "Delivered", status: "pending" as const },
  ];

  return (
    <div className="min-h-screen bg-background">
      <RoleHeader title="Ambulance Dashboard" icon={Ambulance} />

      {/* Incoming Alert */}
      {hasAlert && !accepted && (
        <div className="mx-4 md:mx-6 mt-4 animate-fade-in-up">
          <div className="bg-card p-5 rounded-2xl border border-destructive/20 shadow-lg shadow-destructive/5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-destructive/10">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold">Incoming Emergency</h3>
                  <SeverityIndicator level="critical" className="!px-2 !py-1" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">📍 Sector 62, Noida — Cardiac Emergency</p>
                <p className="text-xs text-muted-foreground">Patient: Male, 45 yrs | Blood: O+ | Distance: 4.2 km</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setAccepted(true)} className="flex-1 py-3 rounded-xl bg-success text-success-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-105 transition-all active:scale-[0.98] shadow-md">
                <CheckCircle className="w-5 h-5" /> Accept
              </button>
              <button onClick={() => setHasAlert(false)} className="flex-1 py-3 rounded-xl bg-secondary border border-border text-muted-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-accent transition-all">
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

            {/* Navigation Map */}
            <MapPlaceholder className="h-56 md:h-72" showRoute ambulancePosition={ambPos}>
              <div className="absolute bottom-3 left-3 bg-card/95 backdrop-blur-sm p-3 rounded-xl border border-border shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-black animate-count-pulse">{eta}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">min</div>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="text-center">
                    <div className="text-2xl font-black">{distance}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">km</div>
                  </div>
                </div>
              </div>
            </MapPlaceholder>

            {/* Traffic Signals */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <Navigation className="w-4 h-4 text-success" />
                <h3 className="font-semibold text-sm">Traffic Signal Status</h3>
                <StatusBadge severity="success">Green Corridor</StatusBadge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {signals.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                    <div className={`w-4 h-4 rounded-full ${
                      s.status === "green" ? "bg-success" : s.status === "turning" ? "bg-warning animate-signal-blink" : "bg-destructive"
                    }`} />
                    <div>
                      <div className="text-sm font-medium">{s.id}</div>
                      <div className="text-xs text-muted-foreground">{s.distance}</div>
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
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Communication</h3>
                </div>
                <div className="space-y-3">
                  <button className="w-full py-3 rounded-xl bg-primary/10 border border-primary/15 text-primary text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/15 transition-all">
                    <Phone className="w-4 h-4" /> Call Patient Contact
                  </button>
                  <button className="w-full py-3 rounded-xl bg-success/10 border border-success/15 text-success text-sm font-medium flex items-center justify-center gap-2 hover:bg-success/15 transition-all">
                    <Phone className="w-4 h-4" /> Call Hospital
                  </button>
                  <VoiceButton />
                </div>
              </GlassCard>

              <GlassCard>
                <h3 className="font-semibold text-sm mb-3">Trip Analytics</h3>
                <MiniAnalytics metrics={[
                  { label: "Distance Covered", value: `${(4.2 - distance).toFixed(1)} km`, bar: ((4.2 - distance) / 4.2) * 100, color: "bg-primary" },
                  { label: "Signals Overridden", value: "2", bar: 50, color: "bg-success" },
                  { label: "Avg Speed", value: "48 km/h", bar: 65, color: "bg-warning" },
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
