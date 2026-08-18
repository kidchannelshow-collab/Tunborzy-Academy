import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ChevronRight, ChevronLeft, Target, Play, ShieldAlert, Award } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface CBTUndergraduateDrillingProps {
  onStartDrill: (config: any) => void;
  onBack: () => void;
  onViewAnalytics?: () => void;
}

export default function CBTUndergraduateDrilling({ onStartDrill, onBack, onViewAnalytics }: CBTUndergraduateDrillingProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  const [levels, setLevels] = useState<string[]>([]);
  const [courses, setCourses] = useState<{ id: string, course_code: string, title: string }[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Configuration for the drill
  const [questionCount, setQuestionCount] = useState(20);
  const [isTimed, setIsTimed] = useState(true);
  const [timeMinutes, setTimeMinutes] = useState(30);

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    setLoading(true);
    try {
      // In a real scenario we might get distinct levels from courses that have exams
      // For this implementation we'll fetch from courses
      const { data, error } = await supabase
        .from('courses')
        .select('portal');
      
      if (error) {
        // Fallback to hardcoded if table missing
        setLevels(['100 Level', '200 Level', '300 Level', '400 Level']);
      } else if (data) {
        const uniqueLevels = Array.from(new Set(data.map(d => d.portal))).filter(Boolean) as string[];
        setLevels(uniqueLevels.length > 0 ? uniqueLevels : ['100 Level', '200 Level', '300 Level', '400 Level']);
      }
    } catch (err) {
      console.error(err);
      setLevels(['100 Level', '200 Level', '300 Level', '400 Level']);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async (level: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, course_code, title')
        .eq('portal', level);
      
      if (!error && data) {
        setCourses(data);
      } else {
        setCourses([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async (courseCode: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbt_exams')
        .select('topic')
        .eq('course_code', courseCode)
        .eq('is_published', true);
      
      if (!error && data) {
        const uniqueTopics = Array.from(new Set(data.map(d => d.topic))).filter(Boolean) as string[];
        setTopics(uniqueTopics);
      } else {
        setTopics([]);
      }
    } catch (err) {
      console.error(err);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelSelect = (level: string) => {
    setSelectedLevel(level);
    setSelectedCourse(null);
    setSelectedTopics([]);
    fetchCourses(level);
    setStep(2);
  };

  const handleCourseSelect = (courseCode: string) => {
    setSelectedCourse(courseCode);
    setSelectedTopics([]);
    fetchTopics(courseCode);
    setStep(3);
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const startDrill = () => {
    onStartDrill({
      courseCode: selectedCourse,
      topics: selectedTopics,
      count: questionCount,
      timed: isTimed,
      time: timeMinutes
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (step === 1) onBack();
              else if (step === 2) setStep(1);
              else if (step === 3) setStep(2);
            }}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Undergraduate CBT Drilling</h1>
            <p className="text-slate-400">Master your courses with targeted practice sessions</p>
          </div>
        </div>
        {onViewAnalytics && (
          <button
            onClick={onViewAnalytics}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 border border-slate-700 shadow-sm"
          >
            <Award size={16} className="text-amber-400" /> Performance Analytics & History
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-2 flex-1 rounded-full ${step >= i ? 'bg-amber-500' : 'bg-slate-800'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 text-sm">1</span>
              Select Your Academic Level
            </h2>
            
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>
            ) : levels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {levels.map(level => (
                  <button
                    key={level}
                    onClick={() => handleLevelSelect(level)}
                    className="p-6 bg-[#0f172a] border border-slate-800 hover:border-amber-500/50 rounded-2xl flex items-center justify-between group transition-all"
                  >
                    <span className="text-lg font-bold text-slate-300 group-hover:text-white">{level}</span>
                    <ChevronRight size={20} className="text-slate-600 group-hover:text-amber-500" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-[#0f172a] border border-slate-800 rounded-2xl">
                <ShieldAlert size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">No levels found. Please check back later.</p>
              </div>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 text-sm">2</span>
              Select Course ({selectedLevel})
            </h2>

            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>
            ) : courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map(course => (
                  <button
                    key={course.id}
                    onClick={() => handleCourseSelect(course.course_code)}
                    className="p-6 bg-[#0f172a] border border-slate-800 hover:border-amber-500/50 rounded-2xl text-left group transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                        {course.course_code}
                      </span>
                      <ChevronRight size={20} className="text-slate-600 group-hover:text-amber-500" />
                    </div>
                    <h3 className="font-bold text-slate-300 group-hover:text-white">{course.title}</h3>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-[#0f172a] border border-slate-800 rounded-2xl">
                <BookOpen size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">No courses available for {selectedLevel}.</p>
              </div>
            )}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 text-sm">3</span>
                Select Topics ({selectedCourse})
              </h2>

              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-slate-300">Available Topics</h3>
                  <button 
                    onClick={() => setSelectedTopics(selectedTopics.length === topics.length ? [] : [...topics])}
                    className="text-sm text-amber-500 hover:text-amber-400 font-medium"
                  >
                    {selectedTopics.length === topics.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {loading ? (
                   <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>
                ) : topics.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {topics.map(topic => (
                      <button
                        key={topic}
                        onClick={() => toggleTopic(topic)}
                        className={`p-4 rounded-xl border flex items-center gap-3 transition-colors text-left ${
                          selectedTopics.includes(topic) 
                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          selectedTopics.includes(topic) ? 'bg-amber-500 border-amber-500' : 'border-slate-600'
                        }`}>
                          {selectedTopics.includes(topic) && <span className="text-[#0f172a] text-xs font-bold">✓</span>}
                        </div>
                        <span className="line-clamp-2">{topic}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400">No specific topics found. You can still start a drill for the entire course.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 sticky top-24">
                <h3 className="font-bold text-white mb-6">Drill Configuration</h3>
                
                <div className="space-y-6 mb-8">
                  <div>
                    <label className="flex items-center justify-between text-sm text-slate-400 mb-3">
                      <span>Number of Questions</span>
                      <span className="text-white font-bold">{questionCount}</span>
                    </label>
                    <input 
                      type="range" 
                      min="5" max="100" step="5"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Timed Session</span>
                    <button 
                      onClick={() => setIsTimed(!isTimed)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors ${isTimed ? 'bg-amber-500' : 'bg-slate-700'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isTimed ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {isTimed && (
                    <div>
                      <label className="flex items-center justify-between text-sm text-slate-400 mb-3">
                        <span>Duration (Minutes)</span>
                        <span className="text-white font-bold">{timeMinutes}m</span>
                      </label>
                      <input 
                        type="range" 
                        min="5" max="120" step="5"
                        value={timeMinutes}
                        onChange={(e) => setTimeMinutes(parseInt(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={startDrill}
                  disabled={topics.length > 0 && selectedTopics.length === 0}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-[#0f172a] rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={20} />
                  Start Drill Now
                </button>
                {topics.length > 0 && selectedTopics.length === 0 && (
                  <p className="text-xs text-center text-rose-400 mt-3">Please select at least one topic.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
