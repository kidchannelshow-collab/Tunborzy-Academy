import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Clock, Zap, DollarSign, XCircle, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

interface PerformanceStats {
  avgResponseTime: number;
  totalRequests: number;
  requestsToday: number;
  estimatedCost: number;
  failedRequests: number;
  uptime: number;
}

export default function AIPerformanceDashboard() {
  const [stats, setStats] = useState<PerformanceStats>({
    avgResponseTime: 0,
    totalRequests: 0,
    requestsToday: 0,
    estimatedCost: 0,
    failedRequests: 0,
    uptime: 100,
  });
  
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('created_at, response_time, status')
        .order('created_at', { ascending: false })
        .limit(10000); // Analyze up to last 10k requests

      if (error) throw error;
      if (!data) return;

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let totalTime = 0;
      let reqToday = 0;
      let failed = 0;
      
      const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        requests: 0
      }));
      
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          date: d.toLocaleDateString('en-US', { weekday: 'short' }),
          requests: 0,
          rawDate: d
        };
      });

      data.forEach(req => {
        if (req.response_time) totalTime += req.response_time;
        if (req.status === 'failed') failed++;
        
        const reqDate = new Date(req.created_at);
        if (reqDate >= startOfDay) reqToday++;
        
        hourlyDistribution[reqDate.getHours()].requests++;
        
        const dayDiff = Math.floor((now.getTime() - reqDate.getTime()) / (1000 * 3600 * 24));
        if (dayDiff >= 0 && dayDiff < 7) {
          const index = 6 - dayDiff;
          if (index >= 0 && index < 7) {
            last7Days[index].requests++;
          }
        }
      });

      const totalReqs = data.length;
      const uptimeCalc = totalReqs > 0 ? ((totalReqs - failed) / totalReqs) * 100 : 100;
      const estimatedMonthly = totalReqs * 0.0001; // Approximate cost per request in USD

      setStats({
        avgResponseTime: totalReqs > 0 ? Math.round(totalTime / totalReqs) : 0,
        totalRequests: totalReqs,
        requestsToday: reqToday,
        estimatedCost: estimatedMonthly,
        failedRequests: failed,
        uptime: Number(uptimeCalc.toFixed(2)),
      });

      setHourlyData(hourlyDistribution);
      setDailyData(last7Days);

    } catch (err) {
      console.error('Failed to fetch performance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">AI Performance Dashboard</h1>
          <p className="text-slate-400">Monitor system latency, usage costs, and AI uptime metrics.</p>
        </div>
        <button onClick={fetchPerformanceData} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors">
          Refresh Metrics
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <Clock size={16} />
            <span className="font-medium text-sm">Avg Latency</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.avgResponseTime}ms</div>
        </div>
        
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <Activity size={16} />
            <span className="font-medium text-sm">Total Requests</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalRequests.toLocaleString()}</div>
        </div>
        
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5">
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <Zap size={16} />
            <span className="font-medium text-sm">Requests Today</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.requestsToday.toLocaleString()}</div>
        </div>
        
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5">
          <div className="flex items-center gap-3 text-amber-400 mb-2">
            <DollarSign size={16} />
            <span className="font-medium text-sm">Est. API Cost</span>
          </div>
          <div className="text-2xl font-bold text-amber-400">${stats.estimatedCost.toFixed(3)}</div>
        </div>
        
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5">
          <div className="flex items-center gap-3 text-rose-400 mb-2">
            <XCircle size={16} />
            <span className="font-medium text-sm">Failed Requests</span>
          </div>
          <div className="text-2xl font-bold text-rose-400">{stats.failedRequests.toLocaleString()}</div>
        </div>
        
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5">
          <div className="flex items-center gap-3 text-indigo-400 mb-2">
            <Activity size={16} />
            <span className="font-medium text-sm">AI Uptime</span>
          </div>
          <div className="text-2xl font-bold text-indigo-400">{stats.uptime}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <LineChartIcon className="text-indigo-400" size={20} />
            <h3 className="text-lg font-bold text-white">Requests Over Last 7 Days</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" tick={{fill: '#475569', fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" tick={{fill: '#475569', fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="text-indigo-400" size={20} />
            <h3 className="text-lg font-bold text-white">Most Active Hours (24h Distribution)</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="hour" stroke="#475569" tick={{fill: '#475569', fontSize: 12}} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={20} />
                <YAxis stroke="#475569" tick={{fill: '#475569', fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  cursor={{fill: '#1e293b', opacity: 0.5}}
                />
                <Bar dataKey="requests" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
