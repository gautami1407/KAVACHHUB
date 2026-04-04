import { cn } from "@/lib/utils";

export function GlassCard({ children, className, hover, ...props }: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div className={cn(hover ? "glass-card-hover" : "glass-card", "p-5", className)} {...props}>
      {children}
    </div>
  );
}
