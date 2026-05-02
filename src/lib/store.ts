// Central in-memory event/alert simulation store with subscriber pattern.
// Acts as a "live backend" for the dashboard until a real API is wired up.

export type Severity = "critical" | "high" | "medium" | "low";

export interface ApiEvent {
  id: string;
  ts: number;
  method: "GET" | "POST" | "PUT" | "DELETE";
  endpoint: string;
  status: number;
  latencyMs: number;
  user: string;
  ip: string;
  bytesOut: number;
  suspicious?: boolean;
  tag?: string;
}

export interface Alert {
  id: string;
  ts: number;
  severity: Severity;
  type: string;
  title: string;
  description: string;
  user?: string;
  endpoint?: string;
  meta?: Record<string, string | number>;
  anomalyScore?: number;
}

type Listener = () => void;

const MAX_EVENTS = 400;
const MAX_ALERTS = 80;

// Each user has a unique numeric ID. The demo customer (Xasanboy) is 101024.
export const DEMO_USER = { id: "101024", name: "Xasanboy", username: "user_101024" };
const USERS = [
  "user_101024", // Xasanboy (demo)
  "user_20451717", // Dilshod
  "user_312088", // Aziza
  "user_450209", // Bekzod
  "user_777301", // Jamshid
  "user_900145", // Madina
];
const IPS = ["10.0.12.4", "10.0.12.55", "10.0.14.21", "85.143.221.7", "185.234.12.99", "192.168.10.5"];
const ENDPOINTS = [
  { method: "GET" as const, path: "/api/accounts" },
  { method: "GET" as const, path: "/api/cards" },
  { method: "GET" as const, path: "/api/transactions" },
  { method: "POST" as const, path: "/api/transfer" },
  { method: "POST" as const, path: "/api/auth/login" },
];

function rand<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function rid() { return Math.random().toString(36).slice(2, 10); }

class Store {
  events: ApiEvent[] = [];
  alerts: Alert[] = [];
  telegramQueue: Alert[] = [];
  private listeners = new Set<Listener>();

  // Per-user, per-action recent click counter (sliding 30s window).
  // Used to flag rapid repeated normal actions as suspicious behavior.
  private actionLog = new Map<string, number[]>();
  private alertedActions = new Set<string>();

  subscribe(l: Listener) { this.listeners.add(l); return () => this.listeners.delete(l); }
  private emit() { this.listeners.forEach((l) => l()); }

  /** Track a (user, action) click. Returns count in the last 30s window. */
  private trackRate(user: string, action: string) {
    const key = `${user}::${action}`;
    const now = Date.now();
    const arr = (this.actionLog.get(key) ?? []).filter((t) => now - t < 30_000);
    arr.push(now);
    this.actionLog.set(key, arr);
    return arr.length;
  }
  private maybeFlagAbuse(user: string, action: string, endpoint: string, count: number) {
    const key = `${user}::${action}`;
    if (count >= 8 && !this.alertedActions.has(key)) {
      this.alertedActions.add(key);
      this.pushAlert({
        severity: count >= 15 ? "high" : "medium",
        type: "Rate Abuse",
        title: `Repeated ${action} by ${user}`,
        description: `${count} ${action} actions in <30s — far above normal user behavior.`,
        user, endpoint,
        meta: { count, window: "30s" },
        anomalyScore: Math.min(95, 50 + count * 2),
      });
      // auto-reset after 60s so it can re-trigger later
      setTimeout(() => this.alertedActions.delete(key), 60_000);
    }
  }

  pushEvent(e: Omit<ApiEvent, "id" | "ts"> & { ts?: number }) {
    const ev: ApiEvent = { id: rid(), ts: e.ts ?? Date.now(), ...e };
    this.events = [ev, ...this.events].slice(0, MAX_EVENTS);
    this.emit();
    return ev;
  }

  /**
   * High-level demo helper: a user performs a normal action.
   * Emits an event AND, if the user repeats the same action many times in 30s,
   * marks subsequent events as suspicious + raises a "Rate Abuse" alert.
   */
  performUserAction(opts: {
    user: string; ip?: string; action: string;
    method: ApiEvent["method"]; endpoint: string;
    status?: number; latencyMs?: number; bytesOut?: number;
  }) {
    const ip = opts.ip ?? "10.0.12.4";
    const count = this.trackRate(opts.user, opts.action);
    const suspicious = count >= 6;
    this.pushEvent({
      method: opts.method, endpoint: opts.endpoint,
      status: opts.status ?? 200,
      latencyMs: opts.latencyMs ?? 40 + Math.random() * 80,
      user: opts.user, ip,
      bytesOut: opts.bytesOut ?? 1200 + Math.random() * 2000,
      suspicious, tag: suspicious ? "rate_abuse" : opts.action,
    });
    this.maybeFlagAbuse(opts.user, opts.action, opts.endpoint, count);
    return count;
  }

  pushAlert(a: Omit<Alert, "id" | "ts"> & { ts?: number }) {
    const al: Alert = { id: rid(), ts: a.ts ?? Date.now(), ...a };
    this.alerts = [al, ...this.alerts].slice(0, MAX_ALERTS);
    if (al.severity === "critical" || al.severity === "high") {
      this.telegramQueue = [al, ...this.telegramQueue].slice(0, 5);
    }
    this.emit();
    return al;
  }

  clearTelegram(id: string) {
    this.telegramQueue = this.telegramQueue.filter((a) => a.id !== id);
    this.emit();
  }

  // ---- Simulators ----
  simulateNormalLogin() {
    this.pushEvent({
      method: "POST", endpoint: "/api/auth/login", status: 200,
      latencyMs: 80 + Math.random() * 60, user: rand(USERS), ip: rand(IPS), bytesOut: 420,
    });
  }
  simulateViewAccounts() {
    this.pushEvent({
      method: "GET", endpoint: "/api/accounts", status: 200,
      latencyMs: 40 + Math.random() * 50, user: rand(USERS), ip: rand(IPS), bytesOut: 2200,
    });
  }
  simulateViewCards() {
    this.pushEvent({
      method: "GET", endpoint: "/api/cards", status: 200,
      latencyMs: 35 + Math.random() * 40, user: rand(USERS), ip: rand(IPS), bytesOut: 1800,
    });
  }
  simulateTransfer() {
    this.pushEvent({
      method: "POST", endpoint: "/api/transfer", status: 200,
      latencyMs: 120 + Math.random() * 100, user: rand(USERS), ip: rand(IPS), bytesOut: 600,
    });
  }
  simulateViewTransactions() {
    this.pushEvent({
      method: "GET", endpoint: "/api/transactions", status: 200,
      latencyMs: 60 + Math.random() * 70, user: rand(USERS), ip: rand(IPS), bytesOut: 4400,
    });
  }
  simulateFailedLogin() {
    this.pushEvent({
      method: "POST", endpoint: "/api/auth/login", status: 401,
      latencyMs: 90 + Math.random() * 60, user: "user_777301", ip: "185.234.12.99", bytesOut: 220,
      suspicious: true, tag: "failed_login",
    });
  }
  simulateBruteForce() {
    const ip = "185.234.12.99";
    for (let i = 0; i < 22; i++) {
      setTimeout(() => {
        this.pushEvent({
          method: "POST", endpoint: "/api/auth/login", status: 401,
          latencyMs: 70 + Math.random() * 50, user: "user_777301", ip,
          bytesOut: 200, suspicious: true, tag: "brute_force",
        });
      }, i * 60);
    }
    setTimeout(() => {
      this.pushAlert({
        severity: "high", type: "Brute Force",
        title: "Brute force login attempts detected",
        description: `22 failed logins in <1 min from ${ip}`,
        user: "user_777301", endpoint: "/api/auth/login",
        meta: { ip, attempts: 22 }, anomalyScore: 78,
      });
    }, 22 * 60 + 200);
  }
  simulateBOLA() {
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        this.pushEvent({
          method: "GET", endpoint: `/api/accounts/${1001 + i}`, status: 200,
          latencyMs: 30 + Math.random() * 30, user: "user_777301", ip: "185.234.12.99",
          bytesOut: 1800, suspicious: true, tag: "bola",
        });
      }, i * 80);
    }
    setTimeout(() => {
      this.pushAlert({
        severity: "high", type: "API Enumeration / BOLA",
        title: "Sequential object access detected",
        description: "12 sequential GET /api/accounts/{id} requests by single user",
        user: "user_777301", endpoint: "/api/accounts/:id",
        meta: { range: "1001-1012" }, anomalyScore: 84,
      });
    }, 12 * 80 + 200);
  }
  simulateDataExfiltration() {
    this.pushEvent({
      method: "GET", endpoint: "/api/transactions/export", status: 200,
      latencyMs: 1820, user: "user_777301", ip: "185.234.12.99",
      bytesOut: 152 * 1024 * 1024, suspicious: true, tag: "exfil",
    });
    this.pushAlert({
      severity: "critical", type: "Data Exfiltration",
      title: "Large data download detected",
      description: "150MB exported in 5 min window — far above baseline (4.2MB)",
      user: "user_777301", endpoint: "/api/transactions/export",
      meta: { volume_mb: 150, window: "5m" }, anomalyScore: 94,
    });
  }
  simulateAfterHours() {
    const d = new Date(); d.setHours(2, 14, 0, 0);
    this.pushEvent({
      ts: d.getTime(),
      method: "GET", endpoint: "/api/accounts", status: 200,
      latencyMs: 80, user: "user_777301", ip: "185.234.12.99",
      bytesOut: 2400, suspicious: true, tag: "after_hours",
    });
    this.pushAlert({
      severity: "medium", type: "After-hours Access",
      title: "Activity outside business hours",
      description: "Account access at 02:14 — outside 07:00–22:00 baseline",
      user: "user_777301", endpoint: "/api/accounts",
      meta: { hour: "02:14" }, anomalyScore: 62,
    });
  }
  simulate5xx() {
    for (let i = 0; i < 14; i++) {
      setTimeout(() => {
        this.pushEvent({
          method: rand(["GET", "POST"] as const),
          endpoint: rand(ENDPOINTS).path, status: rand([500, 502, 503, 504]),
          latencyMs: 800 + Math.random() * 1200, user: rand(USERS), ip: rand(IPS),
          bytesOut: 300, suspicious: true, tag: "errors",
        });
      }, i * 90);
    }
    setTimeout(() => {
      this.pushAlert({
        severity: "medium", type: "High 5xx Error Rate",
        title: "Spike in server errors",
        description: "14 5xx responses across 4 endpoints in <2 min",
        endpoint: "multiple", meta: { errors: 14 }, anomalyScore: 58,
      });
    }, 14 * 90 + 200);
  }

  seed() {
    if (this.events.length) return;
    const now = Date.now();
    for (let i = 0; i < 180; i++) {
      const ep = rand(ENDPOINTS);
      const isErr = Math.random() < 0.04;
      this.events.push({
        id: rid(),
        ts: now - i * 9000 - Math.random() * 5000,
        method: ep.method,
        endpoint: ep.path,
        status: isErr ? rand([401, 500, 503]) : 200,
        latencyMs: 30 + Math.random() * 180,
        user: rand(USERS),
        ip: rand(IPS),
        bytesOut: 400 + Math.random() * 6000,
      });
    }
    this.alerts.push(
      { id: rid(), ts: now - 1000 * 60 * 18, severity: "medium", type: "After-hours Access",
        title: "Account viewed at 23:48", description: "user_204517 accessed account outside hours",
        user: "user_204517", endpoint: "/api/accounts", anomalyScore: 55 },
      { id: rid(), ts: now - 1000 * 60 * 64, severity: "low", type: "Latency Anomaly",
        title: "Latency above baseline", description: "p95 latency 412ms vs 180ms baseline",
        endpoint: "/api/transactions", anomalyScore: 44 },
    );
    this.emit();
  }
}

export const store = new Store();
store.seed();

// Background ambient traffic — keeps charts/feeds alive.
if (typeof window !== "undefined") {
  setInterval(() => {
    const ep = rand(ENDPOINTS);
    const isErr = Math.random() < 0.03;
    store.pushEvent({
      method: ep.method, endpoint: ep.path,
      status: isErr ? rand([401, 500, 503]) : 200,
      latencyMs: 30 + Math.random() * 160,
      user: rand(USERS), ip: rand(IPS),
      bytesOut: 400 + Math.random() * 5000,
    });
  }, 2200);
}
