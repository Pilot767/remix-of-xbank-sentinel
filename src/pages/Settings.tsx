import { TopBar } from "@/components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  return (
    <>
      <TopBar title="Settings" subtitle="Notifications, integrations, retention"/>
      <main className="p-6 space-y-6 overflow-auto max-w-4xl">

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">Organization</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Organization name</Label>
              <Input defaultValue="XBank Joint-Stock Company"/>
            </div>
            <div className="space-y-1.5">
              <Label>Environment</Label>
              <Input defaultValue="production"/>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Telegram alerts", desc: "Send critical & high alerts to SOC channel", on: true, badge: "Connected" },
              { name: "Email digests", desc: "Daily summary at 09:00", on: true },
              { name: "PagerDuty", desc: "Page on-call for critical alerts", on: false },
              { name: "Slack #soc-alerts", desc: "Post all medium+ alerts", on: false },
            ].map((row) => (
              <div key={row.name} className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
                <div>
                  <div className="text-sm font-medium flex items-center gap-2">
                    {row.name}
                    {row.badge && <Badge variant="outline" className="border-success/40 text-success text-[10px]">{row.badge}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">{row.desc}</div>
                </div>
                <Switch defaultChecked={row.on}/>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">Detection thresholds</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Brute force — failed logins / min</Label><Input defaultValue="20"/></div>
            <div className="space-y-1.5"><Label>Data exfiltration — MB / 5 min</Label><Input defaultValue="100"/></div>
            <div className="space-y-1.5"><Label>After-hours window</Label><Input defaultValue="22:00 – 07:00"/></div>
            <div className="space-y-1.5"><Label>5xx error burst threshold</Label><Input defaultValue="10 in 2 min"/></div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">Retention</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label>Hot (ClickHouse)</Label><Input defaultValue="14 days"/></div>
            <div className="space-y-1.5"><Label>Warm (S3 / MinIO)</Label><Input defaultValue="90 days"/></div>
            <div className="space-y-1.5"><Label>Cold archive</Label><Input defaultValue="365 days"/></div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline">Discard</Button>
          <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">Save changes</Button>
        </div>
      </main>
    </>
  );
}
