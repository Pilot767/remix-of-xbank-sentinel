import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAlerts } from "@/lib/hooks";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const alerts = useAlerts();
  const open = alerts.filter((a) => a.severity === "critical" || a.severity === "high").length;
  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur flex items-center px-6 gap-6">
      <div>
        <h1 className="text-base font-semibold leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search endpoints, users, IPs…" className="pl-9 w-72 h-9 bg-background/60" />
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary">
          <span className="relative flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-success pulse-dot" />
            <span className="relative w-2 h-2 rounded-full bg-success" />
          </span>
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
        <button className="relative p-2 rounded-md hover:bg-secondary">
          <Bell className="w-4 h-4" />
          {open > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-critical text-critical-foreground">
              {open}
            </Badge>
          )}
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
            AD
          </div>
          <div className="hidden sm:block text-xs leading-tight">
            <div className="font-medium">Admin</div>
            <div className="text-muted-foreground">XBank SOC</div>
          </div>
        </div>
      </div>
    </header>
  );
}
