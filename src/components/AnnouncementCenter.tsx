import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { notificationService } from '../lib/notificationService';
import { useProfile } from '../lib/useProfile';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell, Check, Trash2, Edit2, Pin, Calendar, Copy, Eye,
  Search, Filter, Image as ImageIcon, FileText, MessageSquare,
  BarChart2, Users, Clock, Star, ArrowLeft, Bookmark, CheckCircle, X, Plus,
  Info, Book, Activity, Settings, AlertTriangle, Send, Share2, 
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  category: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  target: string;
  date: string;
  status: 'Published' | 'Scheduled' | 'Archived';
  isPinned: boolean;
  views: number;
  readRate: number;
  unread: boolean;
  bookmarked: boolean;
  hasAttachment?: 'image' | 'pdf' | 'chat';
}

const CATEGORIES = [
  { name: 'General Announcement', icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { name: 'Academic Notice', icon: Book, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { name: 'Examination Notice', icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  { name: 'New Chat Message', icon: MessageSquare, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  { name: 'New Notes Available', icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { name: 'New CBT Available', icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { name: 'Premium Update', icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { name: 'Maintenance Notice', icon: Settings, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
  { name: 'Event Announcement', icon: Calendar, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  { name: 'Emergency Notice', icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
];

const TARGETS = [
  'Everyone', 'Students Only', 'Lecturers Only', 'Admin Only', 'UTME Students', 
  'Post-UTME Students', 'Undergraduate Students', 'First Semester', 'Second Semester',
  'Specific Course', 'Selected Users'
];

export default function AnnouncementCenter({ onBack, onNavigate }: { onBack?: () => void, onNavigate?: (view: string) => void }) {
  const { profile } = useProfile();
  const role = profile?.role?.toLowerCase() || 'student';
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  useEffect(() => {
    if (!profile) return;
    const fetchAll = async () => {
      try {
        const { data: annData } = await supabase.from('announcements')
          .select('*')
          .eq('target_role', profile.role)
          .order('created_at', { ascending: false });
        if (annData) setAnnouncements(annData);
        
        const { data: notifData } = await supabase.from('notifications')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });
        if (notifData) setNotifications(notifData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAll();
    
    const channel = supabase.channel('announcement_notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${profile.id}`
      }, (payload) => {
        fetchAll();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.role]);

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'bookmarked' | 'pinned'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[0].name);
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState('Medium');
  const [formTarget, setFormTarget] = useState('Everyone');
  const [formSchedule, setFormSchedule] = useState('Immediate');

  const getCategoryStyle = (catName: string) => {
    return CATEGORIES.find(c => c.name === catName) || CATEGORIES[0];
  };

  const AdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Announcements', val: '142', icon: Bell, color: 'text-indigo-400' },
          { label: 'Total Views', val: '45.2K', icon: Eye, color: 'text-blue-400' },
          { label: 'Avg Read Rate', val: '78%', icon: BarChart2, color: 'text-emerald-400' },
          { label: 'Scheduled', val: '3', icon: Clock, color: 'text-amber-400' }
        ].map((stat, i) => (
          <div key={i} className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-white">{stat.val}</h3>
            </div>
            <div className={`p-3 rounded-xl bg-slate-800/50 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search announcements..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#020617] border border-slate-800 text-white text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors">
            <Filter size={16} /> Filter
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus size={18} /> Create New
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {announcements.map(ann => {
          const style = getCategoryStyle(ann.category || 'General Notice');
          const Icon = style.icon;
          return (
            <motion.div 
              key={ann.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-[#0f172a]/80 backdrop-blur-md border ${ann.is_pinned ? 'border-indigo-500/50' : 'border-slate-800'} rounded-2xl p-5 hover:border-indigo-500/30 transition-colors`}
            >
              <div className="flex flex-col lg:flex-row gap-5">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {ann.is_pinned && <span className="flex items-center gap-1 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md"><Pin size={12} /> Pinned</span>}
                    <span className={`flex items-center gap-1 text-xs font-bold ${style.color} ${style.bg} px-2 py-1 rounded-md`}>
                      <Icon size={12} /> {ann.category || 'General Notice'}
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                      ann.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-400' :
                      ann.priority === 'High' ? 'bg-orange-500/10 text-orange-400' :
                      ann.priority === 'Medium' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {ann.priority} Priority
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                      ann.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400' :
                      ann.status === 'Scheduled' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {ann.status}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white leading-tight">{ann.title}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2">{ann.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1"><Users size={14} /> To: {ann.target}</span>
                    <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(ann.created_at).toLocaleDateString()}</span>
                    {ann.hasAttachment && <span className="flex items-center gap-1 text-indigo-400"><FileText size={14} /> Attachment</span>}
                  </div>
                </div>
                
                <div className="flex lg:flex-col items-center justify-between lg:justify-center gap-4 lg:w-48 lg:border-l border-slate-800 lg:pl-5">
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">{ann.views}</p>
                      <p className="text-xs text-slate-500">Views</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-emerald-400">{ann.readRate}%</p>
                      <p className="text-xs text-slate-500">Read</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-indigo-400 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors" title="Edit" ><Edit2 size={16} /></button>
                    <button className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors" title="Duplicate"><Copy size={16} /></button>
                    <button className="p-2 text-slate-400 hover:text-amber-400 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors" title="Pin/Unpin"><Pin size={16} /></button>
                    <button className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors" title="Delete"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const UserView = () => (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="w-full lg:w-64 flex-shrink-0 space-y-2 sticky top-24">
        {[
          { id: 'all', label: 'All Notifications', icon: Bell },
          { id: 'unread', label: 'Unread', icon: CheckCircle },
          { id: 'pinned', label: 'Pinned', icon: Pin },
          { id: 'bookmarked', label: 'Bookmarked', icon: Bookmark },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <tab.icon size={18} /> {tab.label}
            </div>
            {tab.id === 'unread' && notifications.filter(n => !n.is_read).length > 0 && <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{notifications.filter(n => !n.is_read).length}</span>}
          </button>
        ))}
        
        <div className="mt-8 pt-6 border-t border-slate-800/50">
          <button onClick={async () => {
             await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false);
          }} className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
            <Check size={16} /> Mark all as read
          </button>
          <button onClick={async () => {
             await supabase.from('notifications').delete().eq('user_id', profile.id).eq('is_read', true);
          }} className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:text-rose-400 flex items-center gap-2 transition-colors">
            <Trash2 size={16} /> Clear all read
          </button>
        </div>
      </div>

      <div className="flex-1 w-full space-y-4">
        {announcements.map(ann => {
          const style = getCategoryStyle(ann.category || 'General Notice');
          const Icon = style.icon;
          return (
            <motion.div 
              key={ann.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-[#0f172a]/80 backdrop-blur-md border ${false ? 'border-indigo-500/30 shadow-lg shadow-indigo-500/5' : 'border-slate-800'} rounded-2xl p-5 relative overflow-hidden group`}
            >
              {false && <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>}
              
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${style.bg} ${style.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold leading-tight ${false ? 'text-white' : 'text-slate-300'}`}>
                      {ann.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs font-medium text-slate-500">
                      <span>{ann.category || 'General Notice'}</span>
                      <span>•</span>
                      <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                      {ann.is_pinned && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-400 flex items-center gap-1"><Pin size={10} /> Pinned</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className={`p-2 rounded-lg transition-colors ${ann.bookmarked ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <Bookmark size={16} fill={ann.bookmarked ? "currentColor" : "none"} />
                  </button>
                  <button className="p-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                    <Share2 size={16} />
                  </button>
                  {!false && (
                    <button className="p-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className={`pl-14 text-sm leading-relaxed ${false ? 'text-slate-300' : 'text-slate-400'}`}>
                {ann.description}
              </div>
              
              {ann.hasAttachment && (
                <div className="pl-14 mt-4">
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#020617] border border-slate-700 hover:border-slate-500 rounded-xl text-sm font-medium text-slate-300 transition-colors">
                    {ann.hasAttachment === 'pdf' ? <FileText size={16} className="text-rose-400" /> : <ImageIcon size={16} className="text-emerald-400" />}
                     Attachment
                    
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[#020617] text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} /> Back
          </button>
          
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <Bell className="text-indigo-400" size={32} /> Announcement & Notification Center
          </h1>
          <p className="text-slate-400 text-sm font-body">
            {role === 'admin' ? 'Create, manage, and track platform-wide announcements.' : 'Stay updated with the latest information and notices.'}
          </p>
        </div>

        {role === 'admin' ? <AdminDashboard /> : <UserView />}
        
        {/* Create Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-sm overflow-y-auto"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl"
              >
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Edit2 className="text-indigo-400" size={20} /> Create Announcement
                  </h2>
                  <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Announcement Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Scheduled Maintenance Notice"
                      className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">Category</label>
                      <select className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 transition-colors appearance-none">
                        {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">Target Audience</label>
                      <select className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 transition-colors appearance-none">
                        {TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Description</label>
                    <textarea 
                      rows={5}
                      placeholder="Write your announcement here..."
                      className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                    ></textarea>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 mb-2 block">Priority Level</label>
                    <div className="flex flex-wrap gap-3">
                      {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                        <button 
                          key={p}
                          onClick={() => setFormPriority(p)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                            formPriority === p 
                              ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' 
                              : 'bg-[#020617] border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-slate-300 block">Attachments (Optional)</label>
                    <div className="flex flex-wrap gap-4">
                      <button className="flex items-center gap-2 px-4 py-3 bg-[#020617] border border-slate-700 border-dashed hover:border-indigo-500 hover:text-indigo-400 rounded-xl text-sm font-medium text-slate-400 transition-colors">
                        <ImageIcon size={18} /> Upload Image
                      </button>
                      <button className="flex items-center gap-2 px-4 py-3 bg-[#020617] border border-slate-700 border-dashed hover:border-indigo-500 hover:text-indigo-400 rounded-xl text-sm font-medium text-slate-400 transition-colors">
                        <FileText size={18} /> Upload PDF
                      </button>
                      <button className="flex items-center gap-2 px-4 py-3 bg-[#020617] border border-slate-700 border-dashed hover:border-indigo-500 hover:text-indigo-400 rounded-xl text-sm font-medium text-slate-400 transition-colors">
                        <MessageSquare size={18} /> Upload Audio
                      </button>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-800 pt-6 space-y-4">
                    <label className="text-sm font-semibold text-slate-300 block">Scheduling</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${formSchedule === 'Immediate' ? 'bg-indigo-500/10 border-indigo-500 text-white' : 'bg-[#020617] border-slate-700 text-slate-400'}`}>
                        <input type="radio" name="schedule" checked={formSchedule === 'Immediate'} onChange={() => setFormSchedule('Immediate')} className="hidden" />
                        <Send size={18} className={formSchedule === 'Immediate' ? 'text-indigo-400' : ''} />
                        <span className="font-medium text-sm">Publish Now</span>
                      </label>
                      <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${formSchedule === 'Schedule' ? 'bg-indigo-500/10 border-indigo-500 text-white' : 'bg-[#020617] border-slate-700 text-slate-400'}`}>
                        <input type="radio" name="schedule" checked={formSchedule === 'Schedule'} onChange={() => setFormSchedule('Schedule')} className="hidden" />
                        <Calendar size={18} className={formSchedule === 'Schedule' ? 'text-indigo-400' : ''} />
                        <span className="font-medium text-sm">Schedule Later</span>
                      </label>
                    </div>
                    {formSchedule === 'Schedule' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <label className="text-xs text-slate-400">Publish Date & Time</label>
                          <input type="datetime-local" className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-slate-400">Expiry Date (Optional)</label>
                          <input type="datetime-local" className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-6 border-t border-slate-800 bg-[#0f172a] flex justify-between items-center">
                  <button className="text-slate-400 hover:text-white text-sm font-medium flex items-center gap-2">
                    <Eye size={16} /> Preview
                  </button>
                  <div className="flex gap-3">
                    <button onClick={() => setShowCreateModal(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800 transition-colors">
                      Cancel
                    </button>
                    <button onClick={async () => {
  if (!profile) return;
  try {
    let targetRole = 'Student';
    if (formTarget === 'Lecturers Only') targetRole = 'Lecturer';
    if (formTarget === 'Admin Only') targetRole = 'Admin';
    
    await supabase.from('announcements').insert({
      title: formTitle,
      content: formDesc,
      target_role: targetRole,
      created_by: profile.id
    });
    
    // Also broadcast a notification
    if (targetRole === 'Everyone') {
      await notificationService.notifyRole('Student', formTitle, formDesc, 'announcement', '/announcements');
      await notificationService.notifyRole('Lecturer', formTitle, formDesc, 'announcement', '/announcements');
    } else {
      await notificationService.notifyRole(targetRole, formTitle, formDesc, 'announcement', '/announcements');
    }
    
    const { data } = await supabase.from('announcements').select('*').eq('target_role', profile.role).order('created_at', { ascending: false });
    if (data) setAnnouncements(data);
    
    setShowCreateModal(false);
  } catch(err) { console.error(err); }
}} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-500 text-white hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2">
  <Send size={16} /> {formSchedule === 'Immediate' ? 'Publish' : 'Schedule'}
</button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
