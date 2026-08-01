import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Search, Filter, ArrowLeft, ArrowDownToLine, Eye, 
  ChevronRight, Bookmark, BookMarked, Calendar, FileType, ZoomIn, ZoomOut, Maximize, FileStack
} from 'lucide-react';
import DashboardLayout from './dashboard/DashboardLayout';
import { supabase } from '../supabaseClient';

import { useProfile } from '../lib/useProfile';

interface PastQuestionsPageProps {
  onLogout: () => void;
  onNavigate?: (view: string) => void;
}

interface PastQuestion {
  id: string;
  year: number;
  subject: string;
  questionsCount: number;
  fileType: string;
  uploadDate: string;
  isBookmarked: boolean;
}

const UTME_SUBJECTS = ['Use of English', 'Mathematics', 'Physics', 'Chemistry', 'Biology'];
const POST_UTME_SUBJECTS = ['Use of English Past Questions'];
const UNDERGRAD_FIRST_SEMESTER = ['MTH 101', 'CHM 101', 'PHY 101', 'PHY 103', 'GST 111'];
const UNDERGRAD_SECOND_SEMESTER = ['MTH 102', 'CHM 102', 'PHY 102', 'PHY 104', 'GST 112', 'STA 112'];

export default function PastQuestionsPage({ onLogout, onNavigate }: PastQuestionsPageProps) {
  const { profile } = useProfile();
  const [academicPortal, setAcademicPortal] = useState<string>('Undergraduate');
  const [activeSemester, setActiveSemester] = useState<'first' | 'second'>('first');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('All Years');
  const [sortBy, setSortBy] = useState('Newest');
  
  const [questions, setQuestions] = useState<PastQuestion[]>([]); // Will be populated by Admin
  const [viewingPdf, setViewingPdf] = useState<PastQuestion | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    if (profile?.portal) {
      setAcademicPortal(profile.portal);
    }
  }, [profile]);

  useEffect(() => {
    async function loadPastQuestions() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('learning_materials')
          .select('*')
          .eq('type', 'past-questions');
        if (data && data.length > 0) {
          const loaded: PastQuestion[] = data.map((item: any) => ({
            id: item.id,
            year: item.year || 2024,
            subject: item.title || item.course_title || 'General',
            questionsCount: item.questions_count || 40,
            fileType: 'PDF',
            uploadDate: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent',
            isBookmarked: false
          }));
          setQuestions(loaded);
        }
      } catch (err) {
        console.warn("Error loading past questions", err);
      }
    }
    loadPastQuestions();
  }, []);

  const getSubjects = () => {
    if (academicPortal === 'UTME') return UTME_SUBJECTS;
    if (academicPortal === 'Post-UTME') return POST_UTME_SUBJECTS;
    return activeSemester === 'first' ? UNDERGRAD_FIRST_SEMESTER : UNDERGRAD_SECOND_SEMESTER;
  };

  const toggleBookmark = (id: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, isBookmarked: !q.isBookmarked } : q));
  };

  return (
    <DashboardLayout onLogout={onLogout} currentView="past-questions" onNavigate={onNavigate}>
      <AnimatePresence mode="wait">
        {viewingPdf ? (
          <motion.div
            key="pdf-viewer"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full h-[calc(100dvh-120px)] flex flex-col bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden"
          >
            {/* Viewer Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#020617]/50">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setViewingPdf(null)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h3 className="text-white font-display font-bold text-sm sm:text-base truncate max-w-[200px] sm:max-w-md">
                    {viewingPdf.subject} - {viewingPdf.year}
                  </h3>
                  <p className="text-xs text-slate-400 font-body">{viewingPdf.questionsCount} Questions • {viewingPdf.fileType}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:flex items-center gap-2 bg-slate-900 rounded-lg p-1 border border-slate-800">
                  <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"><ZoomOut size={16} /></button>
                  <span className="text-xs font-mono text-slate-300 w-12 text-center">{zoomLevel}%</span>
                  <button onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"><ZoomIn size={16} /></button>
                </div>
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors hidden sm:block">
                  <Maximize size={18} />
                </button>
                
              </div>
            </div>
            
            {/* PDF Canvas Area (Simulated) */}
            <div className="flex-1 bg-[#020617] relative overflow-auto flex items-center justify-center p-4 sm:p-8">
              <div 
                className="bg-white rounded shadow-2xl transition-all duration-300 flex flex-col"
                style={{ 
                  width: `${(zoomLevel / 100) * 100}%`,
                  maxWidth: '800px',
                  minHeight: `${(zoomLevel / 100) * 800}px` 
                }}
              >
                <div className="p-8 sm:p-12 border-b border-gray-200">
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{viewingPdf.subject}</h1>
                    <h2 className="text-lg text-gray-600">Past Question - {viewingPdf.year}</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mt-8"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
              
              {/* Pagination Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/90 backdrop-blur border border-slate-700 px-4 py-2 rounded-full shadow-2xl">
                <button className="p-1 text-slate-400 hover:text-white transition-colors opacity-50 cursor-not-allowed">
                  <ChevronRight size={20} className="rotate-180" />
                </button>
                <span className="text-xs font-action font-semibold text-white">Page 1 of 12</span>
                <button className="p-1 text-slate-400 hover:text-white transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        ) : !selectedSubject ? (
          <motion.div
            key="library-home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">Past Questions</h1>
              <p className="text-sm font-body text-slate-400">Study previous examination questions to prepare effectively.</p>
            </div>

            {academicPortal === 'Undergraduate' && (
              <div className="flex gap-2 p-1 bg-[#0f172a]/80 border border-slate-800 rounded-xl mb-8 w-fit backdrop-blur-md">
                <button
                  onClick={() => setActiveSemester('first')}
                  className={`px-4 py-2 rounded-lg text-sm font-action font-semibold transition-all ${
                    activeSemester === 'first' 
                      ? 'bg-amber-500 text-slate-950 shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  First Semester
                </button>
                <button
                  onClick={() => setActiveSemester('second')}
                  className={`px-4 py-2 rounded-lg text-sm font-action font-semibold transition-all ${
                    activeSemester === 'second' 
                      ? 'bg-amber-500 text-slate-950 shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Second Semester
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {getSubjects().map(subject => (
                <motion.button
                  key={subject}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedSubject(subject)}
                  className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 text-left hover:border-amber-500/50 transition-all shadow-xl group flex flex-col relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                  <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center mb-4 group-hover:bg-amber-500/10 transition-colors">
                    <FileStack size={24} className="text-amber-500/80 group-hover:text-amber-500 transition-colors" />
                  </div>
                  <h4 className="text-lg font-display font-bold text-white mb-2">{subject}</h4>
                  <div className="flex items-center text-xs font-action font-semibold text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity mt-auto pt-4">
                    View Papers <ChevronRight size={14} className="ml-1" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="folder-view"
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

            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <FileStack size={20} className="text-amber-500" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">{selectedSubject}</h1>
                </div>
                <p className="text-sm font-body text-slate-400 ml-13">Available past questions grouped by year.</p>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Search past questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#020617]/50 border border-slate-700 text-white text-sm rounded-xl py-2.5 pl-9 pr-4 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              
              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <select 
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="w-full appearance-none bg-[#020617]/50 border border-slate-700 text-slate-300 text-sm rounded-xl py-2.5 pl-4 pr-10 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                  >
                    <option>All Years</option>
                    <option>2025</option>
                    <option>2024</option>
                    <option>2023</option>
                    <option>2022</option>
                    <option>2021</option>
                  </select>
                  <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
                
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 sm:flex-none bg-[#020617]/50 border border-slate-700 text-slate-300 text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                >
                  <option>Newest</option>
                  <option>Oldest</option>
                </select>
              </div>
            </div>

            {/* Papers List */}
            <div className="bg-[#0f172a]/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6 min-h-[400px]">
              {questions.filter(q => q.subject === selectedSubject).length > 0 ? (
                <div className="space-y-6">
                  {/* Grouped by year ideally, but simple list for now */}
                  <div className="grid grid-cols-1 gap-4">
                    {questions.filter(q => q.subject === selectedSubject).map(paper => (
                      <div key={paper.id} className="bg-[#020617]/50 border border-slate-800 rounded-xl p-5 hover:border-amber-500/30 transition-colors group">
                        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                          <div className="flex items-start sm:items-center gap-4 flex-1 w-full">
                            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col items-center justify-center shrink-0">
                              <span className="text-[10px] font-action font-bold text-amber-500 uppercase">Year</span>
                              <span className="text-lg font-display font-bold text-white leading-none mt-1">{paper.year}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-display font-bold text-white mb-1.5 truncate">{paper.subject}</h4>
                              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-body text-slate-400">
                                <span className="flex items-center gap-1.5"><FileText size={14} className="text-slate-500" /> {paper.questionsCount} Questions</span>
                                <span className="flex items-center gap-1.5"><FileType size={14} className="text-slate-500" /> {paper.fileType}</span>
                                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-500" /> Uploaded {paper.uploadDate}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0">
                            <button 
                              onClick={() => setViewingPdf(paper)}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-action font-semibold transition-colors"
                            >
                              <Eye size={16} /> View
                            </button>
                            <button 
                              onClick={() => onNavigate?.('cbt')}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-lg text-sm font-action font-semibold transition-colors shadow-lg shadow-amber-500/20"
                            >
                              Practice as CBT
                            </button>
                            <button className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#020617] border border-slate-700 hover:border-slate-500 text-slate-300 rounded-lg transition-colors">
                              <ArrowDownToLine size={16} />
                            </button>
                            <button 
                              onClick={() => toggleBookmark(paper.id)}
                              className={`p-2.5 rounded-lg border transition-colors ${
                                paper.isBookmarked 
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                                  : 'bg-[#020617] border-slate-700 text-slate-400 hover:border-slate-500'
                              }`}
                            >
                              {paper.isBookmarked ? <BookMarked size={16} /> : <Bookmark size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                    <FileText size={28} className="text-slate-500" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-white mb-2">No Past Questions Yet</h3>
                  <p className="text-sm font-body text-slate-400 max-w-sm mx-auto">
                    Admin and Lecturers will upload past examination papers for {selectedSubject} here soon. Check back later!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
