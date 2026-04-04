import { CheckCircle, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStep {
  label: string;
  status: "done" | "active" | "pending";
}

interface Props {
  steps: TimelineStep[];
  className?: string;
}

export function EmergencyTimeline({ steps, className }: Props) {
  return (
    <div className={cn("flex items-center gap-0", className)}>
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-initial">
          <div className="flex flex-col items-center gap-1.5">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500",
              step.status === "done" && "bg-success border-success text-success-foreground",
              step.status === "active" && "bg-primary/10 border-primary text-primary animate-pulse",
              step.status === "pending" && "bg-muted border-border text-muted-foreground"
            )}>
              {step.status === "done" ? <CheckCircle className="w-4 h-4" /> :
               step.status === "active" ? <Loader2 className="w-4 h-4 animate-spin" /> :
               <Circle className="w-3 h-3" />}
            </div>
            <span className={cn(
              "text-[10px] font-medium text-center max-w-[80px] leading-tight",
              step.status === "done" && "text-success",
              step.status === "active" && "text-primary",
              step.status === "pending" && "text-muted-foreground"
            )}>{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn(
              "flex-1 h-0.5 mx-1 rounded-full transition-all duration-500 min-w-[20px]",
              step.status === "done" ? "bg-success" : "bg-border"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}
