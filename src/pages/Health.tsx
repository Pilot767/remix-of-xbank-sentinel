import { TopBar } from "@/components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useApi } from "@/lib/useApi";
import type { HealthService } from "@/lib/api";
import { ApiStateBanner } from "@/components/ApiStateBanner";

const FALLBACK_SERVICES: HealthService[] = [
  { name: "Kafka", role: "Event streaming bus (raw.events topic)", cpu: 28, memory: 41, uptime: "12d 4h", status: "healthy" },
  { name: "ClickHouse", role: "Columnar storage for events & metrics", cpu: 36, memory: 52, uptime: "12d 4h", status: "healthy" },
  { name: "Redis", role: "Hot cache for rate-limit & sessions", cpu: 9, memory: 14, uptime: "12d 4h", status: "healthy" },
  { name: "PostgreSQL", role: "Config, users, alert state", cpu: 12, memory: 22, uptime: "12d 4h", status: "healthy" },
  { name: "Loki", role: "Log aggregation (Promtail → Loki)", cpu: 18, memory: 27, uptime: "12d 4h", status: "healthy" },
  { name: "OpenTelemetry Collector", role: "Receives OTLP traces from XBank services", cpu: 22, memory: 31, uptime: "12d 4h", status: "healthy" },
  { name: "Watchdog Engine", role: "Real-time detection & rule evaluation", cpu: 41, memory: 48, uptime: "12d 4h", status: "healthy" },
  { name: "Alertmanager", role: "Routes alerts to Telegram / email / PagerDuty", cpu: 6, memory: 11, uptime: "12d 4h", status: "healthy" },
  { name: "Grafana", role: "Operator dashboards & ad-hoc exploration", cpu: 14, memory: 24, uptime: "12d 4h", status: "degraded" },
  { name: "VictoriaMetrics", role: "Long-term metrics storage (Prom-compatible)", cpu: 19, memory: 33, uptime: "12d 4h", status: "healthy" },
];

const PIPELINE = [
  "XBank Demo App",
  "API events",
  "OpenTelemetry Collector",
  "Kafka (raw.events)",
  "Watchdog Detection Engine",
  "Alerts",
  "ClickHouse Storage",
  "Dashboard",
];

export default function Health() {
  const api = useApi<HealthService[]>("/health");
  const services = (api.data && api.data.length > 0) ? api.data : FALLBACK_SERVICES;

  return (
    <>
      <TopBar title="System Health" subtitle="Platform infrastructure status"/>
      <main className="p-6 space-y-6 overflow-auto">

        <ApiStateBanner
          loading={api.loading}
          error={api.error}
          offline={api.offline}
          hasData={services.length > 0}
          what="health"
        />

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Event pipeline</CardTitle>
            <p className="text-xs text-muted-foreground">From client request to dashboard rendering</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap">
              {PIPELINE.map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`px-3 py-2 rounded-md border text-xs font-medium
                    ${i === 0 ? "border-accent/40 bg-accent/10 text-accent"
                    : i === PIPELINE.length - 1 ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-secondary"}`}>
                    {step}
                  </div>
                  {i < PIPELINE.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground"/>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {services.map((s) => {
            const dot = s.status === "healthy" ? "success" : s.status === "degraded" ? "medium" : "critical";
            return (
              <Card key={s.name} className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full bg-${dot}`}/>
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.status}</span>
                  </div>
                  {s.role && <p className="text-xs text-muted-foreground leading-relaxed">{s.role}</p>}
                  <div className="space-y-1.5">
                    <Bar label="CPU" value={s.cpu}/>
                    <Bar label="Memory" value={s.memory}/>
                  </div>
                  {s.uptime && (
                    <div className="text-[10px] text-muted-foreground pt-1 border-t border-border">
                      Uptime · {s.uptime}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  const color = value > 80 ? "critical" : value > 60 ? "medium" : "primary";
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-0.5">
        <span>{label}</span>
        <span className="tabular-nums">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full" style={{ width: `${value}%`, background: `hsl(var(--${color}))` }}/>
      </div>
    </div>
  );
}
