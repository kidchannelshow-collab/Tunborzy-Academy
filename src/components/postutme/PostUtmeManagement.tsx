import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Filter, Edit3, Trash2, Eye, EyeOff, CheckCircle2, 
  AlertCircle, BookOpen, Layers, Award, Calendar, Building2, Save, X, RefreshCcw
} from 'lucide-react';

interface PostUtmeExam {
  id: string;
  title: string;
  university: string;
  course_code: string;
  subject: string;
  year: string;
  duration_minutes: number;
  is_published: boolean;
}

interface PostUtmeQuestion {
  id: string;
  exam_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
  marks: number;
  topic: string;
  difficulty: string;
}

export default function PostUtmeManagement() {
  const [exams, setExams] = useState<PostUtmeExam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [questions, setQuestions] = useState<PostUtmeQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUniversity, setFilterUniversity] = useState('ALL');
  
  // Modal states
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [currentExam, setCurrentExam] = useState<Partial<PostUtmeExam>>({ university: 'UNILAG', duration_minutes: 60, is_published: false });
  const [currentQuestion, setCurrentQuestion] = useState<Partial<PostUtmeQuestion>>({ correct_option: 'A', difficulty: 'medium', marks: 1 });
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      fetchQuestions(selectedExamId);
    } else {
      setQuestions([]);
    }
  }, [selectedExamId]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      const { data, error } = await supabase.from('post_utme_exams').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setExams(data || []);
      if (data && data.length > 0 && !selectedExamId) {
        setSelectedExamId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch Post-UTME exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (examId: string) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      const { data, error } = await supabase.from('post_utme_questions').select('*').eq('exam_id', examId);
      if (error) throw error;
      setQuestions(data || []);
    } catch (err) {
      console.error('Failed to fetch Post-UTME questions:', err);
    }
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      const { data: userData } = await supabase.auth.getUser();

      const payload = {
        ...currentExam,
        created_by: userData?.user?.id
      };

      if (currentExam.id) {
        const { error } = await supabase.from('post_utme_exams').update(payload).eq('id', currentExam.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('post_utme_exams').insert([payload]).select().single();
        if (error) throw error;
        if (data) setSelectedExamId(data.id);
      }

      setIsExamModalOpen(false);
      setCurrentExam({ university: 'UNILAG', duration_minutes: 60, is_published: false });
      fetchExams();
    } catch (err: any) {
      alert('Error saving Post-UTME exam: ' + err.message);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      const payload = {
        ...currentQuestion,
        exam_id: selectedExamId
      };

      if (editingQuestionId) {
        const { error } = await supabase.from('post_utme_questions').update(payload).eq('id', editingQuestionId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_utme_questions').insert([payload]);
        if (error) throw error;
      }

      setIsQuestionModalOpen(false);
      setCurrentQuestion({ correct_option: 'A', difficulty: 'medium', marks: 1 });
      setEditingQuestionId(null);
      fetchQuestions(selectedExamId);
    } catch (err: any) {
      alert('Error saving question: ' + err.message);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Post-UTME question?')) return;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      const { error } = await supabase.from('post_utme_questions').delete().eq('id', id);
      if (error) throw error;
      fetchQuestions(selectedExamId);
    } catch (err: any) {
      alert('Error deleting question: ' + err.message);
    }
  };

  const togglePublishExam = async (exam: PostUtmeExam) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      const { error } = await supabase.from('post_utme_exams').update({ is_published: !exam.is_published }).eq('id', exam.id);
      if (error) throw error;
      fetchExams();
    } catch (err: any) {
      alert('Error updating exam status: ' + err.message);
    }
  };

  const filteredExams = exams.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (e.course_code && e.course_code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesUni = filterUniversity === 'ALL' || e.university === filterUniversity;
    return matchesSearch && matchesUni;
  });

  const activeExam = exams.find(e => e.id === selectedExamId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Post-UTME Past Question & CBT Manager
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage university past question papers, exam collections, and secure Post-UTME CBT question banks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setCurrentExam({ university: 'UNILAG', duration_minutes: 60, is_published: false }); setIsExamModalOpen(true); }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Create Exam / Past Paper
          </button>
        </div>
      </div>

      {/* Filter and Exam Selector Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exam List Panel */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">University Papers</h3>
            <span className="text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold px-2.5 py-1 rounded-full">
              {filteredExams.length} Papers
            </span>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search university or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={filterUniversity}
              onChange={(e) => setFilterUniversity(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Universities</option>
              <option value="UNILAG">UNILAG</option>
              <option value="UI">UI</option>
              <option value="UNN">UNN</option>
              <option value="OAU">OAU</option>
              <option value="ABU">ABU</option>
              <option value="LASU">LASU</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                onClick={() => setSelectedExamId(exam.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedExamId === exam.id
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-500/50 shadow-sm'
                    : 'bg-gray-50/50 dark:bg-gray-800/50 border-gray-200/60 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                    {exam.university}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePublishExam(exam); }}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                      exam.is_published 
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {exam.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {exam.is_published ? 'Published' : 'Draft'}
                  </button>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mt-2">{exam.title}</h4>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>{exam.subject} ({exam.year || 'General'})</span>
                  <span>{exam.duration_minutes} mins</span>
                </div>
              </div>
            ))}
            {filteredExams.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">No Post-UTME papers found.</div>
            )}
          </div>
        </div>

        {/* Questions Manager Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
          {activeExam ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {activeExam.university}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {activeExam.year || 'All Years'} • {activeExam.duration_minutes} Minutes
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{activeExam.title}</h2>
                </div>
                <button
                  onClick={() => { 
                    setCurrentQuestion({ correct_option: 'A', difficulty: 'medium', marks: 1 }); 
                    setEditingQuestionId(null); 
                    setIsQuestionModalOpen(true); 
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>

              {/* Questions List */}
              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
                {questions.map((q, index) => (
                  <div key={q.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded font-medium">
                          {q.difficulty}
                        </span>
                        <span className="text-xs text-gray-500">
                          {q.marks} Mark{q.marks > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setCurrentQuestion(q);
                            setEditingQuestionId(q.id);
                            setIsQuestionModalOpen(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
                          title="Edit Question"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
                          title="Delete Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="font-medium text-gray-900 dark:text-white text-sm">{q.question_text}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {['A', 'B', 'C', 'D'].map((opt) => {
                        const optKey = `option_${opt.toLowerCase()}` as keyof PostUtmeQuestion;
                        const isCorrect = q.correct_option === opt;
                        return (
                          <div 
                            key={opt}
                            className={`p-2 rounded-lg border ${
                              isCorrect 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/50 text-emerald-900 dark:text-emerald-200 font-semibold' 
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <span className="font-bold mr-2">{opt}:</span> {String(q[optKey])}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="text-xs bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-300 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                        <span className="font-bold">Explanation:</span> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}

                {questions.length === 0 && (
                  <div className="text-center py-16 text-gray-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No questions added to this Post-UTME paper yet.</p>
                    <p className="text-xs mt-1">Click "Add Question" to start building the bank.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-24 text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-base font-medium">Select a Post-UTME paper or create a new one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Exam Modal */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 dark:border-gray-800 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create Post-UTME Paper</h3>
              <button onClick={() => setIsExamModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Paper Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UNILAG Post-UTME Mathematics Past Questions 2023"
                  value={currentExam.title || ''}
                  onChange={(e) => setCurrentExam({ ...currentExam, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">University</label>
                  <select
                    value={currentExam.university || 'UNILAG'}
                    onChange={(e) => setCurrentExam({ ...currentExam, university: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white"
                  >
                    <option value="UNILAG">UNILAG</option>
                    <option value="UI">UI</option>
                    <option value="UNN">UNN</option>
                    <option value="OAU">OAU</option>
                    <option value="ABU">ABU</option>
                    <option value="LASU">LASU</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                  <select
                    value={currentExam.subject || 'Mathematics'}
                    onChange={(e) => setCurrentExam({ ...currentExam, subject: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="English Language">English Language</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="General Aptitude">General Aptitude</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Year / Session</label>
                  <input
                    type="text"
                    placeholder="e.g. 2023/2024"
                    value={currentExam.year || ''}
                    onChange={(e) => setCurrentExam({ ...currentExam, year: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={currentExam.duration_minutes || 60}
                    onChange={(e) => setCurrentExam({ ...currentExam, duration_minutes: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={currentExam.is_published || false}
                  onChange={(e) => setCurrentExam({ ...currentExam, is_published: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="is_published" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Publish paper immediately for students
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm"
                >
                  Save Paper
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Create/Edit Question Modal */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-100 dark:border-gray-800 space-y-5 my-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingQuestionId ? 'Edit Post-UTME Question' : 'Add Post-UTME Question'}
              </h3>
              <button onClick={() => setIsQuestionModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Question Text</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter the question..."
                  value={currentQuestion.question_text || ''}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Option A</label>
                  <input
                    type="text"
                    required
                    value={currentQuestion.option_a || ''}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_a: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Option B</label>
                  <input
                    type="text"
                    required
                    value={currentQuestion.option_b || ''}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_b: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Option C</label>
                  <input
                    type="text"
                    required
                    value={currentQuestion.option_c || ''}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_c: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Option D</label>
                  <input
                    type="text"
                    required
                    value={currentQuestion.option_d || ''}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_d: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Correct Option</label>
                  <select
                    value={currentQuestion.correct_option || 'A'}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, correct_option: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white font-bold text-indigo-600"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
                  <select
                    value={currentQuestion.difficulty || 'medium'}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, difficulty: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={currentQuestion.marks || 1}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Explanation (Shown after submission)</label>
                <textarea
                  rows={2}
                  placeholder="Explain why the correct answer is right..."
                  value={currentQuestion.explanation || ''}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm"
                >
                  Save Question
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
