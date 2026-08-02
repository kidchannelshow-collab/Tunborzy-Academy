import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Plus, Edit2, Trash2, Eye, EyeOff, FileSpreadsheet, Search } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { notificationService } from '../../lib/notificationService';
import { useProfile } from '../../lib/useProfile';
import CBTQuestionManager from './CBTQuestionManager';

export default function CBTManagement() {
  const { profile } = useProfile();
  
  const [tests, setTests] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  
  // Form State
  const [editingId, setEditingId] = useState('');
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [duration, setDuration] = useState(60);
  const [randomize, setRandomize] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (profile) fetchData();
  }, [profile?.id, profile?.role]);

  const fetchData = async () => {
    if (!supabase || !profile) return;
    setLoading(true);
    try {
      const [coursesRes, examsRes] = await Promise.all([
        supabase.from('courses').select('id, title, course_code').eq('lecturer_id', profile.id),
        supabase.from('cbt_exams').select('*, courses(course_code, title)').eq('lecturer_id', profile.id).order('created_at', { ascending: false })
      ]);
      
      setCourses(coursesRes.data || []);
      if (coursesRes.data && coursesRes.data.length > 0 && !courseId) {
        setCourseId(coursesRes.data[0].id);
      }
      setTests(examsRes.data || []);
    } catch (err) {
      console.error(err);
      // Suppress missing table errors by creating dummy state if table doesn't exist
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const saveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !profile) return;
    
    const payload = {
      lecturer_id: profile.id,
      course_id: courseId,
      title,
      duration_minutes: duration,
      randomize_questions: randomize,
      is_published: false
    };

    try {
      if (editingId) {
        await supabase.from('cbt_exams').update(payload).eq('id', editingId);
      } else {
        await supabase.from('cbt_exams').insert(payload);
        if (payload.course_id) {
           await notificationService.notifyCourseStudents(payload.course_id, `New CBT Available: ${payload.title}`, `A new CBT exam has been scheduled.`, 'cbt', '/cbt');
        }
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDuration(60);
    setRandomize(false);
    setEditingId('');
    if (courses.length > 0) setCourseId(courses[0].id);
  };

  const openEdit = (exam: any) => {
    setTitle(exam.title);
    setCourseId(exam.course_id);
    setDuration(exam.duration_minutes || 60);
    setRandomize(exam.randomize_questions || false);
    setEditingId(exam.id);
    setShowModal(true);
  };

  const togglePublish = async (id: string, current: boolean) => {
    if (!supabase) return;
    try {
      await supabase.from('cbt_exams').update({ is_published: !current }).eq('id', id);
      setTests(tests.map(t => t.id === id ? { ...t, is_published: !current } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteExam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam and all its questions?')) return;
    if (!supabase) return;
    try {
      await supabase.from('cbt_exams').delete().eq('id', id);
      setTests(tests.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTests = tests.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (activeExamId) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto pb-12">
        <CBTQuestionManager examId={activeExamId} onBack={() => setActiveExamId(null)} />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto pb-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">CBT Manager</h1>
          <p className="text-slate-400">Create tests, manage questions, and review attempts.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-action font-bold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <Plus size={20} />
          Create Exam
        </button>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search exams..." 
              className="w-full bg-[#020617]/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 font-action text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Exam Title</th>
                <th className="p-4 font-semibold">Course</th>
                <th className="p-4 font-semibold">Settings</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredTests.map(test => (
                <tr key={test.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-white max-w-[250px] truncate">{test.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{new Date(test.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-800 text-slate-300 font-mono text-xs font-bold px-2 py-1 rounded border border-slate-700">
                      {test.courses?.course_code || 'Course'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-xs text-slate-400 space-y-1">
                      <p><span className="text-white font-bold">{test.duration_minutes}</span> mins</p>
                      <p>{test.randomize_questions ? 'Randomized' : 'Fixed Order'}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => togglePublish(test.id, test.is_published)}
                      className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border flex items-center gap-1.5 w-max ${
                        test.is_published ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {test.is_published ? <><Eye size={12}/> Published</> : <><EyeOff size={12}/> Draft</>}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setActiveExamId(test.id)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Manage Questions">
                        <FileSpreadsheet size={18} />
                      </button>
                      <button onClick={() => openEdit(test)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" title="Edit Settings">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => deleteExam(test.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete Exam">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredTests.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400">
                    No CBT exams found. Click "Create Exam" to build one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="p-6 border-b border-slate-800"><h2 className="text-xl font-bold text-white">{editingId ? 'Edit Exam Settings' : 'Create New Exam'}</h2></div>
              
              <form onSubmit={saveExam} className="p-6 space-y-5">
                <div>
                  <label className="text-sm font-bold text-slate-300">Exam Title *</label>
                  <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 mt-1 text-white focus:outline-none focus:border-amber-500" placeholder="e.g. Mid-Semester Physics Test" />
                </div>
                
                <div>
                  <label className="text-sm font-bold text-slate-300">Target Course *</label>
                  <select required value={courseId} onChange={e => setCourseId(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 mt-1 text-white focus:outline-none focus:border-amber-500">
                    {courses.map(c => <option key={c.id} value={c.id}>{c.course_code ? `${c.course_code} - ` : ''}{c.title}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-bold text-slate-300">Duration (Minutes) *</label>
                  <input required type="number" min="5" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 60)} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 mt-1 text-white focus:outline-none focus:border-amber-500" />
                </div>

                <div className="flex items-center gap-3 bg-[#020617] border border-slate-800 rounded-xl p-4">
                  <input 
                    type="checkbox" 
                    id="randomize" 
                    checked={randomize} 
                    onChange={e => setRandomize(e.target.checked)} 
                    className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                  />
                  <div>
                    <label htmlFor="randomize" className="text-sm font-bold text-white cursor-pointer block">Randomize Questions</label>
                    <p className="text-xs text-slate-500">Shuffle questions and answers for each student.</p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-slate-400 hover:text-white font-bold rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="px-8 py-3 bg-amber-500 text-slate-950 rounded-xl font-bold hover:bg-amber-400 transition-colors">Save Exam</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
