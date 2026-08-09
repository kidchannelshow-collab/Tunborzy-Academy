import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, Edit2, Trash2, Shield, UserX, UserCheck, Key, Eye, X, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { supabase } from '../../supabaseClient';

export default function UserManagement() {
  const [filterOption, setFilterOption] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', isIrreversible: false, onConfirm: async () => {} });
  
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  // Modals
  const [viewUser, setViewUser] = useState<any>(null);
  const [editUser, setEditUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchUsers();

    const channel = supabase.channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setUsers(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setUsers(prev => prev.map(u => u.id === payload.new.id ? payload.new : u));
        } else if (payload.eventType === 'DELETE') {
          setUsers(prev => prev.filter(u => u.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error("Error fetching users:", error);
      showNotification(error.message, 'error');
    } else if (data) {
      setUsers(data);
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
          console.error("Action error:", err);
          showNotification(err.message, 'error');
        }
      }
    });
    setIsConfirmModalOpen(true);
  };

  const handleResetPassword = (user: any) => {
    confirmAction('Reset Password', `Send password reset email to ${user.email}?`, false, async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      showNotification(`Password reset email sent to ${user.email}`, 'success');
    });
  };

  const handleToggleStatus = (user: any) => {
    const newStatus = user.status === 'Suspended' || user.status === 'Disabled' ? 'Active' : 'Disabled';
    const actionText = newStatus === 'Active' ? 'Enable' : 'Disable';
    confirmAction(`${actionText} Account`, `Are you sure you want to ${actionText.toLowerCase()} ${user.full_name}?`, false, async () => {
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', user.id);
      if (error) throw error;
      showNotification(`User account ${newStatus.toLowerCase()} successfully`, 'success');
    });
  };

  const handleDeleteUser = (user: any) => {
    confirmAction('Delete User', `Are you sure you want to permanently delete ${user.full_name}?`, true, async () => {
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (error) throw error;
      showNotification(`User deleted successfully`, 'success');
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setIsSaving(true);
    const { id, full_name, role, portal, university, course, student_id, status } = editUser;
    const { error } = await supabase.from('profiles').update({
      full_name, role, portal, university, course, student_id, status
    }).eq('id', id);
    
    setIsSaving(false);
    if (error) {
      console.error("Error saving user:", error);
      showNotification(error.message, 'error');
    } else {
      showNotification("User profile updated", 'success');
      setEditUser(null);
    }
  };

  // Filter & Search Logic
    const filteredUsers = useMemo(() => {
    let result = users;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        (u.full_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.student_id || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
      );
    }

    // Filter by Option
    if (filterOption !== 'All') {
      if (['Student', 'Lecturer', 'Admin'].includes(filterOption)) {
        result = result.filter(u => u.role === filterOption || (filterOption === 'Admin' && u.role === 'Super Admin'));
      } else if (filterOption === 'Active') {
        result = result.filter(u => u.status === 'Active' || !u.status);
      } else if (filterOption === 'Inactive') {
        result = result.filter(u => u.status === 'Inactive' || u.status === 'Suspended' || u.status === 'Disabled');
      }
    }

    // Sorting
    result.sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchQuery, filterOption, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto relative"
    >
      {/* Toast Notification */}
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

      {/* Edit Modal */}
      <AnimatePresence>
        {editUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[#020617]/80 backdrop-blur-sm overflow-y-auto py-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-2xl my-auto shadow-2xl relative"
            >
              <button onClick={() => setEditUser(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
              <h2 className="text-2xl font-display font-bold text-white mb-6">Edit User Profile</h2>
              
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Full Name</label>
                    <input type="text" value={editUser.full_name || ''} onChange={(e) => setEditUser({...editUser, full_name: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Role</label>
                    <select value={editUser.role || 'Student'} onChange={(e) => setEditUser({...editUser, role: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-blue-500 outline-none">
                      <option value="Student">Student</option>
                      <option value="Lecturer">Lecturer</option>
                      <option value="Admin">Admin</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Portal</label>
                    <select value={editUser.portal || ''} onChange={(e) => setEditUser({...editUser, portal: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-blue-500 outline-none">
                      <option value="">None</option>
                      <option value="UTME">UTME</option>
                      <option value="Post-UTME">Post-UTME</option>
                      <option value="Undergraduate">Undergraduate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">University</label>
                    <input type="text" value={editUser.university || ''} onChange={(e) => setEditUser({...editUser, university: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Course</label>
                    <input type="text" value={editUser.course || ''} onChange={(e) => setEditUser({...editUser, course: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Student ID</label>
                    <input type="text" value={editUser.student_id || ''} onChange={(e) => setEditUser({...editUser, student_id: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-poppins text-slate-400 mb-1">Account Status</label>
                    <select value={editUser.status || 'Active'} onChange={(e) => setEditUser({...editUser, status: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-blue-500 outline-none">
                      <option value="Active">Active</option>
                      <option value="Disabled">Disabled</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setEditUser(null)} className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving} className="flex-1 py-3 px-4 rounded-xl font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {viewUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[#020617]/80 backdrop-blur-sm overflow-y-auto py-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-2xl my-auto shadow-2xl relative"
            >
              <button onClick={() => setViewUser(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
              <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-6">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-400 uppercase">
                  {(viewUser.full_name || 'U').charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">{viewUser.full_name}</h2>
                  <p className="text-slate-400">{viewUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 mb-6">
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Role</p><p className="text-white font-medium">{viewUser.role}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</p><p className={`font-medium ${viewUser.status === 'Disabled' || viewUser.status === 'Suspended' ? 'text-rose-400' : 'text-emerald-400'}`}>{viewUser.status || 'Active'}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Student ID</p><p className="text-white font-mono">{viewUser.student_id || '-'}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Portal</p><p className="text-white font-medium">{viewUser.portal || '-'}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">University</p><p className="text-white font-medium">{viewUser.university || '-'}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Course</p><p className="text-white font-medium">{viewUser.course || '-'}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Registration Date</p><p className="text-white font-medium">{new Date(viewUser.created_at).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Last Login</p><p className="text-white font-medium">{viewUser.last_login ? new Date(viewUser.last_login).toLocaleDateString() : 'N/A'}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">CBT Statistics</p><p className="text-slate-300 font-medium text-sm">Tests Taken: {viewUser.cbt_tests_taken || 0}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Learning Progress</p><p className="text-slate-300 font-medium text-sm">Courses Completed: {viewUser.courses_completed || 0}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Subscription Status</p><p className="text-amber-400 font-medium">{viewUser.premium_status || 'Free'}</p></div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <Users className="text-blue-400" size={28} /> User Management
          </h1>
          <p className="text-sm font-body text-slate-400">Manage students, lecturers, and other admins.</p>
        </div>
        <button className="bg-[#020617] border border-slate-700 hover:border-slate-500 text-slate-300 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
          <Eye size={16} /> Export List
        </button>
      </div>

      <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by name, email, ID, university, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#020617] border border-slate-800 text-white text-sm rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
            {['All', 'Active', 'Inactive', 'Student', 'Lecturer', 'Admin'].map((opt) => (
              <button
                key={opt}
                onClick={() => setFilterOption(opt)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterOption === opt 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                    : 'bg-[#020617] text-slate-400 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1000px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-sm">
                <th className="pb-3 px-2 font-semibold cursor-pointer hover:text-white" onClick={() => toggleSort('full_name')}>
                  <div className="flex items-center gap-1">User Details <ArrowUpDown size={14}/></div>
                </th>
                <th className="pb-3 px-2 font-semibold cursor-pointer hover:text-white" onClick={() => toggleSort('role')}>
                  <div className="flex items-center gap-1">Role <ArrowUpDown size={14}/></div>
                </th>
                <th className="pb-3 px-2 font-semibold cursor-pointer hover:text-white" onClick={() => toggleSort('faculty')}>
                  <div className="flex items-center gap-1">Faculty/Dept <ArrowUpDown size={14}/></div>
                </th>
                <th className="pb-3 px-2 font-semibold cursor-pointer hover:text-white" onClick={() => toggleSort('status')}>
                  <div className="flex items-center gap-1">Status <ArrowUpDown size={14}/></div>
                </th>
                <th className="pb-3 px-2 font-semibold cursor-pointer hover:text-white" onClick={() => toggleSort('created_at')}>
                  <div className="flex items-center gap-1">Joined <ArrowUpDown size={14}/></div>
                </th>
                <th className="pb-3 px-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1,2,3,4,5].map(i => <tr key={i}><td colSpan={6} className="py-4 px-2"><div className="h-10 bg-slate-800/50 rounded-xl animate-pulse w-full"></div></td></tr>)
              ) : paginatedUsers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">No records found.</td></tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors group">
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-400 uppercase flex-shrink-0">
                          {(user.full_name || 'U').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-medium truncate">{user.full_name}</div>
                          <div className="text-xs text-slate-500 truncate">{user.email}</div>
                          {user.student_id && <div className="text-[10px] text-slate-600 font-mono mt-0.5">{user.student_id}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <span className="flex items-center gap-1 text-sm text-slate-300">
                        {user.role === 'Super Admin' || user.role === 'Admin' ? <Shield size={14} className="text-rose-400" /> : null}
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      <div className="text-sm text-slate-300">{user.faculty || user.portal || '-'}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[150px]">{user.department || user.course || user.university || ''}</div>
                    </td>
                    <td className="py-4 px-2">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                        user.status === 'Suspended' || user.status === 'Disabled' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-sm text-slate-400 whitespace-nowrap">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="py-4 px-2 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors" title="View Profile" onClick={() => setViewUser(user)}>
                          <Eye size={16}/>
                        </button>
                        <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-400 transition-colors" title="Edit" onClick={() => setEditUser({...user})}>
                          <Edit2 size={16}/>
                        </button>
                        <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-amber-400 transition-colors" title="Reset Password" onClick={() => handleResetPassword(user)}>
                          <Key size={16}/>
                        </button>
                        {user.status === 'Suspended' || user.status === 'Disabled' ? (
                          <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors" title="Enable Account" onClick={() => handleToggleStatus(user)}>
                            <UserCheck size={16}/>
                          </button>
                        ) : (
                          <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-rose-400 transition-colors" title="Disable Account" onClick={() => handleToggleStatus(user)}>
                            <UserX size={16}/>
                          </button>
                        )}
                        <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-rose-500 transition-colors" title="Delete User" onClick={() => handleDeleteUser(user)}>
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 mt-4 border-t border-slate-800">
            <div className="text-sm text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
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
