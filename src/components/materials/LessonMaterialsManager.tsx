import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, Trash2, Edit2, GripVertical, File, FileText, 
  Image as ImageIcon, Video, Music, Link as LinkIcon, 
  Download, Eye, Check, X, FileArchive, FileSpreadsheet
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { LessonAttachment, MaterialCategory } from './LessonEditor';

interface LessonMaterialsManagerProps {
  attachments: LessonAttachment[];
  setAttachments: React.Dispatch<React.SetStateAction<LessonAttachment[]>>;
}

const CATEGORIES: MaterialCategory[] = [
  'Lecture Notes',
  'Slides',
  'Video Lecture',
  'Audio Lecture',
  'Assignments',
  'Additional Resources'
];

export default function LessonMaterialsManager({ attachments, setAttachments }: LessonMaterialsManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [videoLink, setVideoLink] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="text-red-400" size={24} />;
      case 'doc': return <FileText className="text-blue-400" size={24} />;
      case 'ppt': return <File className="text-orange-400" size={24} />;
      case 'excel': return <FileSpreadsheet className="text-emerald-400" size={24} />;
      case 'zip': return <FileArchive className="text-yellow-400" size={24} />;
      case 'video': return <Video className="text-purple-400" size={24} />;
      case 'audio': return <Music className="text-pink-400" size={24} />;
      case 'image': return <ImageIcon className="text-cyan-400" size={24} />;
      case 'link': return <LinkIcon className="text-indigo-400" size={24} />;
      default: return <File className="text-slate-400" size={24} />;
    }
  };

  const getFileType = (file: File): LessonAttachment['type'] => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const type = file.type;
    
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext || '')) return 'doc';
    if (['ppt', 'pptx'].includes(ext || '')) return 'ppt';
    if (['xls', 'xlsx'].includes(ext || '')) return 'excel';
    if (['zip', 'rar'].includes(ext || '')) return 'zip';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    if (type.startsWith('image/')) return 'image';
    return 'pdf'; // fallback
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;

    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `lesson-materials/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('tonborzy-content')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;
      
      setUploadProgress(70);

      const { data } = supabase.storage.from('tonborzy-content').getPublicUrl(filePath);
      
      const newAttachment: LessonAttachment = {
        id: Date.now().toString(),
        name: file.name,
        type: getFileType(file),
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        category: 'Additional Resources',
        url: data.publicUrl,
        uploadedAt: new Date().toISOString()
      };

      setAttachments([...attachments, newAttachment]);
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddVideoLink = () => {
    if (!videoLink) return;
    const newAttachment: LessonAttachment = {
      id: Date.now().toString(),
      name: 'Video Link',
      type: 'video',
      category: 'Video Lecture',
      url: videoLink,
      uploadedAt: new Date().toISOString()
    };
    setAttachments([...attachments, newAttachment]);
    setVideoLink('');
    setShowAddMenu(false);
  };

  const handleRename = (id: string, newName: string) => {
    setAttachments(attachments.map(a => a.id === id ? { ...a, name: newName } : a));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this material?')) {
      setAttachments(attachments.filter(a => a.id !== id));
    }
  };

  const handleChangeCategory = (id: string, category: MaterialCategory) => {
    setAttachments(attachments.map(a => a.id === id ? { ...a, category } : a));
  };

  // Drag and drop logic
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires setting data
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newAttachments = [...attachments];
    const [dragged] = newAttachments.splice(draggedIndex, 1);
    newAttachments.splice(index, 0, dragged);
    
    setDraggedIndex(index);
    setAttachments(newAttachments);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-display font-bold text-white mb-2">Lesson Materials</h2>
          <p className="text-slate-400 text-sm">Upload files, slides, and videos for students.</p>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg"
          >
            <Upload size={18} /> Add Material
          </button>
          
          <AnimatePresence>
            {showAddMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-20"
              >
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-4 py-3 text-sm text-white hover:bg-slate-700 flex items-center gap-3 transition-colors"
                >
                  <File size={16} className="text-indigo-400" /> Upload File (PDF, PPT, etc.)
                </button>
                <div className="border-t border-slate-700 p-3 bg-slate-900/50">
                  <p className="text-xs text-slate-400 font-bold uppercase mb-2">Embed Video Link</p>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={videoLink}
                      onChange={e => setVideoLink(e.target.value)}
                      placeholder="YouTube / Vimeo URL"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button 
                      onClick={handleAddVideoLink}
                      className="bg-indigo-500 hover:bg-indigo-400 text-white p-1.5 rounded-lg transition-colors"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,video/*,audio/*,image/*" 
      />

      {isUploading && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Upload size={14} className="text-indigo-400" />
              </motion.div>
              Uploading...
            </span>
            <span className="text-sm font-bold text-indigo-400">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5">
            <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        </div>
      )}

      {attachments.length === 0 ? (
        <div className="text-center py-16 bg-[#0f172a] border border-slate-800 border-dashed rounded-2xl">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="text-slate-500" size={32} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No materials added yet</h3>
          <p className="text-slate-400 max-w-sm mx-auto mb-6 text-sm">
            Upload lecture notes, slides, videos, or external resources for this lesson.
          </p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
          >
            Select File to Upload
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {attachments.map((attachment, index) => (
              <motion.div
                key={attachment.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                draggable
                onDragStart={(e: any) => handleDragStart(e, index)}
                onDragOver={(e: any) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`bg-slate-900 border ${draggedIndex === index ? 'border-indigo-500 opacity-50' : 'border-slate-800'} rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center gap-4 group transition-colors`}
              >
                <div className="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
                  <div className="cursor-grab active:cursor-grabbing p-1 text-slate-600 hover:text-slate-400 hidden sm:block">
                    <GripVertical size={18} />
                  </div>
                  
                  <div className="p-2 bg-slate-950 rounded-lg shrink-0">
                    {getFileIcon(attachment.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {editingId === attachment.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          autoFocus
                          type="text" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(attachment.id, editName)}
                          className="w-full bg-slate-950 border border-indigo-500 rounded px-2 py-1 text-sm text-white focus:outline-none"
                        />
                        <button onClick={() => handleRename(attachment.id, editName)} className="text-emerald-400 p-1 hover:bg-emerald-400/10 rounded"><Check size={16}/></button>
                        <button onClick={() => setEditingId(null)} className="text-red-400 p-1 hover:bg-red-400/10 rounded"><X size={16}/></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group/edit">
                        <h4 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">{attachment.name}</h4>
                        <button 
                          onClick={() => { setEditingId(attachment.id); setEditName(attachment.name); }}
                          className="opacity-0 group-hover/edit:opacity-100 text-slate-500 hover:text-indigo-400 p-1 transition-opacity"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs font-medium">
                      <span className="text-slate-500 uppercase">{attachment.type}</span>
                      {attachment.size && <span className="text-slate-600">• {attachment.size}</span>}
                      <span className="text-slate-600 hidden sm:inline">• {new Date(attachment.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-row items-center justify-between w-full sm:w-auto gap-4 mt-2 sm:mt-0 pl-10 sm:pl-0">
                  <select
                    value={attachment.category}
                    onChange={(e) => handleChangeCategory(attachment.id, e.target.value as MaterialCategory)}
                    className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <div className="flex items-center gap-1">
                    <a 
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye size={18} />
                    </a>
                    <a 
                      href={attachment.url}
                      download={attachment.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download size={18} />
                    </a>
                    <button 
                      onClick={() => handleDelete(attachment.id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
