import { useState, useEffect } from "react";
import { TrafficCone, Radio, Zap, MapPin } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { RoleHeader } from "@/components/RoleHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { GreenCorridorScene } from "@/components/GreenCorridorScene";
import { MiniAnalytics } from "@/components/MiniAnalytics";

interface Signal {
  id: string;
  location: string;
  mode: "normal" | "emergency" | "corridor";
}

const initialSignals: Signal[] = [
  { id: "TL-01", location: "Sector 62 Junction", mode: "corridor" },
  { id: "TL-02", location: "NH-24 Crossing", mode: "corridor" },
  { id: "TL-03", location: "Metro Station Signal", mode: "emergency" },
  { id: "TL-04", location: "City Center", mode: "normal" },
  { id: "TL-05", location: "Hospital Road", mode: "corridor" },
  { id: "TL-06", location: "Ring Road East", mode: "normal" },
  { id: "TL-07", location: "Railway Crossing", mode: "normal" },
  { id: "TL-08", location: "Industrial Area", mode: "normal" },
];

export default function TrafficDashboard() {
  const [signals, setSignals] = useState(initialSignals);
  const [ambulanceSignal, setAmbulanceSignal] = useState(0);

  useEffect(() => {
    const i = setInterval(() => {
      setAmbulanceSignal(p => (p + 1) % signals.length);
    }, 3000);
    return () => clearInterval(i);
  }, [signals.length]);

  const corridorCount = signals.filter(s => s.mode === "corridor").length;
  const emergencyCount = signals.filter(s => s.mode === "emergency").length;

  return (
    <div className="min-h-screen bg-background">
      <RoleHeader title="Traffic Control Center" icon={TrafficCone} />

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <GlassCard className="!p-4 text-center" hover>
            <div className="text-2xl font-black text-success">{corridorCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Green Corridors</div>
          </GlassCard>
          <GlassCard className="!p-4 text-center" hover>
            <div className="text-2xl font-black text-warning">{emergencyCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Emergency Signals</div>
          </GlassCard>
          <GlassCard className="!p-4 text-center" hover>
            <div className="text-2xl font-black">{signals.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Signals</div>
          </GlassCard>
        </div>

        {/* 3D Corridor Visualization */}
        <GlassCard className="!p-0 overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-success" />
            <h3 className="font-semibold text-sm">Live 3D Green Corridor</h3>
            <StatusBadge severity="success">Active</StatusBadge>
          </div>
          <GreenCorridorScene className="h-[300px] md:h-[400px] w-full" />
          <div className="px-5 py-3 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-destructive" /> Ambulance</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success" /> Green Signal</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success/30" /> Corridor</span>
          </div>
        </GlassCard>

        {/* Corridor Animation strip */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-success" />
            <h3 className="font-semibold text-sm">Signal Corridor Status</h3>
          </div>
          <div className="relative py-6">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-success via-success/30 to-success rounded-full -translate-y-1/2 animate-corridor-flow"
                 style={{ backgroundImage: "linear-gradient(90deg, hsl(var(--corridor)), hsl(var(--corridor) / 0.3), hsl(var(--corridor)))" }} />
            <div className="flex justify-between relative">
              {signals.slice(0, 5).map((s, i) => (
                <div key={s.id} className="flex flex-col items-center gap-2 z-10">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                    i <= ambulanceSignal
                      ? "bg-success border-success text-success-foreground scale-110"
                      : i === ambulanceSignal + 1
                      ? "bg-warning/20 border-warning text-warning animate-signal-blink"
                      : "bg-secondary border-border text-muted-foreground"
                  }`}>
                    <div className="w-2 h-2 rounded-full bg-current" />
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center hidden sm:block">{s.id}</span>
                  {i === ambulanceSignal && (
                    <div className="absolute -top-6 text-xs text-destructive font-bold animate-count-pulse">🚑</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Signal Grid */}
          <div className="lg:col-span-2">
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <Radio className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Signal Grid</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {signals.map((s, i) => (
                  <div key={s.id} className={`p-4 rounded-xl border transition-all animate-fade-in-up ${
                    s.mode === "corridor" ? "bg-success/5 border-success/15" :
                    s.mode === "emergency" ? "bg-destructive/5 border-destructive/15" :
                    "bg-secondary/50 border-border"
                  }`} style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm font-bold">{s.id}</span>
                      <div className={`w-3 h-3 rounded-full ${
                        s.mode === "corridor" ? "bg-success" :
                        s.mode === "emergency" ? "bg-warning animate-signal-blink" :
                        "bg-muted-foreground/30"
                      }`} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <MapPin className="w-3 h-3" /> {s.location}
                    </div>
                    <StatusBadge severity={s.mode === "corridor" ? "success" : s.mode === "emergency" ? "warning" : "info"}>
                      {s.mode === "corridor" ? "Green Corridor" : s.mode === "emergency" ? "Emergency" : "Normal"}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Analytics */}
          <GlassCard>
            <h3 className="font-semibold text-sm mb-4">System Analytics</h3>
            <MiniAnalytics metrics={[
              { label: "Signals Overridden", value: "14", bar: 70, color: "bg-success" },
              { label: "Corridors Today", value: "6", bar: 60, color: "bg-primary" },
              { label: "Avg Clear Time", value: "12s", bar: 40, color: "bg-warning" },
              { label: "System Uptime", value: "99.9%", bar: 99, color: "bg-success" },
            ]} />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
