import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, BookOpen, CheckCircle, Bookmark, Share2, 
  ChevronLeft, ChevronRight, Check, Copy, Maximize,
  List, X, Play, Music, Lock
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { supabase } from '../../supabaseClient';

interface StudentLessonViewerProps {
  material: any;
  onClose: () => void;
  onNavigateToSibling?: (siblingId: string) => void;
}

export default function StudentLessonViewer({ material, onClose, onNavigateToSibling }: StudentLessonViewerProps) {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [publishSettings, setPublishSettings] = useState<any>(null);
  const [courseName, setCourseName] = useState(material.course_code);
  const [siblings, setSiblings] = useState<any[]>([]);
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Scroll Progress
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo(0, 0);
    }
    try {
      if (material.description) {
        const parsed = JSON.parse(material.description);
        if (Array.isArray(parsed)) {
          setBlocks(parsed);
        } else if (parsed && parsed.blocks) {
          setBlocks(parsed.blocks || []);
          setAttachments(parsed.attachments || []);
          setPublishSettings(parsed.publishSettings || null);
        } else {
          setBlocks([{ id: '1', type: 'main', content: material.description }]);
        }
      }
    } catch (e) {
      setBlocks([{ id: '1', type: 'main', content: material.description }]);
    }
    
    fetchContext();
  }, [material]);

  const fetchContext = async () => {
    if (!supabase) return;
    try {
      const { data: courseData } = await supabase
        .from('courses')
        .select('title')
        .eq('course_code', material.course_code)
        .single();
      if (courseData) setCourseName(courseData.title);

      const { data: sibs } = await supabase
        .from('materials')
        .select('id, title')
        .eq('course_code', material.course_code)
        .eq('topic', material.topic)
        .eq('file_type', 'lesson')
        .eq('is_published', true)
        .order('created_at', { ascending: true });
      if (sibs) setSiblings(sibs);
    } catch (e) {
      console.error(e);
    }
  };

  const currentIndex = siblings.findIndex(s => s.id === material.id);
  const prevLesson = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const nextLesson = currentIndex !== -1 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Estimate reading time: ~200 words per minute + 1 min per media block
  const getEstimatedTime = () => {
    let text = '';
    let mediaCount = 0;
    blocks.forEach(b => {
      if (b.type === 'image' || b.type === 'video' || b.type === 'audio' || b.type === 'diagram') {
        mediaCount++;
      } else if (b.content) {
        text += ' ' + b.content;
      }
    });
    const words = text.trim().split(/\s+/).length;
    const time = Math.ceil(words / 200) + mediaCount;
    return time || 1;
  };

  const navigateToSibling = (siblingId: string) => {
    // In a full router app we'd push state, but here we can't easily replace the `material` prop 
    // without lifting state up. We will simulate it by doing nothing for now or dispatching an event?
    // Wait, the prompt says "Add navigation... This only updates the UI for now." or actually:
    // "Add navigation: Previous Lesson, Next Lesson... Back to Topic... This only updates the UI for now."
    // Let's just make them buttons.
    console.log("Navigating to", siblingId);
  };

  const renderBlock = (block: any) => {
    switch (block.type) {
      case 'title':
        return <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-8 leading-tight">{block.content}</h1>;
      case 'intro':
        return (
          <div className="text-xl md:text-2xl text-slate-300 font-body leading-relaxed mb-8 border-l-4 border-indigo-500 pl-6 py-2 bg-indigo-500/5 rounded-r-2xl">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{block.content}</ReactMarkdown>
          </div>
        );
      case 'main':
      case 'summary':
        return (
          <div className="prose prose-invert prose-slate max-w-none mb-8 text-slate-300 font-body leading-relaxed text-lg overflow-x-auto custom-scrollbar">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{block.content}</ReactMarkdown>
          </div>
        );
      case 'example':
        return (
          <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6 md:p-8 mb-8 shadow-lg">
            <h4 className="text-amber-400 font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2"><BookOpen size={16} /> Worked Example</h4>
            <div className="prose prose-invert max-w-none text-slate-200">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{block.content}</ReactMarkdown>
            </div>
          </div>
        );
      case 'formula':
        return (
          <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-6 mb-8 overflow-x-auto text-center flex items-center justify-center min-h-[100px]">
            <div className="text-xl md:text-2xl text-indigo-100">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{block.content}</ReactMarkdown>
            </div>
          </div>
        );
      case 'image':
      case 'diagram':
        return block.fileUrl ? (
          <div className="mb-8">
            <div 
              className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 cursor-zoom-in group"
              onClick={() => setLightboxImage(block.fileUrl)}
            >
              <img src={block.fileUrl} alt="Lesson illustration" className="w-full max-h-[600px] object-contain group-hover:scale-[1.01] transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 bg-slate-900/80 backdrop-blur text-white p-3 rounded-full shadow-xl transition-opacity transform scale-90 group-hover:scale-100 duration-300">
                  <Maximize size={24} />
                </div>
              </div>
            </div>
            {block.content && <p className="text-center text-sm text-slate-500 mt-3">{block.content}</p>}
          </div>
        ) : null;
      case 'audio':
        return block.fileUrl ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 mb-8 shadow-lg">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center shrink-0">
              <Music className="text-indigo-400" size={20} />
            </div>
            <div className="flex-1">
              {block.content && <p className="text-sm font-medium text-slate-300 mb-2">{block.content}</p>}
              <audio controls className="w-full outline-none h-10 custom-audio" src={block.fileUrl} />
            </div>
          </div>
        ) : null;
      case 'video':
        return (
          <div className="mb-8">
            {block.content && (block.content.includes('youtube.com') || block.content.includes('youtu.be')) ? (
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-900">
                <iframe 
                  width="100%" height="100%" 
                  src={`https://www.youtube.com/embed/${block.content.split('v=')[1]?.split('&')[0] || block.content.split('youtu.be/')[1]}`} 
                  title="YouTube video player" frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                ></iframe>
              </div>
            ) : block.fileUrl ? (
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-900">
                <video controls className="w-full h-full object-contain bg-black" src={block.fileUrl} />
              </div>
            ) : null}
            {block.fileUrl && block.content && !block.content.includes('youtube.com') && !block.content.includes('youtu.be') && (
              <p className="text-center text-sm text-slate-500 mt-3">{block.content}</p>
            )}
          </div>
        );
      case 'references':
        return (
          <div className="mt-16 pt-8 border-t border-slate-800">
            <h4 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-4">References</h4>
            <div className="prose prose-invert prose-sm text-slate-500">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{block.content}</ReactMarkdown>
            </div>
          </div>
        );
      default:
        return null;
    }
  };


  const isPremiumRequired = publishSettings?.isPremium;
  const isLocked = publishSettings?.isLocked;
  // Simulating the user doesn't have premium for demo purposes:
  const userHasPremium = false;

  if (isPremiumRequired && !userHasPremium) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500 mb-6">
          <BookOpen size={40} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3 text-center">Premium Access Required</h2>
        <p className="text-slate-400 text-center max-w-md mb-8">This content is available only to Undergraduate Premium members.</p>
        <button className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold px-8 py-3 rounded-xl transition-colors">
          Upgrade to Premium
        </button>
        <button onClick={onClose} className="mt-8 text-slate-500 hover:text-white transition-colors">Go Back</button>
      </motion.div>
    );
  }

  if (isLocked) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-amber-500"></div>
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{material.title}</h2>
          <p className="text-slate-400 mb-8">{blocks.find((b:any) => b.type === 'intro')?.content?.substring(0, 100)}...</p>
          <button disabled className="w-full bg-slate-800 text-slate-500 font-bold py-3 rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
            <Lock size={18} /> Content Locked
          </button>
        </div>
        <button onClick={onClose} className="mt-8 text-slate-500 hover:text-white transition-colors">Go Back</button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 bg-[#020617] flex flex-col overflow-hidden"
    >
      {/* Progress Bar */}
      <motion.div className="h-1 bg-indigo-500 origin-left z-50 fixed top-0 left-0 right-0" style={{ scaleX }} />

      {/* Header */}
      <header className="flex-shrink-0 bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
            <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-400 truncate font-medium">
              <span className="hidden sm:inline hover:text-white cursor-pointer truncate" onClick={onClose}>{courseName}</span>
              <span className="hidden sm:inline text-slate-600">/</span>
              <span className="hover:text-white cursor-pointer truncate" onClick={onClose}>{material.topic}</span>
              <span className="text-slate-600">/</span>
              <span className="text-white font-bold truncate">{material.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest mr-4">
              <span className="flex items-center gap-1.5"><BookOpen size={14} /> {getEstimatedTime()} MIN READ</span>
            </div>
            <button onClick={() => setIsBookmarked(!isBookmarked)} className={`p-2 rounded-xl transition-colors ${isBookmarked ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`} title="Bookmark">
              <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
            </button>
            <button onClick={handleCopyLink} className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors relative" title="Share">
              {linkCopied ? <Check size={18} className="text-emerald-400" /> : <Share2 size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative" ref={containerRef}>
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12 md:py-20">
          
          <div className="mb-12">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest">{material.topic}</span>
              <span className="text-slate-500 text-sm font-medium">{getEstimatedTime()} min read</span>
            </div>
            {!blocks.find(b => b.type === 'title') && (
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">{material.title}</h1>
            )}
          </div>

          <div className="lesson-content">
            {blocks.map((block, i) => (
              <React.Fragment key={block.id || i}>
                {renderBlock(block)}
              </React.Fragment>
            ))}
          </div>


          {/* Lesson Materials / Attachments */}
          {attachments.length > 0 && (
            <div className="mt-16 pt-12 border-t border-slate-800">
              <h3 className="text-2xl font-display font-bold text-white mb-6">Lesson Materials</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {attachments.filter(a => a.type !== 'video' && a.type !== 'audio').map((file) => (
                  <a 
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl hover:border-indigo-500 hover:bg-slate-800/80 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center text-indigo-400 shrink-0">
                      <Bookmark size={20} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{file.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{file.category} • {file.type}</p>
                    </div>
                    <div className="text-slate-500 group-hover:text-white transition-colors p-2">
                      <Share2 size={16} />
                    </div>
                  </a>
                ))}
              </div>

              {/* Inline Media Render */}
              <div className="space-y-6">
                {attachments.filter(a => a.type === 'video' || a.type === 'audio').map((media) => (
                  <div key={media.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
                    <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">{media.name} ({media.category})</h4>
                    {media.type === 'video' ? (
                       (media.url.includes('youtube.com') || media.url.includes('youtu.be')) ? (
                          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                            <iframe 
                              width="100%" height="100%" 
                              src={`https://www.youtube.com/embed/${media.url.split('v=')[1]?.split('&')[0] || media.url.split('youtu.be/')[1]}`} 
                              title="YouTube video" frameBorder="0" 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                            ></iframe>
                          </div>
                       ) : (media.url.includes('vimeo.com')) ? (
                          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                            <iframe 
                              src={`https://player.vimeo.com/video/${media.url.split('/').pop()}`} 
                              width="100%" height="100%" frameBorder="0" 
                              allow="autoplay; fullscreen; picture-in-picture" allowFullScreen
                            ></iframe>
                          </div>
                       ) : (
                          <video controls className="w-full h-auto max-h-[500px] object-contain rounded-xl bg-black" src={media.url} />
                       )
                    ) : (
                      <audio controls className="w-full custom-audio outline-none" src={media.url} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lesson Completion & Actions */}
          <div className="mt-24 pt-12 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <button 
                onClick={() => setIsCompleted(!isCompleted)}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all w-full sm:w-auto justify-center ${isCompleted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl hover:shadow-indigo-500/20'}`}
              >
                {isCompleted ? <CheckCircle size={20} className="fill-emerald-400 text-emerald-950" /> : <CheckCircle size={20} />}
                {isCompleted ? 'Completed' : 'Mark as Completed'}
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => prevLesson && navigateToSibling(prevLesson.id)}
                  disabled={!prevLesson}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} /> Prev
                </button>
                <button 
                  onClick={() => nextLesson && navigateToSibling(nextLesson.id)}
                  disabled={!nextLesson}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            </div>
            
            <div className="mt-8 text-center sm:text-left">
              <button onClick={onClose} className="text-slate-500 hover:text-white text-sm font-medium transition-colors">
                ← Back to {courseName}
              </button>
            </div>
          </div>
          
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur flex items-center justify-center p-4 sm:p-12 cursor-zoom-out"
            onClick={() => setLightboxImage(null)}
          >
            <button className="absolute top-6 right-6 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors">
              <X size={24} />
            </button>
            <img 
              src={lightboxImage} 
              alt="Expanded view" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
