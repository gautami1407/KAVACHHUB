import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { NotificationPanel } from "./NotificationPanel";
import { NetworkStatus } from "./NetworkStatus";

export function RoleHeader({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 rounded-xl bg-secondary border border-border hover:border-primary/20 transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h1 className="text-lg font-bold tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <NetworkStatus className="hidden sm:inline-flex" />
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-success/10 border border-success/20 text-xs text-success font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Live
        </div>
        <NotificationPanel />
      </div>
    </header>
  );
}
