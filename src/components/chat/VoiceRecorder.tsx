import React, { useState, useEffect, useRef } from 'react';
import { Mic, Trash2, Send, Pause, Play, Square, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface VoiceRecorderProps {
  onSend: (base64Audio: string, duration: number) => void;
  onCancel: () => void;
  maxDuration?: number; // in seconds
}

export default function VoiceRecorder({ onSend, onCancel, maxDuration = 60 }: VoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<'requesting' | 'recording' | 'paused' | 'preview' | 'error'>('requesting');
  const [duration, setDuration] = useState(0);
  const [audioData, setAudioData] = useState<number[]>(Array(30).fill(0));
  const [errorMessage, setErrorMessage] = useState('');
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const requestAnimationFrameRef = useRef<number>(0);
  
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewAnimationRef = useRef<number>(0);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (requestAnimationFrameRef.current) cancelAnimationFrame(requestAnimationFrameRef.current);
    if (previewAnimationRef.current) cancelAnimationFrame(previewAnimationRef.current);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
  };

  const startRecording = async () => {
    try {
      setRecordingState('requesting');
      setErrorMessage('');

      try {
        if (navigator.permissions && navigator.permissions.query) {
          const permStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (permStatus.state === 'denied') {
            setErrorMessage("Microphone access is currently denied. Please allow microphone permissions in your browser settings and try again.");
            setRecordingState('error');
            return;
          }
        }
      } catch {
        // Permissions API not supported or failed; fall through to getUserMedia.
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API or getUserMedia not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyserRef.current = analyser;
      }
      
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = '';
        }
      }
      
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        if (chunksRef.current.length === 0) return;
        const blobType = (chunksRef.current[0] as Blob).type || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });
        const url = URL.createObjectURL(blob);
        setPreviewAudioUrl(url);
        
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          setRecordedBase64(reader.result as string);
        };
      };
      
      mediaRecorder.start(100);
      setRecordingState('recording');
      
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration - 1) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
      
      if (audioContextRef.current) {
        drawWaveform();
      }
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      cleanup();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage("Microphone access was denied. Please allow microphone permissions in your browser settings to record voice notes.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage("No microphone found. Please connect a microphone and try again.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMessage("Microphone is already in use by another application.");
      } else {
        setErrorMessage(err.message || "Failed to access microphone. Please try again.");
      }
      setRecordingState('error');
    }
  };

  const drawWaveform = () => {
    if (!analyserRef.current) return;
    if (recordingState === 'paused' || recordingState === 'preview') return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const step = Math.floor(dataArray.length / 30);
    const newData = [];
    for (let i = 0; i < 30; i++) {
      newData.push(dataArray[i * step] || 0);
    }
    setAudioData(newData);
    
    requestAnimationFrameRef.current = requestAnimationFrame(drawWaveform);
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    
    if (recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      clearInterval(timerRef.current);
      if (requestAnimationFrameRef.current) cancelAnimationFrame(requestAnimationFrameRef.current);
    } else if (recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration - 1) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
      drawWaveform();
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    
    clearInterval(timerRef.current);
    if (requestAnimationFrameRef.current) cancelAnimationFrame(requestAnimationFrameRef.current);
    
    mediaRecorderRef.current.stop();
    setRecordingState('preview');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Generate static waveform for preview
    const staticWaveform = [];
    for (let i = 0; i < 30; i++) {
      staticWaveform.push(100 + Math.random() * 155);
    }
    setAudioData(staticWaveform);
  };

  const handleSend = () => {
    if (recordingState === 'recording' || recordingState === 'paused') {
      // If still recording, stop and send immediately
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            onSend(reader.result as string, duration);
          };
        };
        mediaRecorderRef.current.stop();
        cleanup();
        return;
      }
    }
    
    // If in preview state
    if (recordedBase64) {
      onSend(recordedBase64, duration);
      cleanup();
    }
  };

  const handleCancel = () => {
    cleanup();
    onCancel();
  };
  
  const togglePreviewPlay = () => {
    if (!previewAudioUrl) return;
    
    if (!previewAudioRef.current) {
      const audio = new Audio(previewAudioUrl);
      previewAudioRef.current = audio;
      
      audio.addEventListener('ended', () => {
        setIsPreviewPlaying(false);
        setPreviewProgress(0);
      });
    }
    
    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
      if (previewAnimationRef.current) cancelAnimationFrame(previewAnimationRef.current);
    } else {
      previewAudioRef.current.play();
      setIsPreviewPlaying(true);
      updatePreviewProgress();
    }
  };
  
  const updatePreviewProgress = () => {
    if (!previewAudioRef.current) return;
    
    const curr = previewAudioRef.current.currentTime;
    const dur = previewAudioRef.current.duration || duration;
    
    if (dur > 0) {
      setPreviewProgress(curr / dur);
    }
    
    if (isPreviewPlaying) {
      previewAnimationRef.current = requestAnimationFrame(updatePreviewProgress);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (recordingState === 'error') {
    return (
      <div className="flex-1 bg-[#1e293b] rounded-2xl border border-rose-500/50 p-2 sm:p-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 flex items-center gap-2 text-rose-400 text-sm">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
          <button onClick={startRecording} className="p-2 text-emerald-400 hover:bg-slate-800 rounded-full transition-colors flex-shrink-0" title="Retry">
            <RefreshCw size={18} />
          </button>
          <button onClick={handleCancel} className="p-2 text-slate-400 hover:bg-slate-800 rounded-full transition-colors flex-shrink-0" title="Cancel">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#1e293b] rounded-2xl border border-emerald-500/30 p-2 sm:p-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3 w-full">
        <button type="button" onClick={handleCancel} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-full transition-colors flex-shrink-0" title="Delete">
          <Trash2 size={20} />
        </button>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {recordingState === 'recording' ? (
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          ) : recordingState === 'paused' ? (
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          ) : recordingState === 'preview' ? (
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
          )}
          <span className={`text-sm font-medium font-mono w-12 ${recordingState === 'recording' ? 'text-rose-500' : recordingState === 'paused' ? 'text-amber-500' : 'text-emerald-500'}`}>
            {formatDuration(duration)}
          </span>
        </div>
        
        <div className="flex-1 flex items-center gap-[2px] h-8 overflow-hidden px-2 relative">
          {recordingState === 'preview' ? (
            // Static interactive waveform for preview
            <div className="flex-1 flex items-center gap-[2px] h-full w-full">
              {audioData.map((val, i) => {
                const barProgress = i / audioData.length;
                const isPlayed = barProgress <= previewProgress;
                return (
                  <div 
                    key={i}
                    className={`flex-1 rounded-full transition-colors duration-75 ${isPlayed ? 'bg-emerald-400' : 'bg-slate-600'}`}
                    style={{ height: Math.max(4, (val / 255) * 32) + 'px', minHeight: '4px' }}
                  />
                );
              })}
            </div>
          ) : (
            // Live animated waveform
            audioData.map((val, i) => {
              const height = recordingState === 'recording' ? Math.max(4, (val / 255) * 32) : 4;
              return (
                <motion.div
                  key={i}
                  animate={{ height }}
                  transition={{ type: 'tween', duration: 0.1 }}
                  className={`flex-1 rounded-full min-w-[2px] ${recordingState === 'recording' ? 'bg-rose-500' : 'bg-slate-600'}`}
                  style={{ minHeight: '4px' }}
                />
              );
            })
          )}
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {recordingState === 'preview' ? (
            <button type="button" onClick={togglePreviewPlay} className="p-2 text-emerald-500 hover:bg-slate-800 rounded-full transition-colors" title={isPreviewPlaying ? "Pause preview" : "Play preview"}>
              {isPreviewPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
          ) : (
            <button type="button" onClick={recordingState === 'recording' || recordingState === 'paused' ? stopRecording : togglePause} className="p-2 text-rose-500 hover:bg-slate-800 rounded-full transition-colors" title="Stop recording">
              <Square size={18} className="fill-current" />
            </button>
          )}
          
          {(recordingState === 'recording' || recordingState === 'paused') && (
            <button type="button" onClick={togglePause} className="p-2 text-amber-500 hover:bg-slate-800 rounded-full transition-colors" title={recordingState === 'recording' ? "Pause" : "Resume"}>
              {recordingState === 'recording' ? <Pause size={20} className="fill-current" /> : <Mic size={20} className="fill-current" />}
            </button>
          )}
          
          <button 
            type="button" 
            onClick={handleSend} 
            disabled={recordingState === 'requesting'}
            className="p-2.5 bg-emerald-500 text-slate-950 rounded-full hover:bg-emerald-400 transition-transform hover:scale-105 active:scale-95 shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:scale-100"
            title="Send"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
