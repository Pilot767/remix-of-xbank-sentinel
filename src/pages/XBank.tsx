import { useState } from "react";
import { Link } from "react-router-dom";
import { store, DEMO_USER } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TelegramAlerts } from "@/components/TelegramAlerts";
import { toast } from "sonner";
import {
  Building2, CreditCard, ArrowLeftRight, Receipt, Wallet, ShieldCheck, ExternalLink,
  LogIn, Eye, Send, Zap, Loader2,
} from "lucide-react";
import { SIMULATIONS, triggerSimulation, type SimulationKey } from "@/lib/api";

const ACCOUNTS = [
  { id: "AC-101024-01", name: "Salary card · UZS", number: "**** 4521", balance: "12 480 500 UZS" },
  { id: "AC-101024-02", name: "Savings · USD",     number: "**** 7811", balance: "$ 4,820.50" },
  { id: "AC-101024-03", name: "Business · UZS",    number: "**** 9302", balance: "85 200 000 UZS" },
];

const TXNS = [
  { id: "TX-90021", d: "Today 14:22", m: "Korzinka.uz", a: "-128 400 UZS" },
  { id: "TX-90020", d: "Today 11:08", m: "Salary · XBank Tech", a: "+12 000 000 UZS" },
  { id: "TX-90019", d: "Yesterday",   m: "Uber", a: "-32 000 UZS" },
  { id: "TX-90018", d: "Yesterday",   m: "Apple iCloud", a: "-$ 0.99" },
  { id: "TX-90017", d: "28 Apr",      m: "Internal transfer to **** 7811", a: "-1 200 000 UZS" },
];

const DEMO_IP = "10.0.12.4";

export default function XBank() {
  const [logged, setLogged] = useState(false);
  if (!logged) return <XBankLogin onLogin={() => setLogged(true)} />;
  return <XBankApp />;
}

function XBankLogin({ onLogin }: { onLogin: () => void }) {
  const handleLogin = () => {
    store.performUserAction({
      user: DEMO_USER.username, ip: DEMO_IP, action: "login",
      method: "POST", endpoint: "/api/auth/login", bytesOut: 420, latencyMs: 110,
    });
    onLogin();
    toast.success(`Signed in as ${DEMO_USER.name}`);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background grid-bg p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-3 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold tracking-tight">XBank</div>
            <div className="text-xs text-muted-foreground">Digital Banking</div>
          </div>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-1">
              <h1 className="text-lg font-semibold">Welcome back</h1>
              <p className="text-xs text-muted-foreground">
                Demo customer · {DEMO_USER.name} · ID {DEMO_USER.id}
              </p>
            </div>
            <Button className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
              onClick={handleLogin}>
              <LogIn className="w-4 h-4 mr-2" /> Sign in as {DEMO_USER.name}
            </Button>
            <Link to="/dashboard" className="block text-center text-xs text-muted-foreground hover:text-foreground">
              ← Back to monitoring console
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function XBankApp() {
  const [busy, setBusy] = useState<SimulationKey | null>(null);

  const act = (action: string, method: "GET" | "POST", endpoint: string, opts: { bytesOut?: number; latencyMs?: number } = {}) => {
    const count = store.performUserAction({
      user: DEMO_USER.username, ip: DEMO_IP, action, method, endpoint, ...opts,
    });
    if (count >= 8) toast.warning(`⚠ ${action} flagged as suspicious (${count}× in 30s)`);
    else toast.success(`${method} ${endpoint}`);
  };

  const runSim = async (key: SimulationKey, label: string) => {
    setBusy(key);
    try {
      await triggerSimulation(key);
      toast.success(`✓ Backend simulated: ${label}`, {
        description: "Dashboard will refresh within 5s.",
      });
    } catch (e: any) {
      toast.error(`Backend call failed: ${label}`, {
        description: e?.message ?? "Could not reach backend.",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* top bar */}
      <header className="h-16 border-b border-border bg-card/60 backdrop-blur flex items-center px-6 gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">XBank</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Demo App</div>
          </div>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-success" /> Protected by Sentinel
          </span>
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="w-3.5 h-3.5" /> Open Monitoring
            </Button>
          </Link>
        </div>
      </header>

      <main className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* left — bank UI */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Salom, {DEMO_USER.name} 👋</h1>
              <p className="text-xs text-muted-foreground">
                Logged in as <span className="font-mono">{DEMO_USER.username}</span> · ID{" "}
                <span className="font-mono">{DEMO_USER.id}</span>
              </p>
            </div>
          </div>

          <Tabs defaultValue="accounts" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="accounts" className="gap-2"><Wallet className="w-3.5 h-3.5" />Accounts</TabsTrigger>
              <TabsTrigger value="cards" className="gap-2"><CreditCard className="w-3.5 h-3.5" />Cards</TabsTrigger>
              <TabsTrigger value="transfer" className="gap-2"><ArrowLeftRight className="w-3.5 h-3.5" />Transfers</TabsTrigger>
              <TabsTrigger value="txns" className="gap-2"><Receipt className="w-3.5 h-3.5" />Transactions</TabsTrigger>
            </TabsList>

            <TabsContent value="accounts" className="space-y-3 mt-4">
              <p className="text-[11px] text-muted-foreground">Click any account to load it (sends GET /api/accounts/&#123;id&#125;)</p>
              {ACCOUNTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => act("view_account", "GET", `/api/accounts/${a.id}`, { bytesOut: 2200 })}
                  className="w-full text-left"
                >
                  <Card className="bg-card border-border hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{a.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{a.id} · {a.number}</div>
                      </div>
                      <div className="text-base font-semibold tabular-nums">{a.balance}</div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </TabsContent>

            <TabsContent value="cards" className="space-y-3 mt-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {ACCOUNTS.slice(0, 2).map((a, i) => (
                  <button key={a.id}
                    onClick={() => act("view_card", "GET", `/api/cards/${a.id}`, { bytesOut: 1800 })}
                    className="text-left">
                    <Card className={`border-0 text-primary-foreground ${i === 0 ? "bg-gradient-primary" : "bg-gradient-danger"}`}>
                      <CardContent className="p-5 h-44 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase tracking-wider opacity-80">
                            {i === 0 ? "Visa Platinum" : "Mastercard Gold"}
                          </span>
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div className="text-lg font-mono tracking-widest">{a.number}</div>
                        <div className="flex items-center justify-between text-xs">
                          <span>XASANBOY KARIMOV</span>
                          <span className="opacity-80">12/29</span>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">Click a card to load its details.</p>
            </TabsContent>

            <TabsContent value="transfer" className="mt-4">
              <Card className="bg-card border-border">
                <CardContent className="p-5 space-y-3">
                  <div className="text-sm font-medium">Send money</div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input className="bg-background border border-border rounded-md h-9 px-3 text-sm" placeholder="Recipient card" defaultValue="**** 7811" />
                    <input className="bg-background border border-border rounded-md h-9 px-3 text-sm" placeholder="Amount" defaultValue="500 000" />
                  </div>
                  <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90"
                    onClick={() => act("transfer", "POST", "/api/transfer", { bytesOut: 600, latencyMs: 180 })}>
                    <Send className="w-4 h-4 mr-2" /> Send transfer
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="txns" className="mt-4 space-y-3">
              <Button variant="outline" size="sm"
                onClick={() => act("view_transactions", "GET", "/api/transactions", { bytesOut: 4400 })}>
                <Eye className="w-3.5 h-3.5 mr-2" /> Refresh transactions
              </Button>
              <Card className="bg-card border-border">
                <CardContent className="p-0">
                  {TXNS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => act("view_transaction", "GET", `/api/transactions/${t.id}`, { bytesOut: 800 })}
                      className="w-full flex items-center justify-between px-5 py-3 border-b border-border last:border-0 hover:bg-secondary/40 text-left"
                    >
                      <div>
                        <div className="text-sm">{t.m}</div>
                        <div className="text-xs text-muted-foreground font-mono">{t.id} · {t.d}</div>
                      </div>
                      <div className={`text-sm font-medium tabular-nums ${t.a.startsWith("-") ? "" : "text-success"}`}>{t.a}</div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* right — info panel */}
        <aside className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Real-time monitoring</CardTitle>
              <p className="text-xs text-muted-foreground">
                Every action you take here is sent live to the Sentinel monitoring dashboard.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <Row k="User" v={DEMO_USER.name} />
              <Row k="User ID" v={DEMO_USER.id} mono />
              <Row k="Username" v={DEMO_USER.username} mono />
              <Row k="Source IP" v={DEMO_IP} mono />
              <Row k="Session" v="active" v2="text-success" />
              <div className="pt-2 border-t border-border text-muted-foreground">
                <div className="text-foreground font-medium mb-1">Behavior rule</div>
                Repeating the same action <b>6+ times</b> in 30s marks events as
                <span className="text-critical"> suspicious</span>;
                <b> 8+ times</b> raises a <span className="text-medium">Rate Abuse</span> alert.
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Backend simulations
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Trigger events on your real backend — dashboard refreshes within 5s.
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2">
              {SIMULATIONS.map((s) => {
                const variant =
                  s.sev === "danger" ? "destructive"
                  : s.sev === "warning" ? "outline"
                  : "secondary";
                const isBusy = busy === s.key;
                return (
                  <Button
                    key={s.key}
                    variant={variant as any}
                    size="sm"
                    disabled={isBusy}
                    onClick={() => runSim(s.key, s.label)}
                    className="justify-between"
                  >
                    <span className="flex items-center gap-2">
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      {s.label}
                    </span>
                    <span className="font-mono text-[10px] opacity-70">POST /simulate/{s.key}</span>
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
              <div className="text-foreground font-medium">Pipeline</div>
              <p className="font-mono text-[10px] leading-relaxed">
                XBank → OTel Collector → Kafka → Watchdog → ClickHouse → Dashboard
              </p>
              <Link to="/dashboard" className="inline-flex items-center gap-1 text-primary hover:underline mt-2">
                Open monitoring console <ExternalLink className="w-3 h-3" />
              </Link>
            </CardContent>
          </Card>
        </aside>
      </main>

      <TelegramAlerts />
    </div>
  );
}

function Row({ k, v, mono, v2 }: { k: string; v: string; mono?: boolean; v2?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className={`${mono ? "font-mono" : ""} ${v2 ?? ""}`}>{v}</span>
    </div>
  );
}
