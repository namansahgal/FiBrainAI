"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Send, Cpu, LayoutDashboard, FileText, Bell, Settings, ArrowLeft, ArrowRight, Bot } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";
import AppLayout from "@/src/components/layout/AppLayout";

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

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

const SUGGESTED = [
  "Can I afford a new hire?",
  "How long is my runway?",
  "What should I cut first?",
  "Prepare investor update",
];

// ─────────────────────────────────────────────────────────────────────────────
// Typing Indicator
// ─────────────────────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="h-8 w-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
        <Bot className="h-4.5 w-4.5 text-indigo-400" />
      </div>
      <div className="max-w-[85%]">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center gap-1.5 w-max">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-indigo-400"
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
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function BrainPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  // ── Data Loading States ───────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // ── Chat States ───────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // Keep ref in sync to avoid stale closures
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  }, []);

  // ── Fetch Data ────────────────────────────────────────────────────────────
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
        .select("id, name, sector, company_age, team_size")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!co) {
        router.replace("/onboarding");
        return;
      }
      setCompany(co);

      // 3. Load existing conversations
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

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages, scrollToBottom]);

  // ── Send Message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (userInput: string) => {
      if (!company || !userInput.trim()) return;

      const userMsg: ChatMessage = {
        role: "user",
        content: userInput.trim(),
        timestamp: new Date().toISOString(),
      };

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
        const aiContent = data.response ?? "Sorry, I couldn't process that. Try again.";

        const aiMsg: ChatMessage = {
          role: "assistant",
          content: aiContent,
          timestamp: new Date().toISOString(),
        };

        const allMessages = [...updatedMessages, aiMsg];
        setMessages(allMessages);

        // Save conversation history (limit to last 50)
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
            content: "Something went wrong. Please try again.",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isThinking) sendMessage(input);
  };

  return (
    <AppLayout
      title="Brain"
      subtitle={`Interactive CFO assistant for ${company?.name || "your startup"}`}
      activeTab="Brain"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
          <p className="text-zinc-500 text-sm font-mono">Loading financial brain…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-170px)]">
          {/* Main Chat Interface */}
          <div className="lg:col-span-3 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex flex-col overflow-hidden h-full">
            {messages.length === 0 && !isThinking ? (
              /* Empty state details */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-pulse scale-[2]" />
                  <div className="relative h-14 w-14 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                    <Cpu className="h-6 w-6 text-indigo-400" />
                  </div>
                </div>
                <h3 className="text-white text-lg font-semibold mt-6">Ask me anything about your finances</h3>
                <p className="text-zinc-400 text-sm mt-2 max-w-sm leading-relaxed">
                  I have full access to your bank transactions and CFO profile. Choose a question on the right or type your own.
                </p>
              </div>
            ) : (
              /* Messages scrolling viewport */
              <div className="flex-grow overflow-y-auto p-6 space-y-5">
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={`${msg.role}-${msg.timestamp}-${i}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22 }}
                      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="h-8 w-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <Bot className="h-4.5 w-4.5 text-indigo-400" />
                        </div>
                      )}
                      <div className="max-w-[75%]">
                        {msg.role === "assistant" && (
                          <span className="block text-zinc-500 text-[10px] font-mono mb-1 ml-1">FiBrainAI</span>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-3 leading-relaxed text-sm ${
                            msg.role === "user"
                              ? "bg-indigo-600 text-white rounded-tr-sm"
                              : "bg-zinc-900 border border-zinc-800 text-zinc-100 whitespace-pre-wrap rounded-tl-sm"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isThinking && <TypingDots />}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Centralized text bar form */}
            <div className="p-4 border-t border-zinc-800/60 bg-[#0c0c0c]/40">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <input
                  id="chat-input"
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question (e.g. How much are we spending on AWS?)..."
                  aria-label="Ask a question about your finances"
                  disabled={isThinking}
                  className="flex-1 bg-zinc-900 border border-zinc-800/80 rounded-xl px-4 py-3.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all disabled:opacity-50"
                />
                <button
                  id="chat-submit"
                  type="submit"
                  aria-label="Send message"
                  disabled={!input.trim() || isThinking}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl px-5 transition-all flex items-center justify-center cursor-pointer shadow-md"
                >
                  <Send className="h-4 w-4 text-white" />
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Suggested Queries Sidebar */}
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
              <div>
                <h4 className="text-white text-sm font-semibold">Recommended Queries</h4>
                <p className="text-zinc-500 text-[11px] mt-1 font-light leading-normal">
                  Common questions startup founders ask the CFO brain.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendMessage(q)}
                    disabled={isThinking}
                    className="bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs rounded-xl p-3.5 text-left transition-all leading-normal cursor-pointer hover:border-zinc-700 hover:text-white disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ── Simple Loader Icon fallback ─────────────────────────────────────────────
function Loader2({ className }: { className?: string }) {
  return <div className={`rounded-full border-2 border-indigo-500 border-t-transparent animate-spin ${className}`} />;
}
