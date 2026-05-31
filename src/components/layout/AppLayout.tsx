"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Cpu,
  FileText,
  Bell,
  Settings,
  LogOut,
  Building2,
  Menu,
  X,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Navigation Config
// ─────────────────────────────────────────────────────────────────────────────

type AppLayoutProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  activeTab: string;
};

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Brain", href: "/brain", icon: Cpu },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Alerts", href: "/alerts", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function AppLayout({
  children,
  title,
  subtitle,
  activeTab,
}: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── States ────────────────────────────────────────────────────────────────
  const [userEmail, setUserEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  // ── Load User & Company Data ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const sb = createClient();

      // Get user email
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? "");

        // Get company
        const { data: co } = await sb
          .from("companies")
          .select("id, name")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (co) {
          setCompanyName(co.name);
          setCompanyId(co.id);
        }

        // Get unread insights count (Alerts)
        const { data: ins } = await sb
          .from("insights")
          .select("id")
          .eq("company_id", co?.id ?? "")
          .is("read_at", null);
        if (ins) setUnreadAlerts(ins.length);
      }
    })();
  }, []);

  // ── Sign Out ──────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    const sb = createClient();
    await sb.auth.signOut();
    router.replace("/");
  };

  // ── Centralized File Upload ───────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !companyId) return;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("company_id", companyId);

      const res = await fetch("/api/parse-statement", {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        // Force refresh the page so the new parsed statement propagates
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to parse bank statement.");
        setIsUploading(false);
      }
    } catch (err) {
      console.error("[AppLayout] upload error:", err);
      alert("Something went wrong while processing statement.");
      setIsUploading(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const userInitials = userEmail
    ? userEmail.split("@")[0].slice(0, 2).toUpperCase()
    : "US";

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-zinc-300 font-sans flex">
      {/* Centralized Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.xls,.xlsx,.csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── CENTRAL UPLOADING INTERFACE OVERLAY ──────────────────────────── */}
      {isUploading && (
        <div className="fixed inset-0 z-50 bg-[#0f0f0f]/80 backdrop-blur-md flex items-center justify-center flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping scale-150" />
            <div className="h-16 w-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-white text-md font-semibold">Reading your bank statement</h3>
            <p className="text-zinc-500 text-xs mt-1">This takes about 10 seconds. Please hold on.</p>
          </div>
        </div>
      )}

      {/* ── SIDEBAR (DESKTOP) ────────────────────────────────────────────── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[220px] bg-[#0c0c0c] border-r border-[#1a1a1a] flex-col z-30">
        {/* Top Header */}
        <div className="px-5 py-6 border-b border-[#1a1a1a]/50">
          <span className="text-white text-md font-bold tracking-tight block">FiBrainAI</span>
          <span className="inline-flex items-center gap-1 mt-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
            AI CFO
          </span>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = activeTab === label;
            return (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? "bg-[#1f1f1f] text-white border-l-2 border-indigo-500"
                    : "text-zinc-400 hover:text-white hover:bg-[#151515]"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-indigo-400" : "text-zinc-500"}`} />
                <span>{label}</span>
                {label === "Alerts" && unreadAlerts > 0 && (
                  <span className="ml-auto bg-indigo-500 text-white text-[10px] font-mono px-1.5 py-0.25 rounded-full">
                    {unreadAlerts}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom User/Company profile */}
        <div className="p-4 border-t border-[#1a1a1a]/50 space-y-4 bg-[#0a0a0a]/30">
          {/* Company identity */}
          <div className="flex items-center gap-2.5 px-1 min-w-0">
            <Building2 className="h-4 w-4 text-zinc-600 shrink-0" />
            <span className="text-zinc-400 text-xs font-mono truncate">
              {companyName || "No Company"}
            </span>
          </div>

          <div className="border-t border-[#1a1a1a]/40" />

          {/* User row */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7.5 w-7.5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm shadow-indigo-600/20">
                {userInitials}
              </div>
              <div className="min-w-0 flex flex-col">
                <span className="text-zinc-400 text-xs font-medium truncate max-w-[100px]">
                  {userEmail.split("@")[0]}
                </span>
                <span className="text-zinc-600 text-[10px] truncate max-w-[100px] leading-tight">
                  {userEmail}
                </span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="p-1.5 text-zinc-600 hover:text-red-400 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── SIDEBAR OVERLAY (MOBILE DRAWER) ─────────────────────────────── */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm">
          <aside className="w-[220px] bg-[#0c0c0c] border-r border-[#1a1a1a] h-full flex flex-col animate-slide-in">
            <div className="px-5 py-6 border-b border-[#1a1a1a]/50 flex items-center justify-between">
              <div>
                <span className="text-white text-md font-bold tracking-tight block">FiBrainAI</span>
                <span className="inline-flex items-center mt-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase">
                  AI CFO
                </span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-900 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-6 space-y-1">
              {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                const isActive = activeTab === label;
                return (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                      isActive
                        ? "bg-[#1f1f1f] text-white border-l-2 border-indigo-500"
                        : "text-zinc-400 hover:text-white hover:bg-[#151515]"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-zinc-500" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#1a1a1a]/50 space-y-4">
              <div className="flex items-center gap-2.5 px-1 min-w-0">
                <Building2 className="h-4 w-4 text-zinc-600" />
                <span className="text-zinc-400 text-xs font-mono truncate">{companyName}</span>
              </div>
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7.5 w-7.5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    {userInitials}
                  </div>
                  <span className="text-zinc-400 text-xs truncate max-w-[100px]">
                    {userEmail}
                  </span>
                </div>
                <button onClick={handleSignOut} className="text-zinc-600 hover:text-red-400">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ────────────────────────────────────────────── */}
      <div className="flex-1 md:ml-[220px] flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-[#0f0f0f]/90 sticky top-0 z-20 px-8 py-5 border-b border-[#1a1a1a]/40 backdrop-blur-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Hamburger trigger */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <h2 className="text-white text-md font-bold tracking-tight">{title}</h2>
              {subtitle && <p className="text-zinc-500 text-xs mt-0.5 font-light">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Direct Notifications Bell */}
            <Link
              href="/alerts"
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors relative"
              title="View Alerts"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadAlerts > 0 && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
              )}
            </Link>

            {/* Centralized Upload Action */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Upload statement</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-grow px-8 py-8 w-full max-w-[1200px] mx-auto pb-24">
          {children}
        </main>
      </div>
    </div>
  );
}
