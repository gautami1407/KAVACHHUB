import { Wifi, WifiOff, Signal } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type Status = "online" | "low" | "offline";

export function NetworkStatus({ className }: { className?: string }) {
  const [status, setStatus] = useState<Status>("online");

  useEffect(() => {
    const handler = () => setStatus(navigator.onLine ? "online" : "offline");
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);
    return () => { window.removeEventListener("online", handler); window.removeEventListener("offline", handler); };
  }, []);

  const cfg = {
    online: { icon: Wifi, label: "Online", color: "text-success", bg: "bg-success/10", border: "border-success/20" },
    low: { icon: Signal, label: "Low Network", color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
    offline: { icon: WifiOff, label: "Offline Mode", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
  }[status];

  const Icon = cfg.icon;

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium", cfg.bg, cfg.border, cfg.color, className)}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </div>
  );
}
