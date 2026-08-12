import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bot, Power, MessageSquare, Activity } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { supabase } from '../../supabaseClient';

export default function AIManagement() {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('Hello! Welcome to Tunborzy AI. Ask me anything about your studies.');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('You are TONBORZY AI Tutor...');
  const [personality, setPersonality] = useState('Professional and encouraging');
  const [teachingStyle, setTeachingStyle] = useState('Step-by-step guidance');
  const [answerLength, setAnswerLength] = useState('Detailed');
  const [language, setLanguage] = useState('English');

  const [dailyLimit, setDailyLimit] = useState(1000);
  const [studentLimit, setStudentLimit] = useState(50);
  const [blockOffensive, setBlockOffensive] = useState(true);
  const [academicOnly, setAcademicOnly] = useState(true);
  const [enableLogging, setEnableLogging] = useState(true);

  const [stats, setStats] = useState({
    totalQuestions: 0,
    questionsToday: 0,
    activeSessions: 0,
    avgResponseTime: 0,
    uniqueStudents: 0,
    topSubject: '--',
    topTopic: '--'
  });

  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isIrreversible, setIsIrreversible] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
                const { data, error } = await supabase
          .from('ai_settings')
          .select('enabled, welcome_message, system_prompt, personality, teaching_style, answer_length, language, daily_limit, student_limit, block_offensive, academic_only, enable_logging')
          .limit(1)
          .maybeSingle();
        
        if (error) {
          if (error.code !== 'PGRST205') {
            console.error('Error fetching AI settings:', JSON.stringify(error));
          }
        } else if (data) {
          setAiEnabled(data.enabled);
          if (data.welcome_message) setWelcomeMessage(data.welcome_message);
          if (data.system_prompt) setSystemPrompt(data.system_prompt);
          if (data.personality) setPersonality(data.personality);
          if (data.teaching_style) setTeachingStyle(data.teaching_style);
          if (data.answer_length) setAnswerLength(data.answer_length);
          if (data.language) setLanguage(data.language);
          if (data.daily_limit !== undefined && data.daily_limit !== null) setDailyLimit(data.daily_limit);
          if (data.student_limit !== undefined && data.student_limit !== null) setStudentLimit(data.student_limit);
          if (data.block_offensive !== undefined && data.block_offensive !== null) setBlockOffensive(data.block_offensive);
          if (data.academic_only !== undefined && data.academic_only !== null) setAcademicOnly(data.academic_only);
          if (data.enable_logging !== undefined && data.enable_logging !== null) setEnableLogging(data.enable_logging);
        }
      } catch (err) {
        console.error('Failed to load AI settings', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.rpc('get_ai_statistics');
        if (!error && data) {
           setStats(data);
           return;
        }
        
        // Fallback if RPC is not available
        const { data: fallbackData } = await supabase.from('ai_conversations').select('*');
        if (fallbackData) {
           const now = new Date();
           const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
           const oneHourAgo = now.getTime() - (60 * 60 * 1000);
           
           let questionsToday = 0;
           let active = new Set();
           let totalRespTime = 0;
           let validRespCount = 0;
           let uniqueUsers = new Set();
           
           const subjectCounts: Record<string, number> = {};
           const topicCounts: Record<string, number> = {};

           fallbackData.forEach(log => {
             const t = new Date(log.created_at).getTime();
             if (t >= todayStart) questionsToday++;
             if (t >= oneHourAgo) active.add(log.user_id);
             
             if (log.response_time) {
                totalRespTime += log.response_time;
                validRespCount++;
             }
             
             uniqueUsers.add(log.user_id);
             
             if (log.subject) {
               subjectCounts[log.subject] = (subjectCounts[log.subject] || 0) + 1;
             }
             if (log.topic) {
               topicCounts[log.topic] = (topicCounts[log.topic] || 0) + 1;
             }
           });

           let topSubject = '--';
           let maxSub = 0;
           for (const [k,v] of Object.entries(subjectCounts)) {
             if (v > maxSub) { maxSub = v; topSubject = k; }
           }
           let topTopic = '--';
           let maxTop = 0;
           for (const [k,v] of Object.entries(topicCounts)) {
             if (v > maxTop) { maxTop = v; topTopic = k; }
           }

           setStats({
             totalQuestions: fallbackData.length,
             questionsToday,
             activeSessions: active.size,
             avgResponseTime: validRespCount ? Math.round(totalRespTime / validRespCount) : 0,
             uniqueStudents: uniqueUsers.size,
             topSubject,
             topTopic
           });
        }
      } catch (err) {}
    };
    fetchStats();

  }, []);

  const handleDangerousAction = (title: string, message: string, irreversible: boolean, action: () => void) => {
    setActionTitle(title);
    setActionMessage(message);
    setIsIrreversible(irreversible);
    setPendingAction(() => action);
    setIsModalOpen(true);
  };
  
    const saveChanges = async () => {
    setIsSaving(true);
    try {
      const { data: existing, error: checkError } = await supabase.from('ai_settings').select('id').limit(1).maybeSingle();
      if (checkError) throw checkError;
      
      const updates = {
        enabled: aiEnabled,
        welcome_message: welcomeMessage,
        system_prompt: systemPrompt,
        personality: personality,
        teaching_style: teachingStyle,
        answer_length: answerLength,
        language: language,
        daily_limit: dailyLimit,
        student_limit: studentLimit,
        block_offensive: blockOffensive,
        academic_only: academicOnly,
        enable_logging: enableLogging,
        updated_at: new Date().toISOString()
      };

      if (existing?.id) {
        const { error } = await supabase.from('ai_settings').update(updates).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ai_settings').insert([updates]);
        if (error) throw error;
      }
      
      alert('Settings saved successfully!');
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings. Check console.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
      const defWelcome = 'Hello! Welcome to Tunborzy AI. Ask me anything about your studies.';
      const defPrompt = 'You are TONBORZY AI Tutor, a helpful academic assistant for an educational platform. You help students with their studies, explain concepts step by step, and solve problems with worked solutions. Explain science, engineering, computing concepts, and university-level topics. Help students prepare for CBT examinations, generate quizzes when requested, summarize academic notes, simplify difficult concepts, and recommend study strategies. If course materials are provided, use them as the highest-priority knowledge source. Otherwise, use your general educational knowledge. Never return fake information. If the answer is uncertain, state that clearly instead of inventing facts. Encourage learning instead of cheating, explain answers instead of only giving results, use clear language, and maintain a professional tone. Never expose that you are Gemini, identify yourself only as TONBORZY AI Tutor. If you need more information, use Google Search.';
      const updates = {
          enabled: true,
          welcome_message: defWelcome,
          system_prompt: defPrompt,
          personality: 'Professional and encouraging',
          teaching_style: 'Step-by-step guidance',
          answer_length: 'Detailed',
          language: 'English',
          daily_limit: 1000,
          student_limit: 50,
          block_offensive: true,
          academic_only: true,
          enable_logging: true,
          updated_at: new Date().toISOString()
      };
      
      setAiEnabled(true);
      setWelcomeMessage(defWelcome);
      setSystemPrompt(defPrompt);
      setPersonality('Professional and encouraging');
      setTeachingStyle('Step-by-step guidance');
      setAnswerLength('Detailed');
      setLanguage('English');
      setDailyLimit(1000);
      setStudentLimit(50);
      setBlockOffensive(true);
      setAcademicOnly(true);
      setEnableLogging(true);

      const { data: existing } = await supabase.from('ai_settings').select('id').limit(1).maybeSingle();
      if (existing?.id) {
          await supabase.from('ai_settings').update(updates).eq('id', existing.id);
      } else {
          await supabase.from('ai_settings').insert([updates]);
      }
      alert('Reset to defaults successfully!');
  };

  const toggleAIEnabled = async () => {
    const newState = !aiEnabled;
    setAiEnabled(newState);
    
    const { data: existing } = await supabase.from('ai_settings').select('id').limit(1).maybeSingle();
    if (existing?.id) {
        await supabase.from('ai_settings').update({ enabled: newState }).eq('id', existing.id);
    }
    alert(`AI Assistant has been ${newState ? 'enabled' : 'disabled'}`);
  };if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto relative"
    >
      <ConfirmationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => {
          if (pendingAction) {
            pendingAction();
          } else {
            setIsModalOpen(false);
          }
        }}
        title={actionTitle}
        message={actionMessage}
        isIrreversible={isIrreversible}
      />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <Bot className="text-emerald-400" size={28} /> AI Management
          </h1>
          <p className="text-sm font-body text-slate-400">Configure and monitor the AI Study Assistant.</p>
        </div>
        <button 
          onClick={() => {
            if (aiEnabled) {
              handleDangerousAction('Disable AI Assistant', 'Are you sure you want to disable the AI Assistant? Students will no longer be able to use it.', false, toggleAIEnabled);
            } else {
              toggleAIEnabled();
            }
          }}
          disabled={isSaving}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
            aiEnabled ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
          } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Power size={16} /> {aiEnabled ? 'Disable AI Assistant' : 'Enable AI Assistant'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <MessageSquare className="text-emerald-400" size={20} /> Welcome Message Configuration
            </h2>
                        <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Default Welcome Message</label>
                <textarea 
                  rows={4}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Set a custom welcome message for the AI..."
                  className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                />
                <p className="text-xs text-slate-500 mt-2">This is the first message the AI sends when a student opens the chat.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Bot className="text-blue-400" size={20} /> Prompt Manager
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">System Prompt</label>
                <textarea 
                  rows={6}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                />
                <p className="text-xs text-slate-500 mt-2">The core instructions that define the AI's identity and boundaries.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Personality</label>
                  <input 
                    type="text"
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Teaching Style</label>
                  <input 
                    type="text"
                    value={teachingStyle}
                    onChange={(e) => setTeachingStyle(e.target.value)}
                    className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Answer Length</label>
                  <select 
                    value={answerLength}
                    onChange={(e) => setAnswerLength(e.target.value)}
                    className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Concise">Concise</option>
                    <option value="Detailed">Detailed</option>
                    <option value="Comprehensive">Comprehensive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Language</label>
                  <input 
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>


          <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Power className="text-blue-400" size={20} /> Advanced Controls
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Daily Question Limit (Global)</label>
                  <input 
                    type="number"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Max Questions Per Student (Daily)</label>
                  <input 
                    type="number"
                    value={studentLimit}
                    onChange={(e) => setStudentLimit(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={blockOffensive} onChange={(e) => setBlockOffensive(e.target.checked)} />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${blockOffensive ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${blockOffensive ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <span className="text-sm font-semibold text-slate-300">Block Offensive Language</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={academicOnly} onChange={(e) => setAcademicOnly(e.target.checked)} />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${academicOnly ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${academicOnly ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <span className="text-sm font-semibold text-slate-300">Allow Only Academic Questions</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={enableLogging} onChange={(e) => setEnableLogging(e.target.checked)} />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${enableLogging ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${enableLogging ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <span className="text-sm font-semibold text-slate-300">Enable Logging (Save AI Conversations)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={saveChanges}
              disabled={isSaving}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
            <button 
              onClick={() => handleDangerousAction('Reset Defaults', 'Are you sure you want to reset all AI settings and prompts back to their factory defaults?', true, handleResetDefaults)}
              disabled={isSaving}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
            >
              Reset Defaults
            </button>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Activity className="text-blue-400" size={20} /> Usage Statistics
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                <span className="text-sm text-slate-400">Total Conversations</span>
                <span className="text-xl font-bold text-white">{stats.totalQuestions}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                <span className="text-sm text-slate-400">Conversations Today</span>
                <span className="text-xl font-bold text-emerald-400">{stats.questionsToday}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                <span className="text-sm text-slate-400">Active Sessions</span>
                <span className="text-xl font-bold text-emerald-400">{stats.activeSessions}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                <span className="text-sm text-slate-400">Avg. Response Time</span>
                <span className="text-xl font-bold text-white">{stats.avgResponseTime}ms</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                <span className="text-sm text-slate-400">Total Questions Asked</span>
                <span className="text-xl font-bold text-white">{stats.totalQuestions}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                <span className="text-sm text-slate-400">Unique Students Using AI</span>
                <span className="text-xl font-bold text-white">{stats.uniqueStudents}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                <span className="text-sm text-slate-400">Most Asked Subject</span>
                <span className="text-lg font-medium text-white truncate max-w-[150px] text-right" title={stats.topSubject}>{stats.topSubject}</span>
              </div>
              <div className="flex justify-between items-center pb-4">
                <span className="text-sm text-slate-400">Most Asked Topic</span>
                <span className="text-lg font-medium text-white truncate max-w-[150px] text-right" title={stats.topTopic}>{stats.topTopic}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
