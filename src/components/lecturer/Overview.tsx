import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, FileText, Book, Library, Users, Calendar, Clock } from 'lucide-react';
import { useProfile } from '../../lib/useProfile';
import { supabase } from '../../supabaseClient';

export default function Overview() {
  const { profile } = useProfile();
  const displayName = profile?.full_name || "Lecturer";
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  const [stats, setStats] = useState({
    courses: 0,
    active_courses: 0,
    upcoming_classes: 0,
    assignments: 0,
    cbt: 0,
    students: 0
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      fetchStats();
      fetchRecentActivity();
    }
  }, [profile?.id, profile?.role]);

  const fetchStats = async () => {
    if (!supabase || !profile) return;
    try {
      const [coursesRes, classesRes, assignmentsRes, cbtRes] = await Promise.all([
        supabase.from('courses').select('id, is_archived').eq('lecturer_id', profile.id),
        supabase.from('live_classes').select('id', { count: 'exact', head: true }).eq('lecturer_id', profile.id).gte('start_time', new Date().toISOString()),
        supabase.from('assignments').select('id', { count: 'exact', head: true }).eq('lecturer_id', profile.id),
        supabase.from('cbt_exams').select('id', { count: 'exact', head: true }).eq('lecturer_id', profile.id)
      ]);
      
      const studentsRes = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'Student');
      const courses = coursesRes.data || [];
      
      setStats({
        courses: courses.length,
        active_courses: courses.filter(c => !c.is_archived).length,
        upcoming_classes: classesRes.count || 0,
        assignments: assignmentsRes.count || 0,
        cbt: cbtRes.count || 0,
        students: studentsRes.count || 0
      });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecentActivity = async () => {
    if (!supabase || !profile) return;
    try {
      const { data } = await supabase.from('courses').select('title, created_at').eq('lecturer_id', profile.id).order('created_at', { ascending: false }).limit(5);
      if (data && data.length > 0) {
        setRecentActivities(data.map((c, i) => ({ id: i, type: 'course', text: `You created ${c.title}`, time: new Date(c.created_at).toLocaleDateString(), icon: BookOpen, color: 'text-emerald-500' })));
      } else {
        setRecentActivities([]);
      }
    } catch (err) { console.error(err); }
  };

  const STATS_DATA = [
    { label: 'Total Courses', value: stats.courses, icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Active Courses', value: stats.active_courses, icon: Library, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Total Students', value: stats.students, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Upcoming Classes', value: stats.upcoming_classes, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Pending Assignments', value: stats.assignments, icon: Book, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'CBT Exams Created', value: stats.cbt, icon: FileText, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <Calendar size={14} />
            <span>{today}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
            {greeting}, {displayName}
          </h1>
          <p className="text-sm font-body text-slate-400">
            Manage your courses, track student performance, and schedule classes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {STATS_DATA.map((stat, idx) => (
          <div key={idx} className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={24} className={stat.color} />
              </div>
            </div>
            <h3 className="text-3xl font-display font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-sm text-slate-400 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display font-bold text-white">Average Student Performance</h3>
            <select className="bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500">
              <option>This Semester</option>
              <option>Last Semester</option>
              <option>All Time</option>
            </select>
          </div>
          
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl">
             <div className="text-center">
               <div className="text-4xl mb-4 text-emerald-500 font-bold">78%</div>
               <p className="text-slate-400 text-sm">Average across all your courses</p>
               <p className="text-xs text-slate-500 mt-2">+5% from last semester</p>
             </div>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-xl font-display font-bold text-white mb-6">Recent Activity</h3>
          
          <div className="space-y-6">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex gap-4">
                <div className={`w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center shrink-0 border border-slate-800 ${activity.color}`}>
                  <activity.icon size={16} />
                </div>
                <div>
                  <p className="text-sm text-slate-300 font-medium leading-snug">{activity.text}</p>
                  <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-6 py-3 border border-slate-800 rounded-xl text-slate-400 text-sm font-semibold hover:text-white hover:bg-slate-800 transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </motion.div>
  );
}
