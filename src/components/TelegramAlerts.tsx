import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useTelegram } from "@/lib/hooks";
import { store } from "@/lib/store";
import { cn } from "@/lib/utils";

export function TelegramAlerts() {
  const queue = useTelegram();
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-[360px]">
      {queue.map((a) => (
        <Card key={a.id} alert={a} />
      ))}
    </div>
  );
}

function Card({ alert }: { alert: ReturnType<typeof useTelegram>[number] }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 8000);
    const t2 = setTimeout(() => store.clearTelegram(alert.id), 8400);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [alert.id]);

  const sevClass = alert.severity === "critical" ? "border-critical shadow-danger" : "border-high";
  const emoji = alert.severity === "critical" ? "🚨" : "⚠️";

  return (
    <div
      className={cn(
        "rounded-xl border bg-card/95 backdrop-blur p-4 transition-all animate-slide-in",
        sevClass,
        !show && "opacity-0 translate-x-3"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-danger flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-critical-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: `hsl(var(--${alert.severity}))` }}>
              {emoji} {alert.severity}
            </span>
            <span className="text-[10px] text-muted-foreground">SentinelBot</span>
          </div>
          <div className="font-semibold text-sm mt-1">{alert.type}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{alert.description}</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-2 text-[11px] font-mono">
            <span className="text-muted-foreground">Service:</span><span>XBank API</span>
            {alert.user && (<><span className="text-muted-foreground">User:</span><span>{alert.user}</span></>)}
            {alert.endpoint && (<><span className="text-muted-foreground">Endpoint:</span><span className="truncate">{alert.endpoint}</span></>)}
            {alert.anomalyScore != null && (
              <><span className="text-muted-foreground">Anomaly:</span><span>{alert.anomalyScore}/100</span></>
            )}
          </div>
        </div>
        <button onClick={() => store.clearTelegram(alert.id)} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
