import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Activity, ShieldAlert, Users, Brain, HeartPulse,
  Settings as Cog, Building2, LogOut, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/traffic", label: "API Traffic", icon: Activity },
  { to: "/alerts", label: "Security Alerts", icon: ShieldAlert },
  { to: "/users", label: "User Behavior", icon: Users },
  { to: "/anomaly", label: "AI Anomaly", icon: Brain },
  { to: "/health", label: "System Health", icon: HeartPulse },
  { to: "/settings", label: "Settings", icon: Cog },
];

export function AdminSidebar() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-sidebar-border bg-sidebar shrink-0">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
          <ShieldCheck className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight">Sentinel API</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Monitoring</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((it) => {
          const active = pathname.startsWith(it.to);
          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"
              )}
            >
              <it.icon className="w-4 h-4" />
              <span>{it.label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        <Button
          variant="secondary" size="sm"
          className="w-full justify-start gap-2"
          onClick={() => nav("/xbank")}
        >
          <Building2 className="w-4 h-4" /> XBank Demo App
        </Button>
        <Button
          variant="ghost" size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={() => { localStorage.removeItem("sentinel_auth"); nav("/login"); }}
        >
          <LogOut className="w-4 h-4" /> Sign out
        </Button>
      </div>
    </aside>
  );
}
