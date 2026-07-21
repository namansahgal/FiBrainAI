import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Menu, 
  X, 
  MapPin
} from 'lucide-react';

// Data imports
import { INITIAL_BUILD_LOGS, BuildLogEntry } from './data';

// Component imports
import Home from './components/Home';
import About from './components/About';
import TestFlow from './components/TestFlow';
import BuildLog from './components/BuildLog';
import CoFounder from './components/CoFounder';

export type Page = 'home' | 'about' | 'test-flow' | 'build-log' | 'co-founder';
type CoFounderApplication = { name: string; email: string; linkedin: string; message: string; date: string };

const removeEmptyBuildLogPlaceholders = (logs: BuildLogEntry[]) =>
  logs.filter((log) => log.title.trim() || log.content.trim() || log.tags.length > 0);

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Persistent States
  const [isWaitlisted, setIsWaitlisted] = useState<boolean>(false);
  const [waitlistCount, setWaitlistCount] = useState<number>(142);
  const [buildLogs, setBuildLogs] = useState<BuildLogEntry[]>([]);
  const [isApplied, setIsApplied] = useState<boolean>(false);
  const [coFounderApps, setCoFounderApps] = useState<CoFounderApplication[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    // 1. Waitlist state
    const savedWaitlist = localStorage.getItem('finbrain_waitlisted');
    if (savedWaitlist === 'true') {
      setIsWaitlisted(true);
    }
    
    // Dynamic waitlist count (simulating live organic baseline)
    const savedCount = localStorage.getItem('finbrain_waitlist_count');
    if (savedCount) {
      setWaitlistCount(Number(savedCount));
    } else {
      const initialSeedCount = 142 + Math.floor(Math.random() * 20);
      setWaitlistCount(initialSeedCount);
      localStorage.setItem('finbrain_waitlist_count', String(initialSeedCount));
    }

    // 2. Build logs
    const savedLogs = localStorage.getItem('finbrain_build_logs');
    if (savedLogs) {
      const parsedLogs = removeEmptyBuildLogPlaceholders(JSON.parse(savedLogs));
      setBuildLogs(parsedLogs);
      localStorage.setItem('finbrain_build_logs', JSON.stringify(parsedLogs));
    } else {
      setBuildLogs(INITIAL_BUILD_LOGS);
      localStorage.setItem('finbrain_build_logs', JSON.stringify(INITIAL_BUILD_LOGS));
    }

    // 3. Co-founder apps state
    const savedApps = localStorage.getItem('finbrain_cofounder_apps');
    if (savedApps) {
      setCoFounderApps(JSON.parse(savedApps));
    }
    const savedApplied = localStorage.getItem('finbrain_applied');
    if (savedApplied === 'true') {
      setIsApplied(true);
    }

    const loadRemoteData = async () => {
      const [waitlistResponse, logsResponse, appsResponse] = await Promise.allSettled([
        fetch('/api/waitlist'),
        fetch('/api/build-logs'),
        fetch('/api/cofounder-applications'),
      ]);

      if (waitlistResponse.status === 'fulfilled' && waitlistResponse.value.ok) {
        const data = await waitlistResponse.value.json();
        if (typeof data.count === 'number') {
          setWaitlistCount((currentCount) => Math.max(data.count, currentCount));
        }
      }

      if (logsResponse.status === 'fulfilled' && logsResponse.value.ok) {
        const data = await logsResponse.value.json();
        if (Array.isArray(data.logs)) {
          const remoteLogs = removeEmptyBuildLogPlaceholders(data.logs);
          setBuildLogs(remoteLogs);
          localStorage.setItem('finbrain_build_logs', JSON.stringify(remoteLogs));
        }
      }

      if (appsResponse.status === 'fulfilled' && appsResponse.value.ok) {
        const data = await appsResponse.value.json();
        if (Array.isArray(data.applications)) {
          setCoFounderApps(data.applications);
          localStorage.setItem('finbrain_cofounder_apps', JSON.stringify(data.applications));
        }
      }
    };

    void loadRemoteData();
  }, []);

  // Hash-based client-side routing synchronization
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validPages: Page[] = ['home', 'about', 'test-flow', 'build-log', 'co-founder'];
      if (validPages.includes(hash as Page)) {
        setCurrentPage(hash as Page);
      } else if (!hash) {
        setCurrentPage('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Handle Waitlist submission
  const handleWaitlistSubmit = async (email: string, source: string = 'hero') => {
    setIsWaitlisted(true);
    localStorage.setItem('finbrain_waitlisted', 'true');
    const newCount = waitlistCount + 1;
    setWaitlistCount(newCount);
    localStorage.setItem('finbrain_waitlist_count', String(newCount));

    const response = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source }),
    }).catch(() => null);

    if (response?.ok) {
      const countResponse = await fetch('/api/waitlist').catch(() => null);
      if (countResponse?.ok) {
        const data = await countResponse.json();
        if (typeof data.count === 'number') {
          setWaitlistCount(data.count);
          localStorage.setItem('finbrain_waitlist_count', String(data.count));
        }
      }
    }
  };

  // Handle addition of a live local build log
  const handleAddBuildLog = async (newLog: Omit<BuildLogEntry, 'id'>, adminKey: string) => {
    const freshLog: BuildLogEntry = {
      ...newLog,
      id: `log-${Date.now()}`
    };
    const updated = [freshLog, ...buildLogs];
    setBuildLogs(updated);
    localStorage.setItem('finbrain_build_logs', JSON.stringify(updated));

    const response = await fetch('/api/build-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify(newLog),
    }).catch(() => null);

    if (response?.ok) {
      const data = await response.json();
      if (data.log) {
        const synced = [data.log as BuildLogEntry, ...buildLogs];
        setBuildLogs(synced);
        localStorage.setItem('finbrain_build_logs', JSON.stringify(synced));
      }
    }
  };

  // Handle dynamic cofounder applications intake
  const handleCoFounderApply = async (app: { name: string; email: string; linkedin: string; message: string }) => {
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const fullApp = {
      ...app,
      date: timestamp
    };
    const updated = [fullApp, ...coFounderApps];
    setCoFounderApps(updated);
    localStorage.setItem('finbrain_cofounder_apps', JSON.stringify(updated));
    setIsApplied(true);
    localStorage.setItem('finbrain_applied', 'true');

    const response = await fetch('/api/cofounder-applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(app),
    }).catch(() => null);

    if (response?.ok) {
      const data = await response.json();
      if (data.application) {
        const synced = [data.application as CoFounderApplication, ...coFounderApps];
        setCoFounderApps(synced);
        localStorage.setItem('finbrain_cofounder_apps', JSON.stringify(synced));
      }
    }
  };

  const handleLinkClick = (page: Page, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    window.location.hash = page === 'home' ? '' : page;
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToWaitlist = (e: React.MouseEvent) => {
    if (e) e.preventDefault();
    setMobileMenuOpen(false);
    if (currentPage !== 'home') {
      setCurrentPage('home');
      window.location.hash = '';
      setTimeout(() => {
        const el = document.getElementById('final-waitlist');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    } else {
      const el = document.getElementById('final-waitlist');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 flex flex-col font-sans selection:bg-violet-600/30 selection:text-violet-200">
      
      {/* Top Banner indicating startup journey */}
      <div className="bg-gradient-to-r from-violet-950/40 via-[#050505] to-[#050505] border-b border-white/5 py-2 px-4 text-center">
        <p className="text-[10px] sm:text-xs font-mono text-neutral-400 tracking-wider flex items-center justify-center gap-1.5 flex-wrap">
          <MapPin className="h-3 w-3 text-violet-400 shrink-0" />
          <span>Building In Public • Startup Journey Tracker</span>
          <span className="opacity-40">•</span>
          <span className="text-violet-400 font-semibold uppercase tracking-widest text-[9px]">Founder Naman Sahgal</span>
        </p>
      </div>

      {/* Primary Header/Navbar */}
      <header className="sticky top-0 z-40 bg-[#050505]/85 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo Brand left */}
          <a 
            href="#"
            onClick={(e) => handleLinkClick('home', e)}
            className="cursor-pointer flex items-center gap-2.5 group"
            id="nav-logo"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 p-[1.5px] group-hover:shadow-lg group-hover:shadow-violet-600/15 transition-all">
              <div className="h-full w-full rounded-[10px] bg-neutral-950 flex items-center justify-center text-violet-400">
                <Cpu className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="text-left">
              <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-violet-300 transition-colors">
                FiBrainAI
              </span>
              <span className="text-[9px] font-mono font-bold text-violet-400 block -mt-1 uppercase tracking-widest">
                AI CFO
              </span>
            </div>
          </a>

          {/* Navigation Links Right (Desktop) */}
          <div className="hidden md:flex items-center gap-5" id="desktop-nav-container">
            <nav className="flex items-center gap-1 text-sm font-medium" id="desktop-nav">
              <a
                href="#"
                onClick={(e) => handleLinkClick('home', e)}
                className={`cursor-pointer px-3.5 py-1.5 rounded-lg transition-colors ${
                  currentPage === 'home' ? 'text-violet-400 bg-violet-950/20' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Home
              </a>
              <a
                href="#about"
                onClick={(e) => handleLinkClick('about', e)}
                className={`cursor-pointer px-3.5 py-1.5 rounded-lg transition-colors ${
                  currentPage === 'about' ? 'text-violet-400 bg-violet-950/20' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                About
              </a>
              <a
                href="#test-flow"
                onClick={(e) => handleLinkClick('test-flow', e)}
                className={`cursor-pointer px-3.5 py-1.5 rounded-lg transition-colors ${
                  currentPage === 'test-flow' ? 'text-violet-400 bg-violet-950/20' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Test Flow
              </a>
              <a
                href="#build-log"
                onClick={(e) => handleLinkClick('build-log', e)}
                className={`cursor-pointer px-3.5 py-1.5 rounded-lg transition-colors ${
                  currentPage === 'build-log' ? 'text-violet-400 bg-violet-950/20' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Build Log
                <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-850 text-neutral-400 font-mono">
                  {buildLogs.length}
                </span>
              </a>
              <a
                href="#co-founder"
                onClick={(e) => handleLinkClick('co-founder', e)}
                className={`cursor-pointer px-3.5 py-1.5 rounded-lg transition-colors ${
                  currentPage === 'co-founder' ? 'text-violet-400 bg-violet-950/20' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Co-founder
              </a>
            </nav>
            <button
              onClick={handleScrollToWaitlist}
              className="cursor-pointer bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs py-2 px-3.5 rounded-xl transition-all shadow-md shadow-violet-600/15 hover:shadow-lg hover:shadow-violet-600/25 active:scale-95"
            >
              Join Waitlist
            </button>
          </div>

          {/* Menu button (Mobile) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="cursor-pointer md:hidden p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
            id="mobile-nav-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

        </div>
      </header>

      {/* Responsive drawer (Mobile) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#050505] border-b border-white/5 overflow-hidden"
            id="mobile-nav-menu"
          >
            <div className="px-4 py-4 flex flex-col gap-2.5 text-left font-medium text-sm">
              <a
                href="#"
                onClick={(e) => handleLinkClick('home', e)}
                className={`w-full py-2 px-3 rounded-lg text-left transition-colors ${
                  currentPage === 'home' ? 'text-violet-400 bg-violet-950/30' : 'text-neutral-400'
                }`}
              >
                Home
              </a>
              <a
                href="#about"
                onClick={(e) => handleLinkClick('about', e)}
                className={`w-full py-2 px-3 rounded-lg text-left transition-colors ${
                  currentPage === 'about' ? 'text-violet-400 bg-violet-950/30' : 'text-neutral-400'
                }`}
              >
                About
              </a>
              <a
                href="#test-flow"
                onClick={(e) => handleLinkClick('test-flow', e)}
                className={`w-full py-2 px-3 rounded-lg text-left transition-colors ${
                  currentPage === 'test-flow' ? 'text-violet-400 bg-violet-950/30' : 'text-neutral-400'
                }`}
              >
                Test Flow
              </a>
              <a
                href="#build-log"
                onClick={(e) => handleLinkClick('build-log', e)}
                className={`w-full py-2 px-3 rounded-lg text-left transition-colors flex items-center justify-between ${
                  currentPage === 'build-log' ? 'text-violet-400 bg-violet-950/30' : 'text-neutral-400'
                }`}
              >
                <span>Build Log</span>
                <span className="text-xs font-mono bg-neutral-900 border border-neutral-850 px-2 py-0.5 rounded text-neutral-400">
                  {buildLogs.length} updates
                </span>
              </a>
              <a
                href="#co-founder"
                onClick={(e) => handleLinkClick('co-founder', e)}
                className={`w-full py-2 px-3 rounded-lg text-left transition-colors ${
                  currentPage === 'co-founder' ? 'text-violet-400 bg-violet-950/30' : 'text-neutral-400'
                }`}
              >
                Looking for Co-founder
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Page Content Body */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            id="page-container"
          >
            {currentPage === 'home' && (
              <Home 
                onNavigate={handleLinkClick}
                onSubmitWaitlist={(email, source) => handleWaitlistSubmit(email, source)}
                isWaitlisted={isWaitlisted}
                waitlistCount={waitlistCount}
              />
            )}
            
            {currentPage === 'about' && (
              <About />
            )}
            
            {currentPage === 'test-flow' && (
              <TestFlow />
            )}
            
            {currentPage === 'build-log' && (
              <BuildLog 
                logs={buildLogs} 
                onAddLog={(newLog, adminKey) => handleAddBuildLog(newLog, adminKey)} 
              />
            )}
            
            {currentPage === 'co-founder' && (
              <CoFounder 
                onSubmitApplication={handleCoFounderApply}
                isApplied={isApplied}
                applications={coFounderApps}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Simple Footer */}
      <footer className="mt-auto border-t border-white/5 bg-[#050505]/45" id="main-footer">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          
          <div className="space-y-1">
            <p className="text-sm font-bold text-neutral-200">
              FiBrainAI <span className="text-xs font-mono font-normal text-neutral-400">© 2026</span>
            </p>
            <p className="text-xs text-neutral-400 font-light max-w-sm">
              The on-demand financial intelligence engine empowering startup founders and businesses to scale safely.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-neutral-400">
            <span className="flex items-center gap-1">
              Coming Soon MVP
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              By Naman Sahgal
            </span>
          </div>

        </div>
      </footer>

    </div>
  );
}
