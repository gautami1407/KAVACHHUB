import { Link } from "react-router-dom";
import { Heart, Ambulance, Hospital, TrafficCone, Shield, ArrowRight, Zap, Activity, Clock, CheckCircle, LogIn } from "lucide-react";
import { GreenCorridorScene } from "@/components/GreenCorridorScene";
import { NetworkStatus } from "@/components/NetworkStatus";
import { useAuth } from "@/hooks/useSupabaseAuth";
import { useSystemStats } from "@/hooks/useSystemStats";

const roles = [
  {
    title: "Patient / Public",
    description: "Trigger SOS, track ambulance, get pre-hospital assistance",
    icon: Heart,
    path: "/patient",
    accent: "bg-destructive/10 border-destructive/20",
    iconColor: "text-destructive",
  },
  {
    title: "Ambulance Driver",
    description: "Receive alerts, navigate with green corridor, communicate",
    icon: Ambulance,
    path: "/ambulance",
    accent: "bg-primary/10 border-primary/20",
    iconColor: "text-primary",
  },
  {
    title: "Hospital Admin",
    description: "Manage beds, staff, incoming patients, and analytics",
    icon: Hospital,
    path: "/hospital",
    accent: "bg-success/10 border-success/20",
    iconColor: "text-success",
  },
  {
    title: "Traffic Control",
    description: "Monitor signals, activate green corridors, track ambulances",
    icon: TrafficCone,
    path: "/traffic",
    accent: "bg-warning/10 border-warning/20",
    iconColor: "text-warning",
  },
];

export default function Index() {
  const { user, profile, signOut } = useAuth();
  const { stats } = useSystemStats();

  const displayStats = [
    { label: "Avg Response", value: stats.avg_response_time || "4.2 min", icon: Clock },
    { label: "Lives Saved", value: stats.lives_saved || "0", icon: CheckCircle },
    { label: "Active Units", value: stats.active_units || "0", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-destructive/10 border border-destructive/20">
              <Shield className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">Jeevan Setu</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Emergency Response Ecosystem</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NetworkStatus />
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:block">{profile?.full_name}</span>
                <button
                  onClick={signOut}
                  className="px-3 py-1.5 rounded-full bg-secondary border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium hover:bg-primary/15 transition-colors"
              >
                <LogIn className="w-3 h-3" /> Sign In
              </Link>
            )}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20 text-xs text-success font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              System Online
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/5 border border-destructive/15 text-destructive text-xs font-semibold mb-5 animate-fade-in-up">
              <Zap className="w-3.5 h-3.5" />
              Intelligent End-to-End Emergency Response
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Every Second{" "}
              <span className="text-destructive">Counts</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              Connecting patients, ambulances, hospitals, and traffic systems in real-time for faster emergency response.
            </p>
          </div>

          {/* Stats strip */}
          <div className="flex justify-center gap-6 md:gap-10 mb-10 animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
            {displayStats.map(s => (
              <div key={s.label} className="text-center">
                <s.icon className="w-5 h-5 text-primary mx-auto mb-1" />
                <div className="text-xl md:text-2xl font-black">{s.value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-12">
            {roles.map((role, i) => (
              <Link
                key={role.path}
                to={role.path}
                className="group glass-card-hover !p-6 animate-fade-in-up"
                style={{ animationDelay: `${0.3 + i * 0.08}s` }}
              >
                <div className={`w-11 h-11 rounded-xl ${role.accent} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <role.icon className={`w-5 h-5 ${role.iconColor}`} />
                </div>
                <h3 className="font-bold text-base mb-1 flex items-center gap-2">
                  {role.title}
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{role.description}</p>
              </Link>
            ))}
          </div>

          {/* QR Scan Link */}
          <div className="text-center mb-8 animate-fade-in-up" style={{ animationDelay: "0.55s" }}>
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-semibold hover:bg-primary/15 transition-all"
            >
              🔍 Scan SafeRide QR Code
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 3D Corridor Section */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20 text-success text-xs font-semibold mb-3">
                <Zap className="w-3 h-3" />
                SHOWSTOPPER
              </div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight">3D Green Corridor Simulation</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Watch traffic signals dynamically turn green as the ambulance approaches — cars clear the path in real-time.
              </p>
            </div>
            <div className="glass-card overflow-hidden">
              <GreenCorridorScene className="h-[350px] md:h-[450px] w-full" />
              <div className="p-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-destructive" /> Ambulance</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success" /> Green Signal</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success/30" /> Corridor Path</span>
                </div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Real-time 3D Simulation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Jeevan Setu — Saving lives through technology
      </footer>
    </div>
  );
}
