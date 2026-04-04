import { useState, useEffect } from "react";
import { MapPin, Phone, QrCode, Heart, User, ChevronRight, Volume2, Shield, Smartphone, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { RoleHeader } from "@/components/RoleHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { StatusBadge } from "@/components/StatusBadge";
import { LiveMap } from "@/components/LiveMap";
import { EmergencyTimeline } from "@/components/EmergencyTimeline";
import { SeverityIndicator } from "@/components/SeverityIndicator";
import { PrivacyToggle } from "@/components/PrivacyToggle";
import { MiniAnalytics } from "@/components/MiniAnalytics";
import { NotificationPanel } from "@/components/NotificationPanel";
import { NetworkStatus } from "@/components/NetworkStatus";

const assistSteps = [
  { step: 1, text: "Check if the person is breathing", done: true },
  { step: 2, text: "Apply pressure to any visible wound", done: true },
  { step: 3, text: "Keep the person calm and still", done: false },
  { step: 4, text: "Wait for ambulance to arrive", done: false },
];

const contacts = [
  { name: "Rahul Kumar", relation: "Brother", status: "Alert Sent" },
  { name: "Priya Sharma", relation: "Mother", status: "Alert Sent" },
  { name: "Dr. Mehta", relation: "Doctor", status: "Notified" },
];

export default function PatientDashboard() {
  const [sosActive, setSosActive] = useState(false);
  const [eta, setEta] = useState(7);
  const [status, setStatus] = useState<"idle" | "detecting" | "assigned" | "enroute" | "corridor" | "arrived">("idle");
  const [ambulancePos, setAmbulancePos] = useState(5);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [assistProgress, setAssistProgress] = useState(assistSteps);

  const triggerSOS = () => {
    setSosActive(true);
    setStatus("detecting");
    setTimeout(() => setStatus("assigned"), 2000);
    setTimeout(() => setStatus("enroute"), 4000);
    setTimeout(() => setStatus("corridor"), 8000);
  };

  useEffect(() => {
    if (status !== "enroute" && status !== "corridor") return;
    const interval = setInterval(() => {
      setEta(e => Math.max(1, e - 1));
      setAmbulancePos(p => Math.min(92, p + 8));
    }, 3000);
    return () => clearInterval(interval);
  }, [status]);

  // Auto-progress assist steps
  useEffect(() => {
    if (!sosActive) return;
    const t = setTimeout(() => {
      setAssistProgress(prev => {
        const next = [...prev];
        const idx = next.findIndex(s => !s.done);
        if (idx !== -1) next[idx] = { ...next[idx], done: true };
        return next;
      });
    }, 5000);
    return () => clearTimeout(t);
  }, [sosActive, assistProgress]);

  const timelineSteps = [
    { label: "Triggered", status: status !== "idle" ? "done" as const : "pending" as const },
    { label: "Ambulance Assigned", status: status === "assigned" || status === "enroute" || status === "corridor" ? "done" as const : status === "detecting" ? "active" as const : "pending" as const },
    { label: "En Route", status: status === "enroute" || status === "corridor" ? "done" as const : status === "assigned" ? "active" as const : "pending" as const },
    { label: "Corridor Active", status: status === "corridor" ? "done" as const : status === "enroute" ? "active" as const : "pending" as const },
    { label: "At Hospital", status: status === "arrived" ? "done" as const : status === "corridor" ? "active" as const : "pending" as const },
  ];

  return (
    <div className="min-h-screen bg-background">
      <RoleHeader title="Patient Portal" icon={Heart}>
        <div className="flex items-center gap-2">
          <NetworkStatus />
          <NotificationPanel />
        </div>
      </RoleHeader>

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">
        {/* Privacy + Severity bar */}
        <div className="flex items-center justify-between">
          <SeverityIndicator level={status === "idle" ? "stable" : "critical"} />
          <PrivacyToggle enabled={privacyMode} onToggle={() => setPrivacyMode(!privacyMode)} />
        </div>

        {/* Timeline */}
        {sosActive && (
          <GlassCard className="animate-fade-in-up">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Emergency Timeline</h3>
            <EmergencyTimeline steps={timelineSteps} />
          </GlassCard>
        )}

        {/* SOS Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <GlassCard className="flex flex-col items-center justify-center py-10 relative overflow-hidden">
            <div className="relative mb-6">
              {sosActive && (
                <>
                  <div className="absolute inset-0 rounded-full bg-destructive/20 animate-sos-ring" />
                  <div className="absolute inset-0 rounded-full bg-destructive/10 animate-sos-ring" style={{ animationDelay: "0.5s" }} />
                </>
              )}
              <button
                onClick={triggerSOS}
                disabled={sosActive}
                className={`relative z-10 w-36 h-36 rounded-full flex flex-col items-center justify-center font-black text-2xl transition-all duration-300 border-4 shadow-xl ${
                  sosActive
                    ? "bg-destructive text-destructive-foreground border-destructive/50 animate-sos-pulse cursor-not-allowed"
                    : "bg-destructive text-destructive-foreground border-destructive/30 hover:scale-105 active:scale-95 shadow-destructive/20"
                }`}
              >
                <Shield className="w-8 h-8 mb-1" />
                SOS
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4 text-center">
              {status === "idle" && "Press for emergency help"}
              {status === "detecting" && "🔍 Detecting emergency…"}
              {status === "assigned" && "✅ Ambulance Assigned — Unit A-12"}
              {status === "enroute" && `🚑 Ambulance En Route — ETA: ${eta} min`}
              {status === "corridor" && `🟢 Green Corridor Active — ETA: ${eta} min`}
            </p>

            <VoiceButton />

            {/* Crash detection indicator */}
            {!sosActive && (
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Auto crash detection active</span>
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              </div>
            )}
          </GlassCard>

          {/* Status & Location */}
          <div className="space-y-5">
            <GlassCard>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Location & Status</h3>
              </div>
              <div className={`text-xs text-muted-foreground mb-3 ${privacyMode ? "blur-sm select-none" : ""}`}>
                📍 Sector 62, Noida, UP — 201301
              </div>
              <div className="space-y-2">
                <StatusStep label="Emergency Detected" active={status !== "idle"} done={status !== "idle"} />
                <StatusStep label="Ambulance Assigned — Unit A-12" active={status === "assigned" || status === "enroute" || status === "corridor"} done={status === "enroute" || status === "corridor"} />
                <StatusStep label={`ETA: ${eta} minutes`} active={status === "enroute" || status === "corridor"} />
                <StatusStep label="Green Corridor Activated" active={status === "corridor"} done={status === "corridor"} />
                <StatusStep label="Hospital: AIIMS Delhi" active={status === "enroute" || status === "corridor"} />
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">SafeRide QR</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-secondary rounded-xl flex items-center justify-center border border-border">
                  <QrCode className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <div className={`flex-1 space-y-2 ${privacyMode ? "blur-sm select-none" : ""}`}>
                  <div className="text-xs text-muted-foreground">Blood Type: <span className="text-foreground font-medium">O+</span></div>
                  <div className="text-xs text-muted-foreground">Allergies: <span className="text-foreground font-medium">Penicillin</span></div>
                  <div className="text-xs text-muted-foreground">Emergency ID: <span className="text-foreground font-mono font-medium">JS-2024-8847</span></div>
                  <button className="text-xs text-primary hover:underline flex items-center gap-1">
                    Update Details <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Live Map */}
        {sosActive && (
          <LiveMap className="h-64 md:h-80 animate-fade-in-up" showRoute ambulanceProgress={ambulancePos}>
            <div className="absolute bottom-3 left-3 z-[1000] bg-card/95 backdrop-blur-sm p-3 rounded-xl border border-border shadow-lg">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-foreground animate-count-pulse">{eta}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">min</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-black text-foreground">{(eta * 0.6).toFixed(1)}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">km</div>
                </div>
              </div>
            </div>
          </LiveMap>
        )}

        {/* Assist + Contacts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-destructive" />
                <h3 className="font-semibold text-sm">Pre-Hospital Assist</h3>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge severity={sosActive ? "warning" : "info"}>
                  {sosActive ? "Active" : "Standby"}
                </StatusBadge>
                <button className="p-2 rounded-lg bg-primary/10 hover:bg-primary/15 transition-colors">
                  <Volume2 className="w-4 h-4 text-primary" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {assistProgress.map((s) => (
                <div key={s.step} className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-500 ${
                  s.done ? "bg-success/5 border-success/15" : "bg-secondary/50 border-border"
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                    s.done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                  }`}>{s.step}</div>
                  <span className={`text-sm ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.text}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="space-y-5">
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Emergency Contacts</h3>
              </div>
              <div className="space-y-2">
                {contacts.map((c) => (
                  <div key={c.name} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
                    <div className={privacyMode ? "blur-sm select-none" : ""}>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.relation}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge severity="success">{c.status}</StatusBadge>
                      <button className="p-2 rounded-lg bg-primary/10 hover:bg-primary/15">
                        <Phone className="w-3.5 h-3.5 text-primary" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Mini analytics when active */}
            {sosActive && (
              <GlassCard className="animate-fade-in-up">
                <h3 className="font-semibold text-sm mb-3">Response Analytics</h3>
                <MiniAnalytics metrics={[
                  { label: "Detection Time", value: "2.1s", bar: 95, color: "bg-success" },
                  { label: "Dispatch Time", value: "45s", bar: 80, color: "bg-primary" },
                  { label: "Corridor Status", value: "Active", bar: 100, color: "bg-success" },
                ]} />
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusStep({ label, active, done }: { label: string; active?: boolean; done?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full border-2 transition-all ${
        done ? "bg-success border-success" : active ? "border-primary bg-primary/20 animate-pulse" : "border-border"
      }`} />
      <span className={`text-sm ${active || done ? "text-foreground" : "text-muted-foreground/50"}`}>{label}</span>
    </div>
  );
}
