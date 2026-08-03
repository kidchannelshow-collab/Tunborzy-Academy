import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Settings, BookOpen, Clock, FileText, Award, History, TrendingUp, ArrowRight, Brain, Target, Star } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function CBTStudentDashboard({ onStartExam, onOpenCustomBuilder }: any) {
  const [exams, setExams] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'history' | 'leaderboard'>('available');

  useEffect(() => {
    async function loadData() {
      const [examsRes, historyRes] = await Promise.all([
        supabase
          .from('cbt_exams')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('cbt_attempts')
          .select('*, cbt_exams(title)')
          .order('end_time', { ascending: false })
      ]);
      
      if (examsRes.data) setExams(examsRes.data);
      if (historyRes.data) setHistory(historyRes.data);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-sm font-medium mb-4 border border-white/10">
                <Brain size={16} /> Advanced Assessment Engine
              </span>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-4 leading-tight">
                Master your subjects with adaptive practice
              </h1>
              <p className="text-blue-100 mb-8 max-w-lg text-lg">
                Build custom tests, take full-length mock exams, and identify your weak spots with AI-driven analytics.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={onOpenCustomBuilder}
                  className="px-6 py-3 bg-white text-blue-600 hover:bg-slate-50 rounded-xl font-bold transition-all shadow-xl shadow-blue-900/20 flex items-center gap-2 group"
                >
                  <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                  Custom Exam Builder
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#0f172a] p-2 rounded-2xl border border-slate-800 overflow-x-auto">
            {[
              { id: 'available', label: 'Available Exams', icon: Target },
              { id: 'history', label: 'Exam History', icon: History },
              { id: 'leaderboard', label: 'Leaderboard', icon: Award }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
              >
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {activeTab === 'available' && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-white">Full-Length Mock Exams</h2>
                  </div>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : exams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {exams.map(exam => (
                        <div key={exam.id} className="bg-[#0f172a] border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-colors group">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1 block">
                                {exam.portal}
                              </span>
                              <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">
                                {exam.title}
                              </h3>
                            </div>
                            <div className="p-2 bg-slate-800/50 rounded-lg">
                              <BookOpen size={20} className="text-slate-400" />
                            </div>
                          </div>
                          <p className="text-sm text-slate-400 mb-6 line-clamp-2">
                            {exam.description || 'Standard examination assessing comprehensive knowledge.'}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                            <div className="flex items-center gap-1">
                              <Clock size={16} /> {exam.duration_minutes}m
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText size={16} /> {exam.total_questions} Qs
                            </div>
                          </div>
                          <button
                            onClick={() => onStartExam(exam.id)}
                            className="w-full py-3 bg-slate-800 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                          >
                            <Play size={18} /> Start Exam
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-[#0f172a] border border-slate-800 rounded-2xl">
                      <Target size={48} className="mx-auto text-slate-600 mb-4" />
                      <p className="text-slate-400">No mock exams are currently available.</p>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'history' && (
                history.length > 0 ? (
                  <div className="space-y-4">
                    {history.map(attempt => (
                      <div key={attempt.id} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-bold">{attempt.cbt_exams?.title || 'Custom Exam'}</h4>
                          <p className="text-sm text-slate-400">{new Date(attempt.end_time || attempt.started_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-400">
                            {attempt.score !== null ? `${attempt.score}%` : 'In Progress'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-8 text-center">
                    <History size={48} className="mx-auto text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Past Attempts Found</h3>
                    <p className="text-slate-400 max-w-sm mx-auto">Take a mock exam or build a custom practice session to see your history here.</p>
                  </div>
                )
              )}

              {activeTab === 'leaderboard' && (
                <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-center py-12 flex-col">
                    <Award size={48} className="text-amber-500 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Global Leaderboard</h3>
                    <p className="text-slate-400 text-center max-w-md">Complete more exams with high scores to climb the global ranks and earn subject certificates.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-500" /> Performance Overview
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                <div className="text-sm text-slate-400 mb-1">Average Score</div>
                <div className="text-3xl font-display font-bold text-white">
                  {history.length > 0 ? Math.round(history.reduce((acc, curr) => acc + (curr.score || 0), 0) / history.length) + '%' : '--%'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                  <div className="text-sm text-slate-400 mb-1">Tests Taken</div>
                  <div className="text-2xl font-bold text-white">{history.length}</div>
                </div>
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                  <div className="text-sm text-slate-400 mb-1">Questions</div>
                  <div className="text-2xl font-bold text-white">
                    {history.reduce((acc, curr) => acc + (curr.total_questions || 0), 0)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-800">
              <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Strongest Subjects</h4>
              <p className="text-sm text-slate-500 italic">Not enough data yet.</p>
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Star size={20} className="text-amber-500" /> Quick Practice
            </h3>
            <div className="space-y-3">
              {['Mathematics', 'Physics', 'Chemistry', 'English'].map(subj => (
                <button
                  key={subj}
                  onClick={onOpenCustomBuilder}
                  className="w-full flex items-center justify-between p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors group"
                >
                  <span className="font-medium text-slate-300 group-hover:text-white transition-colors">{subj}</span>
                  <ArrowRight size={16} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// Adding FileText import to the top because I missed it. I will fix the imports.
