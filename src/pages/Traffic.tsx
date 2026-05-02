import { useMemo } from "react";
import { TopBar } from "@/components/TopBar";
import { useEvents, fmtBytes } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MethodBadge } from "@/components/Badges";
import { useApi } from "@/lib/useApi";
import type { TrafficItem } from "@/lib/api";
import { normalizeTraffic } from "@/lib/normalize";
import { ApiStateBanner } from "@/components/ApiStateBanner";

export default function Traffic() {
  const events = useEvents();
  const api = useApi<TrafficItem[]>("/traffic");

  const fallback = useMemo<TrafficItem[]>(() => {
    const m = new Map<string, { method: string; ep: string; count: number; errors: number; lat: number[]; bytes: number }>();
    events.forEach((e) => {
      const ep = e.endpoint.replace(/\/\d+/g, "/:id");
      const k = `${e.method} ${ep}`;
      const o = m.get(k) ?? { method: e.method, ep, count: 0, errors: 0, lat: [], bytes: 0 };
      o.count++; o.bytes += e.bytesOut; o.lat.push(e.latencyMs);
      if (e.status >= 400) o.errors++;
      m.set(k, o);
    });
    return [...m.values()].map((r) => ({
      method: r.method,
      endpoint: r.ep,
      requests: r.count,
      error_rate: r.count ? (r.errors / r.count) * 100 : 0,
      avg_latency_ms: r.lat.length ? r.lat.reduce((s, v) => s + v, 0) / r.lat.length : 0,
      data_out_bytes: r.bytes,
    }));
  }, [events]);

  const rows = ((api.data && api.data.length > 0) ? api.data.map(normalizeTraffic) : fallback)
    .slice()
    .sort((a, b) => b.requests - a.requests);

  return (
    <>
      <TopBar title="API Traffic" subtitle="Per-endpoint volume, latency and errors"/>
      <main className="p-6 space-y-4 overflow-auto">
        <ApiStateBanner
          loading={api.loading}
          error={api.error}
          offline={api.offline}
          hasData={(api.data?.length ?? 0) > 0 || fallback.length > 0}
          what="traffic"
        />
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">XBank API endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left font-normal py-2.5 px-3">Method</th>
                    <th className="text-left font-normal py-2.5 px-3">Endpoint</th>
                    <th className="text-right font-normal py-2.5 px-3">Requests</th>
                    <th className="text-right font-normal py-2.5 px-3">Error rate</th>
                    <th className="text-right font-normal py-2.5 px-3">Avg latency</th>
                    <th className="text-right font-normal py-2.5 px-3">Data out</th>
                    <th className="text-right font-normal py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const status =
                      r.error_rate > 10 ? { label: "Degraded", cls: "text-critical" }
                      : r.error_rate > 2 ? { label: "Watch", cls: "text-medium" }
                      : { label: "Healthy", cls: "text-success" };
                    return (
                      <tr key={`${r.method}-${r.endpoint}`} className="border-t border-border/60 hover:bg-secondary/30">
                        <td className="py-2.5 px-3"><MethodBadge method={r.method}/></td>
                        <td className="py-2.5 px-3 font-mono text-xs">{r.endpoint}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums">{r.requests}</td>
                        <td className={`py-2.5 px-3 text-right tabular-nums ${r.error_rate > 5 ? "text-critical" : "text-muted-foreground"}`}>
                          {r.error_rate.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">{r.avg_latency_ms.toFixed(0)} ms</td>
                        <td className="py-2.5 px-3 text-right tabular-nums">{fmtBytes(r.data_out_bytes)}</td>
                        <td className={`py-2.5 px-3 text-right text-xs font-medium ${status.cls}`}>● {status.label}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
