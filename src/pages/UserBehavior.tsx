import { useMemo } from "react";
import { TopBar } from "@/components/TopBar";
import { useEvents, fmtBytes } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/lib/useApi";
import type { UserItem } from "@/lib/api";
import { normalizeUser, tsToMs, safeTimeAgo } from "@/lib/normalize";
import { ApiStateBanner } from "@/components/ApiStateBanner";

const META: Record<string, { label: string; risk: "low" | "medium" | "high" | "critical" }> = {
  user_101024: { label: "Xasanboy (demo)", risk: "low" },
  user_204517: { label: "Dilshod",  risk: "medium" },
  user_312088: { label: "Aziza",    risk: "low" },
  user_450209: { label: "Bekzod",   risk: "low" },
  user_777301: { label: "Suspicious", risk: "critical" },
  user_900145: { label: "Madina",   risk: "medium" },
};

export default function UserBehavior() {
  const events = useEvents();
  const api = useApi<UserItem[]>("/users");

  const fallback = useMemo<UserItem[]>(() => {
    const m = new Map<string, { user: string; reqs: number; failed: number; data: number; lastSeen: number; suspicious: number }>();
    events.forEach((e) => {
      const o = m.get(e.user) ?? { user: e.user, reqs: 0, failed: 0, data: 0, lastSeen: 0, suspicious: 0 };
      o.reqs++; o.data += e.bytesOut; o.lastSeen = Math.max(o.lastSeen, e.ts);
      if (e.endpoint === "/api/auth/login" && e.status >= 400) o.failed++;
      if (e.suspicious) o.suspicious++;
      m.set(e.user, o);
    });
    Object.keys(META).forEach((u) => {
      if (!m.has(u)) m.set(u, { user: u, reqs: 0, failed: 0, data: 0, lastSeen: Date.now() - 1000 * 60 * 60, suspicious: 0 });
    });
    return [...m.values()].map((r) => ({
      user: r.user,
      requests: r.reqs,
      failed_logins: r.failed,
      data_out_bytes: r.data,
      anomaly_score: Math.min(100, r.suspicious * 18 + r.failed * 4 + (r.data > 50 * 1024 * 1024 ? 30 : 0)),
      last_seen: r.lastSeen,
    }));
  }, [events]);

  const rows = ((api.data && api.data.length > 0) ? api.data.map(normalizeUser) : fallback)
    .slice()
    .sort((a, b) => b.anomaly_score - a.anomaly_score);

  return (
    <>
      <TopBar title="User Behavior" subtitle="Per-user activity & risk scoring"/>
      <main className="p-6 space-y-4 overflow-auto">
        <ApiStateBanner
          loading={api.loading}
          error={api.error}
          offline={api.offline}
          hasData={(api.data?.length ?? 0) > 0 || fallback.length > 0}
          what="users"
        />
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Users</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left font-normal py-2.5 px-3">User</th>
                    <th className="text-left font-normal py-2.5 px-3">Label</th>
                    <th className="text-right font-normal py-2.5 px-3">Requests</th>
                    <th className="text-right font-normal py-2.5 px-3">Failed logins</th>
                    <th className="text-right font-normal py-2.5 px-3">Data downloaded</th>
                    <th className="text-right font-normal py-2.5 px-3">Anomaly score</th>
                    <th className="text-right font-normal py-2.5 px-3">Last seen</th>
                    <th className="text-right font-normal py-2.5 px-3">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const meta = META[r.user] ?? { label: r.label ?? "Unknown", risk: r.risk ?? "low" };
                    const score = r.anomaly_score;
                    const sevColor =
                      score >= 81 ? "critical" :
                      score >= 61 ? "high" :
                      score >= 41 ? "medium" : "low";
                    return (
                      <tr key={r.user} className="border-t border-border/60 hover:bg-secondary/30">
                        <td className="py-2.5 px-3 font-mono">{r.user}</td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground">{meta.label}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums">{r.requests}</td>
                        <td className={`py-2.5 px-3 text-right tabular-nums ${r.failed_logins > 5 ? "text-critical" : ""}`}>{r.failed_logins}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums">{fmtBytes(r.data_out_bytes)}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div className="h-full" style={{ width: `${score}%`, background: `hsl(var(--${sevColor}))` }}/>
                            </div>
                            <span className="tabular-nums w-8 text-right">{score}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right text-xs text-muted-foreground">{safeTimeAgo(r.last_seen)}</td>
                        <td className={`py-2.5 px-3 text-right text-xs font-medium`} style={{ color: `hsl(var(--${meta.risk}))` }}>
                          {meta.risk.toUpperCase()}
                        </td>
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
