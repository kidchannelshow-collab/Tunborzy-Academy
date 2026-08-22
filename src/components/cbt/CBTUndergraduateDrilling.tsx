import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ChevronRight, ChevronLeft, Target, Play, ShieldAlert, Award, Layers } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface CBTUndergraduateDrillingProps {
  onStartDrill: (config: any) => void;
  onBack: () => void;
  onViewAnalytics?: () => void;
}

export default function CBTUndergraduateDrilling({ onStartDrill, onBack, onViewAnalytics }: CBTUndergraduateDrillingProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  const [selectedSemester, setSelectedSemester] = useState<'First Semester' | 'Second Semester' | null>(null);
  const [courses, setCourses] = useState<{ code: string, title: string, type: 'Academic' | 'CBT-Only' }[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Configuration for the drill
  const [questionCount, setQuestionCount] = useState(20);
  const [isTimed, setIsTimed] = useState(true);
  const [timeMinutes, setTimeMinutes] = useState(30);

  const FIRST_SEMESTER_COURSES = [
    { code: 'CHM 101', title: 'General Chemistry I', type: 'Academic' as const },
    { code: 'PHY 101', title: 'General Physics I', type: 'Academic' as const },
    { code: 'PHY 103', title: 'Physics for Physical Sciences I', type: 'Academic' as const },
    { code: 'MTH 101', title: 'Elementary Mathematics I', type: 'Academic' as const },
    { code: 'MTH 103', title: 'Algebra and Trigonometry', type: 'Academic' as const },
    { code: 'COS 101', title: 'Introduction to Computer Science', type: 'Academic' as const },
    { code: 'PHY 107', title: 'Practical Physics I (CBT)', type: 'CBT-Only' as const },
    { code: 'BIO 107', title: 'General Biology Practical I (CBT)', type: 'CBT-Only' as const },
    { code: 'CHM 107', title: 'Practical Chemistry I (CBT)', type: 'CBT-Only' as const },
  ];

  const SECOND_SEMESTER_COURSES = [
    { code: 'CHM 102', title: 'General Chemistry II', type: 'Academic' as const },
    { code: 'PHY 102', title: 'General Physics II', type: 'Academic' as const },
    { code: 'PHY 104', title: 'Physics for Physical Sciences II', type: 'Academic' as const },
    { code: 'MTH 102', title: 'Elementary Mathematics II', type: 'Academic' as const },
    { code: 'MTH 114', title: 'Introduction to Numerical Methods', type: 'Academic' as const },
    { code: 'CHM 108', title: 'Practical Chemistry II (CBT)', type: 'CBT-Only' as const },
    { code: 'PHY 108', title: 'Practical Physics II (CBT)', type: 'CBT-Only' as const },
  ];

  const handleSemesterSelect = (semester: 'First Semester' | 'Second Semester') => {
    setSelectedSemester(semester);
    setSelectedCourse(null);
    setSelectedTopics([]);
    setCourses(semester === 'First Semester' ? FIRST_SEMESTER_COURSES : SECOND_SEMESTER_COURSES);
    setStep(2);
  };

  const handleCourseSelect = async (courseCode: string) => {
    setSelectedCourse(courseCode);
    setSelectedTopics([]);
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
      setStep(3);
    }
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
            <p className="text-slate-400">Master your semester courses with targeted practice sessions</p>
          </div>
        </div>
        {onViewAnalytics && (
          <button
            onClick={onViewAnalytics}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 border border-slate-700 shadow-sm"
          >
            <Award size={16} className="text-amber-400" /> Performance Analytics
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
              Select Semester
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(['First Semester', 'Second Semester'] as const).map(sem => (
                <button
                  key={sem}
                  onClick={() => handleSemesterSelect(sem)}
                  className="p-8 bg-[#0f172a] border border-slate-800 hover:border-amber-500/50 rounded-2xl flex flex-col items-start group transition-all text-left shadow-lg"
                >
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl mb-4 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                    <Layers size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{sem}</h3>
                  <p className="text-sm text-slate-400 mb-6">
                    {sem === 'First Semester' ? 'Access CHM 101, PHY 101, MTH 101, COS 101 & CBT-only practical courses.' : 'Access CHM 102, PHY 102, MTH 102, MTH 114 & CBT-only practical courses.'}
                  </p>
                  <span className="text-xs font-bold text-amber-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Select Semester <ChevronRight size={16} />
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 text-sm">2</span>
              Select Course ({selectedSemester})
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Academic / Standard Courses</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {courses.filter(c => c.type === 'Academic').map(course => (
                    <button
                      key={course.code}
                      onClick={() => handleCourseSelect(course.code)}
                      className="p-5 bg-[#0f172a] border border-slate-800 hover:border-amber-500/50 rounded-2xl text-left group transition-all"
                    >
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded mb-2 inline-block">
                        {course.code}
                      </span>
                      <h4 className="font-bold text-slate-200 group-hover:text-white text-sm line-clamp-2">{course.title}</h4>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">CBT-Only Practical Courses</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {courses.filter(c => c.type === 'CBT-Only').map(course => (
                    <button
                      key={course.code}
                      onClick={() => handleCourseSelect(course.code)}
                      className="p-5 bg-[#0f172a] border border-amber-500/20 hover:border-amber-500/60 rounded-2xl text-left group transition-all bg-gradient-to-br from-amber-500/5 to-transparent"
                    >
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded mb-2 inline-block">
                        {course.code} (CBT-Only)
                      </span>
                      <h4 className="font-bold text-slate-200 group-hover:text-white text-sm line-clamp-2">{course.title}</h4>
                    </button>
                  ))}
                </div>
              </div>
            </div>
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
                  {topics.length > 0 && (
                    <button 
                      onClick={() => setSelectedTopics(selectedTopics.length === topics.length ? [] : [...topics])}
                      className="text-sm text-amber-500 hover:text-amber-400 font-medium"
                    >
                      {selectedTopics.length === topics.length ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
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
                  <div className="text-center py-8 bg-slate-900/50 rounded-xl border border-slate-800/80 p-6">
                    <p className="text-slate-300 font-medium mb-1">Full Course Drill Ready</p>
                    <p className="text-xs text-slate-400">No specific topic tags found. You can start drilling all questions for {selectedCourse}.</p>
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
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-[#0f172a] rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
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
