import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Layers, FileText, ArrowLeft, Loader2, PlayCircle, BookMarked, ChevronRight, GraduationCap, ArrowRight } from 'lucide-react';
import DashboardLayout from '../dashboard/DashboardLayout';
import { supabase } from '../../supabaseClient';
import { useProfile } from '../../lib/useProfile';
import StudentLessonViewer from '../materials/StudentLessonViewer';

interface AcademicMaterialsPageProps {
  onLogout: () => void;
  onNavigate?: (view: string) => void;
}

export default function AcademicMaterialsPage({ onLogout, onNavigate }: AcademicMaterialsPageProps) {
  const { profile } = useProfile();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [levels, setLevels] = useState<string[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [topics, setTopics] = useState<{name: string, materials: any[]}[]>([]);

  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);

  useEffect(() => {
    fetchLevels();
  }, [profile]);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      setError(null);
      // Only fetch levels that have published content
      const { data, error } = await supabase
        .from('courses')
        .select('portal, status');
      
      if (error) throw error;
      
      if (data) {
        // filter by published status where appropriate. 
        // Admin manages Course status as well? In CourseManagement.tsx we saw courseInput.status === 'Published'.
        const activeCourses = data.filter(c => c.status === 'Published');
        const uniqueLevels = Array.from(new Set(activeCourses.map(c => c.portal))).filter(Boolean);
        
        // Also pre-select level if student profile has it
        if (profile?.level && uniqueLevels.includes(profile.level) && !selectedLevel) {
           setSelectedLevel(profile.level);
           fetchCourses(profile.level);
        }
        
        // Sort levels (e.g., 100 Level, 200 Level)
        uniqueLevels.sort();
        setLevels(uniqueLevels);
      }
    } catch (err: any) {
      setError('Failed to load levels. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async (level: string) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedLevel(level);
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('portal', level)
        .eq('status', 'Published')
        .order('title', { ascending: true });
        
      if (error) throw error;
      setCourses(data || []);
    } catch (err: any) {
      setError('Failed to load courses.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicsAndMaterials = async (course: any) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedCourse(course);
      
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('course_code', course.course_code)
        .eq('is_published', true)
        .eq('file_type', 'lesson')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      // Group by topic
      if (data) {
        const topicMap = new Map<string, any[]>();
        data.forEach(m => {
          const t = m.topic || 'General';
          if (!topicMap.has(t)) topicMap.set(t, []);
          topicMap.get(t)!.push(m);
        });
        
        const grouped = Array.from(topicMap.entries()).map(([name, materials]) => ({
          name,
          materials
        }));
        setTopics(grouped);
      } else {
        setTopics([]);
      }
    } catch (err: any) {
      setError('Failed to load topics.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (selectedTopic) {
      setSelectedTopic(null);
    } else if (selectedCourse) {
      setSelectedCourse(null);
    } else if (selectedLevel) {
      setSelectedLevel(null);
      fetchLevels();
    }
  };

  const openLesson = (topicName: string, material: any) => {
    setSelectedTopic(topicName);
    setSelectedMaterial(material);
  };

  if (selectedMaterial) {
    return (
      <StudentLessonViewer 
        material={selectedMaterial} 
        onClose={() => {
          setSelectedMaterial(null);
          setSelectedTopic(null);
        }} 
        onNavigateToSibling={(siblingId) => {
           // find sibling in our loaded topics
           for (const topic of topics) {
             const mat = topic.materials.find(m => m.id === siblingId);
             if (mat) {
                openLesson(topic.name, mat);
                return;
             }
           }
        }}
      />
    );
  }

  return (
    <DashboardLayout onLogout={onLogout} currentView="academic-materials" onNavigate={onNavigate}>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 text-indigo-400 mb-2">
              <GraduationCap size={24} />
              <h2 className="font-bold tracking-widest uppercase text-sm">Undergraduate</h2>
            </div>
            <h1 className="text-3xl font-display font-bold text-white">Academic Materials</h1>
            <p className="text-slate-400 mt-2">Access your structured lecture notes, slides, and academic resources.</p>
          </div>
        </div>

        {/* Breadcrumbs / Back button */}
        {(selectedLevel || selectedCourse || selectedTopic) && (
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="font-medium text-sm">
              Back to {selectedCourse ? 'Courses' : selectedLevel ? 'Levels' : 'Overview'}
            </span>
          </button>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex items-center justify-between">
            <p>{error}</p>
            <button onClick={() => {
              if (selectedCourse) fetchTopicsAndMaterials(selectedCourse);
              else if (selectedLevel) fetchCourses(selectedLevel);
              else fetchLevels();
            }} className="px-3 py-1 bg-rose-500/20 rounded-lg hover:bg-rose-500/30 transition-colors text-sm font-bold">
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
            <p>Loading academic materials...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!selectedLevel && (
              <motion.div 
                key="levels"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
              >
                {levels.length > 0 ? levels.map(level => (
                  <button
                    key={level}
                    onClick={() => fetchCourses(level)}
                    className="bg-[#0f172a] border border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl text-left transition-all group hover:bg-[#1e293b]"
                  >
                    <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      <Layers size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{level}</h3>
                    <p className="text-slate-400 text-sm flex items-center gap-2 group-hover:text-slate-300">
                      Explore courses <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
                    </p>
                  </button>
                )) : (
                  <div className="col-span-full text-center py-12 bg-[#0f172a] border border-slate-800 rounded-2xl">
                    <BookMarked className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Academic materials for this level are not available yet.</p>
                  </div>
                )}
              </motion.div>
            )}

            {selectedLevel && !selectedCourse && (
              <motion.div 
                key="courses"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedLevel} Courses</h2>
                    <p className="text-slate-400 text-sm">Select a course to view its topics.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.length > 0 ? courses.map(course => (
                    <button
                      key={course.id}
                      onClick={() => fetchTopicsAndMaterials(course)}
                      className="bg-[#0f172a] border border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl text-left transition-all group flex flex-col h-full"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-lg text-sm font-bold uppercase tracking-wider">
                          {course.course_code}
                        </span>
                        <ChevronRight className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{course.title}</h3>
                      {course.description && (
                        <p className="text-slate-400 text-sm mb-4 line-clamp-2 flex-1">{course.description}</p>
                      )}
                      <div className="mt-auto pt-4 border-t border-slate-800/50 flex items-center text-sm text-slate-500">
                        <BookOpen size={14} className="mr-2" />
                        Access materials
                      </div>
                    </button>
                  )) : (
                    <div className="col-span-full text-center py-12 bg-[#0f172a] border border-slate-800 rounded-2xl">
                      <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">Materials for this level are not available yet.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {selectedCourse && !selectedTopic && (
              <motion.div 
                key="topics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 md:p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                  <div className="relative z-10">
                    <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-lg text-sm font-bold uppercase tracking-wider mb-4 inline-block">
                      {selectedCourse.course_code}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{selectedCourse.title}</h2>
                    {selectedCourse.description && (
                      <p className="text-slate-400 max-w-2xl text-sm md:text-base">{selectedCourse.description}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="text-indigo-400" size={20} />
                    Course Topics
                  </h3>
                  
                  {topics.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {topics.map((topic, index) => (
                        <div key={topic.name} className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">
                          <div className="p-5 border-b border-slate-800/50 bg-[#1e293b]/30">
                            <h4 className="text-lg font-bold text-white flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </span>
                              {topic.name}
                            </h4>
                          </div>
                          <div className="divide-y divide-slate-800/50">
                            {topic.materials.map((material, mIndex) => (
                              <button
                                key={material.id}
                                onClick={() => openLesson(topic.name, material)}
                                className="w-full text-left p-5 hover:bg-slate-800/50 transition-colors flex items-center gap-4 group"
                              >
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <PlayCircle size={20} />
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-semibold text-slate-200 group-hover:text-white transition-colors">{material.title || `Lesson ${mIndex + 1}`}</h5>
                                  <p className="text-xs text-slate-500 mt-1">Read lesson material</p>
                                </div>
                                <ChevronRight className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-[#0f172a] border border-slate-800 rounded-2xl">
                      <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">Materials for this course are not available yet.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </DashboardLayout>
  );
}
