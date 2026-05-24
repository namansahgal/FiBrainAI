import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Calendar, 
  BookOpen, 
  X, 
  Sparkles, 
  Search,
  Filter
} from 'lucide-react';
import { BuildLogEntry } from '../data';

interface BuildLogProps {
  logs: BuildLogEntry[];
  onAddLog: (newLog: Omit<BuildLogEntry, 'id'>) => void;
}

export default function BuildLog({ logs, onAddLog }: BuildLogProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Form states
  const [week, setWeek] = useState(logs.length > 0 ? (Math.max(...logs.map(l => l.week)) + 1) : 1);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState('May 2026');
  const [tagsInput, setTagsInput] = useState('Product, Tech');
  const [error, setError] = useState('');

  // Collect all unique tags for quick filtering
  const allTags = Array.from(
    new Set(logs.flatMap(log => log.tags || []))
  );

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = !selectedTag || log.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !date) {
      setError('Please fill out all fields.');
      return;
    }

    const tagsArray = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    onAddLog({
      week: Number(week),
      date,
      title,
      content,
      tags: tagsArray.length > 0 ? tagsArray : ['General']
    });

    // Reset and success state
    setTitle('');
    setContent('');
    setTagsInput('Tech, Product');
    setWeek(prev => prev + 1);
    setDate('May 2026');
    setShowAddForm(false);
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-16 px-4">
      
      {/* Page Header */}
      <section className="text-left pt-12 md:pt-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-neutral-900 pb-8">
        <div className="space-y-4">
          <span className="font-mono text-xs text-violet-400 uppercase tracking-widest block font-bold">
            Public Commit Log
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Building in public
          </h1>
          <p className="text-neutral-400 text-base max-w-2xl font-light">
            Every week I share exactly what I am learning, building, validating, and discovering.
          </p>
        </div>

        {/* Form toggler */}
        <button
          onClick={() => setShowAddForm(true)}
          className="cursor-pointer font-mono text-xs bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-violet-600/15"
        >
          <Plus className="h-4 w-4" />
          Add Log Entry
        </button>
      </section>

      {/* Interactive Controls & Filters */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-4 text-left">
        {/* Search Input */}
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search dev updates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 glass rounded-xl text-sm font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-violet-500/80 transition-colors shadow-inner"
          />
        </div>

        {/* Tag Filters */}
        <div className="md:col-span-6 flex flex-wrap gap-2 items-center justify-start md:justify-end">
          <span className="text-xs font-mono text-neutral-500 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Filter:
          </span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`cursor-pointer px-2.5 py-1 rounded text-xs font-mono transition-colors ${
              !selectedTag ? 'bg-violet-950 text-violet-400 border border-violet-800/40' : 'bg-neutral-900 text-neutral-400 border border-transparent hover:bg-neutral-800'
            }`}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`cursor-pointer px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                selectedTag === tag ? 'bg-violet-950 text-violet-400 border border-violet-800/40' : 'bg-neutral-900 text-neutral-400 border border-transparent hover:bg-neutral-800'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* Add New Log Entry Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-neutral-950 border border-neutral-900 rounded-2xl w-full max-w-xl p-6 relative shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  <h3 className="text-lg font-bold text-white">Create Public Dev Entry</h3>
                </div>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="cursor-pointer text-neutral-500 hover:text-white p-1 rounded-md hover:bg-neutral-900 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-neutral-400 uppercase">Week Number</label>
                    <input
                      type="number"
                      value={week}
                      onChange={(e) => setWeek(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-neutral-400 uppercase">Publish Period</label>
                    <input
                      type="text"
                      placeholder="May 2026"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-neutral-400 uppercase">Log Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Completed ICICI API Sandbox test"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-neutral-400 uppercase">Tags / Categories (comma separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-neutral-400 uppercase">Update Content (Markdown/Raw text)</label>
                  <textarea
                    rows={6}
                    placeholder="Describe what was designed, fixed, or validated with Pune tech startups..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 font-sans"
                  />
                </div>

                {error && (
                  <p className="text-xs font-mono text-red-400">{error}</p>
                )}

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="cursor-pointer font-mono text-xs text-neutral-400 hover:text-white px-4 py-2.5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer font-mono text-xs bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2.5 rounded-lg transition-colors"
                  >
                    Commit to Build Log
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logs Render Layout */}
      <section className="space-y-6">
        
        {logs.length === 0 ? (
          <div className="text-center py-16 p-8 rounded-2xl bg-neutral-900/10 border border-neutral-900/40 space-y-3">
            <BookOpen className="h-10 w-10 text-neutral-600 mx-auto mb-2" />
            <p className="text-neutral-300 text-sm font-mono font-medium">The public build log is currently empty.</p>
            <p className="text-neutral-500 text-xs max-w-sm mx-auto leading-relaxed font-light">
              Press the <span className="text-violet-400 font-semibold">"Add Log Entry"</span> button to record a new week's build sprint, milestone validation, or tech breakthrough in real-time.
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 p-8 rounded-2xl bg-neutral-900/10 border border-neutral-900">
            <BookOpen className="h-8 w-8 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400 text-sm font-mono">No build log entries match your search query.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredLogs.map((log) => (
              <motion.article 
                key={log.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-2xl glass hover:border-violet-500/20 transition-all duration-300 text-left shadow-lg"
              >
                
                {/* Date & Week Metadata (Left side) */}
                <div className="md:col-span-3 space-y-2">
                  <div className="flex items-center gap-2 md:flex-col md:items-start text-xs font-mono">
                    <span className="text-violet-400 font-bold tracking-wider px-2 py-1 rounded bg-violet-950/40 border border-violet-800/10">
                      WEEK {log.week}
                    </span>
                    <span className="text-neutral-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {log.date}
                    </span>
                  </div>
                  
                  {/* Category badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {log.tags.map(tag => (
                      <span 
                        key={tag} 
                        onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                        className={`cursor-pointer text-[10px] uppercase font-mono px-2 py-0.5 rounded-full transition-colors ${
                          selectedTag === tag ? 'bg-violet-500 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Log Content (Right side) */}
                <div className="md:col-span-9 space-y-3 pl-0 md:pl-4 md:border-l border-neutral-900/80">
                  <h3 className="text-xl font-bold text-white tracking-tight hover:text-violet-300 transition-colors">
                    {log.title}
                  </h3>
                  
                  <div className="text-sm font-light text-neutral-300 leading-relaxed space-y-4 whitespace-pre-line font-sans">
                    {log.content}
                  </div>
                </div>

              </motion.article>
            ))}
          </div>
        )}

      </section>

    </div>
  );
}
