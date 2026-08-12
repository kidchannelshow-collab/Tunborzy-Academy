import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Calendar, User, Search } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface Feedback {
  id: string;
  user_id: string;
  prompt: string;
  response: string;
  is_helpful: boolean;
  comment: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function AIFeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All'); // All, Helpful, Not Helpful

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ai_feedback')
        .select(`
          id,
          user_id,
          prompt,
          response,
          is_helpful,
          comment,
          created_at,
          profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setFeedbacks(data as any || []);
    } catch (err) {
      console.error('Failed to fetch AI feedback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalReviews = feedbacks.length;
  const helpfulCount = feedbacks.filter(f => f.is_helpful).length;
  const notHelpfulCount = feedbacks.filter(f => !f.is_helpful).length;
  const helpfulPercentage = totalReviews > 0 ? Math.round((helpfulCount / totalReviews) * 100) : 0;

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesSearch = 
      (f.prompt || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.response || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.comment || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = 
      filterType === 'All' || 
      (filterType === 'Helpful' && f.is_helpful) ||
      (filterType === 'Not Helpful' && !f.is_helpful);
      
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
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
          <h1 className="text-2xl font-bold text-white mb-2">AI Feedback & Ratings</h1>
          <p className="text-slate-400">Analyze student feedback on AI responses to improve quality.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <Star size={18} />
            <span className="font-medium">Total Feedback</span>
          </div>
          <div className="text-3xl font-bold text-white">{totalReviews}</div>
        </div>
        
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <ThumbsUp size={18} />
            <span className="font-medium">Helpful Ratings</span>
          </div>
          <div className="text-3xl font-bold text-emerald-400">{helpfulCount}</div>
        </div>
        
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-rose-400 mb-2">
            <ThumbsDown size={18} />
            <span className="font-medium">Poor Responses</span>
          </div>
          <div className="text-3xl font-bold text-rose-400">{notHelpfulCount}</div>
        </div>
        
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-indigo-400 mb-2">
            <Star size={18} className="fill-indigo-400" />
            <span className="font-medium">Helpful Score</span>
          </div>
          <div className="text-3xl font-bold text-indigo-400">{helpfulPercentage}%</div>
        </div>
      </div>

      <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search prompts, responses, or comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#020617] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#020617] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 w-full md:w-48"
          >
            <option value="All">All Ratings</option>
            <option value="Helpful">Helpful Only</option>
            <option value="Not Helpful">Poor Responses Only</option>
          </select>
        </div>

        <div className="space-y-4">
          {filteredFeedbacks.map(f => (
            <div key={f.id} className="bg-[#020617] border border-slate-800/50 rounded-2xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <User size={14} />
                    {f.profiles?.full_name || 'Unknown User'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {new Date(f.created_at).toLocaleDateString()} {new Date(f.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div>
                  {f.is_helpful ? (
                    <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md text-xs font-semibold">
                      <ThumbsUp size={12} /> Helpful
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md text-xs font-semibold">
                      <ThumbsDown size={12} /> Poor
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="text-slate-500 font-medium mb-1">User Prompt:</h4>
                  <p className="text-slate-300 italic">"{f.prompt || 'No prompt recorded'}"</p>
                </div>
                <div>
                  <h4 className="text-slate-500 font-medium mb-1">AI Response:</h4>
                  <div className="text-slate-400 bg-slate-800/30 p-3 rounded-xl max-h-32 overflow-y-auto custom-scrollbar">
                    {f.response || 'No response recorded'}
                  </div>
                </div>
                {f.comment && (
                  <div>
                    <h4 className="text-slate-500 font-medium mb-1 flex items-center gap-1.5">
                      <MessageSquare size={14} /> User Comment:
                    </h4>
                    <p className="text-slate-200 font-medium">"{f.comment}"</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {filteredFeedbacks.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <Star size={48} className="mx-auto mb-4 opacity-20" />
              No feedback found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
