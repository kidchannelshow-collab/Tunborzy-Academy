import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Search, Edit2, Trash2, Plus, X, UploadCloud, Archive, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useProfile } from '../../lib/useProfile';

export default function CourseManagement() {
  const { profile } = useProfile();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [description, setDescription] = useState('');
  const [portal, setPortal] = useState('Undergraduate');
  const [department, setDepartment] = useState('');
  const [faculty, setFaculty] = useState('');
  const [level, setLevel] = useState('');
  const [semester, setSemester] = useState('First Semester');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');

  useEffect(() => {
    if (profile) fetchCourses();
  }, [profile]);

  const fetchCourses = async () => {
    if (!supabase || !profile) return;
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('lecturer_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'thumbnail' | 'cover') => {
    if (!supabase) return;
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `course_images/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('tonborzy-content')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
        
      if (uploadError) {
        console.warn('Storage error, using dummy url', uploadError);
        // Fallback dummy image
        const url = type === 'thumbnail' 
          ? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80' 
          : 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80';
        if (type === 'thumbnail') setThumbnailUrl(url);
        else setCoverImageUrl(url);
        return;
      }
      
      const { data } = supabase.storage.from('tonborzy-content').getPublicUrl(filePath);
      
      if (type === 'thumbnail') setThumbnailUrl(data.publicUrl);
      else setCoverImageUrl(data.publicUrl);
      
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCourseCode('');
    setDescription('');
    setPortal('Undergraduate');
    setDepartment('');
    setFaculty('');
    setLevel('');
    setSemester('First Semester');
    setThumbnailUrl('');
    setCoverImageUrl('');
    setEditingId('');
    setIsEditing(false);
  };

  const openEditModal = (course: any) => {
    setTitle(course.title);
    setCourseCode(course.course_code || '');
    setDescription(course.description || '');
    setPortal(course.portal);
    setDepartment(course.department || '');
    setFaculty(course.faculty || '');
    setLevel(course.level || '');
    setSemester(course.semester || 'First Semester');
    setThumbnailUrl(course.thumbnail_url || '');
    setCoverImageUrl(course.cover_image_url || '');
    setEditingId(course.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !profile) return;
    
    const courseData = {
      lecturer_id: profile.id,
      title,
      course_code: courseCode,
      description,
      portal,
      department,
      faculty,
      level,
      semester,
      thumbnail_url: thumbnailUrl,
      cover_image_url: coverImageUrl
    };

    try {
      if (isEditing) {
        await supabase.from('courses').update(courseData).eq('id', editingId);
      } else {
        await supabase.from('courses').insert(courseData);
      }
      setShowModal(false);
      resetForm();
      fetchCourses();
    } catch (err) {
      console.error(err);
      alert('Failed to save course. Check console.');
    }
  };

  const toggleArchive = async (id: string, currentStatus: boolean) => {
    if (!supabase) return;
    try {
      await supabase.from('courses').update({ is_archived: !currentStatus }).eq('id', id);
      setCourses(courses.map(c => c.id === id ? { ...c, is_archived: !currentStatus } : c));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this course? This action cannot be undone.')) return;
    if (!supabase) return;
    try {
      await supabase.from('courses').delete().eq('id', id);
      setCourses(courses.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.course_code || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto pb-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Course Management</h1>
          <p className="text-slate-400">Create and manage your courses across all portals.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-action font-bold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Create Course
        </button>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-4 flex items-center justify-between shadow-lg">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses..." 
            className="w-full bg-[#020617]/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading courses...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-[#0f172a] border border-slate-800 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
            <BookOpen size={24} className="text-slate-500" />
          </div>
          <h3 className="text-xl font-display font-bold text-white mb-2">No courses found</h3>
          <p className="text-slate-400 max-w-md">Get started by creating your first course to begin sharing materials and chats with students.</p>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="mt-6 text-amber-500 font-bold hover:underline">Create a Course</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <div key={course.id} className={`bg-[#0f172a] border ${course.is_archived ? 'border-slate-800 opacity-75' : 'border-slate-700 hover:border-amber-500/50'} rounded-2xl overflow-hidden transition-all flex flex-col shadow-xl group relative`}>
              
              {course.is_archived && (
                <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-sm text-slate-300 text-xs font-bold px-3 py-1 rounded-full border border-slate-700 flex items-center gap-1">
                  <Archive size={12} /> Archived
                </div>
              )}

              <div className="h-40 bg-slate-900 relative">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                    <ImageIcon size={40} />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#0f172a] to-transparent"></div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{course.portal}</span>
                  {course.course_code && (
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{course.course_code}</span>
                  )}
                </div>
                
                <h3 className="text-xl font-display font-bold text-white mb-2 line-clamp-2">{course.title}</h3>
                <p className="text-sm font-body text-slate-400 line-clamp-2 flex-1 mb-4">{course.description || 'No description provided.'}</p>
                
                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mb-6">
                  {course.department && <span>{course.department}</span>}
                  {course.level && <span>• {course.level}L</span>}
                </div>
                
                <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between">
                  <button onClick={() => toggleArchive(course.id, course.is_archived)} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-semibold">
                    <Archive size={16} /> {course.is_archived ? 'Unarchive' : 'Archive'}
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditModal(course)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" title="Edit">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => deleteCourse(course.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#0f172a]/95 backdrop-blur shrink-0 rounded-t-2xl">
                <h2 className="text-xl font-display font-bold text-white">{isEditing ? 'Edit Course' : 'Create New Course'}</h2>
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <form id="course-form" onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-bold text-slate-300">Course Title *</label>
                      <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" placeholder="e.g. Introduction to Mechanics" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-300">Course Code</label>
                      <input type="text" value={courseCode} onChange={e => setCourseCode(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" placeholder="e.g. PHY 101" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-300">Portal *</label>
                      <select required value={portal} onChange={e => setPortal(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500">
                        <option value="Undergraduate">Undergraduate</option>
                        <option value="UTME">UTME</option>
                        <option value="Post-UTME">Post-UTME</option>
                      </select>
                    </div>

                    {portal === 'Undergraduate' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-300">Faculty</label>
                          <input type="text" value={faculty} onChange={e => setFaculty(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" placeholder="e.g. Science" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-300">Department</label>
                          <input type="text" value={department} onChange={e => setDepartment(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" placeholder="e.g. Physics" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-300">Level</label>
                          <select value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500">
                            <option value="">Select Level</option>
                            <option value="100">100 Level</option>
                            <option value="200">200 Level</option>
                            <option value="300">300 Level</option>
                            <option value="400">400 Level</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-300">Semester</label>
                          <select value={semester} onChange={e => setSemester(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500">
                            <option value="First Semester">First Semester</option>
                            <option value="Second Semester">Second Semester</option>
                          </select>
                        </div>
                      </>
                    )}
                    
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-bold text-slate-300">Description</label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full h-32 bg-[#020617] border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:border-amber-500 resize-none" placeholder="Provide a brief overview of what students will learn..."></textarea>
                    </div>

                    {/* Image Uploads */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-300 flex items-center justify-between">
                        Course Thumbnail 
                        {thumbnailUrl && <span className="text-emerald-500 flex items-center gap-1 text-xs"><CheckCircle size={12}/> Uploaded</span>}
                      </label>
                      <div 
                        onClick={() => thumbnailInputRef.current?.click()}
                        className={`h-32 border-2 border-dashed ${thumbnailUrl ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 hover:border-amber-500 hover:bg-amber-500/5'} rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden`}
                      >
                        <input type="file" ref={thumbnailInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'thumbnail')} />
                        {thumbnailUrl ? (
                          <img src={thumbnailUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Thumbnail" />
                        ) : (
                          <>
                            <UploadCloud size={24} className="text-slate-500 mb-2" />
                            <span className="text-xs text-slate-400 font-medium">Upload Image (16:9)</span>
                          </>
                        )}
                        {isUploading && <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center text-amber-500 font-bold text-xs animate-pulse">Uploading...</div>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-300 flex items-center justify-between">
                        Cover Image (Optional)
                        {coverImageUrl && <span className="text-emerald-500 flex items-center gap-1 text-xs"><CheckCircle size={12}/> Uploaded</span>}
                      </label>
                      <div 
                        onClick={() => coverInputRef.current?.click()}
                        className={`h-32 border-2 border-dashed ${coverImageUrl ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 hover:border-amber-500 hover:bg-amber-500/5'} rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden`}
                      >
                        <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'cover')} />
                        {coverImageUrl ? (
                          <img src={coverImageUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Cover" />
                        ) : (
                          <>
                            <ImageIcon size={24} className="text-slate-500 mb-2" />
                            <span className="text-xs text-slate-400 font-medium">Upload Banner Image</span>
                          </>
                        )}
                        {isUploading && <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center text-amber-500 font-bold text-xs animate-pulse">Uploading...</div>}
                      </div>
                    </div>

                  </div>
                </form>
              </div>
              
              <div className="p-6 border-t border-slate-800 flex justify-end gap-4 shrink-0 rounded-b-2xl bg-[#0f172a]">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button form="course-form" type="submit" disabled={isUploading} className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50">
                  {isEditing ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
