import { useMemo } from "react";
import { TopBar } from "@/components/TopBar";
import { useAlerts, useEvents, timeAgo } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { SeverityBadge } from "@/components/Badges";

export default function Anomaly() {
  const events = useEvents();
  const alerts = useAlerts();

  const anomalyScore = useMemo(() => {
    const recent = events.slice(0, 100);
    const errors = recent.filter((e) => e.status >= 400).length;
    const exfil = recent.some((e) => e.bytesOut > 50 * 1024 * 1024);
    const suspicious = recent.filter((e) => e.suspicious).length;
    let s = 18;
    s += Math.min(40, errors * 3);
    s += Math.min(40, suspicious * 4);
    if (exfil) s += 30;
    return Math.min(100, s);
  }, [events]);

  const sev: "low" | "medium" | "high" | "critical" =
    anomalyScore >= 81 ? "critical" :
    anomalyScore >= 61 ? "high" :
    anomalyScore >= 41 ? "medium" : "low";

  const baselineSeries = useMemo(() => {
    const data: { t: string; baseline: number; current: number }[] = [];
    const buckets = new Map<string, number>();
    events.forEach((e) => {
      const d = new Date(e.ts);
      const k = `${d.getHours()}:${String(Math.floor(d.getMinutes() / 5) * 5).padStart(2, "0")}`;
      buckets.set(k, (buckets.get(k) ?? 0) + 1);
    });
    const now = Date.now();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now - i * 5 * 60_000);
      const k = `${d.getHours()}:${String(Math.floor(d.getMinutes() / 5) * 5).padStart(2, "0")}`;
      data.push({ t: k, baseline: 28 + Math.round(Math.sin(i / 2) * 6), current: buckets.get(k) ?? 0 });
    }
    return data;
  }, [events]);

  const topUsers = useMemo(() => {
    const m = new Map<string, number>();
    events.forEach((e) => { if (e.suspicious) m.set(e.user, (m.get(e.user) ?? 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [events]);

  const topEndpoints = useMemo(() => {
    const m = new Map<string, number>();
    events.forEach((e) => { if (e.suspicious) m.set(e.endpoint.replace(/\/\d+/g, "/:id"), (m.get(e.endpoint.replace(/\/\d+/g, "/:id")) ?? 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [events]);

  const aiAlerts = alerts.slice(0, 6);

  const detectors = [
    "Unusual request rate",
    "Unusual error rate",
    "Unusual response size",
    "Unusual latency",
    "Unusual user behavior",
    "Unusual endpoint access",
    "Possible data exfiltration",
    "Possible BOLA / API enumeration",
  ];

  return (
    <>
      <TopBar title="AI Anomaly Detection" subtitle="Behavioral baseline → real-time anomaly scoring"/>
      <main className="p-6 space-y-6 overflow-auto">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="bg-gradient-card border-border lg:col-span-2 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl"/>
            <CardContent className="p-6 relative">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                  <Brain className="w-6 h-6 text-primary-foreground"/>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <Sparkles className="w-3 h-3 text-primary"/>
                    <span className="uppercase tracking-wider text-muted-foreground">Sentinel ML Model · v2.4</span>
                  </div>
                  <div className="text-base font-semibold mt-1">Learning your XBank API behavior</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Baseline trained on 47 days of traffic (target: 30–90 days)
                  </div>
                </div>
                <SeverityBadge sev={sev}/>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-5">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Training period</div>
                  <div className="text-lg font-semibold tabular-nums">47 / 90 days</div>
                  <div className="h-1.5 mt-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-gradient-primary" style={{ width: "52%" }}/>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Model confidence</div>
                  <div className="text-lg font-semibold tabular-nums">92.4%</div>
                  <div className="h-1.5 mt-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-success" style={{ width: "92%" }}/>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Current anomaly score</div>
                  <div className="text-lg font-semibold tabular-nums" style={{ color: `hsl(var(--${sev}))` }}>
                    {anomalyScore}/100
                  </div>
                  <div className="h-1.5 mt-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full" style={{ width: `${anomalyScore}%`, background: `hsl(var(--${sev}))` }}/>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm">What the model watches</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {detectors.map((d) => (
                <div key={d} className="flex items-center gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"/>
                  <span className="text-muted-foreground">{d}</span>
                </div>
              ))}
              <div className="pt-3 mt-3 border-t border-border text-[10px] text-muted-foreground leading-relaxed">
                Severity by score: <span className="text-low">0–40 normal</span> ·{" "}
                <span className="text-medium">41–60 low</span> ·{" "}
                <span className="text-high">61–80 high</span> ·{" "}
                <span className="text-critical">81–100 critical</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">Baseline vs current traffic</CardTitle>
              <p className="text-xs text-muted-foreground">5-minute buckets</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground"/>Baseline</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary"/>Current</span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={baselineSeries}>
                <defs>
                  <linearGradient id="cur" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={11}/>
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11}/>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}/>
                <Area type="monotone" dataKey="baseline" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" fill="transparent"/>
                <Area type="monotone" dataKey="current" stroke="hsl(var(--primary))" fill="url(#cur)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary"/> Top anomalous users</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {topUsers.length === 0 && <p className="text-xs text-muted-foreground">No anomalous behavior yet.</p>}
              {topUsers.map(([u, n]) => (
                <div key={u} className="flex items-center justify-between text-sm">
                  <span className="font-mono">{u}</span>
                  <span className="text-xs text-critical tabular-nums">{n} signals</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary"/> Top anomalous endpoints</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {topEndpoints.length === 0 && <p className="text-xs text-muted-foreground">No anomalous endpoints yet.</p>}
              {topEndpoints.map(([e, n]) => (
                <div key={e} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs truncate">{e}</span>
                  <span className="text-xs text-critical tabular-nums">{n}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 text-primary"/> Recent AI alerts</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {aiAlerts.length === 0 && <p className="text-xs text-muted-foreground">Quiet — model has no concerns.</p>}
              {aiAlerts.map((a) => (
                <div key={a.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <SeverityBadge sev={a.severity}/>
                    <span className="text-xs font-medium truncate">{a.title}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{a.type} · {timeAgo(a.ts)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
