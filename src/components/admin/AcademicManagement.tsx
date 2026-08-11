import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Plus, Edit2, Trash2, Globe, Eye, EyeOff, X } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { supabase } from '../../supabaseClient';

export default function AcademicManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isIrreversible, setIsIrreversible] = useState(false);
  const [actionCallback, setActionCallback] = useState<(() => Promise<void>) | null>(null);

  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: '', course_code: '', portal: 'Undergraduate', semester: 'First Semester', is_published: true, is_hidden: false, create_chat: false
  });

  useEffect(() => {
    fetchCourses();
    
    if (supabase) {
      const channel = supabase.channel('public:courses')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
          fetchCourses();
        })
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const fetchCourses = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: true });
      if (error) {
        // Table might not exist yet, ignore
      } else if (data) {
        setCourses(data);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleDangerousAction = (title: string, message: string, irreversible: boolean, callback: () => Promise<void>) => {
    setActionTitle(title);
    setActionMessage(message);
    setIsIrreversible(irreversible);
    setActionCallback(() => callback);
    setIsModalOpen(true);
  };

  const executeAction = async () => {
    if (actionCallback) {
      await actionCallback();
    }
    setIsModalOpen(false);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsSaving(true);
    try {
      const { create_chat, ...dbData } = courseForm;
      const savedCourseCode = dbData.course_code;
      const savedCourseTitle = dbData.title;

      if (editingCourse) {
        await supabase.from('courses').update(dbData).eq('id', editingCourse.id);
      } else {
        await supabase.from('courses').insert(dbData);
      }

      if (create_chat && savedCourseCode) {
        // Create chat group
        const { error: chatError } = await supabase.from('chat_rooms').insert({
          course_code: savedCourseCode,
          course_title: savedCourseTitle,
          portal: dbData.portal
        });
        if (chatError) console.error("Chat Creation Error", chatError);
      }

      setShowCourseModal(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCourse = async (id: string) => {
    if (!supabase) return;
    await supabase.from('courses').delete().eq('id', id);
    fetchCourses();
  };

  const togglePublish = async (course: any) => {
    if (!supabase) return;
    await supabase.from('courses').update({ is_published: !course.is_published }).eq('id', course.id);
    fetchCourses();
  };

  const toggleHide = async (course: any) => {
    if (!supabase) return;
    await supabase.from('courses').update({ is_hidden: !course.is_hidden }).eq('id', course.id);
    fetchCourses();
  };

  // Group by portal then semester (if applicable)
  const groupedCourses = useMemo(() => {
    const grouped: any = {};
    courses.forEach(c => {
      const portalKey = c.portal || 'Uncategorized';
      const semesterStr = c.semester ? ` - ${c.semester}` : '';
      const key = `${portalKey}${semesterStr}`;
      if (!grouped[key]) {
        grouped[key] = { portal: portalKey, semester: c.semester, subjects: [] };
      }
      grouped[key].subjects.push(c);
    });
    return Object.entries(grouped).map(([key, val]: any) => ({
      key,
      ...val
    }));
  }, [courses]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto relative"
    >
      <ConfirmationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={executeAction}
        title={actionTitle}
        message={actionMessage}
        isIrreversible={isIrreversible}
      />

      <AnimatePresence>
        {showCourseModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[#020617]/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-md my-auto shadow-2xl relative"
            >
              <button onClick={() => setShowCourseModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
              <h2 className="text-2xl font-display font-bold text-white mb-6">
                {editingCourse ? 'Edit Course' : 'Add Course'}
              </h2>
              <form onSubmit={handleSaveCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-poppins text-slate-400 mb-1">Course Title</label>
                  <input type="text" value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-poppins text-slate-400 mb-1">Course Code (Optional)</label>
                  <input type="text" value={courseForm.course_code} onChange={e => setCourseForm({...courseForm, course_code: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-poppins text-slate-400 mb-1">Portal</label>
                  <select value={courseForm.portal} onChange={e => setCourseForm({...courseForm, portal: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2">
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="UTME">UTME</option>
                    <option value="Post-UTME">Post-UTME</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-poppins text-slate-400 mb-1">Semester (Optional)</label>
                  <select value={courseForm.semester} onChange={e => setCourseForm({...courseForm, semester: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2">
                    <option value="">None</option>
                    <option value="First Semester">First Semester</option>
                    <option value="Second Semester">Second Semester</option>
                  </select>
                </div>
                <div className="flex items-center gap-4 py-2">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" checked={courseForm.is_published} onChange={e => setCourseForm({...courseForm, is_published: e.target.checked})} className="rounded bg-slate-800 border-slate-700 text-orange-500 focus:ring-orange-500" />
                    Published
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" checked={courseForm.is_hidden} onChange={e => setCourseForm({...courseForm, is_hidden: e.target.checked})} className="rounded bg-slate-800 border-slate-700 text-orange-500 focus:ring-orange-500" />
                    Hidden
                  </label>
                </div>
                {!editingCourse && (
                  <div className="pt-2">
                    <label className="flex items-center gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 cursor-pointer hover:bg-orange-500/20 transition-colors">
                      <input type="checkbox" checked={courseForm.create_chat} onChange={e => setCourseForm({...courseForm, create_chat: e.target.checked})} className="rounded bg-slate-800 border-slate-700 text-orange-500 focus:ring-orange-500 w-5 h-5" />
                      <div className="flex flex-col">
                        <span className="font-bold text-orange-400">Create Course Chat</span>
                        <span className="text-xs text-orange-500/70">Automatically setup a WhatsApp-style group for this course</span>
                      </div>
                    </label>
                  </div>
                )}
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowCourseModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
                  <button type="submit" disabled={isSaving} className="flex-1 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-900 font-bold transition-colors disabled:opacity-50">Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <BookOpen className="text-orange-400" size={28} /> Academic Management
          </h1>
          <p className="text-sm font-body text-slate-400">Manage portals, semesters, and course/subject structures.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCourse(null);
            setCourseForm({ title: '', course_code: '', portal: 'Undergraduate', semester: 'First Semester', is_published: true, is_hidden: false, create_chat: false });
            setShowCourseModal(true);
          }}
          className="bg-orange-500 hover:bg-orange-400 text-slate-950 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Add Course
        </button>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center text-slate-400 py-10">Loading courses...</div>
        ) : groupedCourses.length === 0 ? (
          <div className="text-center text-slate-400 py-10 bg-[#0f172a]/50 rounded-3xl border border-slate-800">
            No records found.
          </div>
        ) : groupedCourses.map((section, idx) => (
          <div key={idx} className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-slate-800/50 gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                  {section.key}
                </h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {section.subjects.map((sub: any) => (
                <div key={sub.id} className={`flex flex-col justify-between p-4 rounded-xl bg-[#020617]/50 border border-slate-800/50 group hover:border-orange-500/30 transition-colors ${sub.is_hidden ? 'opacity-60' : ''}`}>
                  <div className="mb-2">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      {sub.title}
                      {sub.is_hidden && <span title="Hidden"><EyeOff size={14} className="text-slate-500" /></span>}
                      {!sub.is_published && <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-medium">Draft</span>}
                    </h3>
                    {sub.course_code && <p className="text-xs text-slate-400">{sub.course_code}</p>}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    <button 
                      title={sub.is_published ? "Unpublish" : "Publish"}
                      className={`p-1.5 rounded-lg transition-colors ${sub.is_published ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                      onClick={() => togglePublish(sub)}
                    >
                      <Globe size={14} />
                    </button>
                    <button 
                      title={sub.is_hidden ? "Show" : "Hide"}
                      className={`p-1.5 rounded-lg transition-colors ${sub.is_hidden ? 'text-amber-400 hover:bg-amber-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                      onClick={() => toggleHide(sub)}
                    >
                      {sub.is_hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button 
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                      onClick={() => {
                        setEditingCourse(sub);
                        setCourseForm({
                          title: sub.title || '',
                          course_code: sub.course_code || '',
                          portal: sub.portal || 'Undergraduate',
                          semester: sub.semester || '',
                          is_published: sub.is_published,
                          is_hidden: sub.is_hidden,
                          create_chat: false
                        });
                        setShowCourseModal(true);
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      onClick={() => handleDangerousAction('Delete Course', `Are you sure you want to permanently delete ${sub.title}?`, true, () => deleteCourse(sub.id))}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
