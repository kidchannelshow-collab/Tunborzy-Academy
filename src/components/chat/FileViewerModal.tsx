import React, { useState, useEffect } from 'react';
import { X, Download, Music, ZoomIn, ZoomOut, FileType, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FileViewerModalProps {
  file: {
    name: string;
    url: string;
    type: string; // 'image', 'video', 'audio', 'pdf', 'doc', etc.
    size: string;
    time?: string;
    sender?: string;
  } | null;
  onClose: () => void;
}

export default function FileViewerModal({ file, onClose }: FileViewerModalProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    setScale(1);
  }, [file]);

  if (!file) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    if (file.type === 'pdf') {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = file.url;
      document.body.appendChild(iframe);
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }
  };

  const renderContent = () => {
    if (file.type === 'image') {
      return (
        <div className="flex-1 w-full h-full flex items-center justify-center overflow-auto relative">
          <motion.img 
            src={file.url} 
            alt={file.name} 
            className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing"
            style={{ scale }}
            drag
            dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
          />
        </div>
      );
    }
    
    if (file.type === 'video') {
      return (
        <div className="flex-1 w-full h-full flex items-center justify-center bg-black">
          <video controls autoPlay className="w-full h-full max-h-[85vh]">
            <source src={file.url} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (file.type === 'audio') {
      return (
        <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-slate-900 gap-6">
          <div className="w-32 h-32 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
             <Music size={64} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-semibold text-white max-w-md text-center truncate px-4">{file.name}</h2>
          <audio controls autoPlay className="w-full max-w-md mt-8">
            <source src={file.url} />
          </audio>
        </div>
      );
    }

    if (file.type === 'pdf') {
      return (
        <div className="flex-1 w-full h-full bg-slate-200">
           {/* We use an iframe or embed for PDF. Note: On mobile iframe PDF might not work perfectly without a viewer */}
           <iframe src={`${file.url}#toolbar=0&navpanes=0`} className="w-full h-full border-none" />
        </div>
      );
    }

    // Generic document fallback
    return (
      <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-slate-900 p-8 text-center">
        <FileType size={80} className="text-slate-500 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2 break-all">{file.name}</h2>
        <p className="text-slate-400 mb-8">{file.size} • {file.type.toUpperCase()} Document</p>
        <button onClick={handleDownload} className="flex items-center gap-2 bg-emerald-500 text-slate-950 px-6 py-3 rounded-xl font-semibold hover:bg-emerald-400 transition-colors">
          <Download size={20} /> Download to View
        </button>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {file && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-4 overflow-hidden">
              <button onClick={onClose} className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors shrink-0">
                <X size={24} />
              </button>
              <div className="flex flex-col min-w-0">
                <h3 className="text-white font-medium truncate">{file.name}</h3>
                <p className="text-white/50 text-xs">{file.sender ? `${file.sender} • ` : ''}{file.time ? `${file.time} • ` : ''}{file.size}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {file.type === 'image' && (
                <>
                  <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors hidden sm:block">
                    <ZoomOut size={20} />
                  </button>
                  <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors hidden sm:block">
                    <ZoomIn size={20} />
                  </button>
                </>
              )}
              {file.type === 'pdf' && (
                <button onClick={handlePrint} className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors hidden sm:block" title="Print">
                  <Printer size={20} />
                </button>
              )}
              <button onClick={handleDownload} className="p-2 text-white/70 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/40 rounded-lg transition-colors" title="Download">
                <Download size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 w-full relative overflow-hidden flex items-center justify-center p-2 sm:p-8">
            {renderContent()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
