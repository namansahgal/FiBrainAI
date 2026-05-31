"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, Shield, User, Loader2, Save, Trash2, LogOut, CheckCircle2 } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";
import AppLayout from "@/src/components/layout/AppLayout";

type Company = {
  id: string;
  name: string;
  sector: string;
  company_age: string;
  team_size: string;
  primary_pain_point: string;
};

type Financials = {
  funding_stage: string;
  cash_balance_range: string;
  monthly_spend_range: string;
};

const SECTORS = ["SaaS", "D2C", "Marketplace", "Agency", "Deep Tech", "Other"];
const TEAM_SIZES = ["Just me", "2-5", "6-15", "15+"];
const AGES = ["Under 1yr", "1-2yr", "2-4yr", "4yr+"];

export default function SettingsPage() {
  const router = useRouter();

  // ── States ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [company, setCompany] = useState<Company | null>(null);
  const [financials, setFinancials] = useState<Financials | null>(null);

  // Form Fields
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [companyAge, setCompanyAge] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // ── Load Data ─────────────────────────────────────────────────────────────
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
      setUserEmail(user.email ?? "");

      // 2. Company check
      const { data: co } = await sb
        .from("companies")
        .select("id, name, sector, company_age, team_size, primary_pain_point")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!co) {
        router.replace("/onboarding");
        return;
      }
      setCompany(co);
      setCompanyName(co.name);
      setSector(co.sector);
      setTeamSize(co.team_size);
      setCompanyAge(co.company_age);

      // 3. Financials check
      const { data: fin } = await sb
        .from("company_financials")
        .select("funding_stage, cash_balance_range, monthly_spend_range")
        .eq("company_id", co.id)
        .maybeSingle();
      if (fin) setFinancials(fin);

      setLoading(false);
    })();
  }, [router]);

  // ── Save profile settings ────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      const sb = createClient();
      const { error } = await sb
        .from("companies")
        .update({
          name: companyName.trim(),
          sector,
          team_size: teamSize,
          company_age: companyAge,
        })
        .eq("id", company.id);

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("[Settings] save error:", err);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  // ── Reset financial statement data ────────────────────────────────────────
  const handleResetData = async () => {
    if (!company) return;
    const confirmReset = window.confirm(
      "Warning: This will delete all uploaded transactions, snapshots, insights, and conversations for your company to start fresh. This cannot be undone. Are you sure?"
    );
    if (!confirmReset) return;

    setIsResetting(true);
    try {
      const sb = createClient();

      // Deletes cascade due to foreign key relationships in schema if configured,
      // but let's explicitly wipe all tables for safety.
      await sb.from("transactions").delete().eq("company_id", company.id);
      await sb.from("monthly_snapshots").delete().eq("company_id", company.id);
      await sb.from("financial_briefs").delete().eq("company_id", company.id);
      await sb.from("insights").delete().eq("company_id", company.id);
      await sb.from("conversations").delete().eq("company_id", company.id);

      alert("All financial data cleared successfully. Page will reload.");
      window.location.reload();
    } catch (err) {
      console.error("[Settings] reset error:", err);
      alert("Failed to reset database tables.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleSignOut = async () => {
    const sb = createClient();
    await sb.auth.signOut();
    router.replace("/");
  };

  return (
    <AppLayout
      title="Settings"
      subtitle="Configure profile parameters and system integrations."
      activeTab="Settings"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
          <p className="text-zinc-500 text-sm font-mono">Loading configurations…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Company Profile Settings Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="h-4.5 w-4.5 text-indigo-400" />
                <h3 className="text-white text-sm font-semibold">Company Profile</h3>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                {/* Company Name */}
                <div>
                  <label className="block text-zinc-500 text-[10px] font-mono uppercase tracking-wider mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="w-full max-w-md px-4 py-3 bg-[#0c0c0c] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Sector Selector */}
                <div>
                  <label className="block text-zinc-500 text-[10px] font-mono uppercase tracking-wider mb-2">
                    Sector
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SECTORS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSector(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
                          sector === s
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-[#0c0c0c] border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team Size */}
                <div>
                  <label className="block text-zinc-500 text-[10px] font-mono uppercase tracking-wider mb-2">
                    Team Size
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TEAM_SIZES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTeamSize(t)}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
                          teamSize === t
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-[#0c0c0c] border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company Age */}
                <div>
                  <label className="block text-zinc-500 text-[10px] font-mono uppercase tracking-wider mb-2">
                    Company Age
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AGES.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setCompanyAge(a)}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
                          companyAge === a
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-[#0c0c0c] border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-zinc-800/40 pt-6 flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4.5 py-2.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>Save Changes</span>
                  </button>

                  {saveSuccess && (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Changes saved successfully</span>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Account Profile and Reset System cards */}
          <div className="space-y-6">
            {/* Account Card */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-indigo-400" />
                <h3 className="text-white text-sm font-semibold">User Details</h3>
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="block text-zinc-500 text-[10px]">Email</span>
                  <span className="text-zinc-300">{userEmail}</span>
                </div>
                <div>
                  <span className="block text-zinc-500 text-[10px]">CFO Mode</span>
                  <span className="text-indigo-400">Enterprise AI</span>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl py-3 flex items-center justify-center gap-1.5 cursor-pointer transition-all mt-4"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>

            {/* Reset / Maintenance Card */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-red-500">
                <Shield className="h-4.5 w-4.5" />
                <h3 className="text-white text-sm font-semibold">Risk Options</h3>
              </div>
              <p className="text-zinc-500 text-[11px] font-light leading-normal">
                If you have loaded incorrect bank statements or wish to start analysis on a different business entity, you can wipe your database logs.
              </p>

              <button
                onClick={handleResetData}
                disabled={isResetting}
                className="w-full bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-950/40 text-xs font-semibold rounded-xl py-3 flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              >
                {isResetting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>Clear Financial Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
