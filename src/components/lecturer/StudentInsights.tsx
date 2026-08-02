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
  
  const PERFORMANCE_DATA = [
    { name: 'Week 1', score: 0, attendance: 0 },
    { name: 'Week 2', score: 0, attendance: 0 },
  ];
  
  const ENGAGEMENT_DATA = [
    { name: 'Assignments', completed: 0, pending: 0 },
    { name: 'Quizzes', completed: 0, pending: 0 },
  ];

  const GRADE_DISTRIBUTION = [
    { name: 'A (70-100)', value: 0, color: '#10b981' }, // emerald-500
    { name: 'B (60-69)', value: 0, color: '#3b82f6' }, // blue-500
    { name: 'C (50-59)', value: 0, color: '#f59e0b' }, // amber-500
    { name: 'F (0-49)', value: 0, color: '#f43f5e' },  // rose-500
  ];

  const STUDENTS: any[] = [];

  useEffect(() => {
    if (profile) fetchCourses();
  }, [profile?.id, profile?.role]);

  const fetchCourses = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('courses').select('id, title, course_code').eq('lecturer_id', profile?.id);
      setCourses(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = STUDENTS.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.reg_no.toLowerCase().includes(searchQuery.toLowerCase())
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><TrendingUp size={20} /></div>
                <h3 className="text-slate-400 font-bold text-sm">Average Score</h3>
              </div>
              <div className="text-3xl font-display font-bold text-white mb-1">76.4%</div>
              <p className="text-xs text-emerald-500 font-bold">+4.2% from last week</p>
            </div>
            
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"><Users size={20} /></div>
                <h3 className="text-slate-400 font-bold text-sm">Avg. Attendance</h3>
              </div>
              <div className="text-3xl font-display font-bold text-white mb-1">89.2%</div>
              <p className="text-xs text-rose-500 font-bold">-1.5% from last week</p>
            </div>
            
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500"><CheckCircle2 size={20} /></div>
                <h3 className="text-slate-400 font-bold text-sm">Assignment Completion</h3>
              </div>
              <div className="text-3xl font-display font-bold text-white mb-1">92.0%</div>
              <p className="text-xs text-emerald-500 font-bold">+2.0% from last week</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trend */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6">Performance & Attendance Trend</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PERFORMANCE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Legend iconType="circle" />
                    <Area type="monotone" name="Avg Score (%)" dataKey="score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                    <Area type="monotone" name="Attendance (%)" dataKey="attendance" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Engagement Breakdown */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
              <h3 className="text-lg font-bold text-white mb-6">Task Completion Rate</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ENGAGEMENT_DATA} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} width={80} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                      cursor={{fill: '#1e293b', opacity: 0.4}}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="completed" name="Completed (%)" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={32} />
                    <Bar dataKey="pending" name="Pending (%)" stackId="a" fill="#1e293b" radius={[0, 4, 4, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Grade Distribution */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6">Grade Distribution</h3>
              <div className="h-[250px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={GRADE_DISTRIBUTION}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {GRADE_DISTRIBUTION.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                    <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Actionable Insights */}
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-6 shadow-xl flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500"><FileText size={20} /></div>
                <h3 className="text-xl font-display font-bold text-white">AI Assistant Insights</h3>
              </div>
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
                  <p><strong>4 students</strong> are at risk of failing due to low attendance and poor assignment scores.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                  <p>Overall engagement is up. Students are responding well to the recently uploaded Course Materials.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                  <p>Question 4 on the last CBT Exam had a 85% failure rate. Consider reviewing this topic in the next live class.</p>
                </li>
              </ul>
              <button className="mt-6 w-full py-3 bg-amber-500/10 text-amber-500 font-bold rounded-xl border border-amber-500/20 hover:bg-amber-500 hover:text-slate-950 transition-colors">
                Generate Full Report
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search students..." 
                className="w-full bg-[#020617]/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors text-sm font-bold w-max">
              <Filter size={16} /> Filter
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 font-action text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Student Name</th>
                  <th className="p-4 font-semibold">Reg Number</th>
                  <th className="p-4 font-semibold">Course</th>
                  <th className="p-4 font-semibold">Progress</th>
                  <th className="p-4 font-semibold">Attendance</th>
                  <th className="p-4 font-semibold">Avg Score</th>
                  <th className="p-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-bold text-white">{student.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-sm">{student.reg_no}</td>
                    <td className="p-4">
                      <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-bold font-mono border border-slate-700">
                        {student.course}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden min-w-[80px]">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${student.progress}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-400">{student.progress}%</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-300 text-sm">{student.attendance}</td>
                    <td className="p-4 font-bold text-white text-sm">{student.score}%</td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        student.status === 'Excellent' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        student.status === 'Good' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                        student.status === 'Average' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">No students found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
