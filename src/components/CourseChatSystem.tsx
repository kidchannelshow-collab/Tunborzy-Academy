import { ErrorBoundary } from "./ErrorBoundary";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff } from 'lucide-react';

import { useProfile } from '../lib/useProfile';
import { Search, MoreVertical, Smile, Check, CheckCheck, FileText, ArrowLeft, Pin, MessageCircle, X, Reply, CornerUpLeft, Trash2, Bookmark, Copy, Forward, Download, ChevronDown, Plus } from 'lucide-react';
import DashboardLayout from './dashboard/DashboardLayout';
import { supabase } from '../supabaseClient';
import VoiceMessage from './chat/VoiceMessage';
import ChatComposer from './chat/ChatComposer';
import FileViewerModal from './chat/FileViewerModal';
import { uploadFileToSupabase, getFileTypeCategory, formatFileSize } from '../lib/fileUpload';
import { Bell, Camera, UserMinus, UserPlus } from 'lucide-react';
import { Film, Music, FileType } from 'lucide-react';


interface CourseChatSystemProps {
  onLogout: () => void;
  onNavigate?: (view: string) => void;
}


interface MessageReaction { count: number; me: boolean }
export interface MessageData {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
  isLecturer: boolean;
  isPinned?: boolean;
  type: string;
  readStatus?: string;
  reactions?: Record<string, MessageReaction>;
  fileName?: string;
  fileSize?: string;
  replyTo?: string;
  imageUrl?: string;
  fileUrl?: string;
  dueDate?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  isForwarded?: boolean;
  bookmarkedBy?: string[];
}

const EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🎉', '👏', '🔥', '🙏', '😍', '😡'];
export default function CourseChatSystem({ onLogout, onNavigate }: CourseChatSystemProps) {

  const { profile } = useProfile();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
  const [viewingFile, setViewingFile] = useState<{name: string, url: string, type: string, size: string, time: string, sender: string} | null>(null);
  
  // Phase 3 States
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [activeReactionMessage, setActiveReactionMessage] = useState<string | null>(null);
  const [activeMessageMenu, setActiveMessageMenu] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAtBottomRef = useRef(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [editingMessage, setEditingMessage] = useState<MessageData | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<MessageData | null>(null);
  const [showSavedMessages, setShowSavedMessages] = useState(false);
  const [showCreateChatModal, setShowCreateChatModal] = useState(false);
  const [modalCourses, setModalCourses] = useState<any[]>([]);
  const [modalLecturers, setModalLecturers] = useState<any[]>([]);
  const [modalStudents, setModalStudents] = useState<any[]>([]);
  const [isSubmittingChat, setIsSubmittingChat] = useState(false);
  const [newChatForm, setNewChatForm] = useState({
    name: '',
    courseCode: '',
    description: '',
    lecturerId: '',
    studentIds: [] as string[]
  });

  useEffect(() => {
    if (showCreateChatModal && profile?.role === 'Admin') {
      const loadOptions = async () => {
        try {
          const { data: coursesData } = await supabase.from('courses').select('id, course_code, title');
          if (coursesData) setModalCourses(coursesData);

          const { data: lecturersData } = await supabase.from('profiles').select('id, full_name').eq('role', 'Lecturer');
          if (lecturersData) setModalLecturers(lecturersData);

          const { data: studentsData } = await supabase.from('profiles').select('id, full_name, student_id').eq('role', 'Student');
          if (studentsData) setModalStudents(studentsData);
        } catch (e) {
          console.error("Failed to load modal options", e);
        }
      };
      loadOptions();
    }
  }, [showCreateChatModal, profile]);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };
  const [mentionQuery, setMentionQuery] = useState<{ active: boolean, text: string, index: number }>({ active: false, text: '', index: 0 });
  const [presenceMap, setPresenceMap] = useState<Record<string, { name: string, status: 'typing' | 'recording' | 'uploading' | 'idle', role: string, lastSeen?: string }>>({});
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused'>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimer = useRef<any>(null);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startRecording = () => {
    setRecordingState('recording');
  };

  const pauseRecording = () => {
    setRecordingState('paused');
    clearInterval(recordingTimer.current);
  };

  const resumeRecording = () => {
    setRecordingState('recording');
    recordingTimer.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  const cancelRecording = () => {
    setRecordingState('idle');
  };

  const handleSendVoiceNote = async (duration: number, base64Data: string) => {
    const messageId = crypto.randomUUID();
    let newMessage: any = {
      id: messageId,
      sender: profile?.full_name || 'You',
      text: 'Voice note',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      isLecturer: profile?.role === 'Lecturer' || profile?.role === 'Admin',
      type: 'voice',
      fileSize: String(duration),
      fileUrl: base64Data, // temporary preview
      readStatus: 'uploading',
      replyTo: replyingTo?.id
    };
    
    setMessages(prev => [...prev, newMessage]);
    setReplyingTo(null);
    setTimeout(scrollToBottom, 50);
    
    try {
      const res = await fetch(base64Data);
      const blob = await res.blob();
      const fileName = `voice_${messageId}.webm`;
      
      let finalUrl = base64Data;
      
      try {
        const { error } = await supabase.storage.from('chat_attachments').upload(fileName, blob, { upsert: true });
        if (!error) {
          const { data } = supabase.storage.from('chat_attachments').getPublicUrl(fileName);
          finalUrl = data.publicUrl;
        } else {
           const { error: fbError } = await supabase.storage.from('course_materials').upload(`chat/${fileName}`, blob, { upsert: true });
           if (!fbError) {
             const { data } = supabase.storage.from('course_materials').getPublicUrl(`chat/${fileName}`);
             finalUrl = data.publicUrl;
           }
        }
      } catch (e) {
        console.warn("Storage upload failed, keeping base64");
      }
      
      // Save to database
      if (activeRoomId && profile) {
         await supabase.from('chat_messages').insert({
            id: messageId,
            room_id: activeRoomId,
            sender_id: profile.id,
            message_text: newMessage.text,
            file_url: finalUrl,
            file_type: 'voice'
         });
      }

      newMessage = { ...newMessage, fileUrl: finalUrl, readStatus: 'sent' };
      setMessages(prev => prev.map(m => m.id === messageId ? newMessage : m));
      
      if (activeChat) {
        const payloadToSend = { ...newMessage, isMe: false };
        await supabase.channel(`course_chat_${activeChat}`).send({
          type: 'broadcast',
          event: 'new_message',
          payload: payloadToSend
        });
      }
    } catch (error) {
      console.error("Voice note upload error", error);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, readStatus: 'failed' } : m));
    }
  };

  
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const playNotificationSound = (messageText?: string, sender?: string) => {
    if ('Notification' in window && Notification.permission === 'granted' && messageText && sender) {
      new Notification(`New message from ${sender}`, {
        body: messageText,
        icon: '/favicon.ico'
      });
    }

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch(e) {}
  };

  
  
  const sendRecording = (base64Data: string, duration: number) => {
    setRecordingState('idle');
    handleSendVoiceNote(duration, base64Data);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    isAtBottomRef.current = atBottom;
    if (atBottom !== isAtBottom) {
      setIsAtBottom(atBottom);
    }
    
    if (atBottom) {
      setNewMessagesCount(0);
    }
  };

const handleDownload = (url: string, fileName: string = 'download') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setActiveMessageMenu(null);
  };
  
  const handleDelete = async (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    setActiveMessageMenu(null);
    if (activeRoomId) {
      await supabase.from('chat_messages').update({ is_deleted: true }).eq('id', msgId);
    }
    if (activeChat) {
      await supabase.channel(`course_chat_${activeChat}`).send({
        type: 'broadcast',
        event: 'delete_message',
        payload: { id: msgId }
      });
    }
  };
  
  const handleForward = (msgId: string) => {
    setActiveMessageMenu(null);
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setActiveMessageMenu(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMessagesCount(0);
  };
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const checkTargetChat = async () => {
      const targetChatId = sessionStorage.getItem('targetChatId');
      if (targetChatId) {
        // targetChatId is a courseId. We need to find the chat_room for this course.
        const { data: course } = await supabase.from('courses').select('course_code').eq('id', targetChatId).single();
        if (course) {
           const { data: room } = await supabase.from('chat_rooms').select('id').eq('course_code', course.course_code).single();
           if (room) {
             setActiveChat(room.id);
           }
        }
        sessionStorage.removeItem('targetChatId');
      }
    };
    checkTargetChat();
  }, []);

  useEffect(() => {
    if (activeChat) {
      setIsLoading(true);
      
      const loadChatRoomAndMessages = async () => {
        try {
          setActiveRoomId(activeChat);
          const { data: msgs, error: msgsErr } = await supabase
            .from('chat_messages')
            .select(`*, profiles(full_name, role), message_reactions(emoji, user_id)`)
            .eq('room_id', activeChat)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true });

          if (msgs && !msgsErr) {
            const formattedMsgs = msgs.map(m => {
               const reactionsMap: Record<string, { count: number, me: boolean }> = {};
               if (m.message_reactions) {
                 m.message_reactions.forEach((r: any) => {
                   if (!reactionsMap[r.emoji]) reactionsMap[r.emoji] = { count: 0, me: false };
                   reactionsMap[r.emoji].count += 1;
                   if (r.user_id === profile?.id) reactionsMap[r.emoji].me = true;
                 });
               }
               return {
                 id: m.id,
                 sender: m.profiles?.full_name || 'Unknown',
                 text: m.message_text || '',
                 time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                 isMe: m.sender_id === profile?.id,
                 isLecturer: m.profiles?.role === 'Lecturer',
                 type: m.file_type || 'text',
                 fileUrl: m.file_url,
                 readStatus: 'read',
                 reactions: reactionsMap
               };
            });
            setMessages(formattedMsgs);
          } else {
            setMessages([]);
          }
        } catch(err) {
          console.error(err);
        } finally {
          setIsLoading(false);
          setTimeout(scrollToBottom, 100);
          setNewMessagesCount(0);
        }
      };

      loadChatRoomAndMessages();
    } else {
      setActiveRoomId(null);
    }
  }, [activeChat, profile]);

  useEffect(() => {
    if (!activeChat) return;

    const channel = supabase.channel(`course_chat_${activeChat}`, {
      config: {
        presence: {
          key: profile?.id || 'unknown',
        },
      },
    })
      .on('broadcast', { event: 'new_message' }, (payload) => {
        setMessages((prev) => {
          if (prev.some(m => m.id === payload.payload.id)) return prev;
          if (!isAtBottomRef.current) setNewMessagesCount(c => c + 1);
          if (payload.payload.sender !== profile?.full_name && !isMuted) playNotificationSound(payload.payload.text, payload.payload.sender);
          return [...prev, payload.payload];
        });
        if (isAtBottomRef.current) {
          setTimeout(scrollToBottom, 100);
        }
      })
      .on('broadcast', { event: 'reaction' }, (payload) => {
        setMessages((prev) => prev.map(msg => {
          if (msg.id === payload.payload.messageId) {
            return { ...msg, reactions: payload.payload.reactions };
          }
          return msg;
        }));
      })
      .on('broadcast', { event: 'edit_message' }, (payload) => {
        setMessages((prev) => prev.map(msg => {
          if (msg.id === payload.payload.id) {
            return { ...msg, text: payload.payload.text, isEdited: true };
          }
          return msg;
        }));
      })
      .on('broadcast', { event: 'delete_message' }, (payload) => {
        setMessages((prev) => prev.filter(msg => msg.id !== payload.payload.id));
      })
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const newPresenceMap: Record<string, any> = {};
        for (const id in newState) {
          if (id === profile?.id) continue; // Skip self
          const presences = newState[id] as any[];
          if (presences && presences.length > 0) {
            newPresenceMap[id] = presences[0];
          }
        }
        setPresenceMap(newPresenceMap);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            name: profile?.full_name,
            role: profile?.role,
            status: 'idle',
            onlineAt: new Date().toISOString(),
          });
        }
      });
      
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat]);


  
  const updatePresence = async (status: 'idle' | 'typing' | 'recording' | 'uploading') => {
    if (!channelRef.current) return;
    try {
      await channelRef.current.track({
        name: profile?.full_name,
        role: profile?.role,
        status,
        onlineAt: new Date().toISOString(),
      });
    } catch {
      // Presence updates are best-effort; ignore transient failures.
    }
  };

  const handleTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    updatePresence('typing');
    typingTimeoutRef.current = setTimeout(() => {
      updatePresence('idle');
    }, 2000);
  };

  useEffect(() => {
    if (recordingState === 'recording') {
      updatePresence('recording');
    } else if (recordingState === 'idle') {
      updatePresence('idle');
    }
  }, [recordingState]);

  const handleMentionQuery = (query: { active: boolean, text: string, index: number }) => {
    setMentionQuery(query);
  };

  const handleMentionSelect = (name: string) => {
    // We would need to replace the query part in the input text but for now we just close it
    setMentionQuery({ active: false, text: '', index: 0 });
    // In a real implementation we'd append the name to the input text
  };

  useEffect(() => {
    // Simulate read receipts progression for our own messages
    const timers: any[] = [];
    messages.forEach(msg => {
      if (msg.isMe && msg.readStatus === 'sent') {
        const t1 = setTimeout(() => {
          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, readStatus: 'delivered' } : m));
          const t2 = setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, readStatus: 'read' } : m));
          }, 2000);
          timers.push(t2);
        }, 1500);
        timers.push(t1);
      }
    });
    return () => timers.forEach(t => clearTimeout(t));
  }, [messages]);

  const handleSendMessage = async (text: string, files?: File[]) => {
    if (editingMessage) {
       if (text.trim() === '') return;
       
       if (activeRoomId) {
         await supabase.from('chat_messages').update({ message_text: text }).eq('id', editingMessage.id);
       }
       
       setMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, text, isEdited: true } : m));
       setEditingMessage(null);
       
       if (activeChat) {
         await supabase.channel(`course_chat_${activeChat}`).send({
           type: 'broadcast',
           event: 'edit_message',
           payload: { id: editingMessage.id, text, isEdited: true }
         });
       }
       return;
    }

    if (forwardingMessage) {
       const forwardMsgId = crypto.randomUUID();
       const forwardMsg = { ...forwardingMessage, id: forwardMsgId, sender: profile?.full_name || 'You', isMe: true, isForwarded: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), readStatus: 'sent' };
       
       if (activeRoomId && profile) {
          await supabase.from('chat_messages').insert({
             id: forwardMsgId,
             room_id: activeRoomId,
             sender_id: profile.id,
             message_text: forwardMsg.text,
             file_url: forwardMsg.fileUrl,
             file_type: forwardMsg.type
          });
       }
       
       setMessages(prev => [...prev, forwardMsg]);
       setTimeout(scrollToBottom, 50);
       setForwardingMessage(null);
       if (activeChat) {
         await supabase.channel(`course_chat_${activeChat}`).send({
           type: 'broadcast',
           event: 'new_message',
           payload: { ...forwardMsg, isMe: false }
         });
       }
       return;
    }
    
    if (!text.trim() && (!files || files.length === 0)) return;
    
    const baseMessage = {
      sender: profile?.full_name || 'You',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      isLecturer: profile?.role === 'Lecturer' || profile?.role === 'Admin',
      replyTo: replyingTo?.id
    };

    const newMessages: any[] = [];
    
    if (text.trim()) {
      const textMsg = {
        ...baseMessage,
        id: crypto.randomUUID(),
        text: text,
        type: 'text',
        readStatus: 'sent'
      };
      
      if (activeRoomId && profile) {
         await supabase.from('chat_messages').insert({
             id: textMsg.id,
             room_id: activeRoomId,
             sender_id: profile.id,
             message_text: text,
             file_type: 'text'
         });
      }
      newMessages.push(textMsg);
    }
    
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = crypto.randomUUID();
        const localUrl = URL.createObjectURL(file);
        const fileType = getFileTypeCategory(file);
        
        const fileMsg = {
          ...baseMessage,
          id: fileId,
          text: '',
          type: fileType,
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          fileUrl: localUrl,
          readStatus: 'uploading'
        };
        newMessages.push(fileMsg);
      }
    }
    
    setMessages(prev => [...prev, ...newMessages]);
    setTimeout(scrollToBottom, 50);
    setReplyingTo(null);
    
    const textMessages = newMessages.filter(m => m.type === 'text');
    if (activeChat && textMessages.length > 0) {
      for (const msg of textMessages) {
        const payloadToSend = { ...msg, isMe: false };
        await supabase.channel(`course_chat_${activeChat}`).send({
          type: 'broadcast',
          event: 'new_message',
          payload: payloadToSend
        });
      }
    }

    if (files && files.length > 0) {
      updatePresence('uploading');
      const fileMessages = newMessages.filter(m => m.type !== 'text');
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const msg = fileMessages[i];
        
        try {
          const finalUrl = await uploadFileToSupabase(file, activeChat || 'general', msg.id);
          
          if (activeRoomId && profile) {
             await supabase.from('chat_messages').insert({
                 id: msg.id,
                 room_id: activeRoomId,
                 sender_id: profile.id,
                 file_url: finalUrl,
                 file_type: msg.type,
                 message_text: ''
             });
          }

          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, fileUrl: finalUrl, readStatus: 'sent' } : m));
          
          if (activeChat) {
             const payloadToSend = { ...msg, fileUrl: finalUrl, readStatus: 'sent', isMe: false };
             await supabase.channel(`course_chat_${activeChat}`).send({
               type: 'broadcast',
               event: 'new_message',
               payload: payloadToSend
             });
          }
        } catch (error) {
          console.error("Upload failed for file", file.name, error);
          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, readStatus: 'failed' } : m));
        }
      }
      updatePresence('idle');
    }

    setTimeout(() => {
      setMessages(prev => prev.map(m => newMessages.find(nm => nm.id === m.id) && m.readStatus !== 'uploading' && m.readStatus !== 'failed' ? { ...m, readStatus: 'delivered' } : m));
      setTimeout(() => {
        setMessages(prev => prev.map(m => newMessages.find(nm => nm.id === m.id) && m.readStatus !== 'uploading' && m.readStatus !== 'failed' ? { ...m, readStatus: 'read' } : m));
      }, 2000);
    }, 1000);
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    let updatedReactions = {};
    let isAdding = false;

    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const currentReactions = msg.reactions || {};
        const reaction = currentReactions[emoji] || { count: 0, me: false };
        const newReactions = { ...currentReactions };
        
        if (reaction.me) {
          isAdding = false;
          if (reaction.count <= 1) delete newReactions[emoji];
          else newReactions[emoji] = { count: reaction.count - 1, me: false };
        } else {
          isAdding = true;
          newReactions[emoji] = { count: reaction.count + 1, me: true };
        }
        
        updatedReactions = newReactions;
        return { ...msg, reactions: newReactions };
      }
      return msg;
    }));
    setActiveReactionMessage(null);

    if (activeRoomId && profile) {
      if (isAdding) {
         await supabase.from('message_reactions').insert({
             message_id: messageId,
             user_id: profile.id,
             emoji: emoji
         });
      } else {
         await supabase.from('message_reactions').delete().eq('message_id', messageId).eq('user_id', profile.id).eq('emoji', emoji);
      }
    }

    if (activeChat) {
      // Create a payload where me: false for others
      const payloadReactions = { ...updatedReactions };
      for (const key in payloadReactions) {
         // Keep count same, but others see our reaction as not theirs
         // wait, it's a simple simulation, we'll just send count
         payloadReactions[key] = { count: payloadReactions[key].count, me: false };
      }
      await supabase.channel(`course_chat_${activeChat}`).send({
        type: 'broadcast',
        event: 'reaction',
        payload: { messageId, reactions: payloadReactions }
      });
    }
  };

  const scrollToMessage = (msgId: string) => {
    messageRefs.current[msgId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const el = messageRefs.current[msgId];
    if (el) {
      el.classList.add('bg-emerald-500/20');
      setTimeout(() => el.classList.remove('bg-emerald-500/20'), 1500);
    }
  };

  const getRepliedMessage = (replyToId?: string) => {
    if (!replyToId) return null;
    return messages.find(m => m.id === replyToId);
  };

  const renderMessageTextWithHighlight = (text: string) => {
    if (!text) return text;
    let result: React.ReactNode[] = [text];

    if (messageSearchQuery) {
      const parts = text.split(new RegExp(`(${messageSearchQuery})`, 'gi'));
      result = parts.map((part, i) => 
        part.toLowerCase() === messageSearchQuery.toLowerCase() ? <mark key={i} className="bg-amber-400 text-amber-950 px-0.5 rounded">{part}</mark> : part
      );
    }
    
    // Now highlight mentions
    result = result.flatMap((part, i) => {
      if (typeof part === 'string') {
        const mentionParts = part.split(/(@[a-zA-Z0-9_]+)/g);
        return mentionParts.map((mPart, j) => 
          mPart.startsWith('@') ? <span key={`m-${i}-${j}`} className="text-emerald-400 font-semibold cursor-pointer hover:underline">{mPart}</span> : mPart
        );
      }
      return part;
    });

    return result;
  };

  
  let pressTimer: any = null;
  let touchStartX = 0;
  
  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    touchStartX = e.touches[0].clientX;
    pressTimer = setTimeout(() => {
      setActiveReactionMessage(id);
    }, 500);
  };
  
  const handleTouchMove = (e: React.TouchEvent, msg: MessageData) => {
    if (pressTimer) clearTimeout(pressTimer);
    const touchX = e.touches[0].clientX;
    const diff = touchX - touchStartX;
    if (diff > 50) { // Swipe right
      setReplyingTo(msg);
      touchStartX = touchX; // prevent multiple triggers
    }
  };
  
  const handleTouchEnd = () => {
    if (pressTimer) clearTimeout(pressTimer);
  };


  const [dynamicChats, setDynamicChats] = useState<any[]>([]);
  const [chatParticipants, setChatParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    const loadChats = async () => {
      try {
        let courseCodes: string[] = [];
        if (profile.role === 'Admin') {
           // Admin sees all, no filter needed
        } else if (profile.role === 'Lecturer') {
           const { data } = await supabase.from('courses').select('course_code').eq('lecturer_id', profile.id);
           courseCodes = (data || []).map(d => d.course_code).filter(Boolean);
        } else {
           const { data } = await supabase.from('course_enrollments').select('courses(course_code)').eq('student_id', profile.id);
           if (data) {
             courseCodes = data.map((d: any) => d.courses?.course_code).filter(Boolean);
           }
        }
        
        let roomsQuery = supabase.from('chat_rooms').select('*').eq('is_active', true);
        if (profile.role !== 'Admin') {
           if (courseCodes.length === 0) {
              setDynamicChats([]);
              return;
           }
           roomsQuery = roomsQuery.in('course_code', courseCodes);
        }
        
        const { data: rooms } = await roomsQuery;
        
        if (rooms) {
           const mapped = await Promise.all(rooms.map(async r => {
              let lastMsgText = 'Tap to view chat';
              let lastMsgTime = new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              // Fetch last message
              const { data: lastMsgData } = await supabase
                .from('chat_messages')
                .select('message_text, created_at, file_type')
                .eq('room_id', r.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
                
              if (lastMsgData) {
                 if (lastMsgData.file_type && lastMsgData.file_type !== 'text') {
                    lastMsgText = `Sent a ${lastMsgData.file_type}`;
                 } else {
                    lastMsgText = lastMsgData.message_text || lastMsgText;
                 }
                 lastMsgTime = new Date(lastMsgData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }

              return {
                id: r.id,
                name: r.course_title || `${r.course_code} Chat`,
                code: r.course_code,
                semester: r.portal || 'General',
                lastMessage: lastMsgText,
                time: lastMsgTime,
                unread: 0, // Unread counts would require message_reads table sync
                online: false
              };
           }));
           setDynamicChats(mapped);
        } else {
           setDynamicChats([]);
        }
      } catch (err) {
        setDynamicChats([]);
      }
    };
    loadChats();
  }, [profile?.id, profile?.role]);

  useEffect(() => {
    if (activeChat && dynamicChats.length > 0) {
      const selectedInfo = dynamicChats.find(c => c.id === activeChat);
      if (selectedInfo) {
        const loadParticipants = async () => {
          try {
            const { data: course } = await supabase.from('courses').select('id, lecturer_id, profiles!courses_lecturer_id_fkey(full_name)').eq('course_code', selectedInfo.code).single();
            if (course) {
              const { data: enrollments } = await supabase.from('course_enrollments').select('profiles(full_name, role)').eq('course_id', course.id);
              
              const participants = [];
              if (course.profiles) {
                participants.push({ name: (course.profiles as any).full_name, role: 'Lecturer' });
              }
              if (enrollments) {
                enrollments.forEach((e: any) => {
                  if (e.profiles) participants.push({ name: e.profiles.full_name, role: e.profiles.role || 'Student' });
                });
              }
              setChatParticipants(participants);
            }
          } catch (err) {
            console.error(err);
          }
        };
        loadParticipants();
      }
    }
  }, [activeChat, dynamicChats]);

  const chatsList = dynamicChats;
  const filteredChats = chatsList.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    chat.code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedChatInfo = chatsList.find(c => c.id === activeChat);
  const typingUsers = Object.values(presenceMap).filter(p => p.status === 'typing' && p.name !== profile?.full_name);
  const recordingUsers = Object.values(presenceMap).filter(p => p.status === 'recording' && p.name !== profile?.full_name);
  const uploadingUsers = Object.values(presenceMap).filter(p => p.status === 'uploading' && p.name !== profile?.full_name);
  const activeMembersCount = Object.keys(presenceMap).length + 1;
  const totalMembersCount = chatParticipants.length > 0 ? chatParticipants.length : activeMembersCount;

  let presenceText = selectedChatInfo?.online ? 'Online' : selectedChatInfo?.lastSeen || 'Offline';
  if (typingUsers.length > 0) {
    presenceText = typingUsers.length === 1 ? `${typingUsers[0].name} is typing...` : `${typingUsers.length} people are typing...`;
  } else if (recordingUsers.length > 0) {
    presenceText = recordingUsers.length === 1 ? `${recordingUsers[0].name} is recording audio...` : `${recordingUsers.length} people are recording...`;
  } else if (uploadingUsers.length > 0) {
    presenceText = uploadingUsers.length === 1 ? `${uploadingUsers[0].name} is uploading a file...` : `${uploadingUsers.length} people are uploading...`;
  }

  
  const sidebarNode = (
    <div className={`w-full md:w-[320px] lg:w-[360px] xl:w-[400px] flex-shrink-0 bg-[#0f172a] border-r border-slate-800 flex flex-col h-full absolute md:relative z-10 transition-transform duration-300 ease-in-out ${activeChat ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
      <div className="p-4 border-b border-slate-800 bg-[#0f172a] sticky top-0 z-10 flex items-center justify-between">
        <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
          <MessageCircle className="text-emerald-500" />
          Course Chats
        </h2>
        <button onClick={() => setShowSavedMessages(true)} className="p-2 text-slate-400 hover:text-emerald-400 transition-colors" title="Saved Messages">
                <Bookmark size={20} />
              </button>
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <MoreVertical size={20} />
              </button>
      </div>

      <div className="p-3 border-b border-slate-800">
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1e293b] text-slate-200 placeholder:text-slate-500 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-rose-500/10 border-b border-rose-500/20 text-rose-500 py-1.5 flex items-center justify-center gap-2 text-xs font-medium sticky top-0 z-50 overflow-hidden"
          >
            <WifiOff size={14} />
            <span>Reconnecting... Waiting for network</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#020617]">
        {filteredChats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => {
              setActiveChat(chat.id);
              setDynamicChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
            }}
            className={`w-full flex items-start gap-3 p-4 border-b border-slate-800/50 hover:bg-[#1e293b]/50 transition-colors ${activeChat === chat.id ? 'bg-[#1e293b] border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'}`}
          >
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                {chat.code?.substring(0, 2)}
              </div>
              {chat.online && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#020617] rounded-full"></div>
              )}
            </div>
            
            <div className="flex-1 min-w-0 text-left">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-semibold text-slate-200 truncate pr-2">{chat.name}</h3>
                <span className="text-xs text-slate-500 flex-shrink-0">{chat.time}</span>
              </div>
              <p className="text-sm text-slate-400 truncate pr-6">{chat.typing || chat.lastMessage}</p>
            </div>
            
            {chat.unread > 0 && (
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-6 -ml-5">
                <span className="text-[10px] font-bold text-slate-900">{chat.unread}</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const getMessageDateGroup = (timeStr: string) => {
    if (!timeStr) return 'Today';
    const lower = timeStr.toLowerCase();
    if (lower.includes('yesterday')) return 'Yesterday';
    if (lower.includes('monday')) return 'Monday';
    if (lower.includes('tuesday')) return 'Tuesday';
    if (lower.includes('wednesday')) return 'Wednesday';
    if (lower.includes('thursday')) return 'Thursday';
    if (lower.includes('friday')) return 'Friday';
    if (lower.includes('saturday')) return 'Saturday';
    if (lower.includes('sunday')) return 'Sunday';
    return 'Today';
  };

  let currentGroup = '';

  const chatAreaNode = (
    <div className={`flex-1 flex flex-col bg-[#020617] w-full md:w-auto h-[100dvh] md:h-full fixed md:relative inset-0 z-[60] md:z-20 transition-transform duration-300 ease-in-out ${activeChat ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
      {activeChat ? (
        <>
          <div className="px-4 py-3 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-800/50 p-2 -ml-2 rounded-xl transition-colors" onClick={() => setShowGroupSettings(true)}>
              <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white mr-1 transition-colors">
                  <ArrowLeft size={20} />
                </button>
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold relative">
                 {selectedChatInfo?.code?.substring(0, 2)}
                 {selectedChatInfo?.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-[#0f172a] rounded-full"></div>}
              </div>
              <div>
                <h3 className="font-semibold text-white leading-tight">{selectedChatInfo?.name}</h3>
                <p className="text-xs text-emerald-400 font-medium">
                  {presenceText} <span className="text-slate-500 font-normal ml-1">• {activeMembersCount} online</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={() => setIsSearchActive(!isSearchActive)} className="p-2 text-slate-400 hover:text-white transition-colors">
                <Search size={20} />
              </button>
              <button onClick={() => setShowSavedMessages(true)} className="p-2 text-slate-400 hover:text-emerald-400 transition-colors" title="Saved Messages">
                <Bookmark size={20} />
              </button>
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isSearchActive && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-[#1e293b] border-b border-slate-800 p-2 px-4 flex items-center gap-2 overflow-hidden z-10">
                <Search size={16} className="text-slate-400" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search in conversation..." 
                  value={messageSearchQuery} 
                  onChange={(e) => setMessageSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white focus:outline-none"
                />
                <button onClick={() => { setIsSearchActive(false); setMessageSearchQuery(''); }} className="p-1 text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          
            {messages.some(m => m.isPinned) && (
            <div className="w-full mb-0 bg-[#020617] pt-2 pb-1 px-4 z-10">
              <div onClick={() => setShowPinnedMessages(true)} className="bg-[#1e293b] border border-amber-500/30 rounded-xl p-3 shadow-md flex items-start gap-3 cursor-pointer hover:bg-[#1e293b]/80 transition-colors">
                <Pin size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-amber-500 font-semibold mb-0.5 flex justify-between">
                    <span>Pinned Message{messages.filter(m => m.isPinned).length > 1 ? 's' : ''} ({messages.filter(m => m.isPinned).length})</span>
                    <span className="text-slate-400 font-normal hover:text-white transition-colors">View all</span>
                  </p>
                  <p className="text-sm text-slate-300 truncate">{messages.filter(m => m.isPinned).pop()?.text || 'Attachment'}</p>
                </div>
              </div>
            </div>
          )}
          <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar relative" onClick={() => { setActiveReactionMessage(null); setActiveMessageMenu(null); }}>
            
            
            

            <div className="flex justify-center relative z-10 my-6">
              <span className="bg-[#1e293b] text-slate-400 text-xs px-3 py-1 rounded-full font-medium shadow-sm">Today</span>
            </div>

            <div className="relative z-10 space-y-4 pb-2">
              {isLoading ? (
              <div className="space-y-4 px-2 mt-auto pb-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <div className={`animate-pulse rounded-2xl h-16 w-64 ${i % 2 === 0 ? 'bg-[#1e293b]' : 'bg-[#1e293b]/50'}`}></div>
                  </div>
                ))}
              </div>
            ) : (
              messages.filter(msg => !messageSearchQuery || msg.text?.toLowerCase().includes(messageSearchQuery.toLowerCase())).map((msg, idx) => {
                const group = getMessageDateGroup(msg.time);
                const showGroup = group !== currentGroup;
                if (showGroup) currentGroup = group;
                
                const repliedMsg = getRepliedMessage(msg.replyTo);
                return (
                  <React.Fragment key={msg.id}>
                    {showGroup && (
                      <div className="flex justify-center my-4">
                        <span className="bg-[#1e293b]/80 border border-slate-700 backdrop-blur-sm text-slate-300 text-xs px-3 py-1 rounded-full shadow-sm">
                          {group}
                        </span>
                      </div>
                    )}
                    <motion.div 
                    layout
                    initial={{ opacity: 0, x: msg.isMe ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={msg.id} 
                    ref={(el) => { messageRefs.current[msg.id] = el; }}
                    className={`flex group w-full ${msg.isMe ? 'justify-end' : 'justify-start'} transition-colors duration-500 rounded-2xl`}
                    style={{ marginBottom: msg.reactions && Object.keys(msg.reactions).length > 0 ? '16px' : '0px' }}
                    onTouchStart={(e) => handleTouchStart(e, msg.id)}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={(e) => handleTouchMove(e, msg)}
                  >
                    <div className="flex items-end gap-2 max-w-[90%] sm:max-w-[75%] lg:max-w-[65%]">
                      {/* Reaction / Reply actions desktop */}
                      {msg.isMe && (
                        <div className="hidden sm:group-hover:flex items-center gap-1 bg-[#1e293b] rounded-lg p-1 shadow-lg border border-slate-700 mr-2">
                          <button onClick={() => setReplyingTo(msg)} className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-md hover:bg-slate-800 transition-colors" title="Reply"><Reply size={16}/></button>
                          <button onClick={(e) => { e.stopPropagation(); setActiveReactionMessage(msg.id); }} className="p-1.5 text-slate-400 hover:text-amber-400 rounded-md hover:bg-slate-800 transition-colors" title="React"><Smile size={16}/></button>
                        </div>
                      )}
                      
                      <div className="relative">
                        <div onClick={(e) => { e.stopPropagation(); setActiveMessageMenu(prev => prev === msg.id ? null : msg.id); setActiveReactionMessage(null); }} className={`w-full rounded-2xl px-4 py-2 relative cursor-pointer ${
                          msg.isMe 
                            ? 'bg-emerald-600 text-white rounded-tr-sm shadow-emerald-900/20' 
                            : msg.type === 'announcement'
                            ? 'bg-amber-500/20 border border-amber-500/50 text-slate-200 rounded-tl-sm'
                            : 'bg-[#1e293b] text-slate-200 rounded-tl-sm shadow-slate-900/50 border border-slate-800'
                        } shadow-md`}>
                          
                          {msg.isPinned && (
                            <div className="absolute -top-3 -right-2 bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 z-10">
                              <Pin size={10} /> Pinned
                            </div>
                          )}
                          {msg.isForwarded && (
                            <div className="flex items-center gap-1 mb-1 text-slate-400 text-[11px] font-medium italic opacity-80">
                              <Forward size={12} /> Forwarded
                            </div>
                          )}
                          {/* Replied Message Display */}
                          {repliedMsg && (
                            <div onClick={() => scrollToMessage(repliedMsg.id)} className="mb-2 bg-black/20 rounded-lg p-2 border-l-4 border-emerald-400 cursor-pointer hover:bg-black/30 transition-colors">
                              <p className={`text-xs font-bold mb-0.5 ${repliedMsg.isLecturer ? 'text-amber-400' : 'text-emerald-400'}`}>{repliedMsg.sender}</p>
                              <p className="text-xs text-slate-300 truncate">{repliedMsg.text || 'Attachment'}</p>
                            </div>
                          )}

                          {!msg.isMe && (
                            <div className="flex items-baseline justify-between gap-4 mb-1">
                              <span className={`text-xs font-bold ${msg.isLecturer ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {msg.sender} {msg.isLecturer && '✓'}
                              </span>
                            </div>
                          )}
                          
                          {msg.type === 'text' && (
                            <p className={`text-[15px] leading-relaxed break-words whitespace-pre-wrap ${msg.isDeleted ? 'italic text-slate-400/80' : ''}`}>
                              {msg.isDeleted && <Trash2 size={14} className="inline-block mr-1 opacity-70 -mt-0.5" />}
                              {renderMessageTextWithHighlight(msg.text)}
                            </p>
                          )}
                          
                          {msg.type === 'announcement' && (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
                                <Pin size={14} /> Announcement
                              </div>
                              <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{renderMessageTextWithHighlight(msg.text)}</p>
                            </div>
                          )}
                          
                          {msg.type === 'assignment' && (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-1">
                                <FileText size={14} /> Assignment
                              </div>
                              <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{renderMessageTextWithHighlight(msg.text)}</p>
                              {msg.dueDate && (
                                <div className="bg-rose-500/10 text-rose-300 text-xs py-1 px-2 rounded-md mt-1 inline-block border border-rose-500/20">
                                  Due: {msg.dueDate}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {['pdf', 'doc', 'excel', 'ppt', 'zip', 'file'].includes(msg.type) && (
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              {msg.text && <p className={`text-[15px] leading-relaxed break-words whitespace-pre-wrap ${msg.isDeleted ? 'italic text-slate-400/80' : ''}`}>{renderMessageTextWithHighlight(msg.text)}</p>}
                              <div 
                                onClick={(e) => { e.stopPropagation(); setViewingFile({ name: msg.fileName || 'Document', url: msg.fileUrl || '', type: msg.type, size: msg.fileSize || 'Unknown', time: msg.time, sender: msg.sender }); }}
                                className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-slate-700/50 hover:border-emerald-500/50 transition-colors cursor-pointer group mt-1"
                              >
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                                  {msg.type === 'pdf' ? <FileText size={20} className="text-emerald-500" /> : <FileType size={20} className="text-emerald-500" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">{msg.fileName}</h4>
                                  <p className="text-xs text-slate-400/80">{msg.fileSize} • {msg.type.toUpperCase()}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          

                          {msg.type === 'video' && (
                            <div className="flex flex-col gap-2">
                              {msg.text && <p className={`text-[15px] leading-relaxed break-words whitespace-pre-wrap ${msg.isDeleted ? 'italic text-slate-400/80' : ''}`}>{renderMessageTextWithHighlight(msg.text)}</p>}
                              <div 
                                onClick={(e) => { e.stopPropagation(); setViewingFile({ name: msg.fileName || 'Video', url: msg.fileUrl || '', type: 'video', size: msg.fileSize || 'Unknown', time: msg.time, sender: msg.sender }); }}
                                className="relative rounded-xl overflow-hidden mt-1 border border-slate-700 max-h-64 cursor-pointer group bg-black flex items-center justify-center min-w-[200px]"
                              >
                                <video src={msg.fileUrl} className="w-full h-full object-cover max-w-sm max-h-64 opacity-80 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
                                    <Film size={20} className="ml-1" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {msg.type === 'audio' && (
                            <div className="flex flex-col gap-2 min-w-[250px] max-w-sm">
                              {msg.text && <p className={`text-[15px] leading-relaxed break-words whitespace-pre-wrap ${msg.isDeleted ? 'italic text-slate-400/80' : ''}`}>{renderMessageTextWithHighlight(msg.text)}</p>}
                              <div className="bg-black/20 p-3 rounded-xl border border-slate-700/50 mt-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Music size={16} className="text-emerald-500" />
                                  <h4 className="text-xs font-semibold text-white truncate flex-1">{msg.fileName}</h4>
                                  <span className="text-[10px] text-slate-400">{msg.fileSize}</span>
                                </div>
                                <audio controls className="w-full h-10 custom-audio-player">
                                  <source src={msg.fileUrl} />
                                </audio>
                              </div>
                            </div>
                          )}

                          

                          

                          {msg.type === 'image' && (
                            <div className="flex flex-col gap-2">
                              {msg.text && <p className={`text-[15px] leading-relaxed break-words ${msg.isDeleted ? 'italic text-slate-400/80' : ''}`}>{renderMessageTextWithHighlight(msg.text)}</p>}
                              <div className="relative rounded-xl overflow-hidden mt-1 border border-slate-700 max-h-64 cursor-pointer">
                                 <img loading="lazy" src={msg.imageUrl} alt="Shared image" className="w-full h-full object-cover" />
                              </div>
                            </div>
                          )}
                          {msg.type === 'voice' && (
                            <VoiceMessage
                              audioBase64={msg.fileUrl || ''}
                              duration={parseInt(msg.fileSize) || 0}
                              isMe={msg.isMe}
                              messageId={msg.id}
                              sender={msg.sender}
                              time={msg.time}
                              readStatus={msg.readStatus as any}
                              onRetry={() => handleSendVoiceNote(parseInt(msg.fileSize || '0'), msg.fileUrl || '')}
                            />
                          )}


                          <div className={`flex items-center justify-end gap-1 mt-1 ${msg.isMe ? 'text-emerald-100' : 'text-slate-500'}`}>
                            <span className="text-[10px]">{msg.isEdited && <span className="italic opacity-80 mr-1">Edited</span>}{msg.time}</span>
                            {msg.isMe && (
                               msg.readStatus === 'read' ? <CheckCheck size={14} className="text-blue-400" /> :
                               msg.readStatus === 'delivered' ? <CheckCheck size={14} className="text-emerald-200" /> :
                               <Check size={14} className="text-emerald-200/70" />
                            )}
                          </div>
                        </div>

                        {/* Reactions Display */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className={`absolute -bottom-3 ${msg.isMe ? '-left-2 flex-row-reverse' : '-right-2'} flex gap-1 z-10`}>
                            {Object.entries(msg.reactions).map(([emoji, data]) => (
                              <button onClick={() => toggleReaction(msg.id, emoji)} key={emoji} className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] shadow-sm border ${data.me ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-[#1e293b] border-slate-700 text-slate-300 hover:bg-slate-800'}`}>
                                <span>{emoji}</span>
                                {data.count > 1 && <span className="font-semibold">{data.count}</span>}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Emoji Picker Popover */}
                        <AnimatePresence>
                          {activeReactionMessage === msg.id && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.8, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className={`absolute ${msg.isMe ? 'right-0' : 'left-0'} -top-12 bg-[#0f172a] border border-slate-700 rounded-full shadow-2xl p-1.5 flex gap-1 z-50`}
                            >
                              {EMOJIS.map(emoji => (
                                <button key={emoji} onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); }} className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded-full text-lg hover:scale-125 transition-all">
                                  {emoji}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* More Options Dropdown */}
                        <AnimatePresence>
                          {activeMessageMenu === msg.id && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className={`absolute ${msg.isMe ? 'right-0 top-10' : 'left-0 top-10'} bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[160px]`}
                            >
                              <div className="flex flex-col py-1">
                                <button onClick={() => { setReplyingTo(msg); setActiveMessageMenu(null); }} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left w-full">
                                  <Reply size={16} /> Reply
                                </button>
                                <button onClick={() => handleForward(msg.id)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left w-full">
                                  <Forward size={16} /> Forward
                                </button>
                                {msg.type === 'voice' && msg.fileUrl && (
                                  <button onClick={() => handleDownload(msg.fileUrl!, msg.fileName || 'voice_note.webm')} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left w-full">
                                    <Download size={16} /> Download
                                  </button>
                                )}
                                <button onClick={() => handleCopyLink()} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left w-full">
                                  <Copy size={16} /> Copy Link
                                </button>
                                <button onClick={() => { setActiveMessageMenu(null); }} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left w-full">
                                  <Bookmark size={16} /> Bookmark
                                </button>
                                <div className="h-px bg-slate-700/50 my-1"></div>
                                {msg.isMe ? (
                                  <>
                                    <button onClick={() => handleDelete(msg.id)} className="flex items-center gap-3 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-left w-full">
                                      <Trash2 size={16} /> Delete for Me
                                    </button>
                                    <button onClick={() => handleDelete(msg.id)} className="flex items-center gap-3 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-left w-full">
                                      <Trash2 size={16} /> Delete for Everyone
                                    </button>
                                  </>
                                ) : (
                                  <button onClick={() => handleDelete(msg.id)} className="flex items-center gap-3 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-left w-full">
                                    <Trash2 size={16} /> Delete for Me
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                      </div>

                      {/* Reaction / Reply actions desktop (left side for not me) */}
                      {!msg.isMe && (
                        <div className="hidden sm:group-hover:flex items-center gap-1 bg-[#1e293b] rounded-lg p-1 shadow-lg border border-slate-700 ml-2">
                          <button onClick={(e) => { e.stopPropagation(); setActiveReactionMessage(msg.id); }} className="p-1.5 text-slate-400 hover:text-amber-400 rounded-md hover:bg-slate-800 transition-colors" title="React"><Smile size={16}/></button>
                          <button onClick={() => setReplyingTo(msg)} className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-md hover:bg-slate-800 transition-colors" title="Reply"><Reply size={16}/></button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                  </React.Fragment>
                );
              })
            )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
            
          </div>

          
          <AnimatePresence>
            {newMessagesCount > 0 && !isAtBottom && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-20 md:bottom-24 right-4 md:right-8 z-30 flex items-center justify-center"
              >
                <button 
                  onClick={scrollToBottom}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-slate-950 font-medium rounded-full shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors"
                >
                  <span>{newMessagesCount} New Message{newMessagesCount > 1 ? 's' : ''}</span>
                  <ChevronDown size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-[#0f172a] border-t border-slate-800 z-20">
            {replyingTo && (
              <div className="bg-[#1e293b] px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <CornerUpLeft size={16} className="text-emerald-500 shrink-0" />
                  <div className="border-l-2 border-emerald-500 pl-2 min-w-0">
                    <p className="text-xs font-semibold text-emerald-500 truncate">{replyingTo.sender}</p>
                    <p className="text-xs text-slate-400 truncate">{replyingTo.text || 'Attachment'}</p>
                  </div>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:text-white rounded-full">
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="p-3 sm:p-4 pb-[env(safe-area-inset-bottom)]">
              <ErrorBoundary><ChatComposer 
                onSend={handleSendMessage}
                recordingState={recordingState}
                startRecording={startRecording}
                cancelRecording={cancelRecording}
                pauseRecording={pauseRecording}
                resumeRecording={resumeRecording}
                sendRecording={sendRecording}
                recordingDuration={recordingDuration}
                isAtBottomRef={isAtBottomRef}
                scrollToBottom={scrollToBottom}
                onTyping={handleTyping}
              /></ErrorBoundary>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#020617] relative overflow-hidden h-full">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="w-24 h-24 bg-[#0f172a] rounded-full border border-slate-800 flex items-center justify-center mb-6 shadow-2xl relative z-10">
            <MessageCircle size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-3 relative z-10">Real-Time Learning Chat</h2>
          <p className="text-slate-400 max-w-md mx-auto leading-relaxed relative z-10">
            Select a course chat from the sidebar to join the discussion. Connect with your lecturers and peers instantly.
          </p>
          <div className="mt-8 flex items-center gap-4 text-sm text-slate-500 font-medium bg-[#0f172a] py-2 px-6 rounded-full border border-slate-800/50">
            <Check size={16} className="text-emerald-500" /> WhatsApp-style messaging experience
          </div>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout currentView="chats" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="flex w-full h-full bg-[#020617] overflow-hidden relative">
          {sidebarNode}
          {chatAreaNode}
        </div>
      <FileViewerModal file={viewingFile} onClose={() => setViewingFile(null)} />
      <AnimatePresence>
        {showSavedMessages && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowSavedMessages(false)}></div>
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative w-full max-w-sm bg-[#0f172a] h-full border-l border-slate-800 flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#1e293b]">
                <div className="flex items-center gap-2">
                  <Bookmark className="text-emerald-500" size={20} />
                  <h3 className="font-semibold text-white">Saved Messages</h3>
                </div>
                <button onClick={() => setShowSavedMessages(false)} className="text-slate-400 hover:text-white p-1 rounded-full"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.filter(m => m.bookmarkedBy?.includes(profile?.id || '')).length === 0 ? (
                  <p className="text-slate-500 text-center text-sm mt-10">No saved messages.</p>
                ) : (
                  messages.filter(m => m.bookmarkedBy?.includes(profile?.id || '')).map(msg => (
                    <div key={msg.id} className="bg-[#1e293b] p-3 rounded-xl border border-slate-700/50 hover:border-emerald-500/30 transition-colors cursor-pointer" onClick={() => { setShowSavedMessages(false); scrollToMessage(msg.id); }}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-emerald-500">{msg.sender}</span>
                        <span className="text-[10px] text-slate-500">{msg.time}</span>
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-3">{msg.text || (msg.type !== 'text' ? `${msg.type.toUpperCase()} Attachment` : '')}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPinnedMessages && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowPinnedMessages(false)}></div>
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative w-full max-w-sm bg-[#0f172a] h-full border-l border-slate-800 flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#1e293b]">
                <div className="flex items-center gap-2">
                  <Pin className="text-amber-500" size={20} />
                  <h3 className="font-semibold text-white">Pinned Messages</h3>
                </div>
                <button onClick={() => setShowPinnedMessages(false)} className="text-slate-400 hover:text-white p-1 rounded-full"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.filter(m => m.isPinned).length === 0 ? (
                  <p className="text-slate-500 text-center text-sm mt-10">No pinned messages.</p>
                ) : (
                  messages.filter(m => m.isPinned).map(msg => (
                    <div key={msg.id} className="bg-[#1e293b] p-3 rounded-xl border border-slate-700/50 hover:border-amber-500/30 transition-colors cursor-pointer" onClick={() => { setShowPinnedMessages(false); scrollToMessage(msg.id); }}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-amber-500">{msg.sender}</span>
                        <span className="text-[10px] text-slate-500">{msg.time}</span>
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-3">{msg.text || (msg.type !== 'text' ? `${msg.type.toUpperCase()} Attachment` : '')}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence> 
 
        {showGroupSettings && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-0 right-0 h-full w-full sm:w-80 bg-[#0f172a] border-l border-slate-800 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-white">Group Info</h3>
              <button onClick={() => setShowGroupSettings(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-2xl mb-3 relative group">
                  {selectedChatInfo?.code?.substring(0, 2)}
                  {(profile?.role === 'Lecturer' || profile?.role === 'Admin') && (
                    <button onClick={() => showToast('Group image update requested')} className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={20} className="text-white" />
                    </button>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white text-center">{selectedChatInfo?.name}</h2>
                <p className="text-sm text-slate-400">{selectedChatInfo?.code} • {selectedChatInfo?.semester}</p>
              </div>

              <div className="space-y-1">
                <div className="px-3 py-2 hover:bg-slate-800/50 rounded-lg cursor-pointer flex items-center gap-3 transition-colors text-slate-200" onClick={() => { setShowGroupSettings(false); document.getElementById('chat-search-input')?.focus(); }}>
                  <Search size={18} className="text-slate-400" />
                  <span>Search in conversation</span>
                </div>
                <div className="px-3 py-2 hover:bg-slate-800/50 rounded-lg cursor-pointer flex items-center gap-3 transition-colors text-slate-200" onClick={() => { setShowGroupSettings(false); setShowPinnedMessages(true); }}>
                  <Pin size={18} className="text-slate-400" />
                  <span>Pinned Messages</span>
                </div>
                <div className="px-3 py-2 hover:bg-slate-800/50 rounded-lg cursor-pointer flex items-center gap-3 transition-colors text-slate-200" onClick={() => { setShowGroupSettings(false); setShowSavedMessages(true); }}>
                  <Bookmark size={18} className="text-slate-400" />
                  <span>Saved Messages</span>
                </div>
                <div className="px-3 py-2 hover:bg-slate-800/50 rounded-lg cursor-pointer flex items-center justify-between transition-colors text-slate-200">
                  <div className="flex items-center gap-3">
                    <Bell size={18} className="text-slate-400" />
                    <span>Mute Notifications</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${isMuted ? 'bg-emerald-500' : 'bg-slate-700'}`} onClick={() => setIsMuted(!isMuted)}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${isMuted ? 'bg-white left-4.5' : 'bg-slate-400 left-0.5'}`}></div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">Participants ({totalMembersCount})</h4>
                <div className="space-y-2">
                  {chatParticipants.length === 0 ? (
                    <>
                      <div className="flex items-center gap-3 px-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold relative">
                          {(profile?.full_name || 'YOU').substring(0, 2) || 'YOU'}
                          <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-[#0f172a] rounded-full"></div>
                        </div>
                        <div>
                          <p className="text-sm text-slate-200">{profile?.full_name || 'You'}</p>
                          <p className="text-xs text-slate-500">{profile?.role}</p>
                        </div>
                      </div>
                      {Object.values(presenceMap).map((p, i) => (
                        <div key={i} className="flex items-center gap-3 px-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold relative">
                            {(p.name || 'U').substring(0, 2) || 'U'}
                            <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-[#0f172a] rounded-full"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-200 truncate">{p.name}</p>
                            <p className="text-xs text-slate-500">{p.role} {p.status === 'typing' ? ' • typing...' : p.status === 'recording' ? ' • recording...' : ''}</p>
                          </div>
                          {(profile?.role === 'Lecturer' || profile?.role === 'Admin') && (
                            <button onClick={() => showToast('User removed from group')} className="text-slate-500 hover:text-red-400 transition-colors">
                              <UserMinus size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    chatParticipants.map((p, i) => {
                      const isOnline = Object.values(presenceMap).some(onlineUser => onlineUser.name === p.name) || p.name === profile?.full_name;
                      const status = Object.values(presenceMap).find(onlineUser => onlineUser.name === p.name)?.status;
                      
                      return (
                        <div key={i} className="flex items-center gap-3 px-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold relative">
                            {(p.name || 'U').substring(0, 2) || 'U'}
                            {isOnline && <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-[#0f172a] rounded-full"></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-200 truncate">{p.name === profile?.full_name ? 'You' : p.name}</p>
                            <p className="text-xs text-slate-500">{p.role} {status === 'typing' ? ' • typing...' : status === 'recording' ? ' • recording...' : ''}</p>
                          </div>
                          {(profile?.role === 'Lecturer' || profile?.role === 'Admin') && p.name !== profile?.full_name && (
                            <button onClick={() => showToast('User removed from group')} className="text-slate-500 hover:text-red-400 transition-colors">
                              <UserMinus size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                {(profile?.role === 'Lecturer' || profile?.role === 'Admin') && (
                  <button onClick={() => showToast('Invitation link copied to clipboard')} className="mt-4 w-full py-2 flex items-center justify-center gap-2 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors text-sm font-medium">
                    <UserPlus size={16} /> Add Participant
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}


    
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[100] bg-emerald-500 text-slate-900 px-4 py-2 rounded-full font-medium shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
