import StudentLessonViewer from "./StudentLessonViewer";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize, Bookmark, Edit3, X, Save } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useProfile } from '../../lib/useProfile';

interface MaterialViewerProps {
  material: any;
  onClose: () => void;
}

export default function MaterialViewer({ material, onClose }: MaterialViewerProps) {
  const { profile } = useProfile();
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isSaved, setIsSaved] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if saved
    async function checkSaved() {
      if (!supabase || !profile) return;
      try {
        const { data } = await supabase
          .from('saved_materials')
          .select('id')
          .eq('material_id', material.id)
          .eq('user_id', profile.id)
          .single();
        if (data) setIsSaved(true);
      } catch(e) { console.error(e); }
    }
    
    // Load notes
    async function loadNotes() {
      if (!supabase || !profile) return;
      try {
        const { data } = await supabase
          .from('material_notes')
          .select('content')
          .eq('material_id', material.id)
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (data) setNotes(data.content);
      } catch(e) { console.error(e); }
    }

    checkSaved();
    loadNotes();
  }, [material.id, profile]);

  const toggleSave = async () => {
    if (!supabase || !profile) {
      setIsSaved(!isSaved);
      return;
    }
    try {
      if (isSaved) {
        await supabase.from('saved_materials').delete().eq('material_id', material.id).eq('user_id', profile.id);
        setIsSaved(false);
      } else {
        await supabase.from('saved_materials').insert({ material_id: material.id, user_id: profile.id });
        setIsSaved(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveNotes = async () => {
    if (!supabase || !profile) return;
    try {
      await supabase.from('material_notes').insert({
        material_id: material.id,
        user_id: profile.id,
        content: notes
      });
      setShowNotes(false);
    } catch (err) {
      console.error(err);
    }
  };

  

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  
  if (material.file_type === 'lesson') {
    return <StudentLessonViewer material={material} onClose={onClose} />;
  }

  return (
    <motion.div
      key="material-viewer"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      ref={viewerRef}
      className="w-full h-[calc(100dvh-120px)] flex flex-col bg-[#0f172a]/95 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden z-50 fixed inset-0 m-4 sm:m-8 lg:m-12"
      style={isFullscreen ? { margin: 0, height: '100dvh', borderRadius: 0 } : {}}
    >
      {/* Viewer Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#020617]/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h3 className="text-white font-display font-bold text-sm sm:text-base truncate max-w-[200px] sm:max-w-md">
              {material.title}
            </h3>
            <p className="text-xs text-slate-400 font-body uppercase tracking-wider">{material.file_type} • {material.file_size}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {material.file_type === 'pdf' && (
            <div className="hidden sm:flex items-center gap-2 bg-slate-900 rounded-lg p-1 border border-slate-800">
              <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"><ZoomOut size={16} /></button>
              <span className="text-xs font-mono text-slate-300 w-12 text-center">{zoomLevel}%</span>
              <button onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"><ZoomIn size={16} /></button>
            </div>
          )}
          
          <button onClick={() => setShowNotes(!showNotes)} className={`p-2 rounded-lg transition-colors hidden sm:block ${showNotes ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} title="Notes">
            <Edit3 size={18} />
          </button>
          
          <button onClick={toggleSave} className={`p-2 rounded-lg transition-colors hidden sm:block ${isSaved ? 'text-amber-500 bg-amber-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} title="Save">
            <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
          </button>
          
          <button onClick={toggleFullscreen} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors hidden sm:block">
            <Maximize size={18} />
          </button>
          
          
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 bg-[#020617] relative overflow-auto flex items-center justify-center p-4">
          
          {material.file_type === 'pdf' && (
            <div 
              className="bg-white rounded shadow-2xl transition-all duration-300 flex flex-col"
              style={{ width: `${(zoomLevel / 100) * 100}%`, maxWidth: '900px', minHeight: `${(zoomLevel / 100) * 800}px` }}
            >
              <div className="p-12 border-b border-gray-200 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{material.title}</h1>
                <h2 className="text-xl text-gray-600 mb-8">{material.lecturer_name || material.subject}</h2>
                <div className="space-y-6 max-w-2xl mx-auto text-left opacity-30 pointer-events-none">
                  <div className="h-4 bg-gray-400 rounded w-full"></div>
                  <div className="h-4 bg-gray-400 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-400 rounded w-4/6"></div>
                  <div className="h-4 bg-gray-400 rounded w-full mt-8"></div>
                  <div className="h-4 bg-gray-400 rounded w-full"></div>
                  <div className="h-4 bg-gray-400 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-400 rounded w-full"></div>
                  <div className="h-4 bg-gray-400 rounded w-5/6"></div>
                </div>
                <div className="mt-12 text-slate-500 font-medium">
                  PDF Preview (Simulated for Demo)
                </div>
              </div>
            </div>
          )}

          {material.file_type === 'audio' && (
            <div className="w-full max-w-md bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl text-center">
               <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <div className="w-16 h-16 bg-indigo-500 rounded-full animate-pulse"></div>
               </div>
               <h3 className="text-xl font-bold text-white mb-2">{material.title}</h3>
               <p className="text-slate-400 mb-8">{material.lecturer_name}</p>
               <audio controlsList="noview" onContextMenu={(e) => e.preventDefault()} src={material.file_url} controls className="w-full custom-audio" />
            </div>
          )}

          {['ppt', 'doc', 'zip', 'link', 'image'].includes(material.file_type) && (
            <div className="w-full max-w-md bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl text-center">
               <div className="text-6xl mb-6">📄</div>
               <h3 className="text-xl font-bold text-white mb-2">{material.title}</h3>
               <p className="text-slate-400 mb-8">This file type ({material.file_type}) cannot be viewed directly in the browser.</p>
               
            </div>
          )}

        </div>

        {/* Notes Panel */}
        <AnimatePresence>
          {showNotes && (
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }}
              className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col absolute right-0 top-0 bottom-0 z-20 shadow-2xl"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h4 className="text-white font-bold flex items-center gap-2"><Edit3 size={16} className="text-indigo-400"/> Personal Notes</h4>
                <button onClick={() => setShowNotes(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
              </div>
              <div className="flex-1 p-4">
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Take notes while studying... These will be saved securely to your profile."
                  className="w-full h-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
                ></textarea>
              </div>
              <div className="p-4 border-t border-slate-800">
                <button 
                  onClick={saveNotes}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Save size={16} /> Save Notes
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
