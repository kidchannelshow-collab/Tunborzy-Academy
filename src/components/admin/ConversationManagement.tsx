import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Search, Filter, Trash2, Calendar, User, BookOpen } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import ConfirmationModal from './ConfirmationModal';

interface Conversation {
  id: string;
  subject: string;
  topic: string;
  created_at: string;
  response_time: number;
  messages_count: number;
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function ConversationManagement() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [studentFilter, setStudentFilter] = useState('All');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ai_conversations')
        .select(`
          id,
          subject,
          topic,
          created_at,
          response_time,
          messages_count,
          profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setConversations((data as any) || []);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!conversationToDelete) return;
    
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationToDelete);
        
      if (error) throw error;
      
      setConversations(conversations.filter(c => c.id !== conversationToDelete));
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      alert('Failed to delete conversation');
    } finally {
      setDeleteModalOpen(false);
      setConversationToDelete(null);
    }
  };

  // Derive unique values for filters
  const subjects = ['All', ...Array.from(new Set(conversations.map(c => c.subject || 'Unknown')))];
  const students = ['All', ...Array.from(new Set(conversations.map(c => c.profiles?.full_name || 'Unknown')))];
  
  const filteredConversations = conversations.filter(c => {
    const matchesSearch = 
      (c.topic || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesSubject = subjectFilter === 'All' || c.subject === subjectFilter;
    const matchesStudent = studentFilter === 'All' || (c.profiles?.full_name || 'Unknown') === studentFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'All') {
      const date = new Date(c.created_at);
      const today = new Date();
      if (dateFilter === 'Today') {
        matchesDate = date.toDateString() === today.toDateString();
      } else if (dateFilter === 'Past 7 Days') {
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = date >= lastWeek;
      } else if (dateFilter === 'Past 30 Days') {
        const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = date >= lastMonth;
      }
    }
    
    return matchesSearch && matchesSubject && matchesStudent && matchesDate;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Conversation Management</h1>
          <p className="text-slate-400">View and manage student interactions with the AI Assistant.</p>
        </div>
      </div>

      <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#020617] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            {subjects.map(sub => (
              <option key={sub} value={sub}>{sub === 'All' ? 'All Subjects' : sub}</option>
            ))}
          </select>
          
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            {students.map(stu => (
              <option key={stu} value={stu}>{stu === 'All' ? 'All Students' : stu}</option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Time</option>
            <option value="Today">Today</option>
            <option value="Past 7 Days">Past 7 Days</option>
            <option value="Past 30 Days">Past 30 Days</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-sm text-slate-400">
                <th className="pb-3 font-medium">Student Name</th>
                <th className="pb-3 font-medium">Subject</th>
                <th className="pb-3 font-medium">Topic</th>
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Messages</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredConversations.map((conv) => (
                <tr key={conv.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 text-slate-200 flex items-center gap-2">
                    <User size={16} className="text-slate-500" />
                    {conv.profiles?.full_name || 'Unknown'}
                  </td>
                  <td className="py-4">
                    <span className="bg-slate-800/50 text-slate-300 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-700/50 inline-flex items-center gap-1.5">
                      <BookOpen size={12} />
                      {conv.subject || 'General'}
                    </span>
                  </td>
                  <td className="py-4 text-slate-300 max-w-[200px] truncate" title={conv.topic}>
                    {conv.topic || 'No topic'}
                  </td>
                  <td className="py-4 text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {new Date(conv.created_at).toLocaleDateString()} {new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="py-4 text-slate-300">
                    <div className="flex items-center justify-center bg-blue-500/10 text-blue-400 w-8 h-8 rounded-full font-medium">
                      {conv.messages_count || 2}
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <button 
                      onClick={() => {
                        setConversationToDelete(conv.id);
                        setDeleteModalOpen(true);
                      }}
                      className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-colors"
                      title="Delete Conversation"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {filteredConversations.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                    No conversations found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? This action cannot be undone and will permanently remove it from the system."
        isIrreversible={true}
      />
    </motion.div>
  );
}
