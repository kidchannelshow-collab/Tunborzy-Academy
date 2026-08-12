import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, ListPlus } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface BulkLessonModalProps {
  courseCode: string;
  topic: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkLessonModal({ courseCode, topic, onClose, onSuccess }: BulkLessonModalProps) {
  const [titles, setTitles] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titles.trim() || !supabase) return;
    setIsSaving(true);
    
    try {
      const lessonTitles = titles.split('\\n').map(t => t.trim()).filter(t => t.length > 0);
      const newLessons = lessonTitles.map((title, index) => ({
        title,
        course_code: courseCode,
        topic,
        file_type: 'lesson',
        is_published: false, // Start as Draft
        description: JSON.stringify({ blocks: [], publishSettings: { status: 'Draft', auditLogs: [] } }),
        order_index: index + 100 // push to end
      }));
      
      if (newLessons.length > 0) {
        await supabase.from('materials').insert(newLessons);
        onSuccess();
      } else {
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to bulk create lessons');
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <ListPlus size={20} />
            </div>
            <h3 className="text-xl font-bold text-white">Bulk Create Lessons</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-poppins text-slate-400 mb-2">
              Enter lesson titles (one per line):
            </label>
            <textarea 
              value={titles} 
              onChange={e => setTitles(e.target.value)} 
              className="w-full h-48 bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-3 font-mono text-sm leading-relaxed" 
              placeholder="e.g.&#10;Motion&#10;Velocity&#10;Acceleration&#10;Newton's Laws"
              required 
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} disabled={isSaving} className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
            <button type="submit" disabled={isSaving} className="flex-1 py-3 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-colors flex items-center justify-center gap-2">
              {isSaving ? 'Creating...' : 'Create Lessons'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
