import { useState, useEffect } from "react";
import { TrafficCone, Radio, Zap, MapPin } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { RoleHeader } from "@/components/RoleHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { GreenCorridorScene } from "@/components/GreenCorridorScene";
import { MiniAnalytics } from "@/components/MiniAnalytics";
import { LiveMap } from "@/components/LiveMap";
import { NotificationPanel } from "@/components/NotificationPanel";
import { NetworkStatus } from "@/components/NetworkStatus";
import { useTrafficSignals } from "@/hooks/useTrafficSignals";
import { useAmbulanceTracking } from "@/hooks/useAmbulanceTracking";
import { useSystemStats } from "@/hooks/useSystemStats";

export default function TrafficDashboard() {
  const { signals, corridorCount, emergencyCount, activeCorridors, loading, manualOverride } = useTrafficSignals();
  const { allAmbulances } = useAmbulanceTracking();
  const { stats } = useSystemStats();

  const [ambulanceSignalIdx, setAmbulanceSignalIdx] = useState(0);

  // Ambulance with enroute or dispatched status for map tracking
  const activeAmbulance = allAmbulances.find(a => a.status === "enroute" || a.status === "dispatched");

  const ambMapPos = (() => {
    if (!activeAmbulance || !activeAmbulance.lat) return 10;
    return Math.min(90, 50); // Will be dynamic with real position
  })();

  // Cycle through signals for corridor animation
  useEffect(() => {
    const i = setInterval(() => {
      setAmbulanceSignalIdx(p => (p + 1) % Math.max(signals.length, 1));
    }, 3000);
    return () => clearInterval(i);
  }, [signals.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <TrafficCone className="w-12 h-12 text-primary/20 mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading traffic data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <RoleHeader title="Traffic Control Center" icon={TrafficCone}>
        <div className="flex items-center gap-2">
          <NetworkStatus />
          <NotificationPanel />
        </div>
      </RoleHeader>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
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
          <GlassCard className="!p-4 text-center" hover>
            <div className="text-2xl font-black text-primary">{stats.signals_overridden_today || "0"}</div>
            <div className="text-xs text-muted-foreground mt-1">Signals Overridden</div>
          </GlassCard>
        </div>

        {/* 3D Corridor Visualization */}
        <GlassCard className="!p-0 overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-success" />
            <h3 className="font-semibold text-sm">Live 3D Green Corridor</h3>
            <StatusBadge severity={activeCorridors.length > 0 ? "success" : "info"}>
              {activeCorridors.length > 0 ? "Active" : "Standby"}
            </StatusBadge>
          </div>
          <GreenCorridorScene className="h-[300px] md:h-[420px] w-full" />
          <div className="px-5 py-3 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-destructive" /> Ambulance</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success" /> Green Signal</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success/30" /> Corridor</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-warning" /> Turning</span>
          </div>
        </GlassCard>

        {/* Live Map Tracking */}
        <GlassCard className="!p-0 overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Live Ambulance Tracking</h3>
            {activeAmbulance && (
              <StatusBadge severity="success">Unit {activeAmbulance.unit_code}</StatusBadge>
            )}
          </div>
          <LiveMap
            className="h-[250px] md:h-[300px]"
            showRoute={!!activeAmbulance}
            ambulanceProgress={ambMapPos}
            startCoords={activeAmbulance?.lat && activeAmbulance?.lng ? [activeAmbulance.lat, activeAmbulance.lng] : undefined}
          />
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
                    s.mode === "corridor"
                      ? "bg-success border-success text-success-foreground scale-110"
                      : s.mode === "emergency"
                      ? "bg-warning/20 border-warning text-warning animate-signal-blink"
                      : "bg-secondary border-border text-muted-foreground"
                  }`}>
                    <div className="w-2 h-2 rounded-full bg-current" />
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center hidden sm:block">{s.signal_code}</span>
                  {i === ambulanceSignalIdx && activeCorridors.length > 0 && (
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
                      <span className="font-mono text-sm font-bold">{s.signal_code}</span>
                      <div className={`w-3 h-3 rounded-full ${
                        s.mode === "corridor" ? "bg-success" :
                        s.mode === "emergency" ? "bg-warning animate-signal-blink" :
                        "bg-muted-foreground/30"
                      }`} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <MapPin className="w-3 h-3" /> {s.location}
                    </div>
                    <div className="flex items-center justify-between">
                      <StatusBadge severity={s.mode === "corridor" ? "success" : s.mode === "emergency" ? "warning" : "info"}>
                        {s.mode === "corridor" ? "Green Corridor" : s.mode === "emergency" ? "Emergency" : "Normal"}
                      </StatusBadge>
                      {s.mode !== "corridor" && (
                        <button
                          onClick={() => manualOverride(s.id, "corridor")}
                          className="text-[10px] text-primary hover:underline"
                        >
                          Override
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Analytics */}
          <GlassCard>
            <h3 className="font-semibold text-sm mb-4">System Analytics</h3>
            <MiniAnalytics metrics={[
              { label: "Signals Overridden", value: stats.signals_overridden_today || "0", bar: 70, color: "bg-success" },
              { label: "Corridors Today", value: stats.total_corridors_today || "0", bar: 60, color: "bg-primary" },
              { label: "Avg Clear Time", value: "12s", bar: 40, color: "bg-warning" },
              { label: "System Uptime", value: stats.system_uptime || "99.9%", bar: 99, color: "bg-success" },
              { label: "Active Ambulances", value: allAmbulances.filter(a => a.status !== "offline" && a.status !== "available").length.toString(), bar: 30, color: "bg-destructive" },
            ]} />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
