import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";

type Level = "critical" | "moderate" | "stable";

const config: Record<Level, { icon: React.ElementType; label: string; color: string; bg: string; border: string }> = {
  critical: { icon: AlertTriangle, label: "Critical", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
  moderate: { icon: AlertCircle, label: "Moderate", color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
  stable: { icon: CheckCircle, label: "Stable", color: "text-success", bg: "bg-success/10", border: "border-success/20" },
};

export function SeverityIndicator({ level, className }: { level: Level; className?: string }) {
  const c = config[level];
  const Icon = c.icon;
  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-2 rounded-xl border", c.bg, c.border, className)}>
      <Icon className={cn("w-4 h-4", c.color)} />
      <div>
        <div className={cn("text-xs font-bold uppercase tracking-wider", c.color)}>{c.label}</div>
        <div className="text-[10px] text-muted-foreground">AI Severity Assessment</div>
      </div>
    </div>
  );
}
