"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Bell, X, Info, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";
import AppLayout from "@/src/components/layout/AppLayout";

type Company = {
  id: string;
};

type Insight = {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  content: string;
  read_at: string | null;
  created_at: string;
};

export default function AlertsPage() {
  const router = useRouter();

  // ── States ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);

  // ── Fetch Insights ────────────────────────────────────────────────────────
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

      // 2. Company lookup
      const { data: co } = await sb
        .from("companies")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!co) {
        router.replace("/onboarding");
        return;
      }
      setCompany(co);

      // 3. Fetch insights
      const { data: ins } = await sb
        .from("insights")
        .select("id, type, severity, content, read_at, created_at")
        .eq("company_id", co.id)
        .order("created_at", { ascending: false });

      setInsights((ins ?? []) as Insight[]);
      setLoading(false);
    })();
  }, [router]);

  // ── Dismiss action ────────────────────────────────────────────────────────
  const dismiss = useCallback(async (id: string) => {
    const sb = createClient();
    await sb
      .from("insights")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    
    // Locally update the list
    setInsights((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, read_at: new Date().toISOString() } : item
      )
    );
  }, []);

  const activeAlerts = insights.filter((i) => !i.read_at);
  const dismissedAlerts = insights.filter((i) => !!i.read_at);

  return (
    <AppLayout
      title="Alerts"
      subtitle="Financial checkpoints, anomalies, and recommendations."
      activeTab="Alerts"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-zinc-500 text-sm font-mono">Loading active alerts…</p>
        </div>
      ) : (
        <div className="max-w-3xl space-y-8">
          {/* Active Alerts Segment */}
          <div className="space-y-4">
            <h3 className="text-zinc-400 text-xs font-mono uppercase tracking-wider">
              Active CFO Alerts ({activeAlerts.length})
            </h3>

            {activeAlerts.length === 0 ? (
              <div className="border border-dashed border-zinc-800/80 bg-zinc-900/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500/80" />
                <h4 className="text-white text-sm font-semibold mt-3">All clear</h4>
                <p className="text-zinc-500 text-xs mt-1 max-w-xs font-light">
                  No risk factors or anomalies detected by the financial brain.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {activeAlerts.map((ins) => (
                    <motion.div
                      key={ins.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, padding: 0 }}
                      className={`bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5 border-l-4 ${
                        ins.severity === "critical"
                          ? "border-l-red-500"
                          : ins.severity === "warning"
                          ? "border-l-amber-500"
                          : "border-l-indigo-500"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 mt-0.5">
                          {ins.severity === "critical" ? (
                            <AlertCircle className="h-5 w-5 text-red-400" />
                          ) : ins.severity === "warning" ? (
                            <AlertTriangle className="h-5 w-5 text-amber-400" />
                          ) : (
                            <Info className="h-5 w-5 text-indigo-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className="text-white text-sm font-semibold capitalize">
                            {ins.severity} Alert
                          </span>
                          <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed font-light">
                            {ins.content}
                          </p>
                          <span className="block text-[10px] text-zinc-600 font-mono mt-3">
                            Reported {new Date(ins.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <button
                          onClick={() => dismiss(ins.id)}
                          className="text-zinc-600 hover:text-zinc-400 p-1 hover:bg-zinc-800/50 rounded-lg transition-colors cursor-pointer"
                          title="Dismiss Alert"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Read/Dismissed Alerts History */}
          {dismissedAlerts.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-zinc-800/40">
              <h3 className="text-zinc-500 text-xs font-mono uppercase tracking-wider">
                Dismissed Alerts History ({dismissedAlerts.length})
              </h3>
              <div className="space-y-2 opacity-65">
                {dismissedAlerts.map((ins) => (
                  <div
                    key={ins.id}
                    className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-zinc-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-zinc-400 text-xs leading-relaxed truncate max-w-xl">
                          {ins.content}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] text-zinc-600 font-mono shrink-0">
                      Resolved
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
