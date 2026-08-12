import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileCheck, Search, Eye, CheckCircle, XCircle, MessageSquare, ArrowLeft } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import StudentLessonViewer from '../materials/StudentLessonViewer';

export default function PendingReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingLesson, setViewingLesson] = useState<any>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewComment, setReviewComment] = useState('');

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('materials')
        .select('*')
        .eq('file_type', 'lesson')
        .ilike('description', '%"status":"Under Review"%');
      
      if (data) {
        // filter out false positives
        const actualReviews = data.filter((m: any) => {
          try {
            const parsed = JSON.parse(m.description);
            return parsed?.publishSettings?.status === 'Under Review';
          } catch(e) { return false; }
        });
        setReviews(actualReviews);
      }
    } catch(e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleAction = async () => {
    if (!viewingLesson) return;
    try {
      const parsed = JSON.parse(viewingLesson.description);
      const newStatus = reviewAction === 'approve' ? 'Published' : 'Draft';
      const actionText = reviewAction === 'approve' ? 'Approved & Published' : `Rejected: ${reviewComment}`;
      
      parsed.publishSettings.status = newStatus;
      parsed.publishSettings.auditLogs = [
        { action: actionText, by: 'Admin', date: new Date().toISOString() },
        ...(parsed.publishSettings.auditLogs || [])
      ];

      await supabase.from('materials').update({
        description: JSON.stringify(parsed),
        is_published: reviewAction === 'approve'
      }).eq('id', viewingLesson.id);

      setReviewModalOpen(false);
      setViewingLesson(null);
      setReviewComment('');
      fetchReviews();
    } catch(e) {
      console.error(e);
      alert('Error updating lesson status');
    }
  };

  if (viewingLesson && !reviewModalOpen) {
    return (
      <div className="relative h-screen flex flex-col bg-slate-950">
        <div className="flex items-center justify-between p-4 bg-[#0f172a] border-b border-slate-800">
          <button onClick={() => setViewingLesson(null)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} /> Back to Pending Reviews
          </button>
          <div className="flex gap-3">
            <button onClick={() => { setReviewAction('reject'); setReviewModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg font-bold transition-colors">
              <XCircle size={18} /> Reject & Return
            </button>
            <button onClick={() => { setReviewAction('approve'); setReviewModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-lg font-bold transition-colors">
              <CheckCircle size={18} /> Approve & Publish
            </button>
          </div>
        </div>
        <div className="flex-1 relative">
          <StudentLessonViewer 
            material={viewingLesson} 
            onClose={() => setViewingLesson(null)} 
          />
          {/* Cover the back button from StudentLessonViewer using a tiny hack if needed, but StudentLessonViewer has its own close, we can just intercept it or let it be. */}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-amber-500/20 text-amber-500 rounded-xl">
          <FileCheck size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Pending Reviews</h1>
          <p className="text-slate-400">Review and approve lessons submitted by lecturers.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-slate-500 py-12">Loading...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center bg-[#0f172a] border border-slate-800 rounded-2xl p-12">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-500 mx-auto mb-4">
            <CheckCircle size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
          <p className="text-slate-400">There are no lessons waiting for review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map(review => (
            <div key={review.id} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full uppercase tracking-wider">Needs Review</span>
                </div>
                <button onClick={() => setViewingLesson(review)} className="p-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
                  <Eye size={18} />
                </button>
              </div>
              <h3 className="font-bold text-lg text-white mb-1 line-clamp-1">{review.title}</h3>
              <p className="text-sm text-slate-400 mb-4">{review.course_code} • {review.topic}</p>
              
              <div className="flex items-center gap-2 pt-4 border-t border-slate-800/50 text-sm">
                <span className="text-slate-500">Submitted by:</span>
                <span className="text-slate-300 font-medium">{review.lecturer_name || 'Tutor'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {reviewAction === 'approve' ? 'Approve Lesson' : 'Reject Lesson'}
            </h3>
            
            {reviewAction === 'reject' && (
              <div className="mb-6">
                <label className="block text-sm font-poppins text-slate-400 mb-2">Review Comments (Required)</label>
                <textarea 
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  className="w-full h-32 bg-[#020617] border border-slate-700 text-white rounded-xl p-4 focus:outline-none focus:border-red-500"
                  placeholder="Explain what needs to be changed..."
                  required
                />
              </div>
            )}
            
            {reviewAction === 'approve' && (
              <p className="text-slate-300 mb-6">
                This will immediately publish the lesson and make it visible according to its visibility settings. Are you sure?
              </p>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={() => setReviewModalOpen(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors font-bold">
                Cancel
              </button>
              <button 
                onClick={handleAction} 
                disabled={reviewAction === 'reject' && !reviewComment.trim()}
                className={`px-6 py-2 rounded-xl font-bold transition-colors ${
                  reviewAction === 'approve' 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950'
                    : 'bg-red-500 hover:bg-red-400 text-white disabled:opacity-50'
                }`}
              >
                Confirm {reviewAction === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
