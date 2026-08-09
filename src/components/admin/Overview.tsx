import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, GraduationCap, Shield, UserCheck, UserX, ArrowUpRight, Activity } from 'lucide-react';
import { useProfile } from '../../lib/useProfile';
import { supabase } from '../../supabaseClient';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Overview() {
  const { profile } = useProfile();
  const displayName = profile?.full_name || "";
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    lecturers: 0,
    admins: 0,
    active: 0,
    inactive: 0
  });
  
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!supabase) return;
    try {
      const [
        { count: totalUsers },
        { count: students },
        { count: lecturers },
        { count: admins },
        { count: active },
        { count: inactive }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'Student'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'Lecturer'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['Admin', 'Super Admin']),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).in('status', ['Inactive', 'Suspended', 'Disabled'])
      ]);
      
      setStats({
        totalUsers: totalUsers || 0,
        students: students || 0,
        lecturers: lecturers || 0,
        admins: admins || 0,
        active: active || 0,
        inactive: inactive || 0
      });

      // Recent users
      const { data: recent } = await supabase.from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recent) setRecentUsers(recent);
      
      // Fetch real registration data for chart
      const { data: profiles } = await supabase.from('profiles').select('created_at');
      const counts: Record<string, number> = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      if (profiles && profiles.length > 0) {
        profiles.forEach(p => {
          if (p.created_at) {
            const date = new Date(p.created_at);
            const m = months[date.getMonth()];
            counts[m] = (counts[m] || 0) + 1;
          }
        });
        
        const sortedData = months.map(m => ({
          name: m,
          users: counts[m] || 0
        }));
        setChartData(sortedData);
      } else {
        setChartData([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Subscribe to realtime changes on profiles table
    const channel = supabase.channel('public:overview_profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchData();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
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
    { title: 'Total Users', value: stats.totalUsers.toString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Total Students', value: stats.students.toString(), icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { title: 'Total Lecturers', value: stats.lecturers.toString(), icon: GraduationCap, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'Total Admins', value: stats.admins.toString(), icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { title: 'Active Users', value: stats.active.toString(), icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Inactive Users', value: stats.inactive.toString(), icon: UserX, color: 'text-rose-400', bg: 'bg-rose-500/10' },
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
        <p className="text-sm font-body text-slate-400">High-level metrics for TUNBORZY ACADEMY.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
              </div>
            </div>
          ))}
        </div>
      )}

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
        
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 overflow-y-auto">
          <h2 className="text-lg font-bold text-white mb-6">Recent Users</h2>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-slate-800/50 rounded-xl animate-pulse" />)}
            </div>
          ) : recentUsers.length === 0 ? (
             <p className="text-sm text-slate-400">No records found.</p>
          ) : (
            <div className="space-y-4">
              {recentUsers.map((user, i) => (
                <div key={i} className="flex flex-col p-3 rounded-xl bg-[#020617]/50 border border-slate-800/50">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-slate-200 truncate pr-2">{user.full_name || 'Unnamed'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {user.status || 'Active'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 truncate mb-1">{user.email}</div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>{user.role}</span>
                    <span>{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
