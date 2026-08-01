import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { LineChart as LineChartIcon, BarChart2, TrendingUp, Users, PlayCircle, Eye, FileText, DollarSign, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../supabaseClient';

interface ProfileRow {
  created_at: string | null;
  premium_status: string | null;
  role: string | null;
}

function monthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.toLocaleString('en-US', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`;
}

interface RankedItem { title: string; count: number; }

async function topByJoinedCount(
  countTable: string,
  countFkColumn: string,
  lookupTable: string,
  lookupTitleColumn: string,
  limit = 4,
): Promise<RankedItem[]> {
  if (!supabase) return [];
  const { data: countRows, error: countErr } = await supabase.from(countTable).select(countFkColumn);
  if (countErr || !countRows) return [];

  const tally = new Map<string, number>();
  for (const row of (countRows as unknown as Record<string, any>[])) {
    const key = row[countFkColumn];
    if (!key) continue;
    tally.set(key, (tally.get(key) || 0) + 1);
  }
  if (tally.size === 0) return [];

  const ids = Array.from(tally.keys());
  const { data: lookupRows, error: lookupErr } = await supabase.from(lookupTable).select(`id, ${lookupTitleColumn}`).in('id', ids);
  if (lookupErr || !lookupRows) return [];

  return (lookupRows as unknown as Record<string, any>[])
    .map(row => ({ title: row[lookupTitleColumn], count: tally.get(row.id) || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export default function Analytics() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [topChats, setTopChats] = useState<RankedItem[]>([]);
  const [topMaterials, setTopMaterials] = useState<RankedItem[]>([]);
  const [topExams, setTopExams] = useState<RankedItem[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('created_at, premium_status, role')
        .order('created_at', { ascending: true });

      if (cancelled) return;
      if (error) {
        setLoadError(error.message);
      } else {
        setProfiles((data as ProfileRow[]) || []);
      }
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [chats, materials, exams] = await Promise.all([
        topByJoinedCount('chat_messages', 'room_id', 'chat_rooms', 'course_title'),
        topByJoinedCount('material_downloads', 'material_id', 'materials', 'title'),
        topByJoinedCount('cbt_attempts', 'exam_id', 'cbt_exams', 'title'),
      ]);
      if (cancelled) return;
      setTopChats(chats);
      setTopMaterials(materials);
      setTopExams(exams);
      setIsLoadingActivity(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Real growth series derived from actual signups, grouped by month.
  const growthData = useMemo(() => {
    const buckets = new Map<string, { month: string; students: number; premium: number }>();
    for (const p of profiles) {
      if (!p.created_at) continue;
      const key = monthKey(p.created_at);
      if (!buckets.has(key)) buckets.set(key, { month: key, students: 0, premium: 0 });
      const bucket = buckets.get(key)!;
      bucket.students += 1;
      if (p.premium_status === 'Premium' || p.premium_status === 'Pro') bucket.premium += 1;
    }
    return Array.from(buckets.values());
  }, [profiles]);

  const totalUsers = profiles.length;
  const premiumUsers = profiles.filter(p => p.premium_status === 'Premium' || p.premium_status === 'Pro').length;
  const thisMonthKey = monthKey(new Date().toISOString());
  const newThisMonth = profiles.filter(p => p.created_at && monthKey(p.created_at) === thisMonthKey).length;

  const KPIS = [
    { title: 'Total Users', value: isLoading ? '—' : totalUsers.toLocaleString(), trend: 'All time', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'New Signups', value: isLoading ? '—' : newThisMonth.toLocaleString(), trend: 'This Month', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Premium Users', value: isLoading ? '—' : premiumUsers.toLocaleString(), trend: totalUsers ? `${Math.round((premiumUsers / totalUsers) * 100)}% of total` : '—', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { title: 'Revenue', value: 'N/A', trend: 'No billing data source yet', icon: DollarSign, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
          <LineChartIcon className="text-indigo-400" size={28} /> Analytics & Reports
        </h1>
        <p className="text-sm font-body text-slate-400">Detailed insights into platform usage, revenue, and student performance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {KPIS.map((kpi, idx) => (
          <div key={idx} className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform duration-500">
              <kpi.icon size={64} className={kpi.color} />
            </div>
            <div className={`w-12 h-12 rounded-2xl ${kpi.bg} flex items-center justify-center mb-4 relative z-10`}>
              <kpi.icon size={24} className={kpi.color} />
            </div>
            <h3 className="text-sm font-semibold text-slate-400 relative z-10 mb-1">{kpi.title}</h3>
            <div className="flex items-end gap-3 relative z-10">
              <span className="text-3xl font-display font-bold text-white">{kpi.value}</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center mb-1">
                {kpi.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 h-80 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-400" /> Student & Premium Growth
          </h3>
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Loading...</div>
          ) : loadError ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm text-center px-4">Could not load growth data: {loadError}</div>
          ) : growthData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">No signups recorded yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="studentsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }} />
                <Area type="monotone" dataKey="students" name="New Students" stroke="#10b981" fill="url(#studentsGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="premium" name="Premium" stroke="#f59e0b" fill="url(#premiumGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 h-80 flex flex-col items-center justify-center text-slate-500">
          <BarChart2 size={48} className="mb-4 text-indigo-500/50" />
          <p className="font-medium">Revenue Growth</p>
          <p className="text-xs text-center max-w-xs mt-1">No billing/transactions table exists yet in the database. Connect a payments provider (e.g. Paystack/Flutterwave) and record transactions to enable this chart.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <PlayCircle className="text-blue-400" size={20} /> Most Active Chats
          </h3>
          <div className="space-y-4">
            {isLoadingActivity ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : topChats.length === 0 ? (
              <p className="text-sm text-slate-500">No chat activity recorded yet.</p>
            ) : topChats.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#020617]/50 border border-slate-800/50 hover:border-blue-500/30 transition-colors cursor-default">
                <span className="text-sm font-medium text-slate-200">{item.title}</span>
                <span className="text-xs text-slate-400 font-mono">{item.count} messages</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Eye className="text-emerald-400" size={20} /> Most Viewed Notes
          </h3>
          <div className="space-y-4">
            {isLoadingActivity ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : topMaterials.length === 0 ? (
              <p className="text-sm text-slate-500">No downloads recorded yet.</p>
            ) : topMaterials.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#020617]/50 border border-slate-800/50 hover:border-emerald-500/30 transition-colors cursor-default">
                <span className="text-sm font-medium text-slate-200">{item.title}</span>
                <span className="text-xs text-slate-400 font-mono">{item.count} DLs</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <FileText className="text-rose-400" size={20} /> Most Attempted CBT
          </h3>
          <div className="space-y-4">
            {isLoadingActivity ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : topExams.length === 0 ? (
              <p className="text-sm text-slate-500">No attempts recorded yet.</p>
            ) : topExams.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#020617]/50 border border-slate-800/50 hover:border-rose-500/30 transition-colors cursor-default">
                <span className="text-sm font-medium text-slate-200">{item.title}</span>
                <span className="text-xs text-slate-400 font-mono">{item.count} attempts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
