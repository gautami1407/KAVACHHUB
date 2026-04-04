import { useState, useEffect, useCallback } from "react";
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
import { useAuth } from "@/hooks/useSupabaseAuth";
import { useEmergency } from "@/hooks/useEmergency";
import { useAmbulanceTracking } from "@/hooks/useAmbulanceTracking";
import { useTrafficSignals } from "@/hooks/useTrafficSignals";
import { supabase } from "@/lib/supabaseClient";
import type { Emergency, Patient } from "@/lib/database.types";

export default function AmbulanceDashboard() {
  const { user } = useAuth();
  const {
    activeEmergency,
    acceptEmergency,
    updateEmergencyStatus,
  } = useEmergency(user?.id);

  const [myAmbulanceId, setMyAmbulanceId] = useState<string | null>(null);
  const [pendingEmergency, setPendingEmergency] = useState<Emergency | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [patientInfo, setPatientInfo] = useState<{ name: string; age: string; blood: string; condition: string; allergies: string; emergencyId: string }>({
    name: "...", age: "...", blood: "...", condition: "...", allergies: "None", emergencyId: "..."
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hospitalName, setHospitalName] = useState("");

  // Fetch the ambulance assigned to this driver
  useEffect(() => {
    const fetchAmbulance = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("ambulances")
        .select("id")
        .eq("driver_id", user.id)
        .single();
      if (data) setMyAmbulanceId(data.id);
    };
    fetchAmbulance();
  }, [user?.id]);

  const { ambulancePosition, eta, distance, startTracking, updateETA } = useAmbulanceTracking(
    myAmbulanceId || undefined,
    true // isDriver
  );

  const { signals, corridorSignals, updateCorridorSignalByProximity } = useTrafficSignals();

  // Listen for incoming emergencies assigned to this ambulance
  useEffect(() => {
    if (!myAmbulanceId) return;

    const fetchPending = async () => {
      const { data } = await supabase
        .from("emergencies")
        .select("*")
        .eq("ambulance_id", myAmbulanceId)
        .in("status", ["triggered", "assigned"])
        .order("triggered_at", { ascending: false })
        .limit(1)
        .single();
      if (data) setPendingEmergency(data as Emergency);
    };
    fetchPending();

    // Also check if already accepted
    const fetchActive = async () => {
      const { data } = await supabase
        .from("emergencies")
        .select("*")
        .eq("ambulance_id", myAmbulanceId)
        .in("status", ["enroute", "corridor"])
        .order("triggered_at", { ascending: false })
        .limit(1)
        .single();
      if (data) {
        setPendingEmergency(null);
        setAccepted(true);
      }
    };
    fetchActive();

    const channel = supabase
      .channel("ambulance-emergency")
      .on("postgres_changes", { event: "*", schema: "public", table: "emergencies" }, (payload) => {
        const e = payload.new as Emergency;
        if (e.ambulance_id === myAmbulanceId) {
          if (e.status === "assigned" || e.status === "triggered") {
            setPendingEmergency(e);
          } else if (e.status === "enroute" || e.status === "corridor") {
            setAccepted(true);
            setPendingEmergency(null);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myAmbulanceId]);

  // Fetch patient info for emergency
  const currentEmergency = activeEmergency || pendingEmergency;
  useEffect(() => {
    const fetchPatient = async () => {
      if (!currentEmergency?.patient_id) return;
      const { data: patient } = await supabase
        .from("patients")
        .select("*")
        .eq("id", currentEmergency.patient_id)
        .single();
      if (patient) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", (patient as Patient).user_id)
          .single();
        setPatientInfo({
          name: profile?.full_name || "Unknown",
          age: patient.date_of_birth ? `${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years` : "Unknown",
          blood: patient.blood_group || "Unknown",
          condition: currentEmergency.emergency_type,
          allergies: patient.allergies || "None",
          emergencyId: patient.emergency_id_code,
        });
      }
      if (currentEmergency.hospital_id) {
        const { data: hosp } = await supabase.from("hospitals").select("name").eq("id", currentEmergency.hospital_id).single();
        if (hosp) setHospitalName(hosp.name);
      }
    };
    fetchPatient();
  }, [currentEmergency]);

  // Elapsed time counter
  useEffect(() => {
    if (!accepted) return;
    const i = setInterval(() => setElapsedTime(t => t + 1), 1000);
    return () => clearInterval(i);
  }, [accepted]);

  // Update ETA towards emergency location
  useEffect(() => {
    if (accepted && currentEmergency && ambulancePosition) {
      updateETA(currentEmergency.location_lat, currentEmergency.location_lng);
    }
  }, [accepted, currentEmergency, ambulancePosition, updateETA]);

  // Update traffic signals based on ambulance proximity
  useEffect(() => {
    if (accepted && ambulancePosition) {
      updateCorridorSignalByProximity(ambulancePosition.lat, ambulancePosition.lng);
    }
  }, [accepted, ambulancePosition, updateCorridorSignalByProximity]);

  const handleAccept = useCallback(async () => {
    if (!pendingEmergency) return;
    await acceptEmergency(pendingEmergency.id);
    setAccepted(true);
    setPendingEmergency(null);
    startTracking();
  }, [pendingEmergency, acceptEmergency, startTracking]);

  const handleReject = useCallback(() => {
    setPendingEmergency(null);
  }, []);

  const ambulanceProgress = (() => {
    if (!ambulancePosition || !currentEmergency) return 5;
    const dist = distance || 5;
    return Math.min(95, Math.max(5, (1 - (dist / 10)) * 100));
  })();

  // Signal data for display
  const signalDisplay = signals.slice(0, 5).map(s => ({
    id: s.signal_code,
    location: s.location,
    distance: "...",
    status: s.mode === "corridor" ? "green" as const : s.mode === "emergency" ? "turning" as const : "red" as const,
  }));

  const timelineSteps = [
    { label: "Alert Received", status: "done" as const },
    { label: "Accepted", status: accepted ? "done" as const : "active" as const },
    { label: "En Route", status: accepted ? "active" as const : "pending" as const },
    { label: "Corridor Active", status: accepted && ambulanceProgress > 30 ? "active" as const : "pending" as const },
    { label: "Delivered", status: "pending" as const },
  ];

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const hasAlert = !!pendingEmergency;

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
                <SeverityIndicator level={pendingEmergency?.severity === "critical" ? "critical" : pendingEmergency?.severity === "moderate" ? "moderate" : "stable"} className="mb-3" />
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {pendingEmergency?.location_text || "Location pending"}</p>
                  <p>🫀 {pendingEmergency?.emergency_type || "Emergency"}</p>
                  <p>👤 {patientInfo.name} · Blood: {patientInfo.blood}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAccept} className="flex-1 py-3.5 rounded-xl bg-success text-success-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-105 transition-all active:scale-[0.98] shadow-lg">
                <CheckCircle className="w-5 h-5" /> Accept Mission
              </button>
              <button onClick={handleReject} className="flex-1 py-3.5 rounded-xl bg-secondary border border-border text-muted-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-accent transition-all">
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
                <div className="text-2xl font-black animate-count-pulse">{eta || '...'}</div>
                <div className="text-[10px] text-muted-foreground uppercase">ETA min</div>
              </GlassCard>
              <GlassCard className="!p-4 text-center" hover>
                <Navigation className="w-4 h-4 text-primary mx-auto mb-1" />
                <div className="text-2xl font-black">{distance?.toFixed(1) || '...'}</div>
                <div className="text-[10px] text-muted-foreground uppercase">km left</div>
              </GlassCard>
              <GlassCard className="!p-4 text-center" hover>
                <Timer className="w-4 h-4 text-warning mx-auto mb-1" />
                <div className="text-2xl font-black font-mono">{formatTime(elapsedTime)}</div>
                <div className="text-[10px] text-muted-foreground uppercase">elapsed</div>
              </GlassCard>
              <GlassCard className="!p-4 text-center" hover>
                <div className="text-2xl font-black text-success">{signals.filter(s => s.mode === "corridor").length}</div>
                <div className="text-[10px] text-muted-foreground uppercase">green signals</div>
              </GlassCard>
            </div>

            {/* Navigation Map */}
            <LiveMap
              className="h-64 md:h-80"
              showRoute
              ambulanceProgress={ambulanceProgress}
              startCoords={currentEmergency ? [currentEmergency.location_lat, currentEmergency.location_lng] : undefined}
            />

            {/* Traffic Signal Strip */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <Navigation className="w-4 h-4 text-success" />
                <h3 className="font-semibold text-sm">Traffic Signal Status</h3>
                <StatusBadge severity="success">Green Corridor</StatusBadge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {signalDisplay.map((s) => (
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
                  <Row label="Name" value={patientInfo.name} />
                  <Row label="Age" value={patientInfo.age} />
                  <Row label="Blood Group" value={patientInfo.blood} />
                  <Row label="Condition" value={patientInfo.condition} />
                  <Row label="Allergies" value={patientInfo.allergies} />
                  <Row label="Emergency ID" value={patientInfo.emergencyId} />
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
                  { label: "Distance Covered", value: `${distance ? (10 - distance).toFixed(1) : '0'} km`, bar: distance ? ((10 - distance) / 10) * 100 : 0, color: "bg-primary" },
                  { label: "Signals Overridden", value: `${signals.filter(s => s.mode === "corridor").length}`, bar: (signals.filter(s => s.mode === "corridor").length / Math.max(signals.length, 1)) * 100, color: "bg-success" },
                  { label: "Avg Speed", value: ambulancePosition?.speed ? `${Math.round(ambulancePosition.speed)} km/h` : "-- km/h", bar: ambulancePosition?.speed ? Math.min(100, (ambulancePosition.speed / 80) * 100) : 0, color: "bg-warning" },
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
