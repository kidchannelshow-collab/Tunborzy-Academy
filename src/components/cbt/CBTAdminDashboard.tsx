import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Upload, Users, FileText, Settings, BarChart2, CheckCircle2, ShieldAlert, MonitorPlay, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function CBTAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'exams' | 'questions' | 'analytics' | 'live'>('exams');
  const [exams, setExams] = useState<any[]>([]);
  
  useEffect(() => {
    async function loadExams() {
      const { data } = await supabase.from('cbt_exams').select('*').order('created_at', { ascending: false });
      if (data) setExams(data);
    }
    loadExams();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">CBT Control Center</h1>
          <p className="text-slate-400 font-body">Manage examinations, question banks, and monitor student performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2">
            <Upload size={18} /> Bulk Import
          </button>
          <button className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors flex items-center gap-2">
            <Plus size={18} /> Create Exam
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 bg-[#0f172a] p-2 rounded-2xl border border-slate-800">
        {[
          { id: 'exams', label: 'Examinations', icon: FileText },
          { id: 'questions', label: 'Question Banks', icon: ShieldAlert },
          { id: 'analytics', label: 'Analytics & Results', icon: BarChart2 },
          { id: 'live', label: 'Live Monitor', icon: MonitorPlay }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8"
      >
        {activeTab === 'exams' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Active Examinations</h2>
              <div className="flex items-center gap-2">
                <input type="text" placeholder="Search exams..." className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:border-amber-500 focus:outline-none" />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-sm">
                    <th className="py-4 font-medium">Exam Title</th>
                    <th className="py-4 font-medium">Subject & Portal</th>
                    <th className="py-4 font-medium">Questions</th>
                    <th className="py-4 font-medium">Duration</th>
                    <th className="py-4 font-medium">Status</th>
                    <th className="py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {exams.length > 0 ? exams.map(exam => (
                    <tr key={exam.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 font-medium text-white">{exam.title}</td>
                      <td className="py-4">
                        <div className="text-sm">{exam.subject}</div>
                        <div className="text-xs text-slate-500">{exam.portal}</div>
                      </td>
                      <td className="py-4">{exam.total_questions}</td>
                      <td className="py-4">{exam.duration_minutes}m</td>
                      <td className="py-4">
                        {exam.is_published ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                            <CheckCircle2 size={12} /> Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <button className="text-blue-400 hover:text-blue-300 font-medium text-sm">Manage</button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No exams found. Create one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Question Banks</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center hover:border-amber-500/50 transition-colors cursor-pointer">
                <FileSpreadsheet size={32} className="mx-auto text-emerald-500 mb-4" />
                <h3 className="font-bold text-white mb-2">Import via Excel/CSV</h3>
                <p className="text-sm text-slate-400 mb-4">Upload a bulk list of questions instantly using our template.</p>
                <button className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm w-full">Download Template</button>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center hover:border-amber-500/50 transition-colors cursor-pointer">
                <Plus size={32} className="mx-auto text-blue-500 mb-4" />
                <h3 className="font-bold text-white mb-2">Manual Entry</h3>
                <p className="text-sm text-slate-400 mb-4">Create questions one by one with our rich text editor.</p>
                <button className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm w-full">Open Editor</button>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center hover:border-amber-500/50 transition-colors cursor-pointer">
                <Settings size={32} className="mx-auto text-purple-500 mb-4" />
                <h3 className="font-bold text-white mb-2">Bank Settings</h3>
                <p className="text-sm text-slate-400 mb-4">Manage topics, difficulty weights, and question randomization.</p>
                <button className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm w-full">Manage</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
             <h2 className="text-xl font-bold text-white">Student Analytics</h2>
             <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                <BarChart2 size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">Detailed analytics dashboard requires at least 10 completed attempts across the platform.</p>
                <button className="mt-4 px-6 py-2 bg-slate-800 text-white rounded-xl">Export Raw Data</button>
             </div>
          </div>
        )}

        {activeTab === 'live' && (
          <div className="space-y-6">
             <div className="flex items-center justify-between">
               <h2 className="text-xl font-bold text-white flex items-center gap-2">
                 <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                 Live Monitoring
               </h2>
             </div>
             <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                <Users size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">0 students currently taking an examination.</p>
             </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
