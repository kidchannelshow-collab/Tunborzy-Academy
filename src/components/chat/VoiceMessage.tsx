import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RefreshCw } from 'lucide-react';

interface VoiceMessageProps {
  audioBase64: string;
  duration: number; // in seconds
  isMe: boolean;
  messageId: string;
  sender: string;
  time: string;
  readStatus?: 'uploading' | 'failed' | 'sent' | 'delivered' | 'read';
  onRetry?: () => void;
}

export default function VoiceMessage({ audioBase64, duration: initialDuration, isMe, messageId, sender, time, readStatus, onRetry }: VoiceMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [hasError, setHasError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>(0);
  const waveformRef = useRef<HTMLDivElement>(null);
  
  // Generate a consistent pseudo-random waveform for this message
  const waveformBars = useMemo(() => {
    const seed = messageId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const bars = [];
    for (let i = 0; i < 40; i++) {
      const pseudoRandom = Math.abs(Math.sin(seed + i)) * 100;
      bars.push(15 + (pseudoRandom % 85));
    }
    return bars;
  }, [messageId]);

  useEffect(() => {
    setHasError(false);
    
    // Check if valid audio source
    if (!audioBase64 || audioBase64.trim() === '') {
       if (readStatus !== 'uploading') setHasError(true);
       return;
    }
    
    let audio: HTMLAudioElement;
    try {
      audio = new Audio(audioBase64);
      audio.preload = 'metadata';
      audioRef.current = audio;
      
      const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
      
      const handleLoadedMetadata = () => {
        if (audio.duration && audio.duration !== Infinity && !isNaN(audio.duration)) {
          setDuration(Math.round(audio.duration));
        }
      };
      
      const handleError = () => {
        console.error("Audio playback error for:", messageId);
        setHasError(true);
      };
      
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('error', handleError);
      
      return () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('error', handleError);
        audio.pause();
        audio.src = '';
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
    } catch (e) {
      console.error("Error creating audio:", e);
      setHasError(true);
    }
  }, [audioBase64, readStatus, messageId]);

  const updateProgress = () => {
    if (!audioRef.current) return;
    
    // Only update if not currently dragging
    if (!isDragging) {
      const dur = audioRef.current.duration || duration;
      if (dur > 0 && !isNaN(dur)) {
        setCurrentTime(audioRef.current.currentTime);
        setProgress(audioRef.current.currentTime / dur);
      }
    }
    
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const togglePlay = () => {
    if (hasError || readStatus === 'uploading' || readStatus === 'failed') return;
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    } else {
      audioRef.current.playbackRate = playbackRate;
      
      // If ended, restart
      if (progress >= 0.99) {
        audioRef.current.currentTime = 0;
        setProgress(0);
        setCurrentTime(0);
      }
      
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        animationRef.current = requestAnimationFrame(updateProgress);
      }).catch(e => {
        console.error("Playback failed:", e);
        // Retry logic on mobile where play must be triggered by user interaction
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().then(() => {
              setIsPlaying(true);
              animationRef.current = requestAnimationFrame(updateProgress);
            }).catch(err => setHasError(true));
          }
        }, 100);
      });
    }
  };

  const toggleSpeed = () => {
    if (!audioRef.current) return;
    const nextRate = playbackRate === 1 ? 1.5 : (playbackRate === 1.5 ? 2 : 1);
    
    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement> | any) => {
    if (hasError || !audioRef.current || !waveformRef.current || readStatus === 'uploading') return;
    
    const rect = waveformRef.current.getBoundingClientRect();
    // Support both mouse and touch events
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    if (clientX === undefined) return;
    
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    
    const dur = audioRef.current.duration || duration || 1;
    
    setProgress(percentage);
    setCurrentTime(percentage * dur);
    
    // Only update audio time if not dragging (or if we want live scrubbing)
    audioRef.current.currentTime = percentage * dur;
  };
  
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleSeek(e);
  };
  
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleSeek(e);
    }
  };
  
  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Extract initials for the avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col min-w-[240px] max-w-sm pt-1 pb-1" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-3">
        {/* Profile Avatar */}
        <div className="relative">
          <div className={`w-11 h-11 rounded-full flex flex-shrink-0 items-center justify-center font-bold text-white shadow-md ${isMe ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-slate-600 to-slate-800'}`}>
            {getInitials(sender)}
          </div>
          {/* Micro icon overlay */}
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${isMe ? 'bg-emerald-600 border border-emerald-800' : 'bg-slate-700 border border-slate-900'}`}>
             🎤
          </div>
        </div>

        {/* Play/Pause Button */}
        <button 
          onClick={readStatus === 'failed' ? onRetry : togglePlay}
          disabled={hasError && readStatus !== 'failed'}
          className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-md ${
            isMe ? 'bg-emerald-50 text-emerald-700 hover:bg-white' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
          } ${(hasError && readStatus !== 'failed') || readStatus === 'uploading' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {readStatus === 'uploading' ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : readStatus === 'failed' ? (
            <RefreshCw size={20} className="fill-current" />
          ) : isPlaying ? (
            <Pause size={20} className="fill-current" />
          ) : (
            <Play size={20} className="fill-current ml-1" />
          )}
        </button>
        
        {/* Waveform and Progress */}
        <div className="flex-1 flex flex-col justify-center gap-1 overflow-hidden select-none">
          <div 
            ref={waveformRef}
            className={`flex items-center gap-[2px] h-7 relative touch-none ${!hasError && readStatus !== 'uploading' ? 'cursor-pointer' : 'opacity-50'}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {waveformBars.map((h, i) => {
              const barProgress = i / waveformBars.length;
              const isPlayed = barProgress <= progress;
              return (
                <div 
                  key={i} 
                  className={`flex-1 rounded-full transition-colors duration-75 min-w-[2px] ${
                    isPlayed 
                      ? (isMe ? 'bg-emerald-100' : 'bg-emerald-400') 
                      : (isMe ? 'bg-emerald-800/40' : 'bg-slate-600')
                  }`}
                  style={{ height: `${h}%`, minHeight: '3px' }}
                />
              );
            })}
            
            {/* Scrubber thumb */}
            <div 
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-sm pointer-events-none transition-all duration-75 ${
                isMe ? 'bg-white shadow-black/20' : 'bg-emerald-400 shadow-black/40'
              }`}
              style={{ left: `calc(${Math.max(0, Math.min(progress, 0.98)) * 100}% - 4px)` }}
            />
          </div>
          
          {/* Metadata Row: Time, Speed, Status */}
          <div className="flex items-center justify-between px-1 mt-0.5">
            <span className={`text-[11px] font-medium tracking-wide font-mono ${isMe ? 'text-emerald-50' : 'text-slate-400'}`}>
              {readStatus === 'uploading' ? 'Uploading...' : 
               readStatus === 'failed' ? 'Failed' : 
               hasError ? 'Error loading' : 
               (isPlaying || progress > 0 ? formatTime(currentTime) : formatTime(duration))}
            </span>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleSpeed}
                disabled={hasError || readStatus === 'uploading' || readStatus === 'failed'}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors ${
                  isMe ? 'bg-emerald-800/30 text-emerald-50 hover:bg-emerald-800/50' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                } disabled:opacity-50`}
              >
                {playbackRate}x
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
