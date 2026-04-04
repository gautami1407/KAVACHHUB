import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  icon: React.ElementType;
  className?: string;
  children?: React.ReactNode;
}

export function RoleHeader({ title, icon: Icon, className, children }: Props) {
  return (
    <header className={cn("border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-40", className)}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 rounded-xl bg-secondary border border-border hover:border-primary/20 transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-base font-bold tracking-tight">{title}</h1>
        </div>
        {children}
      </div>
    </header>
  );
}
