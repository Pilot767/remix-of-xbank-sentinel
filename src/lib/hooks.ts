import { useEffect, useState } from "react";
import { store, type ApiEvent, type Alert } from "./store";

function useStore<T>(selector: () => T): T {
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = store.subscribe(() => setTick((t) => t + 1));
    return () => { unsub(); };
  }, []);
  return selector();
}

export const useEvents = (): ApiEvent[] => useStore(() => store.events);
export const useAlerts = (): Alert[] => useStore(() => store.alerts);
export const useTelegram = (): Alert[] => useStore(() => store.telegramQueue);

export function fmtBytes(n: unknown) {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v) || v <= 0) return `0 B`;
  if (v < 1024) return `${Math.round(v)} B`;
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`;
  if (v < 1024 * 1024 * 1024) return `${(v / 1024 / 1024).toFixed(1)} MB`;
  return `${(v / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function fmtTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-GB", { hour12: false });
}

export function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function severityColor(sev: string) {
  switch (sev) {
    case "critical": return "critical";
    case "high": return "high";
    case "medium": return "medium";
    case "low": return "low";
    default: return "muted";
  }
}
