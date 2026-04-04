import { useState, useEffect } from "react";
import { Ambulance, Phone, Clock, MapPin, Navigation, AlertTriangle, CheckCircle, XCircle, Radio, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { RoleHeader } from "@/components/RoleHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { MapPlaceholder } from "@/components/MapPlaceholder";
import { VoiceButton } from "@/components/VoiceButton";

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

  return (
    <div className="min-h-screen bg-background">
      <RoleHeader title="Ambulance Dashboard" icon={Ambulance} />

      {/* Incoming Alert */}
      {hasAlert && !accepted && (
        <div className="mx-4 md:mx-6 mt-4 animate-fade-in-up">
          <div className="glass-card p-5 border-destructive/40 bg-destructive/5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-destructive/20">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold">Incoming Emergency</h3>
                  <StatusBadge severity="critical">Critical</StatusBadge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">📍 Sector 62, Noida — Cardiac Emergency</p>
                <p className="text-xs text-muted-foreground">Patient: Male, 45 yrs | Blood: O+ | Distance: 4.2 km</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setAccepted(true); }} className="flex-1 py-3 rounded-xl bg-success text-success-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-[0.98]">
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
            {/* Navigation Map */}
            <MapPlaceholder className="h-56 md:h-72" showRoute ambulancePosition={ambPos}>
              <div className="absolute bottom-3 left-3 glass-card p-3 !rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-black text-foreground animate-count-pulse">{eta}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">min</div>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="text-center">
                    <div className="text-2xl font-black text-foreground">{distance}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">km</div>
                  </div>
                </div>
              </div>
            </MapPlaceholder>

            {/* Traffic Signals */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <Navigation className="w-4 h-4 text-corridor" />
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

            {/* Patient Info & Comms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  <button className="w-full py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/20 transition-all">
                    <Phone className="w-4 h-4" /> Call Patient Contact
                  </button>
                  <button className="w-full py-3 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-medium flex items-center justify-center gap-2 hover:bg-success/20 transition-all">
                    <Phone className="w-4 h-4" /> Call Hospital
                  </button>
                  <VoiceButton />
                </div>
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
