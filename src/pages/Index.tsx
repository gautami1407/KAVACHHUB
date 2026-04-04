import { Link } from "react-router-dom";
import { Heart, Ambulance, Hospital, TrafficCone, Shield, ArrowRight, Zap } from "lucide-react";

const roles = [
  {
    title: "Patient / Public",
    description: "Trigger SOS, track ambulance, get pre-hospital assistance",
    icon: Heart,
    path: "/patient",
    color: "from-destructive/20 to-destructive/5",
    border: "hover:border-destructive/40",
    iconColor: "text-destructive",
  },
  {
    title: "Ambulance Driver",
    description: "Receive alerts, navigate with green corridor, communicate",
    icon: Ambulance,
    path: "/ambulance",
    color: "from-primary/20 to-primary/5",
    border: "hover:border-primary/40",
    iconColor: "text-primary",
  },
  {
    title: "Hospital Admin",
    description: "Manage beds, staff, incoming patients, and analytics",
    icon: Hospital,
    path: "/hospital",
    color: "from-success/20 to-success/5",
    border: "hover:border-success/40",
    iconColor: "text-success",
  },
  {
    title: "Traffic Control",
    description: "Monitor signals, activate green corridors, track ambulances",
    icon: TrafficCone,
    path: "/traffic",
    color: "from-warning/20 to-warning/5",
    border: "hover:border-warning/40",
    iconColor: "text-warning",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-destructive/10 border border-destructive/20">
              <Shield className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">Jeevan Setu</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Emergency Response Ecosystem</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20 text-xs text-success font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            System Online
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20">
        <div className="text-center mb-12 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold mb-6 animate-fade-in-up">
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

        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
          {roles.map((role, i) => (
            <Link
              key={role.path}
              to={role.path}
              className={`group glass-card-hover !p-6 animate-fade-in-up ${role.border}`}
              style={{ animationDelay: `${0.3 + i * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <role.icon className={`w-6 h-6 ${role.iconColor}`} />
              </div>
              <h3 className="font-bold text-base mb-1 flex items-center gap-2">
                {role.title}
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{role.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Jeevan Setu — Saving lives through technology
      </footer>
    </div>
  );
}
