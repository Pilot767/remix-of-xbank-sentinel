import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet } from "./api";

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** True if the fetch never succeeded (used to show "Backend disconnected"). */
  offline: boolean;
  refresh: () => void;
}

const POLL_MS = 5000;

/**
 * Polling fetch hook. Auto-refreshes every 5s.
 * Keeps last successful data on subsequent failures (so UI doesn't flicker).
 */
export function useApi<T>(path: string, intervalMs: number = POLL_MS): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const everSucceeded = useRef(false);
  const tickRef = useRef(0);

  const fetchOnce = useCallback(async () => {
    const myTick = ++tickRef.current;
    const ctrl = new AbortController();
    try {
      const res = await apiGet<T>(path, ctrl.signal);
      if (tickRef.current !== myTick) return;
      setData(res);
      setError(null);
      setOffline(false);
      everSucceeded.current = true;
    } catch (e: any) {
      if (tickRef.current !== myTick) return;
      const msg = e?.message ?? "Network error";
      setError(msg);
      if (!everSucceeded.current) setOffline(true);
    } finally {
      if (tickRef.current === myTick) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    setLoading(true);
    fetchOnce();
    const id = window.setInterval(fetchOnce, intervalMs);
    return () => window.clearInterval(id);
  }, [fetchOnce, intervalMs]);

  return { data, loading, error, offline, refresh: fetchOnce };
}

// ---------- Global "any backend reachable?" signal ----------
type Listener = (online: boolean) => void;
const listeners = new Set<Listener>();
let globalOnline = false;

export function reportApiResult(ok: boolean) {
  if (ok !== globalOnline) {
    globalOnline = ok;
    listeners.forEach((l) => l(ok));
  }
}

export function useBackendStatus() {
  const [online, setOnline] = useState(globalOnline);
  useEffect(() => {
    const l: Listener = (v) => setOnline(v);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return online;
}
