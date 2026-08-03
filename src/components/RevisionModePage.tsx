import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Search, ArrowLeft, BookOpen, Clock, 
  Bookmark, BookMarked, ChevronRight, Zap, History,
  FileKey, LayoutTemplate, HelpCircle, CheckSquare, 
  AlertTriangle, Lightbulb
} from 'lucide-react';
import DashboardLayout from './dashboard/DashboardLayout';

import { useProfile } from '../lib/useProfile';

interface RevisionModePageProps {
  onLogout: () => void;
  onNavigate?: (view: string) => void;
}

const UTME_SUBJECTS = ['Use of English', 'Mathematics', 'Physics', 'Chemistry', 'Biology'];
const POST_UTME_SUBJECTS = ['Use of English'];
const UNDERGRAD_FIRST_SEMESTER = ['MTH 101', 'CHM 101', 'PHY 101', 'PHY 103', 'GST 111'];
const UNDERGRAD_SECOND_SEMESTER = ['MTH 102', 'CHM 102', 'PHY 102', 'PHY 104', 'GST 112', 'STA 112'];

const CATEGORIES = [
  { id: 'summary', title: 'Summary Notes', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'formulas', title: 'Important Formulas', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'definitions', title: 'Key Definitions', icon: FileKey, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'diagrams', title: 'Important Diagrams', icon: LayoutTemplate, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'tips', title: 'Memory Tips', icon: Lightbulb, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { id: 'faq', title: 'Frequently Asked Questions', icon: HelpCircle, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { id: 'likely', title: 'Likely Examination Questions', icon: CheckSquare, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 'mistakes', title: 'Common Mistakes to Avoid', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
  { id: 'checklist', title: 'Exam Preparation Checklist', icon: CheckSquare, color: 'text-indigo-500', bg: 'bg-indigo-500/10' }
];

export default function RevisionModePage({ onLogout, onNavigate }: RevisionModePageProps) {
  const { profile } = useProfile();
  const [academicPortal, setAcademicPortal] = useState<string>('Undergraduate');
  const [activeSemester, setActiveSemester] = useState<'first' | 'second'>('first');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (profile?.portal) {
      setAcademicPortal(profile.portal);
    }
  }, [profile?.id, profile?.role]);

  const getSubjects = () => {
    if (academicPortal === 'UTME') return UTME_SUBJECTS;
    if (academicPortal === 'Post-UTME') return POST_UTME_SUBJECTS;
    return activeSemester === 'first' ? UNDERGRAD_FIRST_SEMESTER : UNDERGRAD_SECOND_SEMESTER;
  };

  return (
    <DashboardLayout onLogout={onLogout} currentView="revision" onNavigate={onNavigate}>
      <AnimatePresence mode="wait">
        {!selectedSubject ? (
          <motion.div
            key="revision-home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
                <Zap className="text-amber-500" size={28} /> Revision Mode
              </h1>
              <p className="text-sm font-body text-slate-400">Quickly revise important concepts before your examination.</p>
            </div>

            {/* Global Search */}
            <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Search revision materials across all subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#020617]/50 border border-slate-700 text-white text-base rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-display font-bold text-white">Select Subject</h3>
                  {academicPortal === 'Undergraduate' && (
                    <div className="flex gap-1 p-1 bg-[#0f172a]/80 border border-slate-800 rounded-xl backdrop-blur-md">
                      <button
                        onClick={() => setActiveSemester('first')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-action font-semibold transition-all ${
                          activeSemester === 'first' 
                            ? 'bg-amber-500 text-slate-950 shadow-md' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        1st Sem
                      </button>
                      <button
                        onClick={() => setActiveSemester('second')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-action font-semibold transition-all ${
                          activeSemester === 'second' 
                            ? 'bg-amber-500 text-slate-950 shadow-md' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        2nd Sem
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getSubjects().map(subject => (
                    <motion.button
                      key={subject}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedSubject(subject)}
                      className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 text-left hover:border-amber-500/50 transition-all shadow-xl group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                          <BookOpen size={20} className="text-amber-500/80 group-hover:text-amber-500 transition-colors" />
                        </div>
                        <h4 className="text-base font-display font-bold text-white group-hover:text-amber-500 transition-colors">{subject}</h4>
                      </div>
                      <ChevronRight size={18} className="text-slate-600 group-hover:text-amber-500 transition-colors" />
                    </motion.button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-[#0f172a]/50 border border-slate-800/80 rounded-2xl p-5">
                  <h3 className="text-sm font-display font-bold text-white mb-4 flex items-center gap-2">
                    <History size={16} className="text-amber-500" />
                    Recently Viewed
                  </h3>
                  <div className="text-center py-6">
                    <History size={24} className="text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No recently viewed items.</p>
                  </div>
                </div>

                <div className="bg-[#0f172a]/50 border border-slate-800/80 rounded-2xl p-5">
                  <h3 className="text-sm font-display font-bold text-white mb-4 flex items-center gap-2">
                    <Bookmark size={16} className="text-amber-500" />
                    Bookmarked Revision
                  </h3>
                  <div className="text-center py-6">
                    <BookMarked size={24} className="text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">You haven't bookmarked any revision materials yet.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="subject-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full"
          >
            <button 
              onClick={() => setSelectedSubject(null)}
              className="flex items-center gap-2 text-sm font-action font-semibold text-slate-400 hover:text-white mb-6 transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Subjects
            </button>

            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <BookOpen size={20} className="text-amber-500" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">{selectedSubject}</h1>
              </div>
              <p className="text-sm font-body text-slate-400 ml-13">Choose a revision category or a quick revision mode.</p>
            </div>
            
            {/* Quick Revision Modules */}
            <div className="mb-10">
              <h3 className="text-lg font-display font-bold text-white mb-4">Quick Revision</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button className="relative overflow-hidden bg-gradient-to-br from-green-500/20 to-emerald-900/40 border border-green-500/30 rounded-2xl p-5 text-left hover:border-green-500/60 transition-all group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                  <Clock size={24} className="text-green-400 mb-3" />
                  <h4 className="text-lg font-display font-bold text-white mb-1">5-Minute Revision</h4>
                  <p className="text-xs text-green-100/70">Ultra-fast review of core concepts.</p>
                </button>
                
                <button className="relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-indigo-900/40 border border-blue-500/30 rounded-2xl p-5 text-left hover:border-blue-500/60 transition-all group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                  <Clock size={24} className="text-blue-400 mb-3" />
                  <h4 className="text-lg font-display font-bold text-white mb-1">15-Minute Revision</h4>
                  <p className="text-xs text-blue-100/70">Moderate review with likely questions.</p>
                </button>

                <button className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 to-orange-900/40 border border-amber-500/30 rounded-2xl p-5 text-left hover:border-amber-500/60 transition-all group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                  <BookOpen size={24} className="text-amber-400 mb-3" />
                  <h4 className="text-lg font-display font-bold text-white mb-1">Complete Revision</h4>
                  <p className="text-xs text-amber-100/70">Comprehensive review of everything.</p>
                </button>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-lg font-display font-bold text-white mb-4">Revision Categories</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.title)}
                    className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 text-left hover:border-slate-600 transition-all shadow-xl group flex items-start gap-4"
                  >
                    <div className={`w-12 h-12 rounded-xl ${category.bg} flex items-center justify-center shrink-0`}>
                      <category.icon size={20} className={category.color} />
                    </div>
                    <div>
                      <h4 className="text-sm font-display font-bold text-white mb-1 group-hover:text-amber-500 transition-colors">{category.title}</h4>
                      <p className="text-xs text-slate-400">View materials</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Category View Modal/Overlay (Simulated for now, showing empty state if clicked) */}
            <AnimatePresence>
              {selectedCategory && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 bg-[#020617]/50">
                      <div>
                        <h2 className="text-xl font-display font-bold text-white">{selectedCategory}</h2>
                        <p className="text-sm text-slate-400">{selectedSubject}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedCategory(null)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                        <FileText size={28} className="text-slate-500" />
                      </div>
                      <h3 className="text-lg font-display font-bold text-white mb-2">No {selectedCategory} Yet</h3>
                      <p className="text-sm font-body text-slate-400 max-w-sm mx-auto">
                        Admin and Lecturers will upload revision materials for {selectedSubject} here soon. Check back later!
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
