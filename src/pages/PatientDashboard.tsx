import { useState, useEffect, useCallback } from "react";
import { MapPin, Phone, QrCode, Heart, User, ChevronRight, Volume2, Shield, Smartphone, AlertTriangle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
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
import { useAuth } from "@/hooks/useSupabaseAuth";
import { useEmergency } from "@/hooks/useEmergency";
import { useAmbulanceTracking } from "@/hooks/useAmbulanceTracking";
import { supabase } from "@/lib/supabaseClient";
import type { AssistInstruction } from "@/lib/database.types";

export default function PatientDashboard() {
  const { user, profile } = useAuth();
  const {
    activeEmergency,
    patientData,
    emergencyContacts,
    assistSteps,
    loading: emergencyLoading,
    triggerEmergency,
    fetchAssistInstructions,
  } = useEmergency(user?.id);

  const { ambulancePosition, eta, distance, updateETA } = useAmbulanceTracking(
    activeEmergency?.ambulance_id || undefined
  );

  const [sosActive, setSosActive] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [assistProgress, setAssistProgress] = useState<(AssistInstruction & { done: boolean })[]>([]);
  const [hospitalName, setHospitalName] = useState<string>("");
  const [ambulanceCode, setAmbulanceCode] = useState<string>("");

  // Sync SOS state with active emergency
  useEffect(() => {
    if (activeEmergency && activeEmergency.status !== "completed") {
      setSosActive(true);
      fetchAssistInstructions(activeEmergency.emergency_type);
    }
  }, [activeEmergency, fetchAssistInstructions]);

  // Convert assist steps to progress format
  useEffect(() => {
    if (assistSteps.length > 0) {
      setAssistProgress(assistSteps.map((s, i) => ({ ...s, done: i < 2 })));
    }
  }, [assistSteps]);

  // Auto-progress assist steps
  useEffect(() => {
    if (!sosActive || assistProgress.length === 0) return;
    const t = setTimeout(() => {
      setAssistProgress(prev => {
        const next = [...prev];
        const idx = next.findIndex(s => !s.done);
        if (idx !== -1) next[idx] = { ...next[idx], done: true };
        return next;
      });
    }, 8000);
    return () => clearTimeout(t);
  }, [sosActive, assistProgress]);

  // Fetch hospital and ambulance names
  useEffect(() => {
    const fetchDetails = async () => {
      if (activeEmergency?.hospital_id) {
        const { data } = await supabase.from("hospitals").select("name").eq("id", activeEmergency.hospital_id).single();
        if (data) setHospitalName(data.name);
      }
      if (activeEmergency?.ambulance_id) {
        const { data } = await supabase.from("ambulances").select("unit_code").eq("id", activeEmergency.ambulance_id).single();
        if (data) setAmbulanceCode(data.unit_code);
      }
    };
    fetchDetails();
  }, [activeEmergency]);

  // Update ETA when ambulance or hospital position changes
  useEffect(() => {
    if (activeEmergency && ambulancePosition) {
      updateETA(activeEmergency.location_lat, activeEmergency.location_lng);
    }
  }, [ambulancePosition, activeEmergency, updateETA]);

  // Compute ambulance progress (0-100)
  const ambulanceProgress = (() => {
    if (!ambulancePosition || !activeEmergency) return 0;
    const totalDist = distance || 5;
    const progress = Math.min(95, Math.max(5, (1 - (totalDist / 10)) * 100));
    return progress;
  })();

  const handleTriggerSOS = useCallback(async () => {
    if (sosActive || emergencyLoading) return;
    setSosActive(true);

    let lat = 28.6139, lng = 77.2090;
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // Fallback to default coordinates
      }
    }

    await triggerEmergency({
      patientId: patientData?.id,
      severity: "critical",
      emergencyType: "General",
      lat,
      lng,
      locationText: "Auto-detected location",
    });
  }, [sosActive, emergencyLoading, triggerEmergency, patientData]);

  const handleVoiceTrigger = useCallback(async (detected: boolean) => {
    if (detected && !sosActive) {
      await handleTriggerSOS();
    }
  }, [sosActive, handleTriggerSOS]);

  const status = activeEmergency?.status || "idle";

  const timelineSteps = [
    { label: "Triggered", status: status !== "idle" ? "done" as const : "pending" as const },
    { label: "Ambulance Assigned", status: (status === "assigned" || status === "enroute" || status === "corridor" || status === "arrived") ? "done" as const : status === "triggered" ? "active" as const : "pending" as const },
    { label: "En Route", status: (status === "enroute" || status === "corridor" || status === "arrived") ? "done" as const : status === "assigned" ? "active" as const : "pending" as const },
    { label: "Corridor Active", status: (status === "corridor" || status === "arrived") ? "done" as const : status === "enroute" ? "active" as const : "pending" as const },
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
          <SeverityIndicator level={!sosActive ? "stable" : "critical"} />
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
                onClick={handleTriggerSOS}
                disabled={sosActive || emergencyLoading}
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
              {!sosActive && "Press for emergency help"}
              {status === "triggered" && "🔍 Detecting emergency…"}
              {status === "assigned" && `✅ Ambulance Assigned — Unit ${ambulanceCode}`}
              {status === "enroute" && `🚑 Ambulance En Route — ETA: ${eta || '...'} min`}
              {status === "corridor" && `🟢 Green Corridor Active — ETA: ${eta || '...'} min`}
              {status === "arrived" && "🏥 Ambulance has arrived!"}
            </p>

            <VoiceButton onEmergencyDetected={handleVoiceTrigger} />

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
                📍 {activeEmergency?.location_text || "Waiting for location..."}
              </div>
              <div className="space-y-2">
                <StatusStep label="Emergency Detected" active={sosActive} done={sosActive} />
                <StatusStep label={`Ambulance Assigned — Unit ${ambulanceCode || '...'}`} active={status === "assigned" || status === "enroute" || status === "corridor"} done={status === "enroute" || status === "corridor"} />
                <StatusStep label={`ETA: ${eta || '...'} minutes`} active={status === "enroute" || status === "corridor"} />
                <StatusStep label="Green Corridor Activated" active={status === "corridor"} done={status === "corridor"} />
                <StatusStep label={`Hospital: ${hospitalName || '...'}`} active={status === "enroute" || status === "corridor"} />
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">SafeRide QR</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center border border-border p-1">
                  {patientData ? (
                    <QRCodeSVG
                      value={patientData.emergency_id_code}
                      size={72}
                      level="M"
                    />
                  ) : (
                    <QrCode className="w-10 h-10 text-muted-foreground/30" />
                  )}
                </div>
                <div className={`flex-1 space-y-2 ${privacyMode ? "blur-sm select-none" : ""}`}>
                  <div className="text-xs text-muted-foreground">Blood Type: <span className="text-foreground font-medium">{patientData?.blood_group || "Not set"}</span></div>
                  <div className="text-xs text-muted-foreground">Allergies: <span className="text-foreground font-medium">{patientData?.allergies || "None"}</span></div>
                  <div className="text-xs text-muted-foreground">Emergency ID: <span className="text-foreground font-mono font-medium">{patientData?.emergency_id_code || "..."}</span></div>
                  <button className="text-xs text-primary hover:underline flex items-center gap-1">
                    Update Details <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Live Map */}
        {sosActive && activeEmergency && (
          <LiveMap
            className="h-64 md:h-80 animate-fade-in-up"
            showRoute
            ambulanceProgress={ambulanceProgress}
            startCoords={[activeEmergency.location_lat, activeEmergency.location_lng]}
            endCoords={hospitalName ? undefined : undefined}
          >
            <div className="absolute bottom-3 left-3 z-[1000] bg-card/95 backdrop-blur-sm p-3 rounded-xl border border-border shadow-lg">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-foreground animate-count-pulse">{eta || '...'}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">min</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-black text-foreground">{distance?.toFixed(1) || '...'}</div>
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
              {assistProgress.length > 0 ? assistProgress.map((s) => (
                <div key={s.id || s.step_number} className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-500 ${
                  s.done ? "bg-success/5 border-success/15" : "bg-secondary/50 border-border"
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                    s.done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                  }`}>{s.step_number}</div>
                  <span className={`text-sm ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.instruction_text}</span>
                </div>
              )) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Assist instructions will appear when an emergency is active
                </div>
              )}
            </div>
          </GlassCard>

          <div className="space-y-5">
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Emergency Contacts</h3>
              </div>
              <div className="space-y-2">
                {emergencyContacts.length > 0 ? emergencyContacts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
                    <div className={privacyMode ? "blur-sm select-none" : ""}>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.relation}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge severity="success">{c.notified ? "Notified" : "Pending"}</StatusBadge>
                      <a href={`tel:${c.phone}`} className="p-2 rounded-lg bg-primary/10 hover:bg-primary/15">
                        <Phone className="w-3.5 h-3.5 text-primary" />
                      </a>
                    </div>
                  </div>
                )) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No emergency contacts set up yet
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Mini analytics when active */}
            {sosActive && (
              <GlassCard className="animate-fade-in-up">
                <h3 className="font-semibold text-sm mb-3">Response Analytics</h3>
                <MiniAnalytics metrics={[
                  { label: "Detection Time", value: "2.1s", bar: 95, color: "bg-success" },
                  { label: "Dispatch Time", value: activeEmergency?.assigned_at ? `${Math.round((new Date(activeEmergency.assigned_at).getTime() - new Date(activeEmergency.triggered_at).getTime()) / 1000)}s` : "...", bar: 80, color: "bg-primary" },
                  { label: "Corridor Status", value: status === "corridor" ? "Active" : "Pending", bar: status === "corridor" ? 100 : 30, color: "bg-success" },
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
