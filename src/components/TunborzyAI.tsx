import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, Plus, MessageSquare, History, Trash2, Settings,
  Image as ImageIcon, FileText, Camera, Send, MoreVertical,
  ThumbsUp, ThumbsDown, Copy, RefreshCw, X, ArrowLeft,
  Brain, Calculator, FlaskConical, Dna, BookOpen, FileQuestion, AlignLeft, Calendar, 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useProfile } from '../lib/useProfile';
import { supabase } from '../supabaseClient';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  fileData?: { mimeType: string; data: string; name: string };
}

const QUICK_SUGGESTIONS = [
  { title: 'Explain This Topic', icon: Brain, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { title: 'Solve Mathematics', icon: Calculator, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { title: 'Solve Physics', icon: FlaskConical, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { title: 'Solve Chemistry', icon: FlaskConical, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { title: 'Solve Biology', icon: Dna, color: 'text-green-400', bg: 'bg-green-500/10' },
  { title: 'Solve English', icon: BookOpen, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { title: 'Explain Past Question', icon: History, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { title: 'Summarize Lecture Note', icon: AlignLeft, color: 'text-teal-400', bg: 'bg-teal-500/10' },
  { title: 'Generate CBT Practice', icon: FileQuestion, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { title: 'Create Study Plan', icon: Calendar, color: 'text-pink-400', bg: 'bg-pink-500/10' },
];

const LECTURER_SUGGESTIONS = [
  { title: 'Generate Quiz Questions', icon: FileQuestion, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { title: 'Generate Assignment Ideas', icon: Brain, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { title: 'Summarize Lecture Notes', icon: AlignLeft, color: 'text-teal-400', bg: 'bg-teal-500/10' },
  { title: 'Create Learning Objectives', icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { title: 'Generate Practice Questions', icon: History, color: 'text-purple-400', bg: 'bg-purple-500/10' },
];

export default function TunborzyAI({ onBack, role = "student" }: { onBack?: () => void, role?: "student" | "lecturer" | "admin" }) {
  const { profile } = useProfile();
  const avatarUrl = profile?.avatar_url;
  const initials = profile?.full_name && profile.full_name !== '—' 
    ? profile.full_name.split(' ').map((n) => n[0]).join('').substring(0,2).toUpperCase() 
    : 'S';
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('tunborzy_ai_messages');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) { /* ignore */ }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('tunborzy_ai_messages', JSON.stringify(messages));
  }, [messages]);
  const [inputValue, setInputValue] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<Message | null>(null);
  const [feedbackIsHelpful, setFeedbackIsHelpful] = useState(true);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState<Set<string>>(new Set());

  const openFeedback = (msg: Message, isHelpful: boolean) => {
    setFeedbackMessage(msg);
    setFeedbackIsHelpful(isHelpful);
    setFeedbackComment('');
    setFeedbackModalOpen(true);
  };

  const submitFeedback = async () => {
    if (!feedbackMessage || !profile?.id) return;
    try {
      const msgIndex = messages.findIndex(m => m.id === feedbackMessage.id);
      let promptText = '';
      if (msgIndex > 0 && messages[msgIndex - 1].role === 'user') {
        promptText = messages[msgIndex - 1].content;
      }
      const { error } = await supabase.from('ai_feedback').insert({
        user_id: profile.id,
        message_id: feedbackMessage.id,
        prompt: promptText,
        response: feedbackMessage.content,
        is_helpful: feedbackIsHelpful,
        comment: feedbackComment
      });
      if (error) console.error('Failed to submit feedback:', error);
      else {
        setSubmittedFeedbacks(prev => new Set(prev).add(feedbackMessage.id));
      }
    } catch (err) {
      console.error(err);
    }
    setFeedbackModalOpen(false);
    setFeedbackMessage(null);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [isLoggingEnabled, setIsLoggingEnabled] = useState(true);
  const [aiWelcomeMessage, setAiWelcomeMessage] = useState("Hello! Welcome to Tunborzy AI. Ask me anything about your studies.");

  useEffect(() => {
    const fetchAiSettings = async () => {
      try {
        const { data, error } = await supabase.from('ai_settings').select('enabled, welcome_message, enable_logging').limit(1).maybeSingle();
        if (error) {
          if (error.code !== 'PGRST205') {
            console.error('Error fetching AI settings:', JSON.stringify(error));
          }
        } else if (data) {
          setIsAiEnabled(data.enabled);
          if (data.welcome_message) setAiWelcomeMessage(data.welcome_message);
          if (data.enable_logging !== undefined) setIsLoggingEnabled(data.enable_logging);
        }
      } catch (err) {
        console.error('Failed to fetch AI settings', err);
      }
    };
    fetchAiSettings();

    const channel = supabase.channel('ai_settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_settings' }, (payload) => {
        const newSettings = payload.new as any;
        if (newSettings) {
          if (newSettings.enabled !== undefined) setIsAiEnabled(newSettings.enabled);
          if (newSettings.welcome_message) setAiWelcomeMessage(newSettings.welcome_message);
          if (newSettings.enable_logging !== undefined) setIsLoggingEnabled(newSettings.enable_logging);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'pdf') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset input
    if (e.target) {
      e.target.value = '';
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = (event.target?.result as string).split(',')[1];
      
      const newUserMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: `[Uploaded ${type.toUpperCase()}: ${file.name}] Please analyze this ${type}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fileData: { mimeType: file.type, data: base64Data, name: file.name }
      };
      
      const newMessages = [...messages, newUserMsg];
      setMessages(newMessages);
      setIsGenerating(true);
      
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: newMessages.slice(-20),
            userRole: role,
            userId: profile?.id
          })
        });

        if (!response.ok) throw new Error('Failed to get response');

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        const aiMsgId = (Date.now() + 1).toString();
        let aiContent = '';
        
        setMessages(prev => [...prev, {
          id: aiMsgId,
          role: 'ai',
          content: '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isStreaming: true
        }]);

        if (reader) {
          let done = false;
          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n'); //\n'); //\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') break;
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.text) {
                      aiContent += parsed.text;
                      setMessages(prev => prev.map(m => 
                        m.id === aiMsgId ? { ...m, content: aiContent } : m
                      ));
                    } else if (parsed.error) {
                      aiContent += '\n\n**Error:** ' + parsed.error;
                      setMessages(prev => prev.map(m => 
                        m.id === aiMsgId ? { ...m, content: aiContent } : m
                      ));
                    }
                  } catch (e) { /* ignore */
                  }
                }
              }
            }
          }
        }
        
        setMessages(prev => prev.map(m => 
          m.id === aiMsgId ? { ...m, isStreaming: false } : m
        ));
      } catch (err) {
        console.error(err);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'ai',
          content: 'Sorry, I encountered an error while analyzing the file. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isStreaming: false
        }]);
      } finally {
        setIsGenerating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (customText?: string | React.MouseEvent) => {
    const text = typeof customText === 'string' ? customText : inputValue;
    if (!text.trim() || isGenerating) return;
    
    const startTime = performance.now();
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    const newMessages = [...messages, newUserMsg];
    setMessages(newMessages);
    if (typeof customText !== 'string') {
      setInputValue('');
    }
    setIsGenerating(true);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages.slice(-20),
            userRole: role,
            userId: profile?.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      const aiMsgId = (Date.now() + 1).toString();
      let aiContent = '';
      
      setMessages(prev => [...prev, {
        id: aiMsgId,
        role: 'ai',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isStreaming: true
      }]);      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.text) {
                    aiContent += parsed.text;
                    setMessages(prev => prev.map(m => 
                      m.id === aiMsgId ? { ...m, content: aiContent } : m
                    ));
                  } else if (parsed.error) {
                    aiContent += '\n\n**Error:** ' + parsed.error;
                    setMessages(prev => prev.map(m => 
                      m.id === aiMsgId ? { ...m, content: aiContent } : m
                    ));
                  }
                } catch (e) { /* ignore */
                }
              }
            }
          }
        }
      }
      
      setMessages(prev => prev.map(m => 
        m.id === aiMsgId ? { ...m, isStreaming: false } : m
      ));

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      if (profile?.id) {
        let subject = 'General';
        const lowerText = text.toLowerCase();
        if (lowerText.includes('math')) subject = 'Mathematics';
        else if (lowerText.includes('physics')) subject = 'Physics';
        else if (lowerText.includes('chemistry')) subject = 'Chemistry';
        else if (lowerText.includes('biology')) subject = 'Biology';
        else if (lowerText.includes('english')) subject = 'English';
        
        const topic = text.length > 50 ? text.substring(0, 50) + '...' : text;

        supabase.from('ai_conversations').insert({
          user_id: profile.id,
          subject,
          topic,
          response_time: responseTime,
          messages_count: newMessages.length + 1
        }).then(({ error }) => {
          if (error) console.error('Failed to log conversation:', error);
        });
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isStreaming: false
      }]);

      if (profile?.id) {
        let subject = 'General';
        const lowerText = text.toLowerCase();
        if (lowerText.includes('math')) subject = 'Mathematics';
        else if (lowerText.includes('physics')) subject = 'Physics';
        else if (lowerText.includes('chemistry')) subject = 'Chemistry';
        else if (lowerText.includes('biology')) subject = 'Biology';
        else if (lowerText.includes('english')) subject = 'English';
        const topic = text.length > 50 ? text.substring(0, 50) + '...' : text;
        const endTime = performance.now();
        supabase.from('ai_conversations').insert({
          user_id: profile.id,
          subject,
          topic,
          response_time: Math.round(endTime - startTime),
          messages_count: newMessages.length + 1,
          status: 'failed'
        }).then(({ error }) => {
          if (error) console.error('Failed to log failed conversation:', error);
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (title: string) => {
    setInputValue(title);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const MarkdownComponents = {
    h1: ({node, ...props}: any) => <h1 className="text-2xl font-bold mb-4 mt-6 text-white" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-xl font-bold mb-3 mt-5 text-white" {...props} />,
    h3: ({node, ...props}: any) => <h3 className="text-lg font-bold mb-3 mt-4 text-white" {...props} />,
    p: ({node, ...props}: any) => <p className="mb-4 leading-relaxed" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
    ol: ({node, ...props}: any) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
    li: ({node, ...props}: any) => <li className="pl-1" {...props} />,
    a: ({node, ...props}: any) => <a className="text-indigo-400 hover:underline" {...props} />,
    blockquote: ({node, ...props}: any) => {
      const isAnswer = props.children?.toString().includes('Final Answer');
      if (isAnswer) {
        return <blockquote className="border-l-4 border-emerald-500 pl-4 py-3 my-6 bg-emerald-500/10 rounded-r-xl font-medium text-emerald-100 shadow-sm" {...props} />
      }
      return <blockquote className="border-l-4 border-indigo-500 pl-4 py-1 my-4 bg-slate-800/30 rounded-r-lg italic text-slate-300" {...props} />
    },
    code: ({node, inline, className, children, ...props}: any) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline ? (
        <div className="relative rounded-xl overflow-hidden my-4 border border-slate-700 bg-[#020617]">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700">
            <span className="text-xs font-mono text-slate-400">{match?.[1] || 'code'}</span>
            <button className="text-slate-400 hover:text-white transition-colors" title="Copy Code"><Copy size={14} /></button>
          </div>
          <pre className="p-4 overflow-x-auto text-sm font-mono text-slate-300">
            <code className={className} {...props}>
              {children}
            </code>
          </pre>
        </div>
      ) : (
        <code className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded-md text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },
    table: ({node, ...props}: any) => <div className="overflow-x-auto my-6 border border-slate-700 rounded-xl"><table className="w-full text-left border-collapse" {...props} /></div>,
    th: ({node, ...props}: any) => <th className="border-b border-slate-700 bg-slate-800/50 p-3 font-semibold text-slate-200" {...props} />,
    td: ({node, ...props}: any) => <td className="border-b border-slate-700 p-3 text-slate-300" {...props} />,
  };

  return (
    <div className="flex h-[calc(100dvh-120px)] bg-[#020617] text-white overflow-hidden font-sans border border-slate-800 rounded-2xl shadow-2xl relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#020617]/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div 
        className={`fixed lg:relative z-50 h-full w-72 bg-[#0f172a] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-wide text-white">TONBORZY AI Tutor</span>
          </div>
          <div className="flex items-center gap-1">
            {onBack && (
              <button onClick={onBack} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-slate-800 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition-colors mr-2">
                <ArrowLeft size={16} /> Back
              </button>
            )}
            {onBack && (
              <button onClick={onBack} className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors" title="Close AI">
                <X size={18} />
              </button>
            )}
            <button className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors" onClick={() => setIsSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-4">
          <button 
            onClick={() => setMessages([])}
            className="w-full flex items-center gap-2 px-4 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus size={18} /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-6">

        </div>

        <div className="p-4 border-t border-slate-800 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors group relative">
            
            <span className="absolute right-2 bg-slate-800 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Soon</span>
          </button>
          <button onClick={() => setMessages([])} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
            <Trash2 size={16} className="text-slate-500" /> Clear Conversations
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
            <Settings size={16} className="text-slate-500" /> AI Settings
          </button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative w-full min-w-0">
        {!isAiEnabled ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
             <div className="w-20 h-20 rounded-3xl bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20 shadow-2xl shadow-rose-500/10">
                <Bot size={40} className="text-rose-500 opacity-80" />
             </div>
             <h2 className="text-2xl font-bold text-white mb-3">AI Assistant Unavailable</h2>
             <p className="text-slate-400 max-w-md">The AI Assistant is currently disabled by the administrator. Please check back later.</p>
          </div>
        ) : (
          <>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800/50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors lg:hidden"
              >
                <MessageSquare size={20} />
              </button>
            )}
            <div>
              <h2 className="font-semibold text-white">Study Assistant</h2>
              <p className="text-xs text-indigo-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span> Online
              </p>
            </div>
          </div>
          <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <MoreVertical size={20} />
          </button>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6 pb-32">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/20">
                  <Bot size={40} className="text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3">Hello, Student 👋</h1>
                <p className="text-slate-300 text-lg mb-10 max-w-2xl leading-relaxed">
                  {aiWelcomeMessage}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-4xl">
                  {(role === 'lecturer' ? LECTURER_SUGGESTIONS : QUICK_SUGGESTIONS).map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion.title)}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all text-left group"
                    >
                      <div className={`p-2.5 rounded-xl ${suggestion.bg} ${suggestion.color}`}>
                        <suggestion.icon size={18} />
                      </div>
                      <span className="text-sm font-medium text-slate-300 group-hover:text-white">{suggestion.title}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-500 flex-shrink-0 flex items-center justify-center mt-1">
                      <Bot size={20} className="text-white" />
                    </div>
                  )}
                  
                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end max-w-[85%] sm:max-w-[75%]' : 'items-start max-w-[90%] sm:max-w-[85%]'}`}>
                    <div 
                      className={`px-5 py-4 rounded-3xl text-[15px] leading-relaxed break-words w-full ${
                        msg.role === 'user' 
                          ? 'bg-indigo-500 text-white rounded-tr-sm' 
                          : 'bg-[#0f172a] border border-slate-800 text-slate-200 rounded-tl-sm'
                      }`}
                    >
                      {msg.role === 'ai' ? (
                        <div className="markdown-content">
                          <ReactMarkdown 
                            components={MarkdownComponents} 
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {msg.content}
                          </ReactMarkdown>
                          {msg.isStreaming && (
                            <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse"></span>
                          )}
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2 px-1">
                      <span className="text-xs text-slate-500">{msg.timestamp}</span>
                      {msg.role === 'ai' && !msg.isStreaming && (
                        <div className="flex items-center gap-1">
                          <button className="p-1 text-slate-500 hover:text-white transition-colors" title="Copy">
                            <Copy size={14} />
                          </button>
                          
                          <button 
                            onClick={() => openFeedback(msg, true)}
                            disabled={submittedFeedbacks.has(msg.id)}
                            className={`p-1 transition-colors ${submittedFeedbacks.has(msg.id) ? 'text-emerald-500 opacity-50 cursor-not-allowed' : 'text-slate-500 hover:text-emerald-400'}`} 
                            title="Helpful"
                          >
                            <ThumbsUp size={14} />
                          </button>
                          <button 
                            onClick={() => openFeedback(msg, false)}
                            disabled={submittedFeedbacks.has(msg.id)}
                            className={`p-1 transition-colors ${submittedFeedbacks.has(msg.id) ? 'text-rose-500 opacity-50 cursor-not-allowed' : 'text-slate-500 hover:text-rose-400'}`} 
                            title="Not Helpful"
                          >
                            <ThumbsDown size={14} />
                          </button>
  
                          <button className="p-1 text-slate-500 hover:text-indigo-400 transition-colors ml-1" title="Regenerate" onClick={() => handleSendMessage(msg.content)}>
                            <RefreshCw size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-800 flex-shrink-0 flex items-center justify-center mt-1 font-bold text-white uppercase overflow-hidden">
                      {avatarUrl ? <img loading="lazy" src={avatarUrl} alt="User" className="w-full h-full object-cover" /> : initials}
                    </div>
                  )}
                </motion.div>
              ))
            )}
            
            {isGenerating && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <div className="flex gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-500 flex-shrink-0 flex items-center justify-center mt-1">
                  <Bot size={20} className="text-white" />
                </div>
                <div className="px-5 py-4 rounded-3xl bg-[#0f172a] border border-slate-800 rounded-tl-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#020617] via-[#020617] to-transparent pt-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-2 sm:p-3 shadow-2xl focus-within:border-indigo-500/50 transition-colors">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question, paste a problem, or upload a note..."
                className="w-full bg-transparent text-white placeholder-slate-500 px-3 py-3 max-h-32 focus:outline-none resize-none text-[15px] custom-scrollbar"
                rows={1}
              />
              
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50">
                <div className="flex items-center gap-1 sm:gap-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={imageInputRef} 
                    onChange={(e) => handleFileUpload(e, 'image')} 
                  />
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    className="hidden" 
                    ref={pdfInputRef} 
                    onChange={(e) => handleFileUpload(e, 'pdf')} 
                  />
                  <button onClick={() => imageInputRef.current?.click()} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-colors group relative" title="Upload Image">
                    <ImageIcon size={20} />
                  </button>
                  <button onClick={() => pdfInputRef.current?.click()} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors" title="Upload PDF">
                    <FileText size={20} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors hidden sm:block" title="Take Screenshot">
                    <Camera size={20} />
                  </button>
                </div>
                
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isGenerating}
                  className="p-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:shadow-none flex items-center justify-center gap-2 font-bold px-4 sm:px-6"
                >
                  <span className="hidden sm:inline">Send</span> <Send size={18} />
                </button>
              </div>
            </div>
            <div className="text-center mt-3">
              <p className="text-[11px] text-slate-500">TONBORZY AI Tutor can make mistakes. Verify important academic information.</p>
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button 
                onClick={() => setFeedbackModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                {feedbackIsHelpful ? (
                  <><ThumbsUp className="text-emerald-400" /> Helpful Response</>
                ) : (
                  <><ThumbsDown className="text-rose-400" /> Not Helpful</>
                )}
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                Tell us why this response was {feedbackIsHelpful ? 'helpful' : 'not helpful'} (optional).
              </p>
              
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Add a comment..."
                rows={4}
                className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none mb-6"
              />
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setFeedbackModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={submitFeedback}
                  className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  Submit Feedback
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
