// Normalization layer for backend payloads. Tolerates missing/renamed fields
// and coerces numerics so UI never renders NaN.

import type { AlertItem, TrafficItem, UserItem, StatsResponse } from "./api";

const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const str = (v: unknown, fallback = ""): string => {
  if (v === null || v === undefined) return fallback;
  return typeof v === "string" ? v : String(v);
};

export function normalizeAlert(item: any): AlertItem & { severity: AlertItem["severity"] } {
  const sevRaw = str(item?.severity ?? item?.level ?? "low").toLowerCase();
  const severity = (["critical", "high", "medium", "low"].includes(sevRaw) ? sevRaw : "low") as AlertItem["severity"];
  return {
    id: item?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: item?.ts ?? item?.created_at ?? item?.timestamp ?? new Date().toISOString(),
    severity,
    type: str(item?.type ?? item?.rule_type ?? item?.category, "unknown"),
    title: str(item?.title ?? item?.message ?? item?.name, "No description"),
    description: str(item?.description ?? item?.message ?? "", ""),
    user: str(item?.user ?? item?.user_id ?? item?.details?.user_id ?? "", ""),
    endpoint: str(item?.endpoint ?? item?.details?.sample_endpoint ?? item?.details?.endpoint ?? "", ""),
    anomaly_score: num(item?.anomaly_score ?? item?.score, 0),
  };
}

export function normalizeUser(item: any): UserItem {
  const anomaly = num(item?.anomaly_score ?? item?.score, 0);
  const riskRaw = str(item?.risk ?? "").toLowerCase();
  const risk = (["low", "medium", "high", "critical"].includes(riskRaw)
    ? riskRaw
    : anomaly >= 80 ? "critical" : anomaly >= 60 ? "high" : anomaly >= 40 ? "medium" : "low") as UserItem["risk"];
  return {
    user: str(item?.user ?? item?.user_id, "unknown"),
    label: str(item?.label ?? "", ""),
    requests: num(item?.requests ?? item?.request_count, 0),
    failed_logins: num(item?.failed_logins, 0),
    data_out_bytes: num(item?.data_out_bytes ?? item?.total_response_bytes, 0),
    anomaly_score: anomaly,
    last_seen: item?.last_seen ?? new Date().toISOString(),
    risk,
  };
}

export function normalizeTraffic(item: any): TrafficItem {
  const requests = num(item?.requests ?? item?.request_count, 0);
  const errors = num(item?.errors_5xx ?? item?.errors, 0);
  const errorRate = item?.error_rate != null ? num(item.error_rate, 0) : (requests ? (errors / requests) * 100 : 0);
  return {
    method: str(item?.method, "GET").toUpperCase(),
    endpoint: str(item?.endpoint, ""),
    requests,
    error_rate: errorRate,
    avg_latency_ms: num(item?.avg_latency_ms ?? item?.avg_duration_ms, 0),
    data_out_bytes: num(item?.data_out_bytes ?? item?.total_response_bytes, 0),
  };
}

export function normalizeStats(item: any): StatsResponse {
  return {
    total_requests: num(item?.total_requests, 0),
    error_rate: num(item?.error_rate, 0),
    avg_latency_ms: num(item?.avg_latency_ms, 0),
    active_users: num(item?.active_users, 0),
    data_out_bytes: num(item?.data_out_bytes, 0),
    open_alerts: num(item?.open_alerts, 0),
    critical_alerts: num(item?.critical_alerts, 0),
  };
}

// Time helpers tolerant of seconds, ms, ISO, or invalid values.
export function tsToMs(t: unknown): number {
  if (t == null) return Date.now();
  if (typeof t === "number" && Number.isFinite(t)) return t < 1e12 ? t * 1000 : t;
  if (typeof t === "string") {
    const n = Date.parse(t);
    if (Number.isFinite(n)) return n;
  }
  return Date.now();
}

export function safeTimeAgo(t: unknown): string {
  const ms = tsToMs(t);
  const diff = Date.now() - ms;
  if (!Number.isFinite(diff) || diff < 0 || diff < 1000) return "now";
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
