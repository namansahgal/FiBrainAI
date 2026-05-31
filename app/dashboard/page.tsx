"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Cpu, FileText, Settings, X, Building2, TrendingUp, Sparkles, UploadCloud } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";
import AppLayout from "@/src/components/layout/AppLayout";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Helper Functions
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

function parseCashBalance(range: string): number {
  if (!range) return 0;
  if (range.includes("Under ₹10L")) return 500_000;
  if (range.includes("₹10L-₹50L")) return 3_000_000;
  if (range.includes("₹50L-₹2Cr")) return 12_500_000;
  if (range.includes("₹2Cr-₹10Cr")) return 60_000_000;
  if (range.includes("₹10Cr+")) return 150_000_000;
  return 0;
}

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
// Count-Up Animation Hook
// ─────────────────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1300): number {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setVal(0);
      return;
    }
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
// Loading Skeletons
// ─────────────────────────────────────────────────────────────────────────────

function Pulse({ className }: { className?: string }) {
  return <div className={`rounded-xl bg-zinc-800/70 animate-pulse ${className ?? ""}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Pulse className="h-[200px]" />
          <Pulse className="h-[200px]" />
        </div>
        <div className="space-y-4">
          <Pulse className="h-4 w-32" />
          {[1, 2, 3].map((i) => (
            <Pulse key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
      <div className="space-y-8">
        <div className="space-y-4">
          <Pulse className="h-4 w-32" />
          <Pulse className="h-28 w-full" />
        </div>
        <div className="space-y-4">
          <Pulse className="h-4 w-32" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Pulse key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── States ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("there");
  const [company, setCompany] = useState<Company | null>(null);
  const [financials, setFinancials] = useState<Financials | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);

  const [grossBurn, setGrossBurn] = useState(0);
  const [netBurn, setNetBurn] = useState(0);
  const [lastMonthBurn, setLastMonthBurn] = useState(0);
  const [burnChange, setBurnChange] = useState<number | null>(null);
  const [categories, setCategories] = useState<{ category: string; amount: number }[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [runway, setRunway] = useState(0);
  const [hasTx, setHasTx] = useState(false);

  const animatedRunway = useCountUp(loading ? 0 : runway);

  // ── Fetch data ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const sb = createClient();

      // 1. Auth check
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        router.replace("/auth/login");
        return;
      }
      const name: string = user.user_metadata?.full_name ?? "";
      setFirstName(name.split(" ")[0] || "there");

      // 2. Company check
      const { data: co } = await sb
        .from("companies")
        .select("id, name, sector, company_age, team_size")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!co) {
        router.replace("/onboarding");
        return;
      }
      setCompany(co);

      // 3. Financials
      const { data: fin } = await sb
        .from("company_financials")
        .select("funding_stage, cash_balance_range, monthly_spend_range")
        .eq("company_id", co.id)
        .maybeSingle();
      if (fin) setFinancials(fin);
      const cash = parseCashBalance(fin?.cash_balance_range ?? "");
      setCashBalance(cash);

      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const lastStart = new Date(y, m - 1, 1).toISOString().slice(0, 10);
      const lastEnd = new Date(y, m, 0).toISOString().slice(0, 10);

      // 4. Fetch all transactions
      const { data: txAll } = await sb
        .from("transactions")
        .select("id, amount, type, category, description, transaction_date")
        .eq("company_id", co.id)
        .order("transaction_date", { ascending: false });

      const allTx = (txAll ?? []) as Transaction[];
      setHasTx(allTx.length > 0);

      // 5. Fetch last month's transactions for comparison
      const { data: txLast } = await sb
        .from("transactions")
        .select("amount, type")
        .eq("company_id", co.id)
        .gte("transaction_date", lastStart)
        .lte("transaction_date", lastEnd);

      // 6. Fetch unread insights
      const { data: ins } = await sb
        .from("insights")
        .select("id, type, severity, content, read_at, created_at")
        .eq("company_id", co.id)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(5);
      setInsights((ins ?? []) as Insight[]);

      // ── Process calculations ──────────────────────────────────────────────
      const debits = allTx.filter((t) => t.type === "debit");
      const credits = allTx.filter((t) => t.type === "credit");

      const dates = allTx.map((t) => t.transaction_date).sort();
      const dateFrom = dates[0] ? new Date(dates[0]) : new Date();
      const dateTo = dates[dates.length - 1]
        ? new Date(dates[dates.length - 1])
        : new Date();
      const spanMonths = Math.max(
        (dateTo.getFullYear() - dateFrom.getFullYear()) * 12 +
          (dateTo.getMonth() - dateFrom.getMonth()) +
          1,
        1
      );

      const totalDebits = debits.reduce((s, t) => s + Number(t.amount), 0);
      const totalCredits = credits.reduce((s, t) => s + Number(t.amount), 0);

      const gb = totalDebits / spanMonths;
      const rev = totalCredits / spanMonths;
      const nb = Math.max(gb - rev, 0);
      const lmb = (txLast ?? [])
        .filter((t) => t.type === "debit")
        .reduce((s, t) => s + Number(t.amount), 0);

      setGrossBurn(gb);
      setNetBurn(nb);
      setLastMonthBurn(lmb);

      // Burn delta comparison
      const curDate = new Date();
      const curStart = `${curDate.getFullYear()}-${String(
        curDate.getMonth() + 1
      ).padStart(2, "0")}-01`;
      const curMonthBurn = allTx
        .filter((t) => t.type === "debit" && t.transaction_date >= curStart)
        .reduce((s, t) => s + Number(t.amount), 0);
      if (lmb > 0) setBurnChange(((curMonthBurn - lmb) / lmb) * 100);

      // Category breakdown
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

      // Runway
      if (allTx.length > 0) {
        const burnDivisor = nb > 0 ? nb : gb > 0 ? gb : 0;
        setRunway(
          cash > 0 && burnDivisor > 0
            ? parseFloat((cash / burnDivisor).toFixed(1))
            : 0
        );
      } else {
        setRunway(0);
      }

      setLoading(false);
    })();
  }, [router]);

  // ── Dismiss alert ─────────────────────────────────────────────────────────
  const dismiss = useCallback(async (id: string) => {
    const sb = createClient();
    await sb
      .from("insights")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    setInsights((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const effectiveBurn = netBurn > 0 ? netBurn : grossBurn;
  const unread = insights.length;

  return (
    <AppLayout
      title={`Dashboard`}
      subtitle={`${getGreeting()}, ${firstName}! Here's your corporate overview.`}
      activeTab="Overview"
    >
      {/* Hidden file input for dashboard page triggers */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.xls,.xlsx,.csv"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f || !company) return;
          try {
            const fd = new FormData();
            fd.append("file", f);
            fd.append("company_id", company.id);
            const res = await fetch("/api/parse-statement", {
              method: "POST",
              body: fd,
            });
            if (res.ok) {
              window.location.reload();
            } else {
              const data = await res.json();
              alert(data.error || "Upload failed.");
            }
          } catch {
            alert("Upload failed. Please try again.");
          }
          e.target.value = "";
        }}
      />

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {/* Main Desktop Columns Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Financial Cards and Categories */}
            <div className="lg:col-span-2 space-y-8">
              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* RUNWAY CARD */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.35 }}
                  className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between"
                >
                  <div>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono font-medium">
                      Runway Remaining
                    </p>
                    <div className="flex items-baseline gap-2 mt-4">
                      <span
                        className={`text-5xl font-bold tracking-tight leading-none ${runwayColor(
                          runway
                        )}`}
                      >
                        {hasTx ? animatedRunway.toFixed(1) : "—"}
                      </span>
                      <span className="text-zinc-500 text-lg font-light">months</span>
                    </div>
                    <p className="text-zinc-400 text-xs mt-2 font-light">
                      estimated cash availability
                    </p>
                  </div>

                  <div className="mt-6">
                    {/* Health progress bar */}
                    <div className="bg-zinc-800/80 h-2 rounded-full w-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((runway / 18) * 100, 100)}%` }}
                        transition={{ duration: 1.3, ease: "easeOut", delay: 0.3 }}
                        className={`h-full rounded-full ${runwayBarColor(runway)}`}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-3 text-[11px] font-mono text-zinc-500">
                      <span>{fmt(cashBalance)} cash reserves</span>
                      {hasTx && runway > 0 && runway < 120 && (
                        <span>Zero cash: {zeroCashDate(runway)}</span>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* BURN CARD */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.35 }}
                  className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between"
                >
                  <div>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono font-medium">
                      Net Monthly Burn
                    </p>
                    <div className="flex items-baseline justify-between mt-4">
                      <span className="text-white text-5xl font-bold tracking-tight leading-none">
                        {fmt(effectiveBurn)}
                      </span>
                      {burnChange !== null && (
                        <div className="text-right">
                          <span
                            className={`text-sm font-semibold inline-flex items-center ${
                              burnChange > 0 ? "text-red-400" : "text-emerald-400"
                            }`}
                          >
                            {burnChange > 0 ? "↑" : "↓"} {Math.abs(burnChange).toFixed(0)}%
                          </span>
                          <span className="block text-[10px] text-zinc-600 font-mono mt-0.5">
                            MoM Change
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-zinc-400 text-xs mt-2 font-light">
                      average net operations spend
                    </p>
                  </div>

                  <div className="mt-6 text-xs text-zinc-500 border-t border-zinc-800/40 pt-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-zinc-600" />
                    <span>Average gross burn: <strong>{fmt(grossBurn)}</strong>/mo</span>
                  </div>
                </motion.div>
              </div>

              {/* WHERE IT WENT (SPEND BREAKDOWN) */}
              <div className="space-y-4">
                <h3 className="text-zinc-400 text-[10px] uppercase tracking-widest font-mono font-semibold px-1">
                  Corporate Spend Breakdown
                </h3>

                {!hasTx ? (
                  <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-8 text-center max-w-md mx-auto">
                    <p className="text-zinc-500 text-sm leading-relaxed mb-4">
                      Feed the brain a bank statement to map out your top operational cost categories automatically.
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/20 transition-all rounded-xl py-3 px-6 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer mx-auto"
                    >
                      <UploadCloud className="h-4 w-4" />
                      Upload your first statement
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((cat, i) => {
                      const totalDebits = categories.reduce((s, c) => s + c.amount, 0);
                      const pct = totalDebits > 0 ? (cat.amount / totalDebits) * 100 : 0;
                      return (
                        <motion.div
                          key={cat.category}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + i * 0.07, duration: 0.28 }}
                          className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl px-5 py-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white text-sm font-medium">
                              {CAT_EMOJI[cat.category] ?? "📦"} {cat.category}
                            </span>
                            <span className="text-zinc-400 text-xs font-mono">
                              {fmt(cat.amount)} ({pct.toFixed(0)}%)
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
                              className="h-full bg-indigo-500 rounded-full"
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Column: Alerts & Actions */}
            <div className="space-y-8">
              {/* BRAIN ALERTS (Active notifications) */}
              {unread > 0 && (
                <div className="space-y-4">
                  <h3 className="text-zinc-400 text-[10px] uppercase tracking-widest font-mono font-semibold px-1">
                    CFO Risk Signals
                  </h3>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {insights.map((ins) => (
                        <motion.div
                          key={ins.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0, padding: 0, marginBottom: 0 }}
                          transition={{ duration: 0.22 }}
                          className={`bg-zinc-900/60 border rounded-xl p-4 border-zinc-800/60 border-l-4 ${
                            ins.severity === "critical"
                              ? "border-l-red-500"
                              : ins.severity === "warning"
                              ? "border-l-amber-500"
                              : "border-l-indigo-500"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs font-semibold">
                                {ins.severity === "critical"
                                  ? "🚨 Critical Alert"
                                  : ins.severity === "warning"
                                  ? "⚠️ Action Warning"
                                  : "💡 AI Observation"}
                              </p>
                              <p className="text-zinc-400 text-[11px] mt-1.5 leading-relaxed">
                                {ins.content}
                              </p>
                            </div>
                            <button
                              onClick={() => dismiss(ins.id)}
                              className="text-zinc-600 hover:text-zinc-400 p-0.5 rounded transition-colors cursor-pointer"
                              aria-label="Dismiss alert"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* QUICK ACTIONS PANEL */}
              <div className="space-y-4">
                <h3 className="text-zinc-400 text-[10px] uppercase tracking-widest font-mono font-semibold px-1">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {(
                    [
                      { id: "qa-brain",    emoji: "💬", label: "Ask Brain",  href: "/brain"    },
                      { id: "qa-upload",   emoji: "📄", label: "Upload Statement", href: null  },
                      { id: "qa-report",   emoji: "📊", label: "Create Report", href: "/reports" },
                      { id: "qa-settings", emoji: "⚙️", label: "Preferences", href: "/settings" },
                    ] as const
                  ).map((action) =>
                    action.href ? (
                      <Link
                        key={action.id}
                        id={action.id}
                        href={action.href}
                        className="bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center gap-2.5 min-h-[96px] text-center transition-all shadow-sm"
                      >
                        <span className="text-xl shrink-0">{action.emoji}</span>
                        <span className="text-[11px] text-zinc-400 font-mono font-medium">
                          {action.label}
                        </span>
                      </Link>
                    ) : (
                      <button
                        key={action.id}
                        id={action.id}
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center gap-2.5 min-h-[96px] text-center transition-all cursor-pointer shadow-sm"
                      >
                        <span className="text-xl shrink-0">{action.emoji}</span>
                        <span className="text-[11px] text-zinc-400 font-mono font-medium">
                          {action.label}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AppLayout>
  );
}
