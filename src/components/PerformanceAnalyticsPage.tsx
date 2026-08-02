import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart2, Clock, Target, TrendingUp, TrendingDown,
  Award, FileText, MessageCircle, AlertTriangle, Zap, BrainCircuit, Activity, CheckSquare, XCircle, HelpCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import DashboardLayout from './dashboard/DashboardLayout';
import { supabase } from '../supabaseClient';

import { useProfile } from '../lib/useProfile';

interface PerformanceAnalyticsPageProps {
  onLogout: () => void;
  onNavigate?: (view: string) => void;
}

const CBT_HISTORY_DATA = [
  { date: 'Mon', score: 65, average: 50 },
  { date: 'Tue', score: 72, average: 52 },
  { date: 'Wed', score: 68, average: 55 },
  { date: 'Thu', score: 85, average: 58 },
  { date: 'Fri', score: 82, average: 60 },
  { date: 'Sat', score: 90, average: 62 },
  { date: 'Sun', score: 88, average: 64 },
];

const STUDY_TIME_DATA = [
  { day: 'Mon', hours: 2.5 },
  { day: 'Tue', hours: 3.2 },
  { day: 'Wed', hours: 1.5 },
  { day: 'Thu', hours: 4.0 },
  { day: 'Fri', hours: 2.8 },
  { day: 'Sat', hours: 5.5 },
  { day: 'Sun', hours: 4.2 },
];

const SUBJECT_PERFORMANCE = [
  { subject: 'Use of English', score: 85, completion: 90, messages: 24, totalMessages: 30, trend: 'up' },
  { subject: 'Mathematics', score: 92, completion: 85, messages: 18, totalMessages: 25, trend: 'up' },
  { subject: 'Physics', score: 78, completion: 70, messages: 15, totalMessages: 35, trend: 'down' },
  { subject: 'Chemistry', score: 65, completion: 60, messages: 10, totalMessages: 28, trend: 'down' },
];

const ACHIEVEMENTS = [
  { id: 1, title: 'First CBT Completed', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 2, title: '7-Day Study Streak', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 3, title: 'Course Completed', icon: Award, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 4, title: 'Score Above 90%', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

const PIE_COLORS = ['#10b981', '#f43f5e', '#64748b'];

// Generate dummy heatmap data (0 intensity until real tracking is implemented)
const generateHeatmap = () => {
  const data = [];
  for (let i = 0; i < 7; i++) {
    const week = [];
    for (let j = 0; j < 20; j++) {
      week.push(0);
    }
    data.push(week);
  }
  return data;
};
const HEATMAP_DATA = generateHeatmap();

const getHeatmapColor = (intensity: number) => {
  switch(intensity) {
    case 1: return 'bg-amber-500/20';
    case 2: return 'bg-amber-500/40';
    case 3: return 'bg-amber-500/60';
    case 4: return 'bg-amber-500';
    default: return 'bg-slate-800/50';
  }
};

const CircularProgress = ({ percentage, color, size = 60, strokeWidth = 6 }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-800"
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          className={color}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-sm font-display font-bold text-white">{percentage}%</span>
      </div>
    </div>
  );
};

export default function PerformanceAnalyticsPage({ onLogout, onNavigate }: PerformanceAnalyticsPageProps) {
  const { profile } = useProfile();
  const [academicPortal, setAcademicPortal] = useState<string>('Undergraduate');
  const [timeFilter, setTimeFilter] = useState('7D');

  const [cbtAvgScore, setCbtAvgScore] = useState<number | null>(null);
  const [totalSubmissionsCount, setTotalSubmissionsCount] = useState<number>(0);

  useEffect(() => {
    if (profile?.portal) {
      setAcademicPortal(profile.portal);
    }
  }, [profile?.id, profile?.role]);

  useEffect(() => {
    async function loadCbtStats() {
      if (!supabase || !profile?.id) return;
      try {
        const { data, error } = await supabase
          .from('cbt_submissions')
          .select('percentage_score, score')
          .eq('student_id', profile.id);
        if (data && data.length > 0) {
          setTotalSubmissionsCount(data.length);
          const totalPct = data.reduce((acc: number, curr: any) => acc + (curr.percentage_score || 0), 0);
          setCbtAvgScore(Math.round(totalPct / data.length));
        }
      } catch (err) {
        console.warn("Could not load CBT stats:", err);
      }
    }
    loadCbtStats();
  }, [profile?.id, profile?.role]);

  return (
    <DashboardLayout onLogout={onLogout} currentView="analytics" onNavigate={onNavigate}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-8 pb-10"
      >
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
              <BarChart2 className="text-amber-500" size={28} /> Performance Analytics
            </h1>
            <p className="text-sm font-body text-slate-400">Monitor your learning progress and identify areas for improvement.</p>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: 'Overall Progress', value: '78%', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: '+5%', up: true },
            { label: 'Avg CBT Score', value: '81%', icon: Award, color: 'text-cyan-500', bg: 'bg-cyan-500/10', trend: '+12%', up: true },
            { label: 'Study Hours', value: '42h', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: '-2h', up: false },
            { label: 'Active Chats', value: '28', icon: MessageCircle, color: 'text-rose-500', bg: 'bg-rose-500/10', trend: '+4', up: true },
            { label: 'Learning Streak', value: '5 Days', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: 'Best: 12', up: true },
            { label: 'Current Rank', value: 'Top 15%', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10', trend: 'Rising', up: true },
          ].map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 relative overflow-hidden group hover:border-slate-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon size={20} className={stat.color} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-action font-semibold px-2 py-1 rounded-full ${stat.up ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
                  {stat.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {stat.trend}
                </div>
              </div>
              <p className="text-xs font-body text-slate-400 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-display font-bold text-white">{stat.value}</h3>
              
              {/* Fake Sparkline */}
              <div className="absolute bottom-0 left-0 w-full h-8 opacity-20">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={CBT_HISTORY_DATA.slice(0, 5).map(d => ({ v: d.score }))}>
                    <Line type="monotone" dataKey="v" stroke={stat.up ? '#10b981' : '#f43f5e'} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 xl:col-span-3 space-y-6">
            <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-lg font-display font-bold text-white">Performance Overview</h3>
                  <p className="text-xs text-slate-400">Your CBT scores over time</p>
                </div>
                <div className="flex gap-2 p-1 bg-[#020617] border border-slate-800 rounded-lg w-fit">
                  {['7D', '30D', '3M', 'ALL'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setTimeFilter(filter)}
                      className={`px-3 py-1.5 rounded-md text-xs font-action font-semibold transition-all ${
                        timeFilter === filter 
                          ? 'bg-amber-500 text-slate-950 shadow-md' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={CBT_HISTORY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#475569" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                      labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="average" name="Average" stroke="#475569" strokeWidth={2} fillOpacity={1} fill="url(#colorAvg)" />
                    <Area type="monotone" dataKey="score" name="Your Score" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject Performance & Study Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-display font-bold text-white mb-6">Subject Progress</h3>
                <div className="space-y-5">
                  {SUBJECT_PERFORMANCE.map(subject => (
                    <div key={subject.subject} className="flex items-center gap-4 p-3 rounded-xl bg-[#020617]/50 border border-slate-800/50 hover:border-slate-700 transition-colors">
                      <CircularProgress percentage={subject.completion} color="text-amber-500" size={50} strokeWidth={4} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-display font-bold text-white truncate">{subject.subject}</h4>
                          <span className="text-xs font-bold text-amber-500">{subject.score}%</span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {subject.messages} of {subject.totalMessages} Messages • {subject.totalMessages - subject.messages} Left
                        </p>
                      </div>
                      <div className="hidden sm:flex">
                        {subject.trend === 'up' ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-rose-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-display font-bold text-white">Study Time</h3>
                  <span className="text-xs text-amber-500 font-semibold bg-amber-500/10 px-2 py-1 rounded-lg">This Week</span>
                </div>
                <div className="flex-1 min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={STUDY_TIME_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        cursor={{ fill: '#1e293b', opacity: 0.4 }}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                      />
                      <Bar dataKey="hours" name="Hours" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        {STUDY_TIME_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.hours > 3 ? '#3b82f6' : '#60a5fa'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Heatmap & CBT Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-display font-bold text-white mb-2">Study Activity</h3>
                <p className="text-xs text-slate-400 mb-6">Your learning consistency over the last few months.</p>
                <div className="flex gap-2 mb-2">
                  <div className="flex flex-col gap-2 text-[10px] text-slate-500 justify-around py-1">
                    <span>Mon</span><span>Wed</span><span>Fri</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
                    {HEATMAP_DATA.map((week, wIdx) => (
                      <div key={wIdx} className="flex gap-1.5">
                        {week.map((intensity, dIdx) => (
                          <div 
                            key={`${wIdx}-${dIdx}`} 
                            className={`w-3 h-3 rounded-sm ${getHeatmapColor(intensity)} shrink-0`}
                            title={`Activity level: ${intensity}`}
                          ></div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 text-[10px] text-slate-400 mt-2">
                  <span>Less</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm bg-slate-800/50"></div>
                    <div className="w-3 h-3 rounded-sm bg-amber-500/20"></div>
                    <div className="w-3 h-3 rounded-sm bg-amber-500/40"></div>
                    <div className="w-3 h-3 rounded-sm bg-amber-500/60"></div>
                    <div className="w-3 h-3 rounded-sm bg-amber-500"></div>
                  </div>
                  <span>More</span>
                </div>
              </div>

              <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-display font-bold text-white mb-6">CBT Breakdown</h3>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-32 h-32 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Correct', value: 340 },
                            { name: 'Wrong', value: 85 },
                            { name: 'Skipped', value: 25 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {[0, 1, 2].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-xl font-bold text-white">75%</span>
                      <span className="text-[9px] text-slate-400">Accuracy</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-emerald-400 flex items-center gap-1"><CheckSquare size={12}/> Correct</span>
                        <span className="text-white">340</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{width: '75%'}}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-rose-400 flex items-center gap-1"><XCircle size={12}/> Wrong</span>
                        <span className="text-white">85</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-rose-500 h-1.5 rounded-full" style={{width: '18%'}}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 flex items-center gap-1"><HelpCircle size={12}/> Skipped</span>
                        <span className="text-white">25</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-slate-500 h-1.5 rounded-full" style={{width: '7%'}}></div></div>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Avg. Time / Question</span>
                      <span className="text-white font-bold">1m 12s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* AI Insights */}
            <div className="bg-gradient-to-br from-amber-500/20 via-[#0f172a] to-blue-900/20 border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full -z-10 blur-xl"></div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <BrainCircuit className="text-amber-500" size={20} />
                </div>
                <h3 className="text-lg font-display font-bold text-white">AI Insights</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 bg-[#020617]/40 p-3 rounded-xl border border-slate-800/50">
                  <TrendingUp className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                  <p className="text-sm text-slate-300 leading-relaxed">Your <span className="font-bold text-white">Mathematics</span> performance has improved by <span className="text-emerald-400 font-bold">15%</span> this month. Great job!</p>
                </li>
                <li className="flex items-start gap-3 bg-[#020617]/40 p-3 rounded-xl border border-slate-800/50">
                  <AlertTriangle className="text-rose-500 mt-0.5 shrink-0" size={16} />
                  <p className="text-sm text-slate-300 leading-relaxed">You should spend more time revising <span className="font-bold text-white">Physics</span>. Your accuracy dropped recently.</p>
                </li>
                <li className="flex items-start gap-3 bg-[#020617]/40 p-3 rounded-xl border border-slate-800/50">
                  <Zap className="text-amber-500 mt-0.5 shrink-0" size={16} />
                  <p className="text-sm text-slate-300 leading-relaxed">Your study consistency is excellent. Try taking a full CBT mock test this weekend.</p>
                </li>
              </ul>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 text-center">
                <div className="w-10 h-10 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
                  <Award className="text-emerald-500" size={20} />
                </div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Strongest</p>
                <h4 className="text-sm font-bold text-white truncate">Mathematics</h4>
                <p className="text-[10px] text-emerald-400 mt-1">92% Average</p>
              </div>
              <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 text-center">
                <div className="w-10 h-10 mx-auto bg-rose-500/10 rounded-full flex items-center justify-center mb-2">
                  <AlertTriangle className="text-rose-500" size={20} />
                </div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Needs Work</p>
                <h4 className="text-sm font-bold text-white truncate">Chemistry</h4>
                <p className="text-[10px] text-rose-400 mt-1">65% Average</p>
              </div>
            </div>

            {/* Goals */}
            <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-bold text-white">Study Goals</h3>
                <button className="text-xs text-amber-500 hover:text-amber-400 transition-colors font-action font-semibold">
                  Edit
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-slate-300 flex items-center gap-2">
                      <Clock size={14} className="text-amber-500" /> Study 2 hours daily
                    </span>
                    <span className="text-xs text-slate-400">1.5/2h</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <motion.div initial={{width:0}} animate={{width:'75%'}} transition={{duration:1}} className="bg-amber-500 h-1.5 rounded-full"></motion.div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-slate-300 flex items-center gap-2">
                      <MessageCircle size={14} className="text-blue-500" /> Complete 10 messages
                    </span>
                    <span className="text-xs text-slate-400">4/10</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <motion.div initial={{width:0}} animate={{width:'40%'}} transition={{duration:1, delay:0.2}} className="bg-blue-500 h-1.5 rounded-full"></motion.div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-slate-300 flex items-center gap-2">
                      <Target size={14} className="text-emerald-500" /> Score above 80%
                    </span>
                    <span className="text-xs text-slate-400">72%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <motion.div initial={{width:0}} animate={{width:'72%'}} transition={{duration:1, delay:0.4}} className="bg-emerald-500 h-1.5 rounded-full"></motion.div>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-bold text-white">Achievements</h3>
                <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-md">4 Unlocked</span>
              </div>
              <div className="space-y-3">
                {ACHIEVEMENTS.map((achievement, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={achievement.id} 
                    className="flex items-center gap-3 p-3 bg-[#020617]/50 border border-slate-800/50 rounded-xl hover:border-slate-700 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg ${achievement.bg} flex items-center justify-center shrink-0`}>
                      <achievement.icon size={18} className={achievement.color} />
                    </div>
                    <div>
                      <h4 className="text-sm font-display font-bold text-white">{achievement.title}</h4>
                      <p className="text-[10px] text-slate-400">Unlocked recently</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

