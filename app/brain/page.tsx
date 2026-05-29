"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Send,
  Cpu,
  LayoutDashboard,
  FileText,
  Bell,
  Settings,
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

type Snapshot = {
  gross_burn: number;
  total_revenue: number;
  net_burn: number;
  runway_months: number;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Build financial context string for AI
// ─────────────────────────────────────────────────────────────────────────────

function buildContext(
  company: Company,
  financials: Financials | null,
  transactions: Transaction[],
  snapshot: Snapshot | null
): string {
  const categoryTotals = transactions
    .filter((t) => t.type === "debit")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {});

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cat, amt]) => `${cat}: ₹${amt.toLocaleString("en-IN")}`)
    .join("\n");

  return `
COMPANY CONTEXT:
Company: ${company.name}
Sector: ${company.sector}
Age: ${company.company_age}
Team size: ${company.team_size}
Funding: ${financials?.funding_stage ?? "Unknown"}

CURRENT FINANCIAL POSITION:
Cash in bank (approx): ${financials?.cash_balance_range ?? "Unknown"}
Monthly burn: ₹${snapshot?.gross_burn?.toLocaleString("en-IN") || "unknown"}
Monthly revenue: ₹${snapshot?.total_revenue?.toLocaleString("en-IN") || "0"}
Net burn: ₹${snapshot?.net_burn?.toLocaleString("en-IN") || "unknown"}
Runway: ${snapshot?.runway_months?.toFixed(1) || "unknown"} months

TOP SPENDING CATEGORIES (last 90 days):
${topCategories || "No transaction data yet"}

TOTAL TRANSACTIONS ANALYZED: ${transactions.length}
  `.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Suggested questions
// ─────────────────────────────────────────────────────────────────────────────

const SUGGESTED = [
  "Can I afford a new hire?",
  "How long is my runway?",
  "What should I cut first?",
  "Prepare investor update",
];

// ─────────────────────────────────────────────────────────────────────────────
// Typing indicator
// ─────────────────────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-start gap-2 mb-4">
      <div className="max-w-[90%]">
        <p className="text-zinc-500 text-[10px] font-mono mb-1 ml-1">FiBrainAI</p>
        <div className="bg-zinc-900 rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-violet-400"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function BrainPage() {
  const router = useRouter();
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  // ── Data ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [financials, setFinancials] = useState<Financials | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // ── Chat ──────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // Keep ref in sync with state to avoid stale closures
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  }, []);

  // ── Load data on mount ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const sb = createClient();

      // 1. Auth
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      // 2. Company
      const { data: co } = await sb
        .from("companies")
        .select("id, name, sector, company_age, team_size")
        .eq("user_id", user.id)
        .limit(1)
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
        .limit(1)
        .maybeSingle();
      if (fin) setFinancials(fin);

      // 4. Last 90 days of transactions
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const { data: txData } = await sb
        .from("transactions")
        .select("id, amount, type, category, description, transaction_date")
        .eq("company_id", co.id)
        .gte("transaction_date", ninetyDaysAgo.toISOString().slice(0, 10))
        .order("transaction_date", { ascending: false });
      setTransactions((txData ?? []) as Transaction[]);

      // 5. Latest monthly snapshot
      const { data: snap } = await sb
        .from("monthly_snapshots")
        .select("gross_burn, total_revenue, net_burn, runway_months")
        .eq("company_id", co.id)
        .order("month", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (snap) setSnapshot(snap as Snapshot);

      // 6. Load existing conversation
      const { data: conv } = await sb
        .from("conversations")
        .select("id, messages")
        .eq("company_id", co.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (conv) {
        setConversationId(conv.id);
        const msgs = conv.messages as ChatMessage[];
        if (Array.isArray(msgs) && msgs.length > 0) {
          setMessages(msgs);
        }
      }

      setLoading(false);
    })();
  }, [router]);

  // ── Scroll on new message ─────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages, scrollToBottom]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (userInput: string) => {
      if (!company || !userInput.trim()) return;

      const userMsg: ChatMessage = {
        role: "user",
        content: userInput.trim(),
        timestamp: new Date().toISOString(),
      };

      // Use ref for latest messages to avoid stale closure
      const updatedMessages = [...messagesRef.current, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsThinking(true);

      try {
        const res = await fetch("/api/brain/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userInput.trim(),
            context: "",
            history: updatedMessages.slice(-6).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        const data = await res.json();
        const aiContent =
          data.response ?? "Sorry, I couldn't process that. Try again.";

        const aiMsg: ChatMessage = {
          role: "assistant",
          content: aiContent,
          timestamp: new Date().toISOString(),
        };

        const allMessages = [...updatedMessages, aiMsg];
        setMessages(allMessages);

        // Save conversation to Supabase (limit to last 50 messages)
        const sb = createClient();
        const messagesToSave = allMessages.slice(-50);
        if (conversationId) {
          await sb
            .from("conversations")
            .update({
              messages: messagesToSave,
              updated_at: new Date().toISOString(),
            })
            .eq("id", conversationId);
        } else {
          const { data: newConv } = await sb
            .from("conversations")
            .insert({
              company_id: company.id,
              messages: messagesToSave,
              updated_at: new Date().toISOString(),
            })
            .select("id")
            .single();
          if (newConv) setConversationId(newConv.id);
        }
      } catch (err) {
        console.error("[Brain] send error:", err);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Something went wrong. Please try again.",
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsThinking(false);
        inputRef.current?.focus();
      }
    },
    [company, conversationId]
  );

  // ── Handle submit ─────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isThinking) sendMessage(input);
  };

  // ── Bottom nav helper ─────────────────────────────────────────────────────
  function isActive(href: string) {
    if (href.includes("#")) return false;
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Cpu className="h-8 w-8 text-violet-400 animate-pulse" />
          <p className="text-zinc-500 text-sm font-mono">Loading brain…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-[390px] mx-auto flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-1 -ml-1 rounded-lg hover:bg-zinc-800 transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-400" />
          </button>

          <p className="text-white font-semibold text-sm">Brain</p>

          <span className="bg-violet-500/20 text-violet-400 text-[10px] font-mono rounded-full px-2.5 py-1">
            CFO Mode
          </span>
        </div>
      </header>

      {/* ── MESSAGES AREA ───────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto max-w-[390px] w-full mx-auto px-4 pt-16 pb-36">
        {messages.length === 0 && !isThinking ? (
          /* ── EMPTY STATE ─────────────────────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center pt-16"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-violet-500/15 animate-pulse scale-[2.2]" />
              <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-600/25">
                <Cpu className="h-7 w-7 text-white" />
              </div>
            </div>

            <h2 className="text-white text-lg font-semibold mt-8">
              Ask me anything about your finances
            </h2>
            <p className="text-zinc-400 text-sm mt-2 max-w-[280px] leading-relaxed">
              I have full context of {company?.name ?? "your company"}&apos;s
              financial data.
            </p>

            {/* Suggested questions */}
            <div className="grid grid-cols-2 gap-2.5 mt-8 w-full">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(q)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-xl px-4 py-3 text-left hover:border-zinc-600 hover:text-white transition-all leading-snug"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* ── MESSAGE BUBBLES ─────────────────────────────────────────── */
          <div className="space-y-4 pt-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={`${msg.role}-${msg.timestamp}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="max-w-[90%]">
                      <p className="text-zinc-500 text-[10px] font-mono mb-1 ml-1">
                        FiBrainAI
                      </p>
                      <div className="bg-zinc-900 rounded-2xl rounded-tl-sm px-4 py-3">
                        <p className="text-zinc-100 text-sm leading-relaxed whitespace-pre-line">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[80%]">
                      <div className="bg-violet-600 rounded-2xl rounded-tr-sm px-4 py-3">
                        <p className="text-white text-sm leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isThinking && <TypingDots />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* ── INPUT BAR ───────────────────────────────────────────────────── */}
      <div className="fixed bottom-[60px] left-0 right-0 z-20 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800">
        <form
          onSubmit={handleSubmit}
          className="max-w-[390px] mx-auto flex items-center gap-2.5 px-4 py-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your finances..."
            disabled={isThinking}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl p-3 transition-all shrink-0 shadow-lg shadow-violet-600/20"
            aria-label="Send message"
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </form>
      </div>

      {/* ── BOTTOM NAVIGATION ─────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800">
        <div className="max-w-[390px] mx-auto flex items-center justify-around px-2 py-3">
          {(
            [
              { href: "/dashboard", icon: LayoutDashboard, label: "Home", id: "nav-home" },
              { href: "/brain", icon: Cpu, label: "Brain", id: "nav-brain" },
              { href: "/reports", icon: FileText, label: "Reports", id: "nav-reports" },
              { href: "/dashboard#alerts", icon: Bell, label: "Alerts", id: "nav-alerts" },
              { href: "/settings", icon: Settings, label: "Settings", id: "nav-settings" },
            ] as { href: string; icon: React.ElementType; label: string; id: string }[]
          ).map(({ href, icon: Icon, label, id }) => (
            <Link
              key={id}
              id={id}
              href={href}
              className={`relative flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                isActive(href)
                  ? "text-violet-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-mono">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
