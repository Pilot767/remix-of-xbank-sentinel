import { useEffect, useState } from "react";
import { apiGet, getApiBase } from "@/lib/api";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

/**
 * Tiny global banner that pings /stats every 5s and reports backend status.
 * Hidden when backend is healthy (after the first success).
 */
export function BackendStatus() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [base, setBase] = useState(getApiBase());

  useEffect(() => {
    let alive = true;
    const ping = async () => {
      try {
        await apiGet("/stats");
        if (alive) setOnline(true);
      } catch {
        if (alive) setOnline(false);
      }
    };
    ping();
    const id = window.setInterval(ping, 5000);
    return () => { alive = false; window.clearInterval(id); };
  }, []);

  if (online === null) return null;

  if (!online) {
    return (
      <div className="px-4 py-2 bg-critical/10 border-b border-critical/30 text-critical text-xs flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span className="font-medium">Backend disconnected</span>
        <span className="text-muted-foreground">
          — cannot reach <span className="font-mono">{base}</span>. Showing cached/demo data. Retrying every 5s.
        </span>
        <button
          className="ml-auto text-[11px] underline hover:text-foreground"
          onClick={() => {
            const next = window.prompt("Backend base URL", base);
            if (next) {
              window.localStorage.setItem("sentinel_api", next.replace(/\/+$/, ""));
              setBase(next);
              window.location.reload();
            }
          }}
        >
          Change URL
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-1.5 bg-success/5 border-b border-success/20 text-success text-[11px] flex items-center gap-2">
      <CheckCircle2 className="w-3 h-3" />
      <span>Connected to backend <span className="font-mono text-foreground">{base}</span></span>
    </div>
  );
}
