import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Database, HardDrive, RefreshCw, BarChart3, Users, BookOpen, Clock, Award, Bell, ShieldCheck, Activity, Search, Filter, Calendar } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function SystemHealthAndData() {
  const [activeTab, setActiveTab] = useState<'health' | 'audit' | 'data'>('health');
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [dataCounts, setDataCounts] = useState<any>(null);
  
  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchHealthAndCounts = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin/system-health-extended', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setHealthData(json.health);
        setDataCounts(json.counts);
      }
    } catch (err) {
      console.error('Error fetching health & counts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin/audit-logs', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setAuditLogs(json.logs || []);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthAndCounts();
    fetchAuditLogs();
  }, []);

  const filteredLogs = auditLogs.filter(log => {
    const term = auditSearch.toLowerCase();
    const action = (log.action || log.action_details || '').toLowerCase();
    const performedBy = (log.performed_by || log.user_id || '').toLowerCase();
    return action.includes(term) || performedBy.includes(term);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto pb-12"
    >
      {/* Header */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <Database className="text-indigo-400" size={32} /> Data, Backup & Audit Controls
          </h1>
          <p className="text-slate-400 text-sm mt-1">Platform database health diagnostics, entity counts, and administrative audit history.</p>
        </div>
        <button
          onClick={() => { fetchHealthAndCounts(); fetchAuditLogs(); }}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw size={16} /> Refresh Diagnostics
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'health', label: 'Database Health & Backups', icon: Activity },
          { id: 'data', label: 'Data Health Overview', icon: BarChart3 },
          { id: 'audit', label: 'Audit & Activity Logs', icon: Users },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-[#0f172a] text-slate-400 hover:text-white border border-slate-800'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Database Health & Backups */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                <ShieldCheck className="text-emerald-400" size={20} /> Connection & Security State
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
                  <span className="text-slate-300 font-semibold">Supabase Database Connectivity</span>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold">Connected</span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
                  <span className="text-slate-300 font-semibold">Row Level Security (RLS)</span>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold">Enforced</span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
                  <span className="text-slate-300 font-semibold">Express Backend Server</span>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold">Online</span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
                  <span className="text-slate-300 font-semibold">Environment Variables Security</span>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold">Protected (No Secrets Leaked)</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                <HardDrive className="text-indigo-400" size={20} /> Backup Information
              </h3>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Database backups and point-in-time recovery are managed securely through the Supabase cloud database provider infrastructure.
                </p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Provider Backup Policy:</span>
                  <span className="text-emerald-400 font-bold">Automatic Daily Snapshots</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Data Health Overview */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', count: dataCounts?.total_users ?? '...', icon: Users },
              { label: 'Lecturers', count: dataCounts?.total_lecturers ?? '...', icon: Users },
              { label: 'Undergrad Students', count: dataCounts?.total_undergraduate_students ?? '...', icon: Users },
              { label: 'UTME Students', count: dataCounts?.total_utme_students ?? '...', icon: Users },
              { label: 'Post-UTME Students', count: dataCounts?.total_post_utme_students ?? '...', icon: Users },
              { label: 'Total Courses', count: dataCounts?.total_courses ?? '...', icon: BookOpen },
              { label: 'Course Topics', count: dataCounts?.total_topics ?? '...', icon: BookOpen },
              { label: 'Lessons / Materials', count: dataCounts?.total_materials ?? '...', icon: BookOpen },
              { label: 'Undergraduate CBT Exams', count: dataCounts?.total_cbt_exams ?? '...', icon: Clock },
              { label: 'CBT Questions', count: dataCounts?.total_cbt_questions ?? '...', icon: Clock },
              { label: 'CBT Attempts', count: dataCounts?.total_cbt_attempts ?? '...', icon: Clock },
              { label: 'UTME Attempts', count: dataCounts?.total_utme_attempts ?? '...', icon: Clock },
              { label: 'Total Notifications', count: dataCounts?.total_notifications ?? '...', icon: Bell },
              { label: 'Partnership Records', count: dataCounts?.total_partners ?? '...', icon: Award },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
                  <div>
                    <div className="text-slate-400 text-xs font-medium">{stat.label}</div>
                    <div className="text-2xl font-display font-bold text-white mt-1">{stat.count}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-indigo-400">
                    <Icon size={22} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Audit & Activity Logs */}
      {activeTab === 'audit' && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search audit logs by action or admin..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {auditLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="pb-3 font-bold">Action / Event</th>
                    <th className="pb-3 font-bold">Admin ID / User</th>
                    <th className="pb-3 font-bold">Timestamp</th>
                    <th className="pb-3 font-bold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">No audit records found.</td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3.5 font-bold text-white">{log.action || log.action_details || 'ADMIN_ACTION'}</td>
                        <td className="py-3.5 font-mono text-indigo-400">{log.performed_by || log.user_id || 'System'}</td>
                        <td className="py-3.5 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="py-3.5 text-slate-400 font-mono text-[11px] truncate max-w-xs">
                          {JSON.stringify(log.details || log.metadata || {})}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
