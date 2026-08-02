import { motion } from 'motion/react';
import { MessageCircle, BookOpen, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useProfile } from '../../lib/useProfile';

interface MyCoursesProps {
  onNavigate?: (view: string) => void;
}

export default function MyCourses({ onNavigate }: MyCoursesProps) {
  const { profile } = useProfile();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('course_enrollments')
          .select('*, courses(*)')
          .eq('student_id', profile.id)
          .limit(3);
          
        if (data && data.length > 0) {
          const formatted = data.map(enr => ({ 
             code: enr.courses?.course_code || 'Unknown', 
             title: enr.courses?.title || 'Unknown Course', 
             status: enr.status || 'In Progress',
             unread: 0,
             lastActivity: new Date(enr.created_at).toLocaleDateString(),
             id: enr.course_id
          }));
          setCourses(formatted);
        } else {
            setCourses([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [profile?.id, profile?.role]);

  if (loading) {
     return <div className="animate-pulse h-48 bg-slate-800/50 rounded-2xl mb-10"></div>;
  }

  const handleCourseClick = (courseId: string) => {
    sessionStorage.setItem('targetChatId', courseId);
    if (onNavigate) {
      onNavigate('chats');
    }
  };

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
          My Course Hub
        </h3>
        <button onClick={() => onNavigate && onNavigate('courses')} className="text-sm font-poppins font-medium text-amber-500 hover:text-amber-400 transition-colors">
          View All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {courses.length > 0 ? courses.map((course, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -5 }}
            className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800/50 rounded-2xl p-5 hover:border-amber-500/50 transition-all group shadow-xl shadow-black/10 cursor-pointer flex flex-col h-full"
            onClick={() => handleCourseClick(course.id)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <BookOpen size={20} />
              </div>
              {course.unread > 0 && (
                <span className="bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg shadow-rose-500/20">
                  {course.unread} New
                </span>
              )}
            </div>

            <div className="mb-6 flex-1">
              <span className="inline-block px-3 py-1 rounded-lg bg-slate-800/80 text-xs font-mono font-medium text-amber-500 mb-2">
                {course.code}
              </span>
              <h4 className="text-lg font-display font-bold text-white line-clamp-2">
                {course.title}
              </h4>
            </div>

            <div className="mt-auto">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-4 pb-4 border-b border-slate-800/50">
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
          </motion.div>
        )) : (
           <div className="col-span-full py-12 flex flex-col items-center justify-center bg-slate-800/30 border border-slate-800/50 rounded-2xl">
              <BookOpen size={48} className="text-slate-600 mb-4" />
              <p className="text-slate-400 font-medium mb-4">You are not enrolled in any courses yet.</p>
              <button 
                onClick={() => onNavigate && onNavigate('courses')}
                className="px-6 py-2.5 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-400 transition-colors"
              >
                Browse Courses
              </button>
           </div>
        )}
      </div>
    </div>
  );
}
