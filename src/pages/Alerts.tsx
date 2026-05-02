import { TopBar } from "@/components/TopBar";
import { useAlerts, timeAgo } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "@/components/Badges";
import { ShieldAlert, AlertOctagon, Clock } from "lucide-react";
import { useApi } from "@/lib/useApi";
import type { AlertItem } from "@/lib/api";
import { normalizeAlert, tsToMs } from "@/lib/normalize";
import { ApiStateBanner } from "@/components/ApiStateBanner";

const RULES = [
  { type: "Brute Force", sev: "high", desc: "20+ failed logins per minute per IP" },
  { type: "Data Exfiltration", sev: "critical", desc: ">100MB egress per user in 5 min" },
  { type: "After-hours Access", sev: "medium", desc: "Activity 22:00 – 07:00" },
  { type: "API Enumeration / BOLA", sev: "high", desc: "Sequential object-ID access" },
  { type: "High 5xx Error Rate", sev: "medium", desc: "Burst of server errors" },
];

export default function Alerts() {
  const localAlerts = useAlerts();
  const api = useApi<AlertItem[]>("/alerts");

  const alerts = (api.data && api.data.length > 0)
    ? api.data.map(normalizeAlert).map((a) => ({
        id: String(a.id),
        ts: tsToMs(a.ts),
        severity: a.severity,
        type: a.type,
        title: a.title,
        description: a.description ?? "",
        user: a.user,
        endpoint: a.endpoint,
        anomalyScore: a.anomaly_score,
      }))
    : localAlerts;

  const counts = {
    critical: alerts.filter(a => a.severity === "critical").length,
    high: alerts.filter(a => a.severity === "high").length,
    medium: alerts.filter(a => a.severity === "medium").length,
    low: alerts.filter(a => a.severity === "low").length,
  };

  return (
    <>
      <TopBar title="Security Alerts" subtitle="Detection rules and triggered incidents"/>
      <main className="p-6 space-y-6 overflow-auto">

        <ApiStateBanner
          loading={api.loading}
          error={api.error}
          offline={api.offline}
          hasData={(api.data?.length ?? 0) > 0 || localAlerts.length > 0}
          what="alerts"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(["critical","high","medium","low"] as const).map((s) => (
            <Card key={s} className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${s}/15`}>
                  <ShieldAlert className={`w-5 h-5`} style={{ color: `hsl(var(--${s}))` }}/>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{s}</div>
                  <div className="text-2xl font-semibold tabular-nums">{counts[s]}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 bg-card border-border">
            <CardContent className="p-0">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Triggered alerts</div>
                  <div className="text-xs text-muted-foreground">Most recent first</div>
                </div>
                <span className="text-xs text-muted-foreground">{alerts.length} total</span>
              </div>
              <div className="divide-y divide-border max-h-[640px] overflow-auto">
                {alerts.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No alerts. Trigger a simulation in the XBank Demo App.
                  </div>
                )}
                {alerts.map((a) => (
                  <div key={a.id} className="p-4 hover:bg-secondary/40">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center bg-${a.severity}/15`}>
                        <AlertOctagon className="w-4 h-4" style={{ color: `hsl(var(--${a.severity}))` }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <SeverityBadge sev={a.severity}/>
                          <span className="text-sm font-medium">{a.title}</span>
                          <span className="text-xs text-muted-foreground ml-auto inline-flex items-center gap-1">
                            <Clock className="w-3 h-3"/> {timeAgo(a.ts)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{a.description}</div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono">
                          <span><span className="text-muted-foreground">type:</span> {a.type}</span>
                          {a.user && <span><span className="text-muted-foreground">user:</span> {a.user}</span>}
                          {a.endpoint && <span><span className="text-muted-foreground">endpoint:</span> {a.endpoint}</span>}
                          {a.anomalyScore != null && <span><span className="text-muted-foreground">score:</span> {a.anomalyScore}/100</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="text-sm font-medium mb-3">Detection rules</div>
              <div className="space-y-3">
                {RULES.map((r) => (
                  <div key={r.type} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{r.type}</div>
                      <SeverityBadge sev={r.sev}/>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{r.desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
