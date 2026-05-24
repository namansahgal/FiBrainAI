import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  MessageSquare, 
  BarChart3, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Zap
} from 'lucide-react';
import type { Page } from '../App';

interface HomeProps {
  onNavigate: (page: Page) => void;
  onSubmitWaitlist: (email: string) => void;
  isWaitlisted: boolean;
  waitlistCount?: number;
}

export default function Home({ onNavigate, onSubmitWaitlist, isWaitlisted }: HomeProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please provide a valid email address');
      return;
    }
    setError('');
    onSubmitWaitlist(email);
    setEmail('');
  };

  return (
    <div className="space-y-24 pb-16">
      
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 px-4 max-w-5xl mx-auto text-center" id="home-hero">
        {/* Glow Element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 font-mono mb-8 hover:border-violet-500/30 transition-colors"
        >
          <span className="flex h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
          Currently in development — Join the waitlist
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.1] font-sans"
        >
          The AI CFO your startup <br />
          <span className="font-serif italic text-violet-400">
            can't afford
          </span> to be without
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl text-neutral-400 max-w-3xl mx-auto mb-10 leading-relaxed font-sans font-light"
        >
          FiBrainAI helps startup founders and businesses get the financial intelligence of a world-class CFO. 
          No finance degree. No expensive hire. Powered by intelligent agency, built for fast-moving teams.
        </motion.p>

        {/* Waitlist Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-md mx-auto relative z-10 p-0.5 rounded-2xl bg-gradient-to-b from-neutral-800 to-neutral-900/40 shadow-xl"
        >
          <div className="bg-[#0e0e0e] rounded-[15px] p-6 text-left border border-neutral-900">
            <AnimatePresence mode="wait">
              {!isWaitlisted ? (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit} 
                  className="space-y-3"
                  id="waitlist-form"
                >
                  <label htmlFor="waitlist-email" className="text-xs font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                    Secure your launch spot
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="waitlist-email"
                      type="email"
                      placeholder="founder@yourstartup.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-sm placeholder-neutral-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                    />
                    <button
                      id="waitlist-submit"
                      type="submit"
                      className="cursor-pointer bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm py-3 px-5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-violet-600/25 active:scale-98"
                    >
                      Join Waitlist
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  {error && (
                    <motion.p id="waitlist-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-400 font-mono mt-1 flex items-center gap-1.5">
                      <AlertCircle className="h-3 w-3" /> {error}
                    </motion.p>
                  )}
                </motion.form>
              ) : (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-4 text-center space-y-3"
                  id="waitlist-success"
                >
                  <div className="inline-flex p-3 bg-violet-950/40 text-violet-400 rounded-full border border-violet-800/30 mb-2">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">You're on the list!</h3>
                  <p className="text-sm text-neutral-400 max-w-sm mx-auto">
                    Thanks for backing Naman Sahgal and FiBrainAI. You've secured your spot in our private pipeline.
                  </p>
                  <p className="text-xs font-mono text-neutral-500">
                    Weekly build logs and journey updates will reach your inbox.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Floating background indicators */}
        <div className="mt-16 flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-xs font-mono text-neutral-500">
          <div className="flex items-center gap-1.5 bg-neutral-900/50 py-1 px-2.5 rounded-md border border-neutral-800/60">
            <ShieldCheck className="h-3.5 w-3.5 text-neutral-400" />
            Coming Soon MVP
          </div>
          <div className="flex items-center gap-1.5 bg-neutral-900/50 py-1 px-2.5 rounded-md border border-neutral-800/60">
            <Zap className="h-3.5 w-3.5 text-violet-400" />
            Always-on Ingestion
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="px-4 py-16 bg-neutral-950/60 border-y border-neutral-900" id="problem-section">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            
            <div className="md:col-span-6 space-y-6 text-left">
              <span className="font-mono text-xs text-violet-400 uppercase tracking-widest block font-bold">
                The Bootstrapped Reality
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Why early startups burn out.
              </h2>
              <p className="text-neutral-400 leading-relaxed font-light">
                As a founder in India, your options are split. You either hire a full-time CFO (which can easily drain ₹1.5L - ₹3L a month from scarce seed capital), or you rely entirely on an external Chartered Accountant who only shows up to file taxes weeks after you've already burned the cash.
              </p>
              <div className="pt-4 flex flex-col gap-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-5 w-5 rounded bg-violet-950/60 border border-violet-800/30 flex items-center justify-center text-violet-400 mt-0.5">
                    <span className="text-[10px] font-mono">1</span>
                  </div>
                  <p className="text-sm text-neutral-300">
                    <strong className="text-white">Invisible Bleeding:</strong> Duplicate SaaS seat escalations, un-optimized cloud setups, and delayed tax reserves.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-5 w-5 rounded bg-violet-950/60 border border-violet-800/30 flex items-center justify-center text-violet-400 mt-0.5">
                    <span className="text-[10px] font-mono">2</span>
                  </div>
                  <p className="text-sm text-neutral-300">
                    <strong className="text-white">Decision Blindness:</strong> Estimating if you can afford that next engineering senior based on bank balances rather than accurate pipeline models.
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="glass p-6 rounded-2xl text-left space-y-4 hover:border-violet-500/20 transition-all duration-300 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-5xl font-mono font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-violet-500">
                    73%
                  </div>
                  <p className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                    Failure Rate
                  </p>
                </div>
                <p className="text-sm text-neutral-400 font-light">
                  of early-stage startups collapse directly from poor, unmanaged financial runway and cashflow misstatements.
                </p>
              </div>

              <div className="glass p-6 rounded-2xl text-left space-y-4 hover:border-violet-500/20 transition-all duration-300 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-5xl font-mono font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                    88%
                  </div>
                  <p className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                    Budget Constraint
                  </p>
                </div>
                <p className="text-sm text-neutral-400 font-light">
                  of active pre-series Indian startups absolutely cannot justify the cost of professional, high-tier CFO hires.
                </p>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 max-w-5xl mx-auto space-y-16" id="features-section">
        <div className="text-center max-w-2xl mx-auto">
          <span className="font-mono text-xs text-violet-400 uppercase tracking-widest font-bold">
            Product Features
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2">
            Automating the CFO ledger
          </h2>
          <p className="text-neutral-400 text-sm md:text-base font-light mt-4">
            We bypass manual CSV matching, formulas that crash Google Sheets, and slow financial timelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="glass p-8 rounded-2xl text-left space-y-6 flex flex-col justify-between hover:border-violet-500/25 transition-all duration-300 group">
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-xl bg-violet-950/60 border border-violet-800/30 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">
                Always-on burn tracking
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed font-light">
                Securely stream write-only transaction logs. FiBrainAI constantly maps live outflow buckets, identifies subscription duplicates, tracks tax reserve percentages, and updates live runway daily.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5">
              <span className="text-xs font-mono text-neutral-500 italic">No manual sheets, no delays.</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass p-8 rounded-2xl text-left space-y-6 flex flex-col justify-between hover:border-violet-500/25 transition-all duration-300 group">
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-xl bg-violet-950/60 border border-violet-800/30 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">
                Weekly AI CFO brief
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed font-light">
                Skip the complex sheets. Receive an elegant, plain-text summary of your startup’s financial trajectory. Know exactly what went up, what went down, and key insights to share with your board or partners.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5">
              <span className="text-xs font-mono text-neutral-500 italic">Delivered straight to WhatsApp / Slack</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass p-8 rounded-2xl text-left space-y-6 flex flex-col justify-between hover:border-violet-500/25 transition-all duration-300 group">
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-xl bg-violet-950/60 border border-violet-800/30 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">
                Ask your finances anything
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed font-light">
                Need to understand if you can scale your dev ops next week? Ask FiBrainAI directly. Get exact runway impacts, budget analysis, or an executive pitch-ready investment report in seconds.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5">
              <span className="text-xs font-mono text-neutral-500 italic">Conversational Indian tax & banking compliance</span>
            </div>
          </div>

        </div>
      </section>

      {/* Build-in-Public Hook */}
      <section className="px-4 max-w-4xl mx-auto">
        <div className="rounded-3xl p-8 sm:p-12 bg-neutral-900/30 border border-neutral-800/70 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-violet-700/5 blur-[80px]" />
          
          <span className="font-mono text-xs text-violet-400 uppercase tracking-widest font-bold">
            Building in Public
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 mb-4">
            Follow the journey live
          </h2>
          <p className="text-neutral-400 text-sm max-w-xl mx-auto mb-8 font-light leading-relaxed">
            I am a 23-year-old software engineer building completely transparently while balancing a full-time job. I share every major update, validation milestone, and tech breakthrough in my public logs.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => onNavigate('demo')}
              className="cursor-pointer bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-5 py-3 text-sm font-semibold transition-all flex items-center gap-1.5 shadow-lg shadow-violet-600/15"
            >
              Try Demo Sandbox
              <Sparkles className="h-4 w-4 text-violet-200" />
            </button>
            <button
              onClick={() => onNavigate('build-log')}
              className="cursor-pointer bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 rounded-xl px-5 py-3 text-sm font-medium transition-all flex items-center gap-1.5"
            >
              Read Build Logs
              <ArrowRight className="h-4 w-4 text-violet-400" />
            </button>
            <button
              onClick={() => onNavigate('about')}
              className="cursor-pointer bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800 rounded-xl px-5 py-3 text-sm font-medium transition-all"
            >
              Meet Naman Sahgal
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
