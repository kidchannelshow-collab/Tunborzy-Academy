import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users, Eye, Search, FileText, Filter, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useProfile } from '../../lib/useProfile';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';

export default function StudentInsights() {
  const { profile } = useProfile();
  
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'analytics' | 'students'>('analytics');
  
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      fetchCourses();
    }
  }, [profile?.id, profile?.role]);

  const fetchCourses = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('courses').select('id, title, course_code').eq('lecturer_id', profile?.id);
      if (data) {
        setCourses(data);
        fetchStudents(data.map(c => c.id));
      } else {
        fetchStudents([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudents = async (courseIds: string[]) => {
    if (!supabase || courseIds.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('profiles(*)')
        .in('course_id', courseIds);
        
      if (data) {
        // Extract unique profiles
        const uniqueProfiles = Array.from(
          new Map(data.map((enrollment: any) => [enrollment.profiles?.id, enrollment.profiles])).values()
        ).filter(Boolean);
        setStudents(uniqueProfiles);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    (s.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.student_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto pb-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Student Management & Analytics</h1>
          <p className="text-slate-400">Monitor engagement, analyze performance, and manage your students.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
             value={selectedCourse} 
             onChange={e => setSelectedCourse(e.target.value)}
            className="bg-[#0f172a] border border-slate-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.course_code ? `${c.course_code} - ` : ''}{c.title}</option>)}
          </select>
          <button className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-700" title="Export Report">
            <Eye size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-px">
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`px-6 py-3 font-bold text-sm transition-colors relative ${activeTab === 'analytics' ? 'text-amber-500' : 'text-slate-400 hover:text-white'}`}
        >
          Performance Analytics
          {activeTab === 'analytics' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('students')}
          className={`px-6 py-3 font-bold text-sm transition-colors relative ${activeTab === 'students' ? 'text-amber-500' : 'text-slate-400 hover:text-white'}`}
        >
          Student Directory
          {activeTab === 'students' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500"></div>}
        </button>
      </div>

      {activeTab === 'analytics' ? (
        <div className="space-y-6">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-12 text-center shadow-xl">
             <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
               <TrendingUp className="text-slate-500" size={32} />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">No Analytics Data Yet</h3>
             <p className="text-slate-400 max-w-md mx-auto">
               Once students start attempting your CBT exams, their performance data will appear here.
             </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Search by name or ID..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0f172a] border border-slate-700 text-slate-300 rounded-xl hover:text-white hover:border-slate-600 transition-colors">
              <Filter size={18} />
              <span className="font-semibold text-sm">Filters</span>
            </button>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">Student</th>
                    <th className="px-6 py-4 font-bold">Student ID</th>
                    <th className="px-6 py-4 font-bold">Email</th>
                    <th className="px-6 py-4 font-bold">Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">Loading students...</td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        {searchQuery ? 'No students match your search.' : 'No students found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-sm shrink-0">
                              {(student.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-200">{student.full_name || 'Unknown Student'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-mono text-sm">{student.student_id || '—'}</td>
                        <td className="px-6 py-4 text-slate-400 text-sm">{student.email}</td>
                        <td className="px-6 py-4 text-slate-400 text-sm">{student.level || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
