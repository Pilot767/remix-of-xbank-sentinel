import { cn } from "@/lib/utils";
import type { Severity } from "@/lib/store";

export function SeverityBadge({ sev, className }: { sev: Severity | string; className?: string }) {
  const map: Record<string, string> = {
    critical: "bg-critical/15 text-critical border-critical/30",
    high: "bg-high/15 text-high border-high/30",
    medium: "bg-medium/15 text-medium border-medium/30",
    low: "bg-low/15 text-low border-low/30",
  };
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border",
      map[sev] ?? "bg-secondary text-muted-foreground border-border",
      className,
    )}>
      {sev}
    </span>
  );
}

export function StatusBadge({ status }: { status: number }) {
  const cls =
    status >= 500 ? "bg-critical/15 text-critical border-critical/30"
    : status >= 400 ? "bg-high/15 text-high border-high/30"
    : "bg-success/15 text-success border-success/30";
  return (
    <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border", cls)}>
      {status}
    </span>
  );
}

export function MethodBadge({ method }: { method: string }) {
  const map: Record<string, string> = {
    GET: "bg-low/15 text-low border-low/30",
    POST: "bg-success/15 text-success border-success/30",
    PUT: "bg-medium/15 text-medium border-medium/30",
    DELETE: "bg-critical/15 text-critical border-critical/30",
  };
  return (
    <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border w-14 justify-center",
      map[method] ?? "bg-secondary border-border")}>
      {method}
    </span>
  );
}
