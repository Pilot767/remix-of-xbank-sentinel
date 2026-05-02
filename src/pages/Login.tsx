import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@xbank.uz");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem("sentinel_auth", "1");
      toast.success("Authenticated. Welcome back, Admin.");
      nav("/dashboard");
    }, 600);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 grid-bg">
      <div className="hidden lg:flex flex-col justify-between p-12 border-r border-border bg-card/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold">Sentinel API</div>
            <div className="text-xs text-muted-foreground">Universal API Monitoring Platform</div>
          </div>
        </div>

        <div className="space-y-6 max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight leading-tight">
            Real-time visibility into every API call across your bank.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sentinel ingests OpenTelemetry traces from every service, learns normal behavior over
            30–90 days, and surfaces anomalies the moment they appear — brute force, BOLA,
            data exfiltration, after-hours access and more.
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              ["NIST CSF 2.0", "Compliant"],
              ["ISO 27001", "Aligned"],
              ["OWASP API", "Top 10"],
            ].map(([a, b]) => (
              <div key={a} className="rounded-lg border border-border bg-card/60 p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{a}</div>
                <div className="text-xs font-medium mt-1">{b}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          © 2026 Sentinel · Demo environment for XBank
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Sentinel API</span>
          </div>

          <div>
            <h1 className="text-2xl font-semibold">Sign in to console</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Demo credentials are pre-filled. Click sign in.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>

          <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90" disabled={loading}>
            <Lock className="w-4 h-4 mr-2" />
            {loading ? "Signing in…" : "Sign in"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Protected by SSO · TOTP · IP allowlist
          </p>
        </form>
      </div>
    </div>
  );
}
