import React, { useState, useRef } from 'react';
import { Smile, Paperclip, Send, Mic, File as FileIcon, X } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface ChatComposerProps {
  onSend: (text: string, files?: File[]) => void;
  recordingState: string;
  startRecording: () => void;
  cancelRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  sendRecording: (base64: string, duration: number) => void;
  isAtBottomRef: React.MutableRefObject<boolean>;
  recordingDuration?: number;
  scrollToBottom: () => void;
  inputTextValue?: string;
  onMentionQuery?: (query: { active: boolean, text: string, index: number }) => void;
  onTyping?: () => void;
}

export default function ChatComposer({
  onSend,
  recordingState,
  startRecording,
  cancelRecording,
  sendRecording,
  isAtBottomRef,
  scrollToBottom,
  inputTextValue = '',
  onMentionQuery,
  onTyping
}: ChatComposerProps) {
  const [inputText, setInputText] = useState(inputTextValue);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  React.useEffect(() => {
    if (inputTextValue) {
      setInputText(inputTextValue);
    }
  }, [inputTextValue]);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEmojiClick = (emojiObj: any) => {
    setInputText(prev => prev + emojiObj.emoji);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() && selectedFiles.length === 0) return;
    
    onSend(inputText, selectedFiles.length > 0 ? selectedFiles : undefined);
    
    setInputText('');
    setSelectedFiles([]);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    if (onTyping) onTyping();
    
    if (onMentionQuery) {
      const cursor = e.target.selectionStart || 0;
      const textBeforeCursor = val.slice(0, cursor);
      const match = textBeforeCursor.match(/@([a-zA-Z0-9_ ]*)$/);
      if (match) {
        onMentionQuery({ active: true, text: match[1], index: cursor });
      } else {
        onMentionQuery({ active: false, text: '', index: 0 });
      }
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 128)}px`; 
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Drag and drop handlers for the composer area itself, optionally document body
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  // Paste image handler
  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      setSelectedFiles(prev => [...prev, ...Array.from(e.clipboardData.files)]);
    }
  };

  if (recordingState !== 'idle') {
    return (
      <VoiceRecorder 
        onSend={(base64, duration) => sendRecording(base64, duration)} 
        onCancel={cancelRecording} 
      />
    );
  }

  return (
    <div 
      className={`relative w-full rounded-2xl transition-all ${isDragging ? 'bg-emerald-500/10 border-2 border-dashed border-emerald-500' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* File Previews */}
      {selectedFiles.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-full p-3 bg-[#1e293b] border border-slate-700/50 rounded-2xl shadow-xl flex gap-3 overflow-x-auto custom-scrollbar max-h-[140px]">
          {selectedFiles.map((file, idx) => (
            <div key={idx} className="relative w-24 h-24 rounded-lg bg-slate-800 border border-slate-700 flex-shrink-0 flex flex-col items-center justify-center overflow-hidden group">
              {file.type.startsWith('image/') ? (
                <img loading="lazy" src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <>
                  <FileIcon size={32} className="text-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-300 text-center px-1 truncate w-full" title={file.name}>{file.name}</span>
                </>
              )}
              <button 
                onClick={() => removeFile(idx)}
                className="absolute top-1 right-1 w-6 h-6 bg-rose-500/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-50">
          <EmojiPicker onEmojiClick={handleEmojiClick} theme={Theme.DARK} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2 w-full">
        <button 
          type="button" 
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-3 text-slate-400 hover:text-emerald-400 transition-colors hidden sm:block"
        >
          <Smile size={24} />
        </button>
        
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
        />
        
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <Paperclip size={24} />
        </button>
        
        <div className="flex-1 bg-[#1e293b] rounded-2xl border border-slate-700/50 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all flex items-end">
          <textarea
            ref={textareaRef}
            onFocus={() => {
              if (isAtBottomRef.current) setTimeout(scrollToBottom, 300);
            }}
            value={inputText}
            onChange={handleInput}
            onPaste={handlePaste}
            placeholder="Type a message or paste a file..."
            className="w-full bg-transparent text-slate-200 placeholder:text-slate-500 px-4 py-3 resize-none focus:outline-none custom-scrollbar min-h-[48px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            style={{ overflowY: inputText.split('\n').length > 4 ? 'auto' : 'hidden' }}
          />
        </div>
        
        {inputText.trim() || selectedFiles.length > 0 ? (
          <button type="submit" className="p-3 sm:p-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full transition-colors shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <Send size={20} className="ml-1" />
          </button>
        ) : (
          <button type="button" onClick={startRecording} className="p-3 sm:p-4 bg-[#1e293b] text-slate-400 hover:text-white rounded-full transition-colors flex-shrink-0">
            <Mic size={24} />
          </button>
        )}
      </form>
    </div>
  );
}
