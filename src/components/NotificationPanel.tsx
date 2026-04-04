import { Bell, X, AlertTriangle, Ambulance, Hospital } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useSupabaseAuth";
import { useNotifications } from "@/hooks/useNotifications";

const iconMap = {
  emergency: AlertTriangle,
  info: Ambulance,
  success: Hospital,
};

const colorMap = {
  emergency: "text-destructive",
  info: "text-primary",
  success: "text-success",
};

export function NotificationPanel() {
  const { user, profile } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications(user?.id, profile?.role);
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (unreadCount === 0) return;
    const interval = setInterval(() => {
      setFlash(true);
      setTimeout(() => setFlash(false), 1000);
    }, 5000);
    return () => clearInterval(interval);
  }, [unreadCount]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-xl bg-secondary border border-border hover:border-primary/20 transition-colors"
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className={cn(
            "absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center transition-transform",
            flash && "scale-125"
          )}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto bg-card rounded-2xl border border-border p-2 z-50 animate-fade-in-up shadow-xl">
          <div className="px-3 py-2 text-sm font-semibold border-b border-border mb-1">Notifications</div>
          {notifications.length === 0 && (
            <div className="p-4 text-center text-muted-foreground text-sm">No notifications</div>
          )}
          {notifications.map((n) => {
            const Icon = iconMap[n.type] || AlertTriangle;
            return (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors animate-slide-in">
                <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", colorMap[n.type] || "text-primary")} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.message}</div>
                  <div className="text-[10px] text-muted-foreground/60 mt-1">{formatTime(n.created_at)}</div>
                </div>
                <button onClick={() => markAsRead(n.id)} className="p-1 hover:bg-secondary rounded-lg">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
