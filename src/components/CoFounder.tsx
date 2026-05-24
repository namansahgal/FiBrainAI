import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Link2 as Linkedin,
  CheckCircle2, 
  Send,
  GitBranch,
  Rocket
} from 'lucide-react';
import { COFOUNDER_REQUIREMENTS } from '../data';

interface CoFounderProps {
  onSubmitApplication: (app: { name: string; email: string; linkedin: string; message: string }) => void;
  isApplied: boolean;
  applications: Array<{ name: string; email: string; linkedin: string; message: string; date: string }>;
}

export default function CoFounder({ onSubmitApplication, isApplied, applications }: CoFounderProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !linkedin || !message) {
      setError('Please fill out all the fields in the application profile.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Provide a valid email address.');
      return;
    }
    if (!linkedin.toLowerCase().includes('linkedin.com')) {
      setError('Please provide a valid LinkedIn profile link.');
      return;
    }

    setError('');
    onSubmitApplication({ name, email, linkedin, message });
    setName('');
    setEmail('');
    setLinkedin('');
    setMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-16 px-4">
      
      {/* Page Header */}
      <section className="text-left pt-12 md:pt-16 space-y-4">
        <span className="font-mono text-xs text-violet-400 uppercase tracking-widest block font-bold">
          Co-founder Search
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Looking for a co-founder
        </h1>
        <p className="text-neutral-400 text-lg max-w-2xl font-light">
          Are you a relentless absolute builder with system-level backend chops and AI pipeline curiosity? Let’s partner up.
        </p>
      </section>

      {/* Offer / Requirements Grid */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
        
        {/* What you get & Core Offer (Left) */}
        <div className="md:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl glass space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Rocket className="h-4.5 w-4.5 text-violet-400" />
              What you get
            </h3>
            
              <ul className="space-y-3 text-sm text-neutral-300 font-light">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                  <span><strong className="text-white">Meaningful Equity:</strong> Split as true partners based on contribution guidelines.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                  <span><strong className="text-white">A True Problem:</strong> Startup founders and businesses in India genuinely collapse due to poor runaway management. The problem is massive.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                  <span><strong className="text-white">Committed Partner:</strong> I handle validation, sales pipelines, product framing, and building-in-public growth 24/7.</span>
                </li>
              </ul>
          </div>

          <div className="p-6 rounded-2xl glass space-y-4 shadow-sm opacity-90">
            <h4 className="text-sm font-mono text-neutral-400 uppercase tracking-wider">The Target Persona</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              We operate on flexible late hours (balancing full-time commitments), focusing on whiteboard-led sprints, shipping robust ledger parser pipelines, and conducting real validation interviews with founders. Passion for systems engineering, absolute security patterns, and relentless building beats credentials any day.
            </p>
          </div>
        </div>

        {/* Requirements Clean List (Right) */}
        <div className="md:col-span-7 space-y-4">
          <h3 className="text-lg font-bold text-white mb-2 font-mono text-xs uppercase tracking-wider text-neutral-400">
            Requirements Profile
          </h3>
          
          <div className="space-y-3">
            {COFOUNDER_REQUIREMENTS.map((req, index) => (
              <div 
                key={req.id} 
                className="p-5 rounded-2xl glass hover:border-violet-500/20 transition-all duration-300 flex gap-4 items-start shadow-sm"
              >
                <div className="font-mono text-xs text-violet-400 bg-neutral-900 px-2 py-1 rounded border border-neutral-800 shrink-0 select-none">
                  0{index + 1}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">{req.title}</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed font-light">{req.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* Application Form & Submissions Section */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Form Intake container */}
        <div className="md:col-span-8 md:col-start-3 text-left">
          
          <div className="p-0.5 rounded-3xl glow-purple text-left">
            <div className="glass-premium rounded-[22px] p-6 sm:p-8 space-y-6">
              
              <div className="space-y-1">
                <span className="font-mono text-[10px] text-violet-400 uppercase tracking-widest block font-bold">Intake Process</span>
                <h3 className="text-xl font-bold text-white">Join as Co-Founder</h3>
                <p className="text-xs text-neutral-400 font-light">Tell me about your experience. All submissions are processed directly and privately.</p>
              </div>

              <AnimatePresence mode="wait">
                {!isApplied ? (
                  <motion.form 
                    key="co-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit} 
                    className="space-y-4"
                    id="cofounder-form"
                  >
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="co-name" className="text-xs font-mono text-neutral-400 block">Name</label>
                        <input
                          id="co-name"
                          type="text"
                          placeholder="e.g. Varun Sharma"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-900 rounded-xl text-sm font-mono text-white placeholder-neutral-700 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="co-email" className="text-xs font-mono text-neutral-400 block">Email Address</label>
                        <input
                          id="co-email"
                          type="email"
                          placeholder="varun@engineering-scale.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-900 rounded-xl text-sm font-mono text-white placeholder-neutral-700 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="co-linkedin" className="text-xs font-mono text-neutral-400 block">LinkedIn Profile URL</label>
                      <input
                        id="co-linkedin"
                        type="text"
                        placeholder="https://linkedin.com/in/yourname"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-900 rounded-xl text-sm font-mono text-white placeholder-neutral-700 focus:outline-none focus:border-violet-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="co-message" className="text-xs font-mono text-neutral-400 block">Tell me about your background & interest</label>
                      <textarea
                        id="co-message"
                        rows={5}
                        placeholder="Mention some of the hard tech/backend products you've built, and why FiBrainAI is exciting to you..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-900 rounded-xl text-sm text-white placeholder-neutral-700 focus:outline-none focus:border-violet-500 transition-colors font-sans"
                      />
                    </div>

                    {error && (
                      <p id="co-error" className="text-xs font-mono text-red-400 mt-1">{error}</p>
                    )}

                    <div className="pt-2">
                      <button
                        id="co-submit"
                        type="submit"
                        className="cursor-pointer w-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm py-3 px-5 rounded-xl transition-colors flex items-center justify-center gap-2 group shadow-lg shadow-violet-600/15"
                      >
                        Submit Application Profile
                        <Send className="h-4 w-4 text-violet-200 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>

                  </motion.form>
                ) : (
                  <motion.div 
                    key="co-success"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-6 text-center space-y-4"
                    id="cofounder-success"
                  >
                    <div className="inline-flex p-3 bg-violet-950/40 text-violet-400 rounded-full border border-violet-800/30">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Application Recorded Successfully!</h3>
                    <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
                      Your technical profile has been saved live in our local session database. I will inspect your details, cross-reference your LinkedIn details, and reach out to establish digital coordination.
                    </p>
                    
                    <div className="pt-2">
                      <button
                        onClick={() => window.open('https://linkedin.com', '_blank')}
                        className="cursor-pointer text-xs font-mono text-violet-400 hover:text-violet-300 bg-neutral-950 px-3 py-1.5 rounded border border-neutral-800/80 inline-flex items-center gap-1"
                      >
                        <Linkedin className="h-3 w-3" /> Connect with me
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

          {/* Render List of Active Session Applications (Dynamic local database tracking) */}
          {applications.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 space-y-6 text-left"
              id="submissions-ledger"
            >
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                <h4 className="font-mono text-xs text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-violet-400" />
                  Your Active Application (Session Database)
                </h4>
                <span className="text-[10px] font-mono bg-violet-950 text-violet-400 px-2 py-0.5 rounded border border-violet-800/20 uppercase font-bold">
                  Persisted
                </span>
              </div>
              
              <div className="space-y-4">
                {applications.map((app, index) => (
                  <div key={index} className="p-5 rounded-2xl glass shadow-md space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-white">{app.name}</p>
                        <p className="text-xs font-mono text-neutral-500">{app.email}</p>
                      </div>
                      <a 
                        href={app.linkedin} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs font-mono text-violet-400 hover:text-violet-300 bg-neutral-900 py-1 px-2.5 rounded border border-neutral-800 flex items-center gap-1"
                      >
                        <Linkedin className="h-3 w-3" /> View Profile
                      </a>
                    </div>
                    
                    <p className="text-xs leading-relaxed text-neutral-300 font-mono italic bg-white/5 p-3 rounded-lg border border-white/5">
                      "{app.message}"
                    </p>
                    
                    <div className="text-[9px] font-mono text-neutral-600">
                      Submitted: {app.date}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </div>

      </section>

    </div>
  );
}
