import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, File, Image as ImageIcon, Book, BookOpen, Check, Save } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useProfile } from '../../lib/useProfile';

const UPLOAD_TYPES = [
  { id: 'pdf', label: 'PDF Notes', icon: File },
  { id: 'past-questions', label: 'Past Questions', icon: Book },
  { id: 'cbt', label: 'CBT Questions', icon: File },
  { id: 'practical', label: 'Practical Manuals', icon: BookOpen },
  { id: 'assignment', label: 'Assignment', icon: File },
  { id: 'revision', label: 'Revision Notes', icon: Book },
  { id: 'image', label: 'Image/Diagram', icon: ImageIcon },
];

export default function UploadCenter() {
  const { profile } = useProfile();
  const [selectedType, setSelectedType] = useState('pdf');
  const [courses, setCourses] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    course_id: '',
    semester: 'first',
    level: '',
    topic: '',
    description: '',
    file_url: ''
  });

  useEffect(() => {
    if (profile) fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('courses').select('*').eq('lecturer_id', profile?.id);
      setCourses(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpload = async (e: React.FormEvent, isPublished: boolean) => {
    e.preventDefault();
    if (!supabase || !profile) return;
    setIsUploading(true);
    
    try {
      await supabase.from('learning_materials').insert([{
        course_id: formData.course_id,
        title: formData.topic,
        description: formData.description,
        type: selectedType,
        file_url: formData.file_url,
        semester: formData.semester,
        level: formData.level,
        is_published: isPublished,
        lecturer_id: profile.id
      }]);
      
      setShowSuccess(true);
      setFormData({
        course_id: '', semester: 'first', level: '', topic: '', description: '', file_url: ''
      });
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-4xl mx-auto pb-24"
    >
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
          <UploadCloud className="text-emerald-500" size={28} /> Upload Center
        </h1>
        <p className="text-sm font-body text-slate-400">Upload and organize learning materials for your students.</p>
      </div>

      <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 md:p-8">
        <form onSubmit={(e) => handleUpload(e, true)} className="space-y-6">
          
          {/* Material Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Material Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {UPLOAD_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                    selectedType === type.id
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                      : 'bg-[#020617]/50 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <type.icon size={24} className="mb-2" />
                  <span className="text-xs font-semibold text-center">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Course / Subject</label>
              <select 
                required
                value={formData.course_id}
                onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="" disabled>Select Course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.code})</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Semester</label>
              <select 
                value={formData.semester}
                onChange={(e) => setFormData({...formData, semester: e.target.value})}
                className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="first">First Semester</option>
                <option value="second">Second Semester</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Level (Optional)</label>
              <input 
                type="text" 
                value={formData.level}
                onChange={(e) => setFormData({...formData, level: e.target.value})}
                placeholder="e.g. 100L"
                className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Topic / Title</label>
              <input 
                type="text" 
                required
                value={formData.topic}
                onChange={(e) => setFormData({...formData, topic: e.target.value})}
                placeholder="e.g., Introduction to Kinematics"
                className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Description (Optional)</label>
            <textarea 
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Brief description of the material..."
              className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 resize-none custom-scrollbar"
            />
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">File URL / Select File</label>
            <input 
              type="text" 
              required
              value={formData.file_url}
              onChange={(e) => setFormData({...formData, file_url: e.target.value})}
              placeholder="https://..."
              className="w-full mb-4 bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 bg-[#020617]/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group">
              <div className="w-16 h-16 rounded-full bg-slate-800 group-hover:bg-emerald-500/10 flex items-center justify-center mb-4 transition-colors">
                <UploadCloud size={28} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">Click to browse or drag and drop</p>
              <p className="text-xs text-slate-500">Supports PDF, JPEG, DOCX (Max 500MB)</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/50 flex flex-col sm:flex-row justify-end gap-4">
            <button 
              type="button"
              disabled={isUploading}
              onClick={(e) => handleUpload(e, false)}
              className="px-6 py-3 border border-slate-700 rounded-xl text-sm font-semibold text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} /> Save Draft
            </button>
            <button 
              type="submit"
              disabled={isUploading}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {isUploading ? 'Uploading...' : <><UploadCloud size={18} /> Publish Material</>}
            </button>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-emerald-500/90 backdrop-blur-xl border border-emerald-400 text-white px-6 py-3 rounded-full shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)]"
          >
            <Check size={18} />
            <span className="text-sm font-bold">Material saved successfully</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
