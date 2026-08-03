import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Search, Trash2, Edit2, Eye, EyeOff, FileText, BookOpen, Database,
  PlayCircle, Calendar, PenTool
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

import { useProfile } from '../../lib/useProfile';

export default function UploadCenter() {
  const { profile } = useProfile();
  
  // -- Form State --
  const [materialType, setMaterialType] = useState('pdf'); // pdf, past_question, assignment
  const [portal, setPortal] = useState('Undergraduate');
  const [subject, setSubject] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [semester, setSemester] = useState('First Semester');
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Sub-states
   
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'upload'|'link'>('upload');
  const [pdfLink, setPdfLink] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pqMethod, setPqMethod] = useState<'pdf'|'cbt'>('pdf');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // -- Recent Materials State --
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPortal, setFilterPortal] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const [coursesCount, setCoursesCount] = useState(0);

  useEffect(() => {
    async function loadStats() {
      if (!supabase) return;
      try {
        const { count } = await supabase.from('courses').select('*', { count: 'exact', head: true });
        setCoursesCount(count || 0);
      } catch (err) { console.error(err); }
    }
    loadStats();
  }, []);

  useEffect(() => {
    async function loadMaterials() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('materials')
          .select('*')
          .eq('lecturer_name', profile?.full_name || '')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setMaterials(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMaterials();
    
    if (supabase) {
      const channel = supabase.channel('public:materials_admin')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, (payload) => {
          loadMaterials(); // Refresh when changes occur
        })
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  useEffect(() => {
    if (materialType === 'pdf' && pdfLink.length > 5) {
      if (pdfLink.includes('youtube.com') || pdfLink.includes('youtu.be')) {
        setThumbnailUrl('https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600&auto=format&fit=crop');

      } else {
        setThumbnailUrl('https://images.unsplash.com/photo-1481481600673-c6c8c93ccfb0?q=80&w=600&auto=format&fit=crop');
      }
    } else {
      setThumbnailUrl('');
    }
  }, [pdfLink, materialType]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !profile) return;
    
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      let finalFileUrl = '';
      let finalFileSize = 'Unknown';
      let finalFileType = materialType;
      
      // If editing, use existing if not changed
      if (editingId) {
        const existing = materials.find(m => m.id === editingId);
        if (existing && !pdfLink && !pdfFile) {
          finalFileUrl = existing.file_url;
          finalFileSize = existing.file_size;
          finalFileType = existing.file_type;
        }
      }

      if (materialType === 'pdf' || materialType === 'assignment' || (materialType === 'past_question' && pqMethod === 'pdf')) {
        if (uploadMethod === 'link') {
          finalFileUrl = pdfLink;
          finalFileSize = 'External Link';
        } else if (pdfFile) {
          const fileExt = pdfFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `materials/${portal.toLowerCase()}/${fileName}`;
          
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('tonborzy-content')
            .upload(filePath, pdfFile, { cacheControl: '3600', upsert: false });
          
          setUploadProgress(60);
          
          if (!uploadError && uploadData) {
            const { data } = supabase.storage.from('tonborzy-content').getPublicUrl(filePath);
            finalFileUrl = data.publicUrl;
          } else {
             finalFileUrl = '#'; // dummy
          }
          finalFileSize = (pdfFile.size / (1024 * 1024)).toFixed(2) + ' MB';
        }
      } else if (materialType === 'past_question' && pqMethod === 'cbt') {
        finalFileUrl = 'cbt-imported';
        finalFileSize = 'Question Bank';
      }

      setUploadProgress(80);

      const newMaterial = {
        title,
        description,
        lecturer_name: profile?.full_name || 'Lecturer',
        file_url: finalFileUrl,
        file_type: finalFileType,
        file_size: finalFileSize,
        portal,
        subject,
        course_code: courseCode,
        is_published: true,
      };

      const { data, error } = await supabase.from('materials').insert([newMaterial]).select();
      
      if (error) throw error;
      
      if (data) {
        setMaterials([data[0], ...materials]);
      }
      
      // Reset
      setTitle('');
      setDescription('');
      setTopic('');
            setPdfLink('');
      setPdfFile(null);
      setThumbnailUrl('');
      
    } catch (err) {
      console.error(err);
      alert('Failed to upload material');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const togglePublish = async (id: string, current: boolean) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('materials').update({ is_published: !current }).eq('id', id);
      if (error) throw error;
      setMaterials(prev => prev.map(m => m.id === id ? { ...m, is_published: !current } : m));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMaterial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    if (!supabase) return;
    try {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMaterials = materials.filter(m => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (m.title && m.title.toLowerCase().includes(q)) ||
      (m.subject && m.subject.toLowerCase().includes(q)) ||
      (m.course_code && m.course_code.toLowerCase().includes(q)) ||
      (m.portal && m.portal.toLowerCase().includes(q));
      
    const matchesPortal = filterPortal === 'All' || m.portal === filterPortal;
    const matchesType = filterType === 'All' || m.file_type === filterType;
    const matchesStatus = filterStatus === 'All' ? true : filterStatus === 'Published' ? m.is_published : !m.is_published;
    
    return matchesSearch && matchesPortal && matchesType && matchesStatus;
  });

  const getIcon = (type: string) => {
    switch(type) {
      case 'pdf': return <FileText size={18} className="text-blue-500" />;
            case 'past_question': return <PenTool size={18} className="text-amber-500" />;
      case 'assignment': return <BookOpen size={18} className="text-emerald-500" />;
      default: return <FileText size={18} className="text-slate-400" />;
    }
  };

  const totalPdfs = materials.filter(m => m.file_type === 'pdf').length;
  const totalNotes = materials.filter(m => m.file_type === 'pdf').length;
  const publishedCount = materials.filter(m => m.is_published).length;
  const hiddenCount = materials.filter(m => !m.is_published).length;
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight">Material Upload Center</h2>
          <p className="text-slate-400 font-body text-sm mt-1">
            Securely publish learning materials across all portals.
          </p>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-[#0f172a]/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Courses</p>
          <p className="text-2xl font-bold text-indigo-400">{coursesCount}</p>
        </div>
        <div className="bg-[#0f172a]/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Materials</p>
          <p className="text-2xl font-bold text-white">{materials.length}</p>
        </div>
        <div className="bg-[#0f172a]/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total PDFs</p>
          <p className="text-2xl font-bold text-rose-400">{totalPdfs}</p>
        </div>
        <div className="bg-[#0f172a]/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Documents</p>
          <p className="text-2xl font-bold text-blue-400">{totalNotes}</p>
        </div>
        <div className="bg-[#0f172a]/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Published</p>
          <p className="text-2xl font-bold text-emerald-400">{publishedCount}</p>
        </div>
        <div className="bg-[#0f172a]/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Hidden</p>
          <p className="text-2xl font-bold text-amber-400">{hiddenCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        
        {/* LEFT: Upload Form (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            {/* Top decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-500 to-blue-500 opacity-50"></div>
            
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Database className="text-amber-500" size={24} /> Smart Bulk Import
              </h3>
            </div>
            
            <div className="text-slate-400 p-4 border border-slate-800 rounded-xl text-center">Smart Bulk Import requires Google Drive and has been disabled.</div>
          </div>
        </div>

        {/* RIGHT: Recent Materials (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6 shadow-xl flex flex-col h-full max-h-[1200px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-display font-bold text-white">Recent Uploads</h3>
              <div className="px-3 py-1 bg-slate-800 rounded-full text-xs font-semibold text-slate-300">
                {materials.length} Total
              </div>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search materials..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select value={filterPortal} onChange={e => setFilterPortal(e.target.value)} className="bg-[#020617] border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
                  <option value="All">All Portals</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="UTME">UTME</option>
                  <option value="Post-UTME">Post-UTME</option>
                </select>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-[#020617] border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
                  <option value="All">All Types</option>
                  <option value="pdf">PDF</option>
                  <option value="pdf">Document</option>
                  <option value="past_question">Past Question</option>
                  <option value="assignment">Assignment</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-[#020617] border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
                  <option value="All">All Status</option>
                  <option value="Published">Published</option>
                  <option value="Hidden">Hidden</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
              {loading ? (
                <div className="text-center py-10">
                  <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-400 text-sm">Loading repository...</p>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
                  <BookOpen size={32} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium text-sm">No materials found.</p>
                </div>
              ) : (
                filteredMaterials.map((m) => (
                  <motion.div 
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#020617] border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700 transition-colors group relative overflow-hidden"
                  >
                    {!m.is_published && (
                      <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                        <div className="absolute top-[10px] -right-[18px] bg-slate-700 text-[9px] font-bold uppercase tracking-wider text-white py-0.5 px-6 rotate-45">
                          Draft
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-4">
                      {/* Thumbnail or Icon */}
                      <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center relative">
                        {m.thumbnail_url ? (
                          <img loading="lazy" src={m.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getIcon(m.file_type)
                        )}
                        {m.file_type === 'pdf' && m.thumbnail_url && (
                          <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                            <PlayCircle size={20} className="text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold font-display text-sm truncate pr-4">{m.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-slate-400 truncate max-w-[120px]">{m.subject}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            m.portal === 'UTME' ? 'bg-purple-500/10 text-purple-400' :
                            m.portal === 'Post-UTME' ? 'bg-cyan-500/10 text-cyan-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>
                            {m.portal}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                            <Calendar size={12} />
                            {new Date(m.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800/50">
                      <button 
                        onClick={() => togglePublish(m.id, m.is_published)}
                        className={`p-1.5 rounded-lg transition-colors ${m.is_published ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-800'}`}
                        title={m.is_published ? "Unpublish" : "Publish"}
                      >
                        {m.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button 
                        onClick={() => {
                          setEditingId(m.id);
                          setMaterialType(m.file_type);
                          setPortal(m.portal || 'Undergraduate');
                          setSubject(m.subject || '');
                          setCourseCode(m.course_code || '');
                          setSemester(m.semester || 'First Semester');
                          setTopic(m.topic || '');
                          setTitle(m.title || '');
                          setDescription(m.description || '');
                                                    if (m.file_type === 'pdf') {
                            setUploadMethod('link');
                            setPdfLink(m.file_url || '');
                          }
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteMaterial(m.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
