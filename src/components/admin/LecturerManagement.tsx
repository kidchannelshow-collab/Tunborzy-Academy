import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCog, Plus, Search, Edit2, Trash2, BookOpen, Eye, X, Mail, Phone, Book, GraduationCap, Clock, FileText, ChevronLeft, ChevronRight, UserCheck, UserX, Key } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { supabase } from '../../supabaseClient';


export default function LecturerManagement() {
  const [filterOption, setFilterOption] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', isIrreversible: false, onConfirm: async () => {} });
  
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  // Modals
  const [viewLecturer, setViewLecturer] = useState<any>(null);
  const [editLecturer, setEditLecturer] = useState<any>(null);
  const [assignMaterialLecturer, setAssignMaterialLecturer] = useState<any>(null);
  const [materialForm, setMaterialForm] = useState({ type: 'PDF', url: '', title: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Add Form State
  const [addForm, setAddForm] = useState({
    full_name: '', email: '', password: '', department: '', faculty: '', phone_number: '', assigned_courses: '', assigned_subjects: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchLecturers();

    const channel = supabase?.channel('public:profiles_lecturers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        fetchLecturers(); // Re-fetch to ensure we have the latest (could be optimized)
      })
      .subscribe();

    return () => {
      if (channel) supabase?.removeChannel(channel);
    };
  }, []);

  const fetchLecturers = async () => {
    if (!supabase) return;
    setIsLoading(true);
    const { data, error } = await supabase.from('profiles')
      .select('*')
      .ilike('role', 'lecturer')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.log("Error fetching lecturers:", error);
      showNotification(error.message || String(error), 'error');
    } else if (data) {
      setLecturers(data);
    }
    setIsLoading(false);
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const confirmAction = (title: string, message: string, irreversible: boolean, action: () => Promise<void>) => {
    setConfirmConfig({
      title,
      message,
      isIrreversible: irreversible,
      onConfirm: async () => {
        try {
          await action();
        } catch (err: any) {
          console.log("Action error:", err);
          showNotification(err.message || String(err), 'error');
        }
      }
    });
    setIsConfirmModalOpen(true);
  };

  const handleResetPassword = (lecturer: any) => {
    confirmAction('Reset Password', `Send password reset email to ${lecturer.email}?`, false, async () => {
      if (!supabase) throw new Error('Supabase client is not initialized');
      const { error } = await supabase.auth.resetPasswordForEmail(lecturer.email);
      if (error) throw error;
      showNotification(`Password reset email sent to ${lecturer.email}`, 'success');
    });
  };

  const handleToggleStatus = (lecturer: any, newStatus: string) => {
    const actionText = newStatus === 'Active' ? (lecturer.status === 'Suspended' ? 'Reactivate' : 'Enable') : (newStatus === 'Suspended' ? 'Suspend' : 'Disable');
    confirmAction(`${actionText} Lecturer`, `Are you sure you want to ${actionText.toLowerCase()} ${lecturer.full_name}?`, false, async () => {
      if (!supabase) throw new Error('Supabase client is not initialized');
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', lecturer.id);
      if (error) throw error;
      showNotification(`Lecturer account ${newStatus.toLowerCase()} successfully`, 'success');
      fetchLecturers();
    });
  };

  const handleDeleteLecturer = (lecturer: any) => {
    confirmAction('Delete Lecturer', `Are you sure you want to permanently delete ${lecturer.full_name}?`, true, async () => {
      if (!supabase) throw new Error('Supabase client is not initialized');
      const { error } = await supabase.from('profiles').delete().eq('id', lecturer.id);
      if (error) throw error;
      showNotification(`Lecturer deleted successfully`, 'success');
      fetchLecturers();
    });
  };

  const handleAddLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (!supabase) throw new Error('Supabase client is not initialized');

      // Provisioned via the Edge Function, using the service role key server-side.
      // This does NOT touch the calling admin's browser session — the previous
      // client-side supabase.auth.signUp call here silently logged the admin out
      // and signed them in as the new lecturer instead.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your session has expired. Please log in again.');

      const { data: fnData, error: fnError } = await supabase.functions.invoke('admin-provision-user', {
        body: {
          action: 'add-lecturer',
          full_name: addForm.full_name,
          email: addForm.email,
          password: addForm.password,
          department: addForm.department,
          faculty: addForm.faculty,
          phone_number: addForm.phone_number,
          assigned_courses: addForm.assigned_courses.split(',').map(s => s.trim()).filter(Boolean),
          assigned_subjects: addForm.assigned_subjects.split(',').map(s => s.trim()).filter(Boolean),
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnData?.error) {
        throw new Error(fnData.error);
      }
      if (fnError) {
        let actualError = fnError.message;
        if (fnError.context && typeof fnError.context.json === 'function') {
           try {
             const errData = await fnError.context.json();
             actualError = errData.error || actualError;
           } catch(e) {}
        }
        throw new Error(actualError);
      }

      showNotification("Lecturer created successfully.", 'success');
      setShowAddModal(false);
      setAddForm({ full_name: '', email: '', password: '', department: '', faculty: '', phone_number: '', assigned_courses: '', assigned_subjects: '' });
      fetchLecturers();
    } catch (err: any) {
      console.log("Error adding lecturer:", err);
      showNotification(err.message || String(err), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  
  const handleAssignMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignMaterialLecturer) return;
    setIsSaving(true);
    try {
      if (!supabase) throw new Error('Supabase client is not initialized');
      // Append to assigned_materials
      const existing = assignMaterialLecturer.assigned_materials || [];
      const updated = [...existing, materialForm];
      
      const { error } = await supabase.from('profiles').update({
        assigned_materials: updated
      }).eq('id', assignMaterialLecturer.id);
      
      if (error) throw error;
      
      showNotification("Material assigned successfully", 'success');
      setAssignMaterialLecturer(null);
      setMaterialForm({ type: 'PDF', url: '', title: '' });
      fetchLecturers();
    } catch (err: any) {
      console.log("Error assigning material:", err);
      showNotification(err.message || String(err), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLecturer) return;
    setIsSaving(true);
    
    try {
      if (!supabase) throw new Error('Supabase client is not initialized');
      const { id, full_name, department, faculty, phone_number, assigned_courses, assigned_subjects, status } = editLecturer;
      
      const coursesArray = typeof assigned_courses === 'string' ? assigned_courses.split(',').map((s:string) => s.trim()).filter(Boolean) : assigned_courses;
      const subjectsArray = typeof assigned_subjects === 'string' ? assigned_subjects.split(',').map((s:string) => s.trim()).filter(Boolean) : assigned_subjects;
      
      const { error } = await supabase.from('profiles').update({
        full_name, department, faculty, phone_number, assigned_courses: coursesArray, assigned_subjects: subjectsArray, status
      }).eq('id', id);
      
      if (error) throw error;
      
      showNotification("Lecturer profile updated", 'success');
      setEditLecturer(null);
      fetchLecturers();
    } catch (err: any) {
      console.log("Error saving lecturer:", err);
      showNotification(err.message || String(err), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter & Search Logic
    const filteredLecturers = useMemo(() => {
    let result = lecturers;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        (l.full_name || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.department || '').toLowerCase().includes(q) ||
        (l.faculty || '').toLowerCase().includes(q) ||
        (l.student_id || '').toLowerCase().includes(q) ||
        (l.role || '').toLowerCase().includes(q) ||
        (l.assigned_courses || []).some((c) => c.toLowerCase().includes(q))
      );
    }

    if (filterOption !== 'All') {
      if (filterOption === 'Active') {
        result = result.filter(l => l.status === 'Active' || !l.status);
      } else if (filterOption === 'Inactive') {
        result = result.filter(l => l.status === 'Inactive' || l.status === 'Suspended' || l.status === 'Disabled');
      } else if (filterOption === 'Recently Added') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        result = result.filter(l => new Date(l.created_at) > thirtyDaysAgo);
      }
    }

    return result;
  }, [lecturers, searchQuery, filterOption]);

  const totalPages = Math.ceil(filteredLecturers.length / itemsPerPage) || 1;
  const paginatedLecturers = filteredLecturers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Dynamic filter options based on available departments and faculties
  const dynamicFilters = useMemo(() => {
    const filters = new Set(['All', 'Active', 'Disabled', 'Recently Added']);
    lecturers.forEach(l => {
      if (l.department) filters.add(l.department);
      if (l.faculty) filters.add(l.faculty);
    });
    return Array.from(filters);
  }, [lecturers]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto relative"
    >
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-[200] px-6 py-3 rounded-xl shadow-2xl border flex items-center gap-3 ${
              notification.type === 'success' 
                ? 'bg-emerald-900/90 border-emerald-500 text-emerald-100' 
                : 'bg-rose-900/90 border-rose-500 text-rose-100'
            }`}
          >
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => {
          confirmConfig.onConfirm();
          setIsConfirmModalOpen(false);
        }}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isIrreversible={confirmConfig.isIrreversible}
      />

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[#020617]/80 backdrop-blur-sm overflow-y-auto py-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-2xl my-auto shadow-2xl relative"
            >
              <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
              <h2 className="text-2xl font-display font-bold text-white mb-6">Add New Lecturer</h2>
              
              <form onSubmit={handleAddLecturer} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Full Name</label>
                    <input type="text" value={addForm.full_name} onChange={(e) => setAddForm({...addForm, full_name: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-emerald-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Email</label>
                    <input type="email" value={addForm.email} onChange={(e) => setAddForm({...addForm, email: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-emerald-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Temporary Password</label>
                    <input type="password" value={addForm.password} onChange={(e) => setAddForm({...addForm, password: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-emerald-500 outline-none" required minLength={6} />
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Phone Number</label>
                    <input type="text" value={addForm.phone_number} onChange={(e) => setAddForm({...addForm, phone_number: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Department</label>
                    <input type="text" value={addForm.department} onChange={(e) => setAddForm({...addForm, department: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Faculty</label>
                    <input type="text" value={addForm.faculty} onChange={(e) => setAddForm({...addForm, faculty: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-emerald-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Assigned Courses (comma separated)</label>
                    <input type="text" value={addForm.assigned_courses} onChange={(e) => setAddForm({...addForm, assigned_courses: e.target.value})} placeholder="e.g. MTH101, PHY101" className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-emerald-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Assigned Subjects (comma separated)</label>
                    <input type="text" value={addForm.assigned_subjects} onChange={(e) => setAddForm({...addForm, assigned_subjects: e.target.value})} placeholder="e.g. Mathematics (UTME), Physics (UTME)" className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-emerald-500 outline-none" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving} className="flex-1 py-3 px-4 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-900 transition-colors disabled:opacity-50">
                    {isSaving ? 'Creating...' : 'Create Lecturer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editLecturer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[#020617]/80 backdrop-blur-sm overflow-y-auto py-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-2xl my-auto shadow-2xl relative"
            >
              <button onClick={() => setEditLecturer(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
              <h2 className="text-2xl font-display font-bold text-white mb-6">Edit Lecturer Profile</h2>
              
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Full Name</label>
                    <input type="text" value={editLecturer.full_name || ''} onChange={(e) => setEditLecturer({...editLecturer, full_name: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-emerald-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Phone Number</label>
                    <input type="text" value={editLecturer.phone_number || ''} onChange={(e) => setEditLecturer({...editLecturer, phone_number: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Department</label>
                    <input type="text" value={editLecturer.department || ''} onChange={(e) => setEditLecturer({...editLecturer, department: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Faculty</label>
                    <input type="text" value={editLecturer.faculty || ''} onChange={(e) => setEditLecturer({...editLecturer, faculty: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Account Status</label>
                    <select value={editLecturer.status || 'Active'} onChange={(e) => setEditLecturer({...editLecturer, status: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-emerald-500 outline-none">
                      <option value="Active">Active</option>
                      <option value="Disabled">Disabled</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Assigned Courses (comma separated)</label>
                    <input type="text" value={Array.isArray(editLecturer.assigned_courses) ? editLecturer.assigned_courses.join(', ') : editLecturer.assigned_courses || ''} onChange={(e) => setEditLecturer({...editLecturer, assigned_courses: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-emerald-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Assigned Subjects (comma separated)</label>
                    <input type="text" value={Array.isArray(editLecturer.assigned_subjects) ? editLecturer.assigned_subjects.join(', ') : editLecturer.assigned_subjects || ''} onChange={(e) => setEditLecturer({...editLecturer, assigned_subjects: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-emerald-500 outline-none" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setEditLecturer(null)} className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving} className="flex-1 py-3 px-4 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-900 transition-colors disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      
      {/* Assign Material Modal */}
      <AnimatePresence>
        {assignMaterialLecturer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[#020617]/80 backdrop-blur-sm overflow-y-auto py-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-xl my-auto shadow-2xl relative"
            >
              <button onClick={() => setAssignMaterialLecturer(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
              <h2 className="text-2xl font-display font-bold text-white mb-6">Assign Material to {assignMaterialLecturer.full_name}</h2>
              
              <form onSubmit={handleAssignMaterial} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Material Type</label>
                    <select value={materialForm.type} onChange={(e) => setMaterialForm({...materialForm, type: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-blue-500 outline-none">
                      <option value="PDF">PDF Document</option>
                      <option value="Chat">Live Chat</option>
                      <option value="Practice Test">Practice Test</option>
                      <option value="CBT Exam">CBT Exam</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Title</label>
                    <input type="text" value={materialForm.title} onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">URL / Link</label>
                    <input type="text" value={materialForm.url} onChange={(e) => setMaterialForm({...materialForm, url: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-blue-500 outline-none" required />
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setAssignMaterialLecturer(null)} className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving} className="flex-1 py-3 px-4 rounded-xl font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50">
                    {isSaving ? 'Assigning...' : 'Assign Material'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {viewLecturer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[#020617]/80 backdrop-blur-sm overflow-y-auto py-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-2xl my-auto shadow-2xl relative"
            >
              <button onClick={() => setViewLecturer(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
              <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl font-bold text-emerald-400 uppercase">
                  {(viewLecturer.full_name || 'L').charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">{viewLecturer.full_name}</h2>
                  <p className="text-slate-400 flex items-center gap-2 mt-1"><Mail size={14}/> {viewLecturer.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 mb-8">
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Book size={14}/> Department</p><p className="text-white font-medium">{viewLecturer.department || '-'}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><GraduationCap size={14}/> Faculty</p><p className="text-white font-medium">{viewLecturer.faculty || '-'}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Phone size={14}/> Phone Number</p><p className="text-white font-medium">{viewLecturer.phone_number || '-'}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</p><p className={`font-medium ${viewLecturer.status === 'Disabled' || viewLecturer.status === 'Suspended' ? 'text-rose-400' : 'text-emerald-400'}`}>{viewLecturer.status || 'Active'}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Clock size={14}/> Joined</p><p className="text-white font-medium">{new Date(viewLecturer.created_at).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Clock size={14}/> Last Login</p><p className="text-white font-medium">{viewLecturer.last_login ? new Date(viewLecturer.last_login).toLocaleDateString() : 'N/A'}</p></div>
              </div>
              
              <div className="mb-8 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Assigned Courses</p>
                  <div className="flex flex-wrap gap-2">
                    {(viewLecturer.assigned_courses || []).length > 0 ? (
                      (viewLecturer.assigned_courses || []).map((c: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700">{c}</span>
                      ))
                    ) : <span className="text-slate-500 text-sm">No courses assigned</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Assigned Subjects</p>
                  <div className="flex flex-wrap gap-2">
                    {(viewLecturer.assigned_subjects || []).length > 0 ? (
                      (viewLecturer.assigned_subjects || []).map((c: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700">{c}</span>
                      ))
                    ) : <span className="text-slate-500 text-sm">No subjects assigned</span>}
                  </div>
                </div>
              </div>

              <div className="bg-[#020617] rounded-2xl p-4 border border-slate-800/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-4 font-semibold">Lecturer Analytics</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{viewLecturer.materials_uploaded || 0}</p>
                    <p className="text-[10px] text-slate-500 uppercase mt-1">Uploaded<br/>Materials</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{viewLecturer.cbt_exams_created || 0}</p>
                    <p className="text-[10px] text-slate-500 uppercase mt-1">CBT Exams<br/>Created</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{viewLecturer.total_students || 0}</p>
                    <p className="text-[10px] text-slate-500 uppercase mt-1">Total<br/>Students</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">{viewLecturer.avg_performance || 'N/A'}</p>
                    <p className="text-[10px] text-slate-500 uppercase mt-1">Avg Student<br/>Performance</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <UserCog className="text-emerald-400" size={28} /> Lecturer Management
          </h1>
          <p className="text-sm font-body text-slate-400">Add lecturers, assign subjects, and monitor uploads.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Plus size={16} /> Add Lecturer
        </button>
      </div>

      <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by name, email, department, faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#020617] border border-slate-800 text-white text-sm rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
            {dynamicFilters.map((opt) => (
              <button
                key={opt}
                onClick={() => setFilterOption(opt)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterOption === opt 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-[#020617] text-slate-400 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500">Loading lecturers...</div>
        ) : paginatedLecturers.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No records found.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {paginatedLecturers.map((lecturer) => (
              <div key={lecturer.id} className="bg-[#020617]/50 border border-slate-800/50 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/30 transition-colors group">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold uppercase text-lg shrink-0">
                        {(lecturer.full_name || 'L').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-white font-bold truncate pr-4">{lecturer.full_name}</h3>
                        <p className="text-xs text-slate-400 truncate">{lecturer.email}</p>
                        {(lecturer.department || lecturer.faculty) && (
                          <p className="text-[10px] text-emerald-500/70 truncate mt-1">
                            {lecturer.department} {lecturer.department && lecturer.faculty && '•'} {lecturer.faculty}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-lg" title="View Profile" onClick={() => setViewLecturer(lecturer)}><Eye size={16}/></button>
                      <button className="p-2 text-slate-400 hover:text-blue-400 transition-colors hover:bg-slate-800 rounded-lg" title="Edit" onClick={() => setEditLecturer({...lecturer})}><Edit2 size={16}/></button>
                      <button className="p-2 text-slate-400 hover:text-amber-400 transition-colors hover:bg-slate-800 rounded-lg" title="Reset Password" onClick={() => handleResetPassword(lecturer)}><Key size={16}/></button>
                      {lecturer.status === 'Suspended' || lecturer.status === 'Disabled' ? (
                        <button className="p-2 text-slate-400 hover:text-emerald-400 transition-colors hover:bg-slate-800 rounded-lg" title="Enable Account" onClick={() => handleToggleStatus(lecturer, 'Active')}><UserCheck size={16}/></button>
                      ) : (
                        <>
                          <button className="p-2 text-slate-400 hover:text-amber-500 transition-colors hover:bg-slate-800 rounded-lg" title="Suspend Account" onClick={() => handleToggleStatus(lecturer, 'Suspended')}><UserX size={16}/></button>
                        </>
                      )}
                      <button className="p-2 text-slate-400 hover:text-rose-400 transition-colors hover:bg-slate-800 rounded-lg" title="Delete Lecturer" onClick={() => handleDeleteLecturer(lecturer)}><Trash2 size={16}/></button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {lecturer.assigned_subjects && lecturer.assigned_subjects.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Assigned Subjects</p>
                        <div className="flex flex-wrap gap-2">
                          {lecturer.assigned_subjects.map((sub: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 text-[10px] rounded-md border border-slate-700">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                    {lecturer.assigned_courses && lecturer.assigned_courses.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Assigned Courses</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {lecturer.assigned_courses.map((sub: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-md border border-emerald-500/20">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1.5" title="Uploaded Materials">
                      <BookOpen size={14} className="text-emerald-500" />
                      <span>{lecturer.materials_uploaded || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="CBT Exams Created">
                      <FileText size={14} className="text-blue-500" />
                      <span>{lecturer.cbt_exams_created || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${
                      lecturer.status === 'Suspended' || lecturer.status === 'Disabled' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {lecturer.status || 'Active'}
                    </span>
                    <div className="flex gap-3">
                      <button className="text-emerald-400 hover:text-emerald-300 text-[11px] font-semibold transition-colors uppercase tracking-wider" onClick={() => setEditLecturer({...lecturer})}>
                        Assign Courses
                      </button>
                      <button className="text-blue-400 hover:text-blue-300 text-[11px] font-semibold transition-colors uppercase tracking-wider" onClick={() => setAssignMaterialLecturer(lecturer)}>
                        Assign Materials
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800">
            <div className="text-sm text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLecturers.length)} of {filteredLecturers.length} lecturers
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
