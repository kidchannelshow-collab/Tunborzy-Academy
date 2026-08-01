import { motion, AnimatePresence } from 'motion/react';
import { Search, X, BookOpen, Clock, Bot, Users, FileCheck, Bell, ChevronRight, TrendingUp } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string) => void;
  userRole?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Search },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'cbt', label: 'CBT', icon: FileCheck },
  { id: 'announcements', label: 'Announcements', icon: Bell },
];

const ADMIN_CATEGORIES = [
  ...CATEGORIES,
  { id: 'students', label: 'Students', icon: Users },
];

const RECENT_SEARCHES = ['Mathematics', 'Chemistry', 'Physics'];
const POPULAR_SEARCHES = ['JAMB CBT', 'UNILORIN Post-UTME', 'Calculus', 'Biology Notes'];

export default function GlobalSearch({ isOpen, onClose, onNavigate, userRole = 'student' }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [recentSearches, setRecentSearches] = useState(RECENT_SEARCHES);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setActiveFilter('all');
      setSearchResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim() || query.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      
      try {
        const results: any[] = [];
        const searchPattern = `%${query}%`;
        
        // Search courses
        if (activeFilter === 'all' || activeFilter === 'courses') {
          const { data: courses } = await supabase.from('courses').select('*').ilike('title', searchPattern).limit(5);
          if (courses) {
            courses.forEach(c => results.push({ id: `c_${c.id}`, title: c.title, type: 'courses', icon: BookOpen, desc: c.course_code, category: 'courses', portal: c.portal }));
          }
        }
        
        // Search CBT
        if (activeFilter === 'all' || activeFilter === 'cbt') {
          const { data: cbts } = await supabase.from('cbt_exams').select('*').ilike('title', searchPattern).limit(5);
          if (cbts) {
            cbts.forEach(c => results.push({ id: `cbt_${c.id}`, title: c.title, type: 'cbt', icon: FileCheck, desc: `Duration: ${c.duration_minutes}m`, category: 'cbt', portal: c.portal }));
          }
        }
        
        // Search announcements
        if (activeFilter === 'all' || activeFilter === 'announcements') {
          const { data: anns } = await supabase.from('announcements').select('*').ilike('title', searchPattern).limit(5);
          if (anns) {
            anns.forEach(c => results.push({ id: `ann_${c.id}`, title: c.title, type: 'announcements', icon: Bell, desc: c.target_role, category: 'announcements', portal: 'All' }));
          }
        }
        
        // Search students (Admin only)
        if (userRole === 'admin' && (activeFilter === 'all' || activeFilter === 'students')) {
          const { data: students } = await supabase.from('profiles').select('*').ilike('full_name', searchPattern).limit(5);
          if (students) {
            students.forEach(c => results.push({ id: `stu_${c.id}`, title: c.full_name, type: 'student', icon: Users, desc: c.email, category: 'students', portal: c.portal || 'All', adminOnly: true }));
          }
        }
        
        setSearchResults(results);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    const timeoutId = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [query, activeFilter, userRole]);

  const handleResultClick = (view: string) => {
    if (onNavigate) {
      onNavigate(view);
    }
    onClose();
  };

  const removeRecent = (search: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(prev => prev.filter(s => s !== search));
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
  };

  const displayCategories = userRole === 'admin' ? ADMIN_CATEGORIES : CATEGORIES;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 pb-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-3xl bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Search Input */}
            <div className="relative flex items-center px-4 py-4 border-b border-slate-800 shrink-0 bg-[#020617]/50">
              <Search size={24} className="text-indigo-400 absolute left-6" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What would you like to learn today?"
                className="w-full bg-transparent border-none text-white text-lg sm:text-xl pl-12 pr-12 py-2 focus:outline-none placeholder:text-slate-500 font-display"
              />
              {query && (
                <button 
                  onClick={() => setQuery('')}
                  className="absolute right-6 p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 overflow-x-auto custom-scrollbar shrink-0">
              {displayCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveFilter(category.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                    activeFilter === category.id 
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                      : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <category.icon size={14} />
                  {category.label}
                </button>
              ))}
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 relative min-h-[300px]">
              {!query ? (
                <div className="space-y-6">
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3 px-2">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <Clock size={14} /> Recent Searches
                        </h3>
                        <button onClick={clearAllRecent} className="text-xs text-rose-400 hover:text-rose-300 transition-colors">Clear All</button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {recentSearches.map((search, i) => (
                          <button 
                            key={i} 
                            onClick={() => setQuery(search)}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/80 border border-slate-800/50 hover:border-slate-700 transition-all text-left group"
                          >
                            <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors truncate pr-4">{search}</span>
                            <div onClick={(e) => removeRecent(search, e)} className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-all">
                              <X size={14} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3 px-2">
                      <TrendingUp size={14} /> Popular Searches
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_SEARCHES.map((search, i) => (
                        <button 
                          key={i} 
                          onClick={() => setQuery(search)}
                          className="px-4 py-2 rounded-xl bg-[#020617]/50 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-sm text-slate-300 hover:text-indigo-400 transition-all font-medium"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {loading ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center">
                       <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                       <p className="text-slate-400">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(result => {
                      const getViewFromCategory = (category: string) => {
                        switch (category) {
                          case 'courses': return 'courses';
                          case 'chats': return 'chats';
                          case 'notes': return 'resources';
                          case 'past_questions': return 'past-questions';
                          case 'cbt': return 'cbt';
                          case 'ai': return 'ai';
                          case 'announcements': return 'announcements';
                          default: return 'dashboard';
                        }
                      };
                      return (
                      <button 
                        key={result.id}
                        onClick={() => handleResultClick(getViewFromCategory(result.category))}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-800/30 hover:bg-slate-800/80 border border-slate-800/50 hover:border-indigo-500/50 transition-all text-left group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-[#020617] border border-slate-800 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/50 transition-colors">
                          <result.icon size={20} className="text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-semibold text-slate-200 group-hover:text-white truncate transition-colors">
                            {result.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#020617] text-indigo-300 border border-indigo-500/20 capitalize shrink-0">
                              {result.type.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                              {result.portal}
                            </span>
                            <span className="text-[11px] text-slate-500 truncate">{result.desc}</span>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-4 group-hover:translate-x-0" />
                      </button>
                    );})
                  ) : (
                    <div className="py-16 flex flex-col items-center justify-center text-center px-4 animate-in fade-in zoom-in-95 duration-300">
                      <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                        <Search size={28} className="text-slate-500" />
                      </div>
                      <h3 className="text-lg font-display font-bold text-white mb-2">No results found</h3>
                      <p className="text-sm text-slate-400 max-w-sm mb-8">We couldn't find anything matching "{query}". Try adjusting your search or filters.</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                        <button onClick={() => handleResultClick('courses')} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-left transition-colors">
                          <BookOpen size={18} className="text-indigo-400" />
                          <div>
                            <p className="text-sm font-semibold text-slate-300">Browse Courses</p>
                            <p className="text-[10px] text-slate-500">View all available materials</p>
                          </div>
                        </button>
                        <button onClick={() => handleResultClick('ai')} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-left transition-colors">
                          <Bot size={18} className="text-emerald-400" />
                          <div>
                            <p className="text-sm font-semibold text-slate-300">Ask AI Assistant</p>
                            <p className="text-[10px] text-slate-500">Get instant explanations</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-800 bg-[#020617]/50 flex items-center justify-between shrink-0">
              <div className="hidden sm:flex items-center gap-4 text-[10px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300">↓</kbd> to navigate</span>
                <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300">Enter</kbd> to select</span>
              </div>
              <div className="flex items-center gap-2 ml-auto text-[10px] text-slate-500">
                <span>Powered by</span>
                <span className="font-display font-bold text-slate-400">TUNBORZY</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
