import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { NotificationPanel } from "./NotificationPanel";

export function RoleHeader({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 rounded-xl bg-secondary border border-border hover:border-primary/30 transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <Icon className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20 text-xs text-success font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          System Online
        </div>
        <NotificationPanel />
      </div>
    </header>
  );
}
