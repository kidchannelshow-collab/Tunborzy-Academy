import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, Target, PlayCircle, Settings2, Calculator } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function CBTCustomBuilder({ onBack, onStartCustom }: any) {
  const [examType, setExamType] = useState('JAMB');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(40);
  const [timeLimit, setTimeLimit] = useState(30);
  const [difficulty, setDifficulty] = useState('Medium');
  const [examMode, setExamMode] = useState('Practice');
  const [calculator, setCalculator] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<{id: string, title: string}[]>([]);
  
  useEffect(() => {
    async function fetchCourses() {
      if (!supabase) return;
      const { data } = await supabase.from('courses').select('id, title').eq('is_published', true);
      if (data) {
        setAvailableCourses(data);
      }
    }
    fetchCourses();
  }, []);

  const toggleSubject = (s: string) => {
    if (subjects.includes(s)) setSubjects(subjects.filter(x => x !== s));
    else if (subjects.length < 4) setSubjects([...subjects, s]);
  };

  const handleStart = () => {
    const subjectTitles = availableCourses
      .filter(c => subjects.includes(c.id))
      .map(c => c.title);
      
    onStartCustom({
      type: examType,
      subjects, // These are course IDs
      subjectTitles,
      count: questionCount,
      time: timeLimit,
      difficulty,
      mode: examMode,
      calculator
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-[#0f172a] text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Custom Exam Builder</h1>
          <p className="text-slate-400">Configure your CBT session precisely how you want it.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Target className="text-amber-500" size={20} /> Exam Type & Mode
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {['JAMB', 'WAEC', 'NECO', 'Post-UTME'].map(type => (
                <button
                  key={type}
                  onClick={() => setExamType(type)}
                  className={`p-3 rounded-xl border transition-all text-sm font-medium ${examType === type ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'Practice', label: 'Practice Mode', desc: 'Instant answers & hints' },
                { id: 'Exam', label: 'Exam Mode', desc: 'Strict timing & no hints' }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setExamMode(mode.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${examMode === mode.id ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                >
                  <h3 className={`font-bold ${examMode === mode.id ? 'text-emerald-500' : 'text-slate-200'}`}>{mode.label}</h3>
                  <p className="text-xs text-slate-500 mt-1">{mode.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <BookOpen className="text-blue-500" size={20} /> Select Subjects (Max 4)
            </h2>
            <div className="flex flex-wrap gap-3">
              {availableCourses.length > 0 ? availableCourses.map(course => (
                <button
                  key={course.id}
                  onClick={() => toggleSubject(course.id)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${subjects.includes(course.id) ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
                >
                  {course.title}
                </button>
              )) : (
                <div className="text-slate-500 text-sm py-2">No subjects available</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Settings2 className="text-purple-500" size={20} /> Configuration
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="text-sm text-slate-400 font-medium block mb-2">Number of Questions</label>
                <select 
                  value={questionCount} 
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={10}>10 Questions</option>
                  <option value={20}>20 Questions</option>
                  <option value={40}>40 Questions</option>
                  <option value={60}>60 Questions</option>
                  <option value={100}>100 Questions</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-400 font-medium block mb-2">Time Limit</label>
                <select 
                  value={timeLimit} 
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={5}>5 Minutes</option>
                  <option value={10}>10 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={120}>2 Hours</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-400 font-medium block mb-2">Difficulty</label>
                <select 
                  value={difficulty} 
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>
              
              <div className="pt-2">
                <button 
                  onClick={() => setCalculator(!calculator)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${calculator ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                >
                  <span className="flex items-center gap-2 font-medium"><Calculator size={18} /> On-screen Calculator</span>
                  <div className={`w-8 h-4 rounded-full transition-colors relative ${calculator ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                    <div className={`absolute top-0.5 bottom-0.5 w-3 bg-white rounded-full transition-all ${calculator ? 'left-4' : 'left-0.5'}`}></div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={subjects.length === 0}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-lg py-4 rounded-2xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <PlayCircle size={24} />
            Launch CBT Session
          </button>
        </div>
      </div>
    </motion.div>
  );
}
