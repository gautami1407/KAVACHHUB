import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function PrivacyToggle({ enabled, onToggle, className }: { enabled: boolean; onToggle: () => void; className?: string }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all",
        enabled
          ? "bg-primary/10 border-primary/20 text-primary"
          : "bg-muted border-border text-muted-foreground hover:text-foreground"
      , className)}
    >
      {enabled ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
      {enabled ? "Privacy On" : "Privacy Off"}
    </button>
  );
}
