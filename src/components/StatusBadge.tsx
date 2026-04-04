import { cn } from "@/lib/utils";

type Severity = "critical" | "moderate" | "low" | "success" | "warning" | "info";

const styles: Record<Severity, string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  moderate: "bg-warning/20 text-warning border-warning/30",
  low: "bg-primary/20 text-primary border-primary/30",
  success: "bg-success/20 text-success border-success/30",
  warning: "bg-warning/20 text-warning border-warning/30",
  info: "bg-primary/20 text-primary border-primary/30",
};

export function StatusBadge({ severity, children, className }: { severity: Severity; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border", styles[severity], className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", {
        "bg-destructive": severity === "critical",
        "bg-warning": severity === "moderate" || severity === "warning",
        "bg-primary": severity === "low" || severity === "info",
        "bg-success": severity === "success",
      })} />
      {children}
    </span>
  );
}
