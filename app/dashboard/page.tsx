"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  LayoutDashboard,
  Cpu,
  FileText,
  Settings,
  X,
} from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Company = {
  id: string;
  name: string;
  sector: string;
  company_age: string;
  team_size: string;
};

type Financials = {
  funding_stage: string;
  cash_balance_range: string;
  monthly_spend_range: string;
};

type Transaction = {
  id: string;
  amount: number;
  type: "debit" | "credit";
  category: string;
  description: string;
  transaction_date: string;
};

type Insight = {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  content: string;
  read_at: string | null;
  created_at: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Convert cash_balance_range string to a numeric midpoint (INR) */
function parseCashBalance(range: string): number {
  if (!range) return 0;
  if (range.includes("Under ₹10L")) return 500_000;
  if (range.includes("₹10L-₹50L")) return 3_000_000;
  if (range.includes("₹50L-₹2Cr")) return 12_500_000;
  if (range.includes("₹2Cr-₹10Cr")) return 60_000_000;
  if (range.includes("₹10Cr+")) return 150_000_000;
  return 0;
}

/** Short Indian-style currency format */
function fmt(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)}Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(0)}K`;
  return `₹${amount.toFixed(0)}`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Month+year when cash hits zero */
function zeroCashDate(runway: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + Math.floor(runway));
  d.setDate(d.getDate() + Math.round((runway % 1) * 30));
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

const CAT_EMOJI: Record<string, string> = {
  Salaries: "👥",
  Cloud: "☁️",
  "SaaS Tools": "🛠️",
  Marketing: "📣",
  Office: "🏢",
  Food: "🍔",
  Travel: "✈️",
  Legal: "⚖️",
  Taxes: "🏛️",
  Revenue: "💰",
  Other: "📦",
};

function runwayColor(m: number) {
  if (m > 12) return "text-emerald-400";
  if (m >= 6) return "text-white";
  return "text-red-400";
}
function runwayBarColor(m: number) {
  if (m > 12) return "bg-emerald-400";
  if (m >= 6) return "bg-white/80";
  return "bg-red-400";
}

// ─────────────────────────────────────────────────────────────────────────────
// Count-up animation hook
// ─────────────────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1300): number {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    let start: number | null = null;

    const step = (ts: number) => {
      if (!start) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
      setVal(parseFloat((eased * target).toFixed(1)));
      if (t < 1) requestAnimationFrame(step);
    };

    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, duration]);

  return val;
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

function Pulse({ className }: { className?: string }) {
  return <div className={`rounded-xl bg-zinc-800/70 animate-pulse ${className ?? ""}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 pb-28">
      <div className="flex items-center justify-between px-1 mb-4">
        <Pulse className="h-6 w-40" />
        <Pulse className="h-6 w-6 rounded-full" />
      </div>
      <Pulse className="h-[172px] w-full" />
      <Pulse className="h-[88px] w-full" />
      <Pulse className="h-4 w-28 mt-6" />
      {[1, 2, 3, 4, 5].map((i) => <Pulse key={i} className="h-14 w-full" />)}
      <Pulse className="h-4 w-28 mt-6" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => <Pulse key={i} className="h-[80px]" />)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);

  // ── Raw data ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("there");
  const [company, setCompany] = useState<Company | null>(null);
  const [financials, setFinancials] = useState<Financials | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);

  // ── Computed financial metrics ────────────────────────────────────────────
  const [grossBurn, setGrossBurn] = useState(0);
  const [netBurn, setNetBurn] = useState(0);
  const [lastMonthBurn, setLastMonthBurn] = useState(0);
  const [burnChange, setBurnChange] = useState<number | null>(null);
  const [categories, setCategories] = useState<{ category: string; amount: number }[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [runway, setRunway] = useState(0);
  const [hasTx, setHasTx] = useState(false);

  const animatedRunway = useCountUp(loading ? 0 : runway);

  // ── Fetch everything on mount ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const sb = createClient();

      // 1. Auth
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.replace("/auth/login"); return; }
      const name: string = user.user_metadata?.full_name ?? "";
      setFirstName(name.split(" ")[0] || "there");

      // 2. Company
      const { data: co } = await sb
        .from("companies")
        .select("id, name, sector, company_age, team_size")
        .eq("user_id", user.id)
        .single();
      if (!co) { router.replace("/onboarding"); return; }
      setCompany(co);

      // 3. Financials
      const { data: fin } = await sb
        .from("company_financials")
        .select("funding_stage, cash_balance_range, monthly_spend_range")
        .eq("company_id", co.id)
        .single();
      if (fin) setFinancials(fin);
      const cash = parseCashBalance(fin?.cash_balance_range ?? "");
      setCashBalance(cash);

      // Date helpers
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const thisStart = new Date(y, m, 1).toISOString().slice(0, 10);
      const lastStart = new Date(y, m - 1, 1).toISOString().slice(0, 10);
      const lastEnd   = new Date(y, m, 0).toISOString().slice(0, 10);

      // 4. This month's transactions
      const { data: txThis } = await sb
        .from("transactions")
        .select("id, amount, type, category, description, transaction_date")
        .eq("company_id", co.id)
        .gte("transaction_date", thisStart);

      const txT = (txThis ?? []) as Transaction[];
      setHasTx(txT.length > 0);

      // 5. Last month debits (for MoM comparison)
      const { data: txLast } = await sb
        .from("transactions")
        .select("amount, type")
        .eq("company_id", co.id)
        .gte("transaction_date", lastStart)
        .lte("transaction_date", lastEnd);

      // 6. Unread insights (5 latest)
      const { data: ins } = await sb
        .from("insights")
        .select("id, type, severity, content, read_at, created_at")
        .eq("company_id", co.id)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(5);
      setInsights((ins ?? []) as Insight[]);

      // ── Compute metrics ───────────────────────────────────────────────────
      const debits  = txT.filter((t) => t.type === "debit");
      const credits = txT.filter((t) => t.type === "credit" && t.category !== "Salaries");

      const gb  = debits.reduce((s, t) => s + Number(t.amount), 0);
      const rev = credits.reduce((s, t) => s + Number(t.amount), 0);
      const nb  = Math.max(gb - rev, 0);
      const lmb = (txLast ?? [])
        .filter((t) => t.type === "debit")
        .reduce((s, t) => s + Number(t.amount), 0);

      setGrossBurn(gb);
      setNetBurn(nb);
      setLastMonthBurn(lmb);
      if (lmb > 0) setBurnChange(((nb - lmb) / lmb) * 100);

      // Category breakdown — top 5 debit categories
      const catMap: Record<string, number> = {};
      debits.forEach((t) => {
        catMap[t.category] = (catMap[t.category] ?? 0) + Number(t.amount);
      });
      setCategories(
        Object.entries(catMap)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)
      );

      // Runway = cash / effective burn
      const divisor = nb > 0 ? nb : gb > 0 ? gb : 1;
      setRunway(cash > 0 ? parseFloat((cash / divisor).toFixed(1)) : 0);

      setLoading(false);
    })();
  }, [router]);

  // ── Dismiss insight ───────────────────────────────────────────────────────
  const dismiss = useCallback(async (id: string) => {
    const sb = createClient();
    await sb
      .from("insights")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    setInsights((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const effectiveBurn = netBurn > 0 ? netBurn : grossBurn;
  const unread = insights.length;

  // ── Bottom nav active check ───────────────────────────────────────────────
  function isActive(href: string) {
    if (href.includes("#")) return false; // hash links never active
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hidden file input for upload actions */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.xls,.xlsx,.csv"
        className="hidden"
        onChange={() => {}}
      />

      <main className="max-w-[390px] mx-auto px-4 pt-12 pb-28">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* ── HEADER ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-5 px-1">
              <p className="text-lg font-semibold text-white">
                {getGreeting()}, {firstName} 👋
              </p>
              <button
                id="bell-btn"
                onClick={() => alertsRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="relative p-1.5 rounded-full hover:bg-zinc-800 transition-colors"
              >
                <Bell className="h-5 w-5 text-zinc-400" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-violet-500" />
                )}
              </button>
            </div>

            {/* ── RUNWAY CARD ────────────────────────────────────────── */}
            <motion.div
              id="runway-card"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.35 }}
              className="bg-zinc-900 rounded-2xl p-6 mt-1"
            >
              <p className="text-zinc-400 text-[10px] uppercase tracking-widest font-mono mb-3">
                Runway
              </p>

              {/* Big number */}
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-6xl font-bold tabular-nums leading-none ${runwayColor(runway)}`}
                >
                  {hasTx ? animatedRunway.toFixed(1) : "—"}
                </span>
                <span className="text-zinc-400 text-xl font-light">months</span>
              </div>
              <p className="text-zinc-500 text-sm mt-1 font-light">
                of runway remaining
              </p>

              {/* Health bar */}
              <div className="mt-4 bg-zinc-800 h-2 rounded-full w-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((runway / 18) * 100, 100)}%` }}
                  transition={{ duration: 1.3, ease: "easeOut", delay: 0.3 }}
                  className={`h-full rounded-full ${runwayBarColor(runway)}`}
                />
              </div>

              {/* Footer stats */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-zinc-400 text-xs font-mono">
                  {fmt(cashBalance)} in bank
                </span>
                {runway > 0 && (
                  <span className="text-zinc-400 text-xs font-mono">
                    Zero cash: {zeroCashDate(runway)}
                  </span>
                )}
              </div>
            </motion.div>

            {/* ── BURN CARD ──────────────────────────────────────────── */}
            <motion.div
              id="burn-card"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
              className="bg-zinc-900 rounded-2xl p-5 mt-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-zinc-400 text-[10px] uppercase tracking-widest font-mono">
                    Burn this month
                  </p>
                  <p className="text-white text-2xl font-bold mt-1.5 tabular-nums">
                    {fmt(effectiveBurn)}
                  </p>
                </div>
                {burnChange !== null && (
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        burnChange > 0 ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {burnChange > 0 ? "↑" : "↓"}{" "}
                      {Math.abs(burnChange).toFixed(0)}%
                    </p>
                    <p className="text-zinc-600 text-[11px] mt-0.5 font-mono">
                      vs last month
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── WHERE IT WENT ──────────────────────────────────────── */}
            <div className="mt-7">
              <p className="text-zinc-400 text-[10px] uppercase tracking-widest font-mono mb-3 px-1">
                Where it went
              </p>

              {!hasTx ? (
                <div className="bg-zinc-900 rounded-2xl p-6 text-center space-y-4">
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    Upload a bank statement to see your spending breakdown
                  </p>
                  <button
                    id="upload-statement-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-violet-600/15 text-violet-400 border border-violet-600/30 rounded-xl py-3 text-sm hover:bg-violet-600/25 transition-all"
                  >
                    Upload statement
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map((cat, i) => {
                    const pct = grossBurn > 0 ? (cat.amount / grossBurn) * 100 : 0;
                    return (
                      <motion.div
                        key={cat.category}
                        id={`cat-${cat.category.toLowerCase().replace(/\s+/g, "-")}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.07, duration: 0.28 }}
                        className="bg-zinc-900 rounded-xl px-4 py-3"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-white text-sm">
                            {CAT_EMOJI[cat.category] ?? "📦"} {cat.category}
                          </span>
                          <span className="text-zinc-300 text-sm font-mono tabular-nums">
                            {fmt(cat.amount)}
                          </span>
                        </div>
                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{
                              duration: 1.0,
                              delay: 0.25 + i * 0.07,
                              ease: "easeOut",
                            }}
                            className="h-full bg-violet-500 rounded-full"
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── BRAIN ALERTS ───────────────────────────────────────── */}
            {unread > 0 && (
              <div ref={alertsRef} id="alerts-section" className="mt-7">
                <p className="text-zinc-400 text-[10px] uppercase tracking-widest font-mono mb-3 px-1">
                  Brain alerts
                </p>
                <AnimatePresence>
                  {insights.map((ins) => (
                    <motion.div
                      key={ins.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.22 }}
                      className={`bg-zinc-900 rounded-xl p-4 mb-2 border-l-4 ${
                        ins.severity === "critical"
                          ? "border-red-500"
                          : ins.severity === "warning"
                          ? "border-amber-500"
                          : "border-violet-500"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold">
                            {ins.severity === "critical"
                              ? "🚨 Critical"
                              : ins.severity === "warning"
                              ? "⚠️ Warning"
                              : "💡 Insight"}
                          </p>
                          <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                            {ins.content}
                          </p>
                        </div>
                        <button
                          onClick={() => dismiss(ins.id)}
                          className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0 mt-0.5"
                          aria-label="Dismiss alert"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* ── QUICK ACTIONS ──────────────────────────────────────── */}
            <div className="mt-7">
              <p className="text-zinc-400 text-[10px] uppercase tracking-widest font-mono mb-3 px-1">
                Quick actions
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { id: "qa-brain",    emoji: "💬", label: "Ask Brain",  href: "/brain"    },
                    { id: "qa-upload",   emoji: "📄", label: "Upload",     href: null        },
                    { id: "qa-report",   emoji: "📊", label: "Report",     href: "/reports"  },
                    { id: "qa-settings", emoji: "⚙️", label: "Settings",   href: "/settings" },
                  ] as const
                ).map((action) =>
                  action.href ? (
                    <Link
                      key={action.id}
                      id={action.id}
                      href={action.href}
                      className="bg-zinc-900 hover:bg-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center gap-2 min-h-[80px] transition-colors"
                    >
                      <span className="text-2xl">{action.emoji}</span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {action.label}
                      </span>
                    </Link>
                  ) : (
                    <button
                      key={action.id}
                      id={action.id}
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-zinc-900 hover:bg-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center gap-2 min-h-[80px] transition-colors"
                    >
                      <span className="text-2xl">{action.emoji}</span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {action.label}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Company context */}
            {company && (
              <p className="text-center text-[11px] font-mono text-zinc-700 mt-8 pb-2">
                {company.name}
                {financials?.funding_stage ? ` · ${financials.funding_stage}` : ""}
                {company.team_size ? ` · ${company.team_size} people` : ""}
              </p>
            )}
          </motion.div>
        )}
      </main>

      {/* ── BOTTOM NAVIGATION ────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800">
        <div className="max-w-[390px] mx-auto flex items-center justify-around px-2 py-3">
          {(
            [
              { href: "/dashboard",        icon: LayoutDashboard, label: "Home",    id: "nav-home",    dot: false           },
              { href: "/brain",            icon: Cpu,             label: "Brain",   id: "nav-brain",   dot: false           },
              { href: "/reports",          icon: FileText,        label: "Reports", id: "nav-reports", dot: false           },
              { href: "/dashboard#alerts", icon: Bell,            label: "Alerts",  id: "nav-alerts",  dot: unread > 0      },
              { href: "/settings",         icon: Settings,        label: "Settings",id: "nav-settings", dot: false          },
            ] as { href: string; icon: React.ElementType; label: string; id: string; dot: boolean }[]
          ).map(({ href, icon: Icon, label, id, dot }) => (
            <Link
              key={id}
              id={id}
              href={href}
              className={`relative flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                isActive(href) ? "text-violet-400" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {dot && (
                  <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-violet-500" />
                )}
              </div>
              <span className="text-[10px] font-mono">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
