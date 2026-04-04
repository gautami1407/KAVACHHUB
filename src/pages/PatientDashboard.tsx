import { useState, useEffect } from "react";
import { MapPin, Phone, QrCode, Mic, Heart, User, Clock, Ambulance, Hospital, ChevronRight, Volume2, Shield } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { RoleHeader } from "@/components/RoleHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { StatusBadge } from "@/components/StatusBadge";
import { MapPlaceholder } from "@/components/MapPlaceholder";

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
  const [eta, setEta] = useState(5);
  const [status, setStatus] = useState<"idle" | "detecting" | "assigned" | "enroute">("idle");
  const [ambulancePos, setAmbulancePos] = useState(10);

  const triggerSOS = () => {
    setSosActive(true);
    setStatus("detecting");
    setTimeout(() => setStatus("assigned"), 1500);
    setTimeout(() => setStatus("enroute"), 3000);
  };

  useEffect(() => {
    if (status !== "enroute") return;
    const interval = setInterval(() => {
      setEta(e => Math.max(1, e - 1));
      setAmbulancePos(p => Math.min(90, p + 15));
    }, 3000);
    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="min-h-screen bg-background">
      <RoleHeader title="Patient Portal" icon={Heart} />
      
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">
        {/* SOS Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <GlassCard className="flex flex-col items-center justify-center py-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-destructive/5 to-transparent pointer-events-none" />
            
            {/* SOS Button */}
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
                className={`relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center font-black text-2xl transition-all duration-300 border-4 ${
                  sosActive
                    ? "bg-destructive text-destructive-foreground border-destructive animate-sos-pulse cursor-not-allowed"
                    : "bg-destructive/90 text-destructive-foreground border-destructive/50 hover:bg-destructive hover:scale-105 active:scale-95"
                }`}
              >
                <Shield className="w-8 h-8 mb-1" />
                SOS
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {status === "idle" && "Press for emergency help"}
              {status === "detecting" && "🔍 Detecting emergency…"}
              {status === "assigned" && "✅ Ambulance Assigned"}
              {status === "enroute" && `🚑 ETA: ${eta} minutes`}
            </p>

            <VoiceButton />
          </GlassCard>

          {/* Status & Location */}
          <div className="space-y-5">
            <GlassCard>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Location & Status</h3>
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                📍 Sector 62, Noida, UP — 201301
              </div>
              <div className="space-y-2">
                <StatusStep label="Emergency Detected" active={status !== "idle"} done={status !== "idle"} />
                <StatusStep label="Ambulance Assigned" active={status === "assigned" || status === "enroute"} done={status === "enroute"} />
                <StatusStep label={`ETA: ${eta} minutes`} active={status === "enroute"} />
                <StatusStep label="Hospital Selected: AIIMS Delhi" active={status === "enroute"} />
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">SafeRide QR</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-foreground/10 rounded-xl flex items-center justify-center border border-border">
                  <QrCode className="w-10 h-10 text-foreground/40" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="text-xs text-muted-foreground">Blood Type: <span className="text-foreground font-medium">O+</span></div>
                  <div className="text-xs text-muted-foreground">Allergies: <span className="text-foreground font-medium">Penicillin</span></div>
                  <button className="text-xs text-primary hover:underline flex items-center gap-1">
                    Update Details <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Map */}
        {sosActive && (
          <MapPlaceholder className="h-52 md:h-64 animate-fade-in-up" showRoute ambulancePosition={ambulancePos} />
        )}

        {/* Assist + Contacts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-destructive" />
                <h3 className="font-semibold text-sm">Pre-Hospital Assist</h3>
              </div>
              <button className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                <Volume2 className="w-4 h-4 text-primary" />
              </button>
            </div>
            <div className="space-y-2">
              {assistSteps.map((s) => (
                <div key={s.step} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  s.done ? "bg-success/5 border-success/20" : "bg-secondary/50 border-border"
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    s.done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                  }`}>{s.step}</div>
                  <span className={`text-sm ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.text}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Emergency Contacts</h3>
            </div>
            <div className="space-y-2">
              {contacts.map((c) => (
                <div key={c.name} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
                  <div>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.relation}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge severity="success">{c.status}</StatusBadge>
                    <button className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function StatusStep({ label, active, done }: { label: string; active?: boolean; done?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full border-2 transition-all ${
        done ? "bg-success border-success" : active ? "border-primary bg-primary/30 animate-pulse" : "border-muted-foreground/30"
      }`} />
      <span className={`text-sm ${active || done ? "text-foreground" : "text-muted-foreground/50"}`}>{label}</span>
    </div>
  );
}
