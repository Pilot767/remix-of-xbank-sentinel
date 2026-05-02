import { useMemo } from "react";
import { TopBar } from "@/components/TopBar";
import { useAlerts, useEvents, fmtBytes, fmtTime, timeAgo } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity, AlertTriangle, Users, Database, Gauge, ShieldAlert, ArrowDownRight, ArrowUpRight,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid,
} from "recharts";
import { MethodBadge, SeverityBadge, StatusBadge } from "@/components/Badges";
import { Link } from "react-router-dom";
import { useApi } from "@/lib/useApi";
import type { StatsResponse } from "@/lib/api";
import { normalizeStats } from "@/lib/normalize";
import { ApiStateBanner } from "@/components/ApiStateBanner";

function Stat({ icon: Icon, label, value, sub, trend, intent = "primary" }: {
  icon: any; label: string; value: string; sub?: string;
  trend?: { dir: "up" | "down"; value: string }; intent?: "primary" | "danger" | "warning" | "success";
}) {
  const intents: Record<string, string> = {
    primary: "from-primary/20 to-primary/0 text-primary",
    danger: "from-critical/25 to-critical/0 text-critical",
    warning: "from-medium/25 to-medium/0 text-medium",
    success: "from-success/25 to-success/0 text-success",
  };
  return (
    <Card className="bg-gradient-card border-border overflow-hidden relative">
      <div className={`absolute inset-0 bg-gradient-to-br ${intents[intent]} opacity-40 pointer-events-none`} />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="text-2xl font-semibold mt-2 tabular-nums">{value}</div>
            {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
          </div>
          <div className="p-2 rounded-lg bg-background/50 border border-border">
            <Icon className="w-4 h-4" />
          </div>
        </div>
        {trend && (
          <div className={`mt-3 inline-flex items-center text-xs gap-1 ${trend.dir === "up" ? "text-success" : "text-critical"}`}>
            {trend.dir === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend.value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Overview() {
  const events = useEvents();
  const alerts = useAlerts();
  const statsApi = useApi<StatsResponse>("/stats");

  const fallback = useMemo(() => {
    const total = events.length;
    const errors = events.filter((e) => e.status >= 400).length;
    return {
      total_requests: total,
      error_rate: total ? (errors / total) * 100 : 0,
      avg_latency_ms: total ? events.reduce((s, e) => s + e.latencyMs, 0) / total : 0,
      data_out_bytes: events.reduce((s, e) => s + e.bytesOut, 0),
      active_users: new Set(events.slice(0, 80).map((e) => e.user)).size,
      open_alerts: alerts.length,
      critical_alerts: alerts.filter((a) => a.severity === "critical").length,
    } as StatsResponse;
  }, [events, alerts]);

  const stats = normalizeStats(statsApi.data ?? fallback);

  const series = useMemo(() => {
    const buckets = new Map<string, { time: string; reqs: number; errors: number }>();
    const now = Date.now();
    for (let i = 11; i >= 0; i--) {
      const t = new Date(now - i * 60_000);
      const k = `${t.getHours()}:${String(t.getMinutes()).padStart(2, "0")}`;
      buckets.set(k, { time: k, reqs: 0, errors: 0 });
    }
    events.forEach((e) => {
      const t = new Date(e.ts);
      const k = `${t.getHours()}:${String(t.getMinutes()).padStart(2, "0")}`;
      const b = buckets.get(k); if (!b) return;
      b.reqs++; if (e.status >= 400) b.errors++;
    });
    return [...buckets.values()];
  }, [events]);

  const statusBreakdown = useMemo(() => {
    const groups: Record<string, number> = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 };
    events.forEach((e) => {
      const k = `${Math.floor(e.status / 100)}xx`;
      if (k in groups) groups[k]++;
    });
    return Object.entries(groups).map(([code, count]) => ({ code, count }));
  }, [events]);

  const topEndpoints = useMemo(() => {
    const m = new Map<string, { ep: string; count: number; errors: number }>();
    events.forEach((e) => {
      const k = e.endpoint.replace(/\/\d+/g, "/:id");
      const o = m.get(k) ?? { ep: k, count: 0, errors: 0 };
      o.count++; if (e.status >= 400) o.errors++;
      m.set(k, o);
    });
    return [...m.values()].sort((a, b) => b.count - a.count).slice(0, 6);
  }, [events]);

  const topUsers = useMemo(() => {
    const m = new Map<string, number>();
    events.forEach((e) => m.set(e.user, (m.get(e.user) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [events]);

  const recentAlerts = alerts.slice(0, 6);
  const recentEvents = events.slice(0, 12);

  return (
    <>
      <TopBar title="Overview" subtitle="Live picture of XBank API estate" />
      <main className="p-6 space-y-6 overflow-auto">

        <ApiStateBanner
          loading={statsApi.loading}
          error={statsApi.error}
          offline={statsApi.offline}
          hasData={statsApi.data !== null}
          what="dashboard stats"
        />

        <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Stat icon={Activity} label="Total requests" value={stats.total_requests.toLocaleString()} trend={{ dir: "up", value: "+12.4% / 1h" }} intent="primary" />
          <Stat icon={AlertTriangle} label="Error rate" value={`${stats.error_rate.toFixed(2)}%`} sub="last 5 min" intent={stats.error_rate > 5 ? "danger" : "success"} />
          <Stat icon={Gauge} label="Avg latency" value={`${stats.avg_latency_ms.toFixed(0)} ms`} sub="p50" intent="primary" />
          <Stat icon={Users} label="Active users" value={String(stats.active_users)} sub="last 5 min" intent="success" />
          <Stat icon={Database} label="Data out" value={fmtBytes(stats.data_out_bytes)} sub="last hour" intent="warning" />
          <Stat icon={ShieldAlert} label="Open alerts" value={String(stats.open_alerts)} sub={`${stats.critical_alerts} critical`} intent="danger" />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2 bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm">API Requests over time</CardTitle>
                <p className="text-xs text-muted-foreground">Per-minute requests vs errors</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary"/>Requests</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-critical"/>Errors</span>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--critical))" stopOpacity={0.6}/>
                      <stop offset="100%" stopColor="hsl(var(--critical))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11}/>
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11}/>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}/>
                  <Area type="monotone" dataKey="reqs" stroke="hsl(var(--primary))" fill="url(#g1)" strokeWidth={2}/>
                  <Area type="monotone" dataKey="errors" stroke="hsl(var(--critical))" fill="url(#g2)" strokeWidth={2}/>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Status code breakdown</CardTitle>
              <p className="text-xs text-muted-foreground">Distribution of HTTP responses</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={statusBreakdown}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="code" stroke="hsl(var(--muted-foreground))" fontSize={11}/>
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11}/>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}/>
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {statusBreakdown.map((s) => {
                  const c = s.code === "2xx" ? "success" : s.code === "4xx" ? "high" : s.code === "5xx" ? "critical" : "low";
                  return (
                    <div key={s.code} className="text-center rounded border border-border p-2">
                      <div className={`text-xs text-${c}`} style={{color:`hsl(var(--${c}))`}}>{s.code}</div>
                      <div className="text-sm font-semibold tabular-nums">{s.count}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Top endpoints</CardTitle>
              <Link to="/traffic" className="text-xs text-primary hover:underline">View all</Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {topEndpoints.map((e) => {
                const pct = (e.count / topEndpoints[0].count) * 100;
                return (
                  <div key={e.ep}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono truncate">{e.ep}</span>
                      <span className="text-muted-foreground tabular-nums">{e.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }}/>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Top users by requests</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {topUsers.map(([u, c]) => {
                const id = u.split("_")[1] ?? "??";
                const isDemo = u === "user_101024";
                const isAttacker = u === "user_777301";
                return (
                  <div key={u} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold border
                      ${isAttacker ? "bg-critical/20 border-critical/40 text-critical"
                        : isDemo ? "bg-primary/20 border-primary/40 text-primary"
                        : "bg-secondary border-border"}`}>
                      {id.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-mono truncate">{u}</div>
                      <div className="text-[10px] text-muted-foreground">
                        ID {id} · {isDemo ? "Xasanboy (demo)" : isAttacker ? "Suspicious" : "Normal"}
                      </div>
                    </div>
                    <div className="text-sm tabular-nums">{c}</div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Recent security alerts</CardTitle>
              <Link to="/alerts" className="text-xs text-primary hover:underline">All alerts</Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentAlerts.length === 0 && <p className="text-xs text-muted-foreground">No alerts yet — trigger an action in XBank Demo.</p>}
              {recentAlerts.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-secondary/60 border border-transparent hover:border-border">
                  <SeverityBadge sev={a.severity}/>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{a.title}</div>
                    <div className="text-[10px] text-muted-foreground">{a.type} · {timeAgo(a.ts)}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm">Live event feed</CardTitle>
              <p className="text-xs text-muted-foreground">Streaming from OpenTelemetry → Kafka → ClickHouse</p>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">tail -f</span>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-secondary/40">
                  <tr className="text-muted-foreground">
                    <th className="text-left font-normal py-2 px-3">Time</th>
                    <th className="text-left font-normal py-2 px-3">Method</th>
                    <th className="text-left font-normal py-2 px-3">Endpoint</th>
                    <th className="text-left font-normal py-2 px-3">Status</th>
                    <th className="text-left font-normal py-2 px-3">User</th>
                    <th className="text-left font-normal py-2 px-3">IP</th>
                    <th className="text-right font-normal py-2 px-3">Latency</th>
                    <th className="text-right font-normal py-2 px-3">Bytes</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((e) => (
                    <tr key={e.id} className={`border-t border-border/60 ${e.suspicious ? "bg-critical/5" : ""}`}>
                      <td className="py-2 px-3 font-mono text-muted-foreground">{fmtTime(e.ts)}</td>
                      <td className="py-2 px-3"><MethodBadge method={e.method}/></td>
                      <td className="py-2 px-3 font-mono">{e.endpoint}</td>
                      <td className="py-2 px-3"><StatusBadge status={e.status}/></td>
                      <td className="py-2 px-3 font-mono">{e.user}</td>
                      <td className="py-2 px-3 font-mono text-muted-foreground">{e.ip}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{e.latencyMs.toFixed(0)} ms</td>
                      <td className="py-2 px-3 text-right tabular-nums">{fmtBytes(e.bytesOut)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
