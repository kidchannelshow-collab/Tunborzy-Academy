import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Plus, Edit2, Trash2, ChevronRight, X, Folder, Layers, FileText, ChevronLeft, Search, ArrowUp, ArrowDown, LayoutTemplate, Copy } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { supabase } from '../../supabaseClient';
import MaterialAdminDashboard from '../materials/MaterialAdminDashboard';
import LessonEditor from '../materials/LessonEditor';
import BulkLessonModal from './BulkLessonModal';
import CourseTemplatesModal from './CourseTemplatesModal';

export default function CourseManagement() {
  const [activeTab, setActiveTab] = useState<'courses' | 'content'>('courses');
  
  // Navigation State
  const [path, setPath] = useState<{
    level?: string;
    semester?: string;
    course?: { id: string, course_code: string, title: string };
    topic?: string;
  }>({});

  // DB State
  const [courses, setCourses] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Virtual Custom State (for empty levels/semesters/topics not yet in DB)
  const [customLevels, setCustomLevels] = useState<string[]>([]);
  const [customSemesters, setCustomSemesters] = useState<{level: string, name: string}[]>([]);
  const [customTopics, setCustomTopics] = useState<{course_code: string, name: string}[]>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isIrreversible, setIsIrreversible] = useState(false);
  const [actionCallback, setActionCallback] = useState<(() => Promise<void>) | null>(null);

  // Edit/Add Forms
  const [showFormModal, setShowFormModal] = useState(false);
  const [formType, setFormType] = useState<'level' | 'semester' | 'course' | 'topic'>('level');
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Lesson Editor State
  const [showLessonEditor, setShowLessonEditor] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  
  // Form States
  const [nameInput, setNameInput] = useState('');
  const [courseInput, setCourseInput] = useState({ 
    title: '', 
    course_code: '',
    status: 'Draft',
    visibility: 'Public',
    lecturer_id: ''
  });
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showBulkLessonModal, setShowBulkLessonModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [templateCourseToSave, setTemplateCourseToSave] = useState<any>(null);

  useEffect(() => {
    fetchData();
    if (supabase) {
      const channel1 = supabase.channel('public:courses').on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, fetchData).subscribe();
      const channel2 = supabase.channel('public:materials').on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, fetchData).subscribe();
      return () => {
        supabase.removeChannel(channel1);
        supabase.removeChannel(channel2);
      };
    }
  }, []);

  const fetchData = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const [coursesRes, materialsRes, lecturersRes] = await Promise.all([
        supabase.from('courses').select('*').order('order_index', { ascending: true }).order('created_at', { ascending: true }),
        supabase.from('materials').select('id, title, topic, course_code, order_index, description, is_published, file_type').order('order_index', { ascending: true }).order('created_at', { ascending: true }),
        supabase.from('profiles').select('id, full_name').ilike('role', 'lecturer')
      ]);
      if (lecturersRes.data) setLecturers(lecturersRes.data);
      if (coursesRes.data) setCourses(coursesRes.data);
      if (materialsRes.data) setMaterials(materialsRes.data);
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


  const handleDuplicateCourse = async (course: any) => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      // Create new course
      const newCourseCode = course.course_code + '_COPY_' + Math.floor(Math.random() * 10000);
      const { id, created_at, updated_at, ...restCourse } = course;
      const newCourse = {
        ...restCourse,
        title: `${course.title} (Copy)`,
        course_code: newCourseCode,
        status: 'Draft',
        visibility: 'Private'
      };
      await supabase.from('courses').insert([newCourse]);

      // Fetch materials
      const { data: mats } = await supabase.from('materials').select('*').eq('course_code', course.course_code);
      if (mats && mats.length > 0) {
        const newMats = mats.map((m: any) => {
          const { id: mid, created_at: mc, updated_at: mu, ...restMat } = m;
          
          let newDesc = restMat.description;
          try {
            const parsed = JSON.parse(newDesc || '{}');
            if (parsed.publishSettings) {
              parsed.publishSettings.status = 'Draft';
              parsed.publishSettings.auditLogs = [];
            }
            newDesc = JSON.stringify(parsed);
          } catch(e) {}

          return {
            ...restMat,
            course_code: newCourseCode,
            is_published: false,
            description: newDesc
          };
        });
        await supabase.from('materials').insert(newMats);
      }
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Error duplicating course');
    }
    setIsLoading(false);
  };

  const handleDuplicateTopic = async (topicName: string, courseCode: string) => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data: mats } = await supabase.from('materials').select('*').eq('course_code', courseCode).eq('topic', topicName);
      if (mats && mats.length > 0) {
        const newTopicName = `${topicName} (Copy)`;
        const newMats = mats.map((m: any) => {
          const { id: mid, created_at: mc, updated_at: mu, ...restMat } = m;
          
          let newDesc = restMat.description;
          try {
            const parsed = JSON.parse(newDesc || '{}');
            if (parsed.publishSettings) {
              parsed.publishSettings.status = 'Draft';
              parsed.publishSettings.auditLogs = [];
            }
            newDesc = JSON.stringify(parsed);
          } catch(e) {}

          return {
            ...restMat,
            topic: newTopicName,
            is_published: false,
            description: newDesc
          };
        });
        await supabase.from('materials').insert(newMats);
      } else {
        // If empty topic (custom topic), just add it to state
        setCustomTopics([...customTopics, { course_code: courseCode, name: `${topicName} (Copy)` }]);
      }
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Error duplicating topic');
    }
    setIsLoading(false);
  };


  const handleReorder = async (table: string, currentItems: any[], index: number, direction: 'up' | 'down') => {
    if (!supabase) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentItems.length) return;

    setIsLoading(true);
    try {
      // Ensure all items have sequential order_index first (in memory)
      const itemsToUpdate = [...currentItems].map((item, i) => ({ ...item, order_index: item.order_index || i }));
      
      // Swap
      const tempOrder = itemsToUpdate[index].order_index;
      itemsToUpdate[index].order_index = itemsToUpdate[targetIndex].order_index;
      itemsToUpdate[targetIndex].order_index = tempOrder;

      // Update the two items in DB
      const item1 = itemsToUpdate[index];
      const item2 = itemsToUpdate[targetIndex];

      if (table === 'courses' || table === 'materials') {
        await Promise.all([
          supabase.from(table).update({ order_index: item1.order_index }).eq('id', item1.id),
          supabase.from(table).update({ order_index: item2.order_index }).eq('id', item2.id)
        ]);
      } else if (table === 'topics') {
        // Topic reorder: We need to update ALL materials in that topic to the new order index?
        // Actually, topics don't have their own table. We group by topic. We can't reorder topics easily without a Topics table unless we update ALL materials in that topic to share an order_index.
        // For simplicity, let's just update ALL materials in that topic to the new topic order.
        await Promise.all([
          supabase.from('materials').update({ order_index: item1.order_index }).eq('course_code', path.course!.course_code).eq('topic', item1.name),
          supabase.from('materials').update({ order_index: item2.order_index }).eq('course_code', path.course!.course_code).eq('topic', item2.name)
        ]);
      }
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Error reordering');
    }
    setIsLoading(false);
  };

  const handleDuplicateLesson = async (lesson: any) => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data: fullLesson } = await supabase.from('materials').select('*').eq('id', lesson.id).single();
      if (!fullLesson) return;
      
      let newDescription = fullLesson.description;
      try {
        const parsed = JSON.parse(newDescription);
        if (parsed.publishSettings) {
          parsed.publishSettings.status = 'Draft';
          parsed.publishSettings.auditLogs = [];
          newDescription = JSON.stringify(parsed);
        }
      } catch(e) {}

      const { id, created_at, updated_at, ...rest } = fullLesson;
      const copy = {
        ...rest,
        title: `${rest.title} (Copy)`,
        is_published: false,
        description: newDescription
      };
      
      await supabase.from('materials').insert([copy]);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Error duplicating lesson');
    }
    setIsLoading(false);
  };

  const executeAction = async () => {
    if (actionCallback) await actionCallback();
    setIsModalOpen(false);
  };

  // Derived Data
  const levels = useMemo(() => {
    const dbLevels = Array.from(new Set(courses.map(c => c.portal).filter(Boolean)));
    return Array.from(new Set([...dbLevels, ...customLevels]));
  }, [courses, customLevels]);

  const semesters = useMemo(() => {
    if (!path.level) return [];
    const dbSemesters = Array.from(new Set(courses.filter(c => c.portal === path.level).map(c => c.semester).filter(Boolean)));
    const custom = customSemesters.filter(s => s.level === path.level).map(s => s.name);
    return Array.from(new Set([...dbSemesters, ...custom]));
  }, [courses, customSemesters, path.level]);

  const currentCourses = useMemo(() => {
    if (!path.level || !path.semester) return [];
    return courses.filter(c => c.portal === path.level && c.semester === path.semester);
  }, [courses, path.level, path.semester]);

  const topics = useMemo(() => {
    if (!path.course) return [];
    const dbTopics = Array.from(new Set(materials.filter(m => m.course_code === path.course!.course_code).map(m => m.topic).filter(Boolean)));
    const custom = customTopics.filter(t => t.course_code === path.course!.course_code).map(t => t.name);
    return Array.from(new Set([...dbTopics, ...custom]));
  }, [materials, customTopics, path.course]);

  const lessons = useMemo(() => {
    if (!path.course || !path.topic) return [];
    return materials.filter(m => m.course_code === path.course!.course_code && m.topic === path.topic);
  }, [materials, path.course, path.topic]);

  // Filtering
  const getFilteredList = (list: any[]) => {
    if (!searchQuery) return list;
    return list.filter(item => {
      if (typeof item === 'string') return item.toLowerCase().includes(searchQuery.toLowerCase());
      if (item.title) return item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.course_code?.toLowerCase().includes(searchQuery.toLowerCase());
      return false;
    });
  };

  // Actions
  const openForm = (type: 'level' | 'semester' | 'course' | 'topic', item: any = null) => {
    setFormType(type);
    setEditingItem(item);
    if (type === 'course') {
      if (item) setCourseInput({ title: item.title, course_code: item.course_code, status: item.status || 'Draft', visibility: item.visibility || 'Public', lecturer_id: item.lecturer_id || '' });
      else setCourseInput({ title: '', course_code: '', status: 'Draft', visibility: 'Public', lecturer_id: '' });
    } else {
      setNameInput(item || '');
    }
    setShowFormModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsSaving(true);
    try {
      if (formType === 'level') {
        if (editingItem) {
          await supabase.from('courses').update({ portal: nameInput }).eq('portal', editingItem);
          setCustomLevels(prev => prev.map(l => l === editingItem ? nameInput : l));
        } else {
          setCustomLevels(prev => [...prev, nameInput]);
        }
      } else if (formType === 'semester') {
        if (editingItem) {
          await supabase.from('courses').update({ semester: nameInput }).eq('semester', editingItem).eq('portal', path.level);
          setCustomSemesters(prev => prev.map(s => s.level === path.level && s.name === editingItem ? { ...s, name: nameInput } : s));
        } else {
          setCustomSemesters(prev => [...prev, { level: path.level!, name: nameInput }]);
        }
      } else if (formType === 'course') {
        if (editingItem) {
          if (courseInput.status === 'Published' && editingItem.status !== 'Published') {
            // Simulate sending notifications
            setTimeout(() => {
              alert(`Notification sent to enrolled students: "${courseInput.title}" is now available!`);
            }, 500);
          }
          const updatePayload = { ...courseInput };
          if (!updatePayload.lecturer_id) updatePayload.lecturer_id = null;
          await supabase.from('courses').update(updatePayload).eq('id', editingItem.id);
        } else {
          if (courseInput.status === 'Published') {
            setTimeout(() => {
              alert(`Notification sent to enrolled students: "${courseInput.title}" is now available!`);
            }, 500);
          }
          const payload = { ...courseInput, portal: path.level, semester: path.semester };
          if (!payload.lecturer_id) payload.lecturer_id = null;
          await supabase.from('courses').insert(payload);
        }
      } else if (formType === 'topic') {
        if (editingItem) {
          await supabase.from('materials').update({ topic: nameInput }).eq('topic', editingItem).eq('course_code', path.course!.course_code);
          setCustomTopics(prev => prev.map(t => t.course_code === path.course!.course_code && t.name === editingItem ? { ...t, name: nameInput } : t));
        } else {
          setCustomTopics(prev => [...prev, { course_code: path.course!.course_code, name: nameInput }]);
        }
      }
      setShowFormModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
    setIsSaving(false);
  };

  const handleDelete = async (type: string, item: any) => {
    if (!supabase) return;
    try {
      if (type === 'level') {
        await supabase.from('courses').delete().eq('portal', item);
        setCustomLevels(prev => prev.filter(l => l !== item));
      } else if (type === 'semester') {
        await supabase.from('courses').delete().eq('semester', item).eq('portal', path.level);
        setCustomSemesters(prev => prev.filter(s => !(s.level === path.level && s.name === item)));
      } else if (type === 'course') {
        await supabase.from('courses').delete().eq('id', item.id);
      } else if (type === 'topic') {
        await supabase.from('materials').delete().eq('topic', item).eq('course_code', path.course!.course_code);
        setCustomTopics(prev => prev.filter(t => !(t.course_code === path.course!.course_code && t.name === item)));
      } else if (type === 'lesson') {
        await supabase.from('materials').delete().eq('id', item.id);
      }
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={executeAction} title={actionTitle} message={actionMessage} isIrreversible={isIrreversible} />

      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white capitalize">{editingItem ? 'Edit' : 'Add'} {formType}</h3>
                <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                {formType === 'course' ? (
                  <>
                    <div>
                      <label className="block text-sm font-poppins text-slate-400 mb-1">Course Title</label>
                      <input type="text" value={courseInput.title} onChange={e => setCourseInput({...courseInput, title: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2" required />
                    </div>
                    <div>
                      <label className="block text-sm font-poppins text-slate-400 mb-1">Course Code</label>
                      <input type="text" value={courseInput.course_code} onChange={e => setCourseInput({...courseInput, course_code: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2" required />
                    </div>
                    <div>
                      <label className="block text-sm font-poppins text-slate-400 mb-1">Assign Lecturer (Optional)</label>
                      <select value={courseInput.lecturer_id || ''} onChange={e => setCourseInput({...courseInput, lecturer_id: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2">
                        <option value="">No Lecturer Assigned</option>
                        {lecturers.map(l => (
                          <option key={l.id} value={l.id}>{l.full_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-poppins text-slate-400 mb-1">Publication Status</label>
                      <select value={courseInput.status} onChange={e => setCourseInput({...courseInput, status: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2" required>
                        <option value="Draft">Draft</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Published">Published</option>
                        <option value="Archived">Archived</option>
                        <option value="Hidden">Hidden</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-poppins text-slate-400 mb-1">Visibility Rules</label>
                      <select value={courseInput.visibility} onChange={e => setCourseInput({...courseInput, visibility: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2" required>
                        <option value="Public">Public (Visible to everyone)</option>
                        <option value="Undergraduate Only">Undergraduate Students Only</option>
                        <option value="Selected Departments">Selected Departments</option>
                        <option value="Selected Faculties">Selected Faculties</option>
                        <option value="Selected Levels">Selected Levels</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">{formType.charAt(0).toUpperCase() + formType.slice(1)} Name</label>
                    <input type="text" value={nameInput} onChange={e => setNameInput(e.target.value)} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2" required />
                  </div>
                )}
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowFormModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
                  <button type="submit" disabled={isSaving} className="flex-1 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold transition-colors disabled:opacity-50">Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <BookOpen className="text-orange-400" size={28} /> Course Management
          </h1>
          <p className="text-sm font-body text-slate-400">Hierarchical course curriculum and materials management.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('courses')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'courses' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>Hierarchy</button>
          <button onClick={() => setActiveTab('content')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'content' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>Legacy Materials</button>
        </div>
      </div>

      {activeTab === 'content' ? (
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
          <MaterialAdminDashboard />
        </div>
      ) : (
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 min-h-[500px] flex flex-col">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mb-6 text-sm text-slate-400 overflow-x-auto pb-2 custom-scrollbar">
            <button onClick={() => { setPath({}); setSearchQuery(''); }} className={`whitespace-nowrap hover:text-white transition-colors ${!path.level ? 'text-indigo-400 font-bold' : ''}`}>Levels</button>
            {path.level && (
              <>
                <ChevronRight size={14} className="flex-shrink-0" />
                <button onClick={() => { setPath({ level: path.level }); setSearchQuery(''); }} className={`whitespace-nowrap hover:text-white transition-colors ${!path.semester ? 'text-indigo-400 font-bold' : ''}`}>{path.level}</button>
              </>
            )}
            {path.semester && (
              <>
                <ChevronRight size={14} className="flex-shrink-0" />
                <button onClick={() => { setPath({ level: path.level, semester: path.semester }); setSearchQuery(''); }} className={`whitespace-nowrap hover:text-white transition-colors ${!path.course ? 'text-indigo-400 font-bold' : ''}`}>{path.semester}</button>
              </>
            )}
            {path.course && (
              <>
                <ChevronRight size={14} className="flex-shrink-0" />
                <button onClick={() => { setPath({ level: path.level, semester: path.semester, course: path.course }); setSearchQuery(''); }} className={`whitespace-nowrap hover:text-white transition-colors ${!path.topic ? 'text-indigo-400 font-bold' : ''}`}>{path.course.course_code}</button>
              </>
            )}
            {path.topic && (
              <>
                <ChevronRight size={14} className="flex-shrink-0" />
                <span className="whitespace-nowrap text-indigo-400 font-bold">{path.topic}</span>
              </>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm"
              />
            </div>
            {!path.topic ? (
              <button 
                onClick={() => openForm(path.course ? 'topic' : path.semester ? 'course' : path.level ? 'semester' : 'level')}
                className="w-full sm:w-auto bg-orange-500 hover:bg-orange-400 text-slate-950 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add {path.course ? 'Topic' : path.semester ? 'Course' : path.level ? 'Semester' : 'Level'}
              </button>
            ) : (
              <button 
                onClick={() => { setEditingLesson(null); setShowLessonEditor(true); }}
                className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Create Lesson
              </button>
            )}
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="text-center text-slate-400 py-10">Loading hierarchy...</div>
            ) : (
              <div className="space-y-3">
                {/* LEVELS */}
                {!path.level && (
                  getFilteredList(levels).length === 0 ? (
                    <div className="text-center text-slate-500 py-10 bg-[#020617]/50 rounded-xl border border-slate-800 border-dashed">No levels found.</div>
                  ) : getFilteredList(levels).map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[#020617]/50 border border-slate-800/50 hover:border-indigo-500/30 transition-colors group">
                      <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setPath({ level: item })}>
                        <Layers className="text-indigo-400" size={20} />
                        <span className="font-bold text-white">{item}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openForm('level', item)} className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => handleDangerousAction('Delete Level', `Are you sure you want to delete ${item}? This will delete all courses within it.`, true, () => handleDelete('level', item))} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))
                )}

                {/* SEMESTERS */}
                {path.level && !path.semester && (
                  getFilteredList(semesters).length === 0 ? (
                    <div className="text-center text-slate-500 py-10 bg-[#020617]/50 rounded-xl border border-slate-800 border-dashed">No semesters found.</div>
                  ) : getFilteredList(semesters).map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[#020617]/50 border border-slate-800/50 hover:border-indigo-500/30 transition-colors group">
                      <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setPath({ ...path, semester: item })}>
                        <Folder className="text-indigo-400" size={20} />
                        <span className="font-bold text-white">{item}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openForm('semester', item)} className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => handleDangerousAction('Delete Semester', `Are you sure you want to delete ${item}? This will delete all courses within it.`, true, () => handleDelete('semester', item))} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))
                )}

                {/* COURSES */}
                {path.semester && !path.course && (
                  getFilteredList(currentCourses).length === 0 ? (
                    <div className="text-center text-slate-500 py-10 bg-[#020617]/50 rounded-xl border border-slate-800 border-dashed">No courses found.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {getFilteredList(currentCourses).map((course, i) => (
                        <div key={i} className="flex flex-col justify-between p-4 rounded-xl bg-[#020617]/50 border border-slate-800/50 hover:border-indigo-500/30 transition-colors group">
                          <div className="mb-4 cursor-pointer" onClick={() => setPath({ ...path, course })}>
                            <h3 className="font-bold text-white mb-1 line-clamp-2">{course.title}</h3>
                            <p className="text-xs text-slate-400 font-mono bg-slate-800/50 inline-block px-2 py-0.5 rounded">{course.course_code}</p>
                          </div>
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {i > 0 && <button onClick={(e) => { e.stopPropagation(); handleReorder('courses', getFilteredList(currentCourses), i, 'up'); }} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><ArrowUp size={16} /></button>}
                            {i < getFilteredList(currentCourses).length - 1 && <button onClick={(e) => { e.stopPropagation(); handleReorder('courses', getFilteredList(currentCourses), i, 'down'); }} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><ArrowDown size={16} /></button>}
                            <button onClick={(e) => { e.stopPropagation(); setTemplateCourseToSave(course); setShowTemplatesModal(true); }} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg" title="Save as Template"><LayoutTemplate size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDangerousAction('Duplicate Course', `Are you sure you want to duplicate ${course.course_code}?`, false, () => handleDuplicateCourse(course)); }} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg" title="Duplicate"><Copy size={16} /></button>
                            <button onClick={() => openForm('course', course)} className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg"><Edit2 size={16} /></button>
                            <button onClick={() => handleDangerousAction('Delete Course', `Are you sure you want to delete ${course.course_code}?`, true, () => handleDelete('course', course))} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* TOPICS */}
                {path.course && !path.topic && (
                  getFilteredList(topics).length === 0 ? (
                    <div className="text-center text-slate-500 py-10 bg-[#020617]/50 rounded-xl border border-slate-800 border-dashed">No topics found.</div>
                  ) : getFilteredList(topics).map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[#020617]/50 border border-slate-800/50 hover:border-indigo-500/30 transition-colors group">
                      <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setPath({ ...path, topic: item })}>
                        <FileText className="text-indigo-400" size={20} />
                        <span className="font-bold text-white">{item}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {i > 0 && <button onClick={(e) => { e.stopPropagation(); handleReorder('topics', getFilteredList(topics).map((t, idx) => ({ name: t, order_index: materials.find(m => m.topic === t)?.order_index || idx })), i, 'up'); }} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><ArrowUp size={16} /></button>}
                        {i < getFilteredList(topics).length - 1 && <button onClick={(e) => { e.stopPropagation(); handleReorder('topics', getFilteredList(topics).map((t, idx) => ({ name: t, order_index: materials.find(m => m.topic === t)?.order_index || idx })), i, 'down'); }} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><ArrowDown size={16} /></button>}
                        <button onClick={() => handleDangerousAction('Duplicate Topic', `Are you sure you want to duplicate "${item}" and all its lessons?`, false, () => handleDuplicateTopic(item, path.course!.course_code))} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg" title="Duplicate"><Copy size={16} /></button>
                        <button onClick={() => openForm('topic', item)} className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => handleDangerousAction('Delete Topic', `Are you sure you want to delete this topic and its lessons?`, true, () => handleDelete('topic', item))} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))
                )}

                {/* LESSONS */}
                {path.topic && (
                  getFilteredList(lessons).length === 0 ? (
                    <div className="text-center flex flex-col items-center justify-center py-16 bg-[#020617]/50 rounded-xl border border-slate-800 border-dashed">
                      <FileText size={48} className="text-slate-700 mb-4" />
                      <p className="text-slate-400 font-medium mb-1">No lessons yet.</p>
                      <div className="mt-4 flex gap-3">
                        <button onClick={() => { setEditingLesson(null); setShowLessonEditor(true); }} className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-xl text-sm font-bold">Create Lesson</button>
                        <button onClick={() => setShowBulkLessonModal(true)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Layers size={16} /> Bulk Create</button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {getFilteredList(lessons).map((lesson, i) => (
                        <div key={i} className="flex flex-col justify-between p-4 rounded-xl bg-[#020617]/50 border border-slate-800/50 hover:border-indigo-500/30 transition-colors group">
                          <div className="mb-4 cursor-pointer" onClick={() => { setEditingLesson(lesson); setShowLessonEditor(true); }}>
                            <div className={`mb-3 inline-block text-xs font-medium px-2 py-0.5 rounded ${lesson.is_published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              {lesson.is_published ? 'Published' : 'Draft'}
                            </div>
                            <h3 className="font-bold text-white mb-1 line-clamp-2">{lesson.title || 'Untitled Lesson'}</h3>
                          </div>
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {i > 0 && <button onClick={(e) => { e.stopPropagation(); handleReorder('materials', getFilteredList(lessons), i, 'up'); }} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><ArrowUp size={16} /></button>}
                            {i < getFilteredList(lessons).length - 1 && <button onClick={(e) => { e.stopPropagation(); handleReorder('materials', getFilteredList(lessons), i, 'down'); }} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><ArrowDown size={16} /></button>}
                            <button onClick={() => handleDangerousAction('Duplicate Lesson', `Are you sure you want to duplicate "${lesson.title}"?`, false, () => handleDuplicateLesson(lesson))} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg" title="Duplicate"><Copy size={16} /></button>
                            <button onClick={() => { setEditingLesson(lesson); setShowLessonEditor(true); }} className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg"><Edit2 size={16} /></button>
                            <button onClick={() => handleDangerousAction('Delete Lesson', `Are you sure you want to delete ${lesson.title}?`, true, () => handleDelete('lesson', lesson))} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showBulkLessonModal && (
        <BulkLessonModal
          courseCode={path.course!.course_code}
          topic={path.topic!}
          onClose={() => setShowBulkLessonModal(false)}
          onSuccess={() => { setShowBulkLessonModal(false); fetchData(); }}
        />
      )}
      {showTemplatesModal && (
        <CourseTemplatesModal
          courseToSave={templateCourseToSave}
          onClose={() => setShowTemplatesModal(false)}
          onSuccess={() => { setShowTemplatesModal(false); fetchData(); }}
        />
      )}
      <AnimatePresence>
        {showLessonEditor && (
          <LessonEditor 
            courseCode={path.course!.course_code}
            topic={path.topic!}
            portal={path.level!}
            semester={path.semester!}
            lesson={editingLesson}
            onClose={() => setShowLessonEditor(false)}
            onSaved={() => {
              setShowLessonEditor(false);
              fetchData();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
