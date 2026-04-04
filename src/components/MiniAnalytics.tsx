import { cn } from "@/lib/utils";

interface Metric {
  label: string;
  value: string;
  bar: number;
  color: string;
}

export function MiniAnalytics({ metrics, className }: { metrics: Metric[]; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {metrics.map((m) => (
        <div key={m.label}>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">{m.label}</span>
            <span className="font-semibold">{m.value}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-1000", m.color)} style={{ width: `${m.bar}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
