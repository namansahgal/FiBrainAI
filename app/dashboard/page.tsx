"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Cpu, FileText, Settings, X, Building2, TrendingUp, Sparkles, UploadCloud } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { createClient } from "@/src/lib/supabase/client";
import AppLayout from "@/src/components/layout/AppLayout";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

type Company = {
  id: string;
  name: string;
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

type Snapshot = {
  month: string;
  gross_burn: number;
  net_burn: number;
  total_revenue: number;
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

// ─────────────────────────────────────────────────────────────────────────────
// Loading Skeletons
// ─────────────────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#171717] border border-[#2a2a2a] rounded-xl p-5 space-y-3 animate-pulse">
            <div className="h-3 w-16 bg-[#1f1f1f] rounded" />
            <div className="h-8 w-28 bg-[#1f1f1f] rounded" />
            <div className="h-4 w-20 bg-[#1f1f1f] rounded" />
          </div>
        ))}
      </div>
      
      {/* Chart & Spending Breakdown */}
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 bg-[#171717] border border-[#2a2a2a] rounded-xl p-5 space-y-4 animate-pulse">
          <div className="h-4 w-24 bg-[#1f1f1f] rounded" />
          <div className="h-[200px] bg-[#1f1f1f] rounded" />
        </div>
        <div className="xl:w-80 w-full shrink-0 bg-[#171717] border border-[#2a2a2a] rounded-xl p-5 space-y-4 animate-pulse">
          <div className="h-4 w-28 bg-[#1f1f1f] rounded" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3.5 w-16 bg-[#1f1f1f] rounded" />
                <div className="h-3.5 w-10 bg-[#1f1f1f] rounded" />
              </div>
              <div className="h-1 bg-[#1f1f1f] rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Transactions & Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-[#171717] border border-[#2a2a2a] rounded-xl p-5 space-y-4 animate-pulse">
          <div className="h-4 w-32 bg-[#1f1f1f] rounded" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-[#1f1f1f] rounded" />
          ))}
        </div>
        <div className="bg-[#171717] border border-[#2a2a2a] rounded-xl p-5 space-y-4 animate-pulse">
          <div className="h-4 w-24 bg-[#1f1f1f] rounded" />
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-[#1f1f1f] rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Recharts Custom Tooltip
// ─────────────────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const rawVal = payload[0].payload.burnRaw;
    return (
      <div className="bg-[#171717] border border-[#2a2a2a] rounded-lg p-2.5 shadow-xl">
        <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">Gross Burn</p>
        <p className="text-white text-xs font-semibold mt-0.5">₹{rawVal.toLocaleString("en-IN")}</p>
      </div>
    );
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard Rebuild
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();

  // ── States ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [financials, setFinancials] = useState<Financials | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Computed Values
  const [cashBalance, setCashBalance] = useState(0);
  const [grossBurn, setGrossBurn] = useState(0);
  const [netBurn, setNetBurn] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [burnChange, setBurnChange] = useState<number | null>(null);
  const [categories, setCategories] = useState<{ category: string; amount: number }[]>([]);
  const [runway, setRunway] = useState(0);
  const [hasTx, setHasTx] = useState(false);

  // Set mounted state for Recharts
  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Fetch Everything ──────────────────────────────────────────────────────
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

      // 2. Company check
      const { data: co } = await sb
        .from("companies")
        .select("id, name")
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

      // Date ranges for MoM check
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const lastStart = new Date(y, m - 1, 1).toISOString().slice(0, 10);
      const lastEnd = new Date(y, m, 0).toISOString().slice(0, 10);

      // 4. All transactions
      const { data: txAll } = await sb
        .from("transactions")
        .select("id, amount, type, category, description, transaction_date")
        .eq("company_id", co.id)
        .order("transaction_date", { ascending: false });

      const allTx = (txAll ?? []) as Transaction[];
      setTransactions(allTx);
      setHasTx(allTx.length > 0);

      // Last month debits
      const { data: txLast } = await sb
        .from("transactions")
        .select("amount, type")
        .eq("company_id", co.id)
        .gte("transaction_date", lastStart)
        .lte("transaction_date", lastEnd);

      // 5. Monthly snapshots
      const { data: snapData } = await sb
        .from("monthly_snapshots")
        .select("month, gross_burn, net_burn, total_revenue")
        .eq("company_id", co.id)
        .order("month", { ascending: true });
      if (snapData) setSnapshots(snapData as Snapshot[]);

      // 6. Risk insights (Alerts)
      const { data: ins } = await sb
        .from("insights")
        .select("id, type, severity, content, read_at, created_at")
        .eq("company_id", co.id)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(5);
      setInsights((ins ?? []) as Insight[]);

      // ── Process Metrics ───────────────────────────────────────────────────
      const debits = allTx.filter((t) => t.type === "debit");
      const credits = allTx.filter((t) => t.type === "credit");

      const dates = allTx.map((t) => t.transaction_date).sort();
      const dateFrom = dates[0] ? new Date(dates[0]) : new Date();
      const dateTo = dates[dates.length - 1] ? new Date(dates[dates.length - 1]) : new Date();
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
      setMonthlyRevenue(rev);

      // Burn change percentage MoM
      const curDate = new Date();
      const curStart = `${curDate.getFullYear()}-${String(
        curDate.getMonth() + 1
      ).padStart(2, "0")}-01`;
      const curMonthBurn = allTx
        .filter((t) => t.type === "debit" && t.transaction_date >= curStart)
        .reduce((s, t) => s + Number(t.amount), 0);
      if (lmb > 0) setBurnChange(((curMonthBurn - lmb) / lmb) * 100);

      // Category breakdown (top 6 all-time debits)
      const catMap: Record<string, number> = {};
      debits.forEach((t) => {
        catMap[t.category] = (catMap[t.category] ?? 0) + Number(t.amount);
      });
      setCategories(
        Object.entries(catMap)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 6)
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

  // Format runway text
  const isProfitable = runway === 0 && netBurn === 0 && hasTx;
  const runwayValueText = isProfitable ? "∞" : hasTx ? runway.toFixed(1) : "—";
  const runwayStatusText = isProfitable ? "Profitable (infinite runway)" : "months remaining";

  // Chart data extraction (last 6 snapshots)
  const chartData = snapshots.slice(-6).map((s) => {
    const d = new Date(s.month);
    return {
      month: d.toLocaleDateString("en-US", { month: "short" }),
      "Gross Burn": Number((s.gross_burn / 100000).toFixed(2)),
      burnRaw: s.gross_burn,
    };
  });

  return (
    <AppLayout
      title="Overview"
      subtitle="Your financial command center"
      activeTab="Overview"
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          {/* ── SECTION 1: KPI ROW (4 Cards) ──────────────────────────────── */}
          <div className="grid grid-cols-4 gap-4">
            {/* CARD 1: RUNWAY */}
            <div className="bg-[#171717] border border-[#2a2a2a] rounded-xl p-5 flex flex-col justify-between min-h-[140px]">
              <div>
                <span className="text-zinc-400 text-[10px] uppercase tracking-wider font-mono">
                  Runway
                </span>
                <p
                  className={`text-3xl font-bold mt-1 tracking-tight ${
                    isProfitable
                      ? "text-emerald-400"
                      : runway > 12
                      ? "text-emerald-400"
                      : runway >= 6
                      ? "text-white"
                      : "text-red-400"
                  }`}
                >
                  {runwayValueText}
                </p>
                <span className="text-zinc-500 text-xs mt-1 block">
                  {runwayStatusText}
                </span>
              </div>
              <div className="mt-4">
                <div className="bg-zinc-800/60 h-1 rounded-full w-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isProfitable || runway > 12
                        ? "bg-emerald-500"
                        : runway >= 6
                        ? "bg-white/80"
                        : "bg-red-400"
                    }`}
                    style={{ width: `${isProfitable ? 100 : Math.min((runway / 18) * 100, 100)}%` }}
                  />
                </div>
                {hasTx && runway > 0 && runway < 120 && (
                  <p className="text-zinc-600 text-[10px] font-mono mt-2">
                    Zero cash: {zeroCashDate(runway)}
                  </p>
                )}
              </div>
            </div>

            {/* CARD 2: MONTHLY BURN */}
            <div className="bg-[#171717] border border-[#2a2a2a] rounded-xl p-5 flex flex-col justify-between min-h-[140px]">
              <div>
                <span className="text-zinc-400 text-[10px] uppercase tracking-wider font-mono">
                  Monthly Burn
                </span>
                <p className="text-white text-3xl font-bold mt-1 tracking-tight">
                  {fmt(grossBurn)}
                </p>
              </div>
              {burnChange !== null && (
                <div className="mt-2.5">
                  <span
                    className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-medium rounded-full px-2 py-0.5 ${
                      burnChange > 0
                        ? "bg-red-500/10 text-red-400"
                        : "bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {burnChange > 0 ? "↑" : "↓"}
                    {Math.abs(burnChange).toFixed(0)}% vs last month
                  </span>
                </div>
              )}
            </div>

            {/* CARD 3: CASH BALANCE */}
            <div className="bg-[#171717] border border-[#2a2a2a] rounded-xl p-5 flex flex-col justify-between min-h-[140px]">
              <div>
                <span className="text-zinc-400 text-[10px] uppercase tracking-wider font-mono">
                  Cash in Bank
                </span>
                <p className="text-white text-3xl font-bold mt-1 tracking-tight">
                  {fmt(cashBalance)}
                </p>
              </div>
              <div>
                <span className="text-zinc-600 text-[10px] font-mono block">
                  Approximate Balance
                </span>
              </div>
            </div>

            {/* CARD 4: NET BURN */}
            <div className="bg-[#171717] border border-[#2a2a2a] rounded-xl p-5 flex flex-col justify-between min-h-[140px]">
              <div>
                <span className="text-zinc-400 text-[10px] uppercase tracking-wider font-mono">
                  Net Burn
                </span>
                <p className="text-white text-3xl font-bold mt-1 tracking-tight">
                  {fmt(netBurn)}
                </p>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] font-mono leading-none block">
                  after {fmt(monthlyRevenue)} avg revenue
                </span>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: BURN CHART & SPEND BREAKDOWN ─────────────────── */}
          <div className="flex flex-col xl:flex-row gap-6 mt-6">
            {/* Chart Area (left) */}
            <div className="flex-1 bg-[#171717] border border-[#2a2a2a] rounded-xl p-5">
              <h4 className="text-white text-sm font-semibold mb-6">Burn Trend</h4>
              {hasTx && chartData.length > 0 ? (
                mounted && (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="month"
                        stroke="#52525b"
                        fontSize={10}
                        fontFamily="monospace"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#52525b"
                        fontSize={10}
                        fontFamily="monospace"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₹${v}L`}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#2a2a2a", strokeWidth: 1 }} />
                      <Area
                        type="monotone"
                        dataKey="Gross Burn"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="rgba(99, 102, 241, 0.12)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )
              ) : (
                <div className="h-[200px] border border-dashed border-zinc-800 rounded-xl flex items-center justify-center text-center">
                  <p className="text-zinc-500 text-xs font-mono">
                    Upload statement to see burn trend
                  </p>
                </div>
              )}
            </div>

            {/* Spending Breakdown (right) */}
            <div className="xl:w-80 w-full shrink-0 bg-[#171717] border border-[#2a2a2a] rounded-xl p-5">
              <div className="flex items-baseline justify-between mb-4">
                <h4 className="text-white text-sm font-semibold">Where It Went</h4>
                <span className="text-zinc-500 text-[10px] font-mono">This month</span>
              </div>

              {categories.length === 0 ? (
                <div className="h-[200px] border border-dashed border-zinc-800 rounded-xl flex items-center justify-center text-center">
                  <p className="text-zinc-500 text-xs font-mono">
                    Upload a statement to see breakdown
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categories.map((cat, i) => {
                    const totalDebits = categories.reduce((s, c) => s + c.amount, 0);
                    const pct = totalDebits > 0 ? (cat.amount / totalDebits) * 100 : 0;
                    return (
                      <div key={cat.category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300">
                            {CAT_EMOJI[cat.category] ?? "📦"} {cat.category}
                          </span>
                          <span className="text-white font-medium font-mono">
                            {fmt(cat.amount)}
                          </span>
                        </div>
                        <div className="h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${i === 0 ? "bg-emerald-500" : "bg-indigo-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-600 text-[9px] font-mono leading-none">
                            {pct.toFixed(0)}% of total
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── SECTION 3: TRANSACTIONS & BRAIN ALERTS ──────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            {/* Recent Transactions List */}
            <div className="xl:col-span-2 bg-[#171717] border border-[#2a2a2a] rounded-xl p-5">
              <div className="flex items-center justify-between mb-5">
                <h4 className="text-white text-sm font-semibold">Recent Transactions</h4>
                <Link href="/brain" className="text-indigo-400 text-xs font-mono hover:text-indigo-300 transition-colors">
                  View all →
                </Link>
              </div>

              {transactions.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-zinc-800 rounded-xl">
                  <p className="text-zinc-500 text-xs font-mono">No transaction records found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#2a2a2a] pb-2 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Description</th>
                        <th className="pb-3 font-medium">Category</th>
                        <th className="pb-3 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]/40">
                      {transactions.slice(0, 8).map((tx) => {
                        const d = new Date(tx.transaction_date);
                        const formattedDate = d.toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        });
                        return (
                          <tr key={tx.id} className="hover:bg-[#1f1f1f] transition-all group">
                            <td className="py-3 text-zinc-500 text-xs font-mono">{formattedDate}</td>
                            <td className="py-3 text-white text-sm truncate max-w-[180px] font-light">
                              {tx.description}
                            </td>
                            <td className="py-3">
                              <span className="inline-flex bg-[#2a2a2a] text-zinc-400 text-[10px] font-mono rounded px-2 py-0.5">
                                {tx.category}
                              </span>
                            </td>
                            <td
                              className={`py-3 text-sm font-medium font-mono text-right ${
                                tx.type === "debit" ? "text-red-400" : "text-emerald-400"
                              }`}
                            >
                              {tx.type === "debit" ? "−" : "+"}
                              {fmt(tx.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Brain Alerts Console */}
            <div className="bg-[#171717] border border-[#2a2a2a] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-5">
                <Bell className="h-4.5 w-4.5 text-indigo-400" />
                <h4 className="text-white text-sm font-semibold">Brain Alerts</h4>
              </div>

              {insights.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl min-h-[220px]">
                  <p className="text-zinc-500 text-sm font-semibold">No alerts right now</p>
                  <p className="text-zinc-600 text-xs mt-1 font-mono">The brain is watching your finances</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {insights.map((ins) => (
                      <motion.div
                        key={ins.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, padding: 0, marginBottom: 0 }}
                        transition={{ duration: 0.22 }}
                        className={`bg-zinc-950/20 border-l-2 p-3.5 rounded flex flex-col gap-1.5 ${
                          ins.severity === "critical"
                            ? "border-l-red-500"
                            : ins.severity === "warning"
                            ? "border-l-amber-500"
                            : "border-l-indigo-500"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-white text-xs font-semibold">
                            {ins.severity === "critical"
                              ? "Critical Risk"
                              : ins.severity === "warning"
                              ? "System Warning"
                              : "CFO Insight"}
                          </span>
                          <button
                            onClick={() => dismiss(ins.id)}
                            className="text-zinc-600 hover:text-zinc-400 text-[10px] font-mono cursor-pointer transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                        <p className="text-zinc-400 text-[11px] leading-relaxed font-light">
                          {ins.content}
                        </p>
                        <span className="text-zinc-600 text-[9px] font-mono mt-1">
                          {new Date(ins.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
