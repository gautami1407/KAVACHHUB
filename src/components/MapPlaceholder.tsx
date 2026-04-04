import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapProps {
  className?: string;
  showRoute?: boolean;
  ambulancePosition?: number;
  children?: React.ReactNode;
}

export function MapPlaceholder({ className, showRoute, ambulancePosition = 30, children }: MapProps) {
  return (
    <div className={cn("relative rounded-2xl overflow-hidden bg-secondary/30 border border-border", className)}>
      {/* Grid */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `
          linear-gradient(hsl(var(--primary) / 0.2) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--primary) / 0.2) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }} />
      
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
        <path d="M 0 150 Q 100 100 200 150 T 400 120" stroke="hsl(var(--muted-foreground))" strokeWidth="2" fill="none" opacity="0.2" />
        <path d="M 50 0 Q 80 100 60 200 T 80 300" stroke="hsl(var(--muted-foreground))" strokeWidth="2" fill="none" opacity="0.2" />
        <path d="M 300 0 Q 320 80 310 150 T 350 300" stroke="hsl(var(--muted-foreground))" strokeWidth="2" fill="none" opacity="0.15" />
        
        {showRoute && (
          <>
            <path d="M 60 250 Q 120 180 200 150 T 350 60" stroke="hsl(var(--corridor))" strokeWidth="3" fill="none" strokeDasharray="8 4" opacity="0.8" />
            <circle
              cx={60 + (350 - 60) * ambulancePosition / 100}
              cy={250 - (250 - 60) * ambulancePosition / 100}
              r="6" fill="hsl(var(--destructive))"
            >
              <animate attributeName="r" values="6;8;6" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="350" cy="60" r="5" fill="hsl(var(--success))" opacity="0.8" />
          </>
        )}
      </svg>

      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-card/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-border text-xs">
        <MapPin className="w-3 h-3 text-primary" />
        <span className="text-muted-foreground">Live Map</span>
      </div>

      {showRoute && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-success/10 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-success/20 text-xs text-success">
          <Navigation className="w-3 h-3" />
          Green Corridor Active
        </div>
      )}

      {children}
    </div>
  );
}
