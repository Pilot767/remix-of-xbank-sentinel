// Real backend client. Direct calls to ngrok backend (no proxy).
// Base URL is configurable via localStorage("sentinel_api") or VITE_API_URL.

export const DEFAULT_API_BASE = "https://service-matador-stimulant.ngrok-free.dev";

export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const ls = window.localStorage.getItem("sentinel_api");
    if (ls) return ls.replace(/\/+$/, "");
  }
  const env = (import.meta as any).env?.VITE_API_URL as string | undefined;
  return (env ?? DEFAULT_API_BASE).replace(/\/+$/, "");
}

export function setApiBase(url: string) {
  window.localStorage.setItem("sentinel_api", url.replace(/\/+$/, ""));
}

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const NGROK_HEADERS = {
  "ngrok-skip-browser-warning": "true",
  Accept: "application/json",
};

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const url = `${getApiBase()}${path}`;
  const res = await fetch(url, { method: "GET", headers: NGROK_HEADERS, signal });
  if (!res.ok) throw new ApiError(res.status, `API GET failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  const url = `${getApiBase()}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...NGROK_HEADERS, "Content-Type": "application/json" },
    body: body == null ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, `API POST failed: ${res.status}`);
  const text = await res.text();
  try {
    return (text ? JSON.parse(text) : (undefined as unknown)) as T;
  } catch {
    return undefined as unknown as T;
  }
}

// ---------- Backend payload types ----------
export interface StatsResponse {
  total_requests: number;
  error_rate: number;        // 0–100
  avg_latency_ms: number;
  active_users: number;
  data_out_bytes: number;
  open_alerts: number;
  critical_alerts: number;
}

export interface AlertItem {
  id: string | number;
  ts: number | string;
  severity: "critical" | "high" | "medium" | "low";
  type: string;
  title: string;
  description?: string;
  user?: string;
  endpoint?: string;
  anomaly_score?: number;
}

export interface TrafficItem {
  method: string;
  endpoint: string;
  requests: number;
  error_rate: number;       // 0–100
  avg_latency_ms: number;
  data_out_bytes: number;
}

export interface UserItem {
  user: string;
  label?: string;
  requests: number;
  failed_logins: number;
  data_out_bytes: number;
  anomaly_score: number;    // 0–100
  last_seen: number | string;
  risk?: "low" | "medium" | "high" | "critical";
}

export interface HealthService {
  name: string;
  role?: string;
  status: "healthy" | "degraded" | "down";
  cpu: number;
  memory: number;
  uptime?: string;
}

// ---------- Simulation endpoints ----------
export const SIMULATIONS = [
  { key: "normal-login",       label: "Normal login",       sev: "primary" },
  { key: "failed-login",       label: "Failed login",       sev: "warning" },
  { key: "brute-force",        label: "Brute force",        sev: "danger"  },
  { key: "bola",               label: "BOLA enumeration",   sev: "danger"  },
  { key: "data-exfiltration",  label: "Data exfiltration",  sev: "danger"  },
  { key: "after-hours",        label: "After-hours access", sev: "warning" },
  { key: "5xx-errors",         label: "5xx error burst",    sev: "warning" },
] as const;

export type SimulationKey = typeof SIMULATIONS[number]["key"];

export function triggerSimulation(key: SimulationKey) {
  return apiPost(`/simulate/${key}`);
}
