import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MessageCircle, ArrowRight, User, BookOpen } from 'lucide-react';
import DashboardLayout from './dashboard/DashboardLayout';
import { supabase } from '../supabaseClient';
import { useProfile } from '../lib/useProfile';

interface MyCoursesPageProps {
  onLogout: () => void;
  onOpenChat: () => void;
  onNavigate?: (view: string) => void;
}

export default function MyCoursesPage({ onLogout, onOpenChat, onNavigate }: MyCoursesPageProps) {
  const { profile } = useProfile();
  const [courses, setCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    if (!profile) return;
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('course_enrollments')
          .select('*, courses(*, profiles(full_name))')
          .eq('student_id', profile.id);
                  
        if (data && data.length > 0) {
          const formatted = data.map(enr => ({
             code: enr.courses?.course_code || 'Unknown',
             title: enr.courses?.title || 'Unknown Course',
             lecturer: enr.courses?.profiles?.full_name || 'Unknown Lecturer',
             semester: enr.courses?.semester || 'Unknown Semester',
             status: enr.status || 'In Progress',
             unreadMessages: 0,
             lastActivity: new Date(enr.created_at).toLocaleDateString(),
             id: enr.course_id
          }));
          setCourses(formatted);
        } else {
            setCourses([]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourses();
  }, [profile]);

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCourseClick = (courseId: string) => {
    sessionStorage.setItem('targetChatId', courseId);
    onOpenChat();
  };

  return (
    <DashboardLayout onLogout={onLogout} currentView="courses" onNavigate={onNavigate}>
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">My Course Hub</h1>
            <p className="text-slate-400 font-body">Access your enrolled courses and connect with lecturers and peers.</p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredCourses.map((course, idx) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleCourseClick(course.id)}
                className="bg-[#0f172a]/80 backdrop-blur-md rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col h-full shadow-lg"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <BookOpen size={24} />
                    </div>
                    {course.unreadMessages > 0 && (
                      <span className="bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg shadow-rose-500/20">
                        {course.unreadMessages} New
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-sm font-bold text-amber-500 tracking-wider mb-1">{course.code}</h3>
                  <h2 className="text-xl font-display font-bold text-white mb-2 line-clamp-2">{course.title}</h2>
                  
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
                    <User size={14} />
                    <span>{course.lecturer}</span>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-4 pb-4 border-b border-slate-800/50">
                      <span>{course.semester}</span>
                      <span className={`px-2 py-0.5 rounded ${course.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {course.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                        <MessageCircle size={16} />
                        <span>Last active: {course.lastActivity}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-amber-500 flex items-center justify-center transition-colors">
                        <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-950" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-20 bg-[#0f172a]/50 rounded-2xl border border-slate-800 border-dashed">
            <BookOpen size={48} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-display font-bold text-white mb-2">No courses found</h3>
            <p className="text-slate-400">Try adjusting your search query.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
