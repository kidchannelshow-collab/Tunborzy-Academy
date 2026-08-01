import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, GraduationCap, PlayCircle, Key, ArrowUpRight, Database, HardDrive, Cpu, Activity, Globe, Bot, Server } from 'lucide-react';
import { useProfile } from '../../lib/useProfile';
import { supabase } from '../../supabaseClient';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Overview() {
  const { profile } = useProfile();
  const displayName = profile?.full_name || "";
  
  const [stats, setStats] = useState({
    students: 0,
    lecturers: 0,
    chats: 0,
    codes: 0,
    unusedCodes: 0
  });
  
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) return;
      try {
        const [
          { count: students },
          { count: lecturers },
          { count: chats },
          { data: codesData }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'Student'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'Lecturer'),
          supabase.from('chat_rooms').select('*', { count: 'exact', head: true }),
          supabase.from('activation_codes').select('status')
        ]);
        
        const codes = codesData?.length || 0;
        const unusedCodes = codesData?.filter(c => c.status === 'Unused').length || 0;
        
        setStats({
          students: students || 0,
          lecturers: lecturers || 0,
          chats: chats || 0,
          codes: codes,
          unusedCodes: unusedCodes
        });
        
        // Generate some sample analytics data for the chart, ideally this would be real data over time
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        setChartData(months.map((m, i) => ({
          name: m,
          users: Math.floor(Math.random() * 50) + (i * 10),
          revenue: Math.floor(Math.random() * 500) + (i * 200)
        })));
        
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const hour = new Date().getHours();
  const getGreeting = () => {
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Good Night';
  };
  const getEmoji = () => {
    if (hour >= 5 && hour < 12) return '☀️';
    if (hour >= 12 && hour < 17) return '🌤️';
    if (hour >= 17 && hour < 21) return '🌇';
    return '🌙';
  };

  const STATS = [
    { title: 'Total Students', value: stats.students.toString(), trend: '+0%', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { title: 'Active Lecturers', value: stats.lecturers.toString(), trend: '+0%', icon: GraduationCap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Course Chats', value: stats.chats.toString(), trend: '+0%', icon: PlayCircle, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'Premium Codes', value: stats.codes.toString(), trend: `Unused: ${stats.unusedCodes}`, icon: Key, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  const SYSTEM_HEALTH = [
    { label: 'Database', status: 'Healthy', icon: Database },
    { label: 'Storage Usage', status: 'Healthy', icon: HardDrive, usage: '0%' },
    { label: 'CPU Usage', status: 'Healthy', icon: Cpu, usage: '0%' },
    { label: 'Memory', status: 'Healthy', icon: Activity, usage: '0%' },
    { label: 'API Status', status: 'Healthy', icon: Globe },
    { label: 'AI Engine', status: 'Healthy', icon: Bot },
    { label: 'Server Status', status: 'Healthy', icon: Server },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
          {getGreeting()}, {displayName} {getEmoji()}
        </h1>
        <p className="text-sm font-body text-slate-400">High-level metrics and system health for TUNBORZY ACADEMY.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {STATS.map((stat, idx) => (
          <div key={idx} className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform duration-500">
              <stat.icon size={64} className={stat.color} />
            </div>
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-4 relative z-10`}>
              <stat.icon size={24} className={stat.color} />
            </div>
            <h3 className="text-sm font-semibold text-slate-400 relative z-10 mb-1">{stat.title}</h3>
            <div className="flex items-end gap-3 relative z-10">
              <span className="text-3xl font-display font-bold text-white">{stat.value}</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center mb-1">
                <ArrowUpRight size={14} /> {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 h-96 flex flex-col items-center justify-center text-slate-500">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Area type="monotone" dataKey="users" stroke="#10b981" fillOpacity={1} fill="url(#colorUsers)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
          <h2 className="text-lg font-bold text-white mb-6">System Health</h2>
          <div className="space-y-4">
            {SYSTEM_HEALTH.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#020617]/50 border border-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    item.status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-400' :
                    item.status === 'Warning' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-rose-500/10 text-rose-400'
                  }`}>
                    <item.icon size={16} />
                  </div>
                  <span className="text-sm font-medium text-slate-200">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.usage && <span className="text-xs text-slate-400 font-mono">{item.usage}</span>}
                  <div className={`w-2 h-2 rounded-full ${
                    item.status === 'Healthy' ? 'bg-emerald-400' :
                    item.status === 'Warning' ? 'bg-amber-400' :
                    'bg-rose-400'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
