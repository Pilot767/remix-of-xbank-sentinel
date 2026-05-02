import { Loader2, WifiOff, AlertTriangle } from "lucide-react";

interface Props {
  loading: boolean;
  error: string | null;
  offline: boolean;
  /** True if there's any data to render (even fallback). */
  hasData: boolean;
  what?: string;
}

/**
 * Inline banner shown above page content when the API is loading,
 * errored, or completely offline. Returns null when everything's fine.
 */
export function ApiStateBanner({ loading, error, offline, hasData, what = "data" }: Props) {
  if (offline && !hasData) {
    return (
      <div className="rounded-md border border-critical/30 bg-critical/10 p-4 flex items-center gap-3 text-sm">
        <WifiOff className="w-4 h-4 text-critical" />
        <div>
          <div className="font-medium text-critical">Backend disconnected</div>
          <div className="text-xs text-muted-foreground">
            Could not load {what}. Showing demo data. Retrying every 5s.
          </div>
        </div>
      </div>
    );
  }
  if (loading && !hasData) {
    return (
      <div className="rounded-md border border-border bg-card p-4 flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading {what}…
      </div>
    );
  }
  if (error && hasData) {
    return (
      <div className="rounded-md border border-medium/30 bg-medium/10 p-2.5 px-3 flex items-center gap-2 text-xs text-medium">
        <AlertTriangle className="w-3.5 h-3.5" />
        Last refresh failed ({error}). Showing previous data.
      </div>
    );
  }
  return null;
}
