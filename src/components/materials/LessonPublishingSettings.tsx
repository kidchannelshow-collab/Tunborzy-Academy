import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Clock, Lock, Eye, CheckCircle2, History, AlertTriangle, Users } from 'lucide-react';
import { PublishSettings } from './LessonEditor';

interface Props {
  publishSettings: PublishSettings;
  setPublishSettings: React.Dispatch<React.SetStateAction<PublishSettings>>;
  onSave: () => void;
}

export default function LessonPublishingSettings({ publishSettings, setPublishSettings, onSave }: Props) {
  const [newAuditLog, setNewAuditLog] = useState('');

  const updateSetting = (key: keyof PublishSettings, value: any) => {
    setPublishSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleStatusChange = (status: PublishSettings['status']) => {
    updateSetting('status', status);
    
    // Add to audit log
    const log = {
      action: `Status changed to ${status}`,
      by: 'Current User', // In a real app, this would be the logged-in user
      date: new Date().toISOString()
    };
    
    setPublishSettings(prev => ({
      ...prev,
      auditLogs: [log, ...(prev.auditLogs || [])]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-12">
      
      {/* Status & Visibility */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
              <Eye size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Publication Status</h3>
              <p className="text-xs text-slate-400">Control when this lesson is visible</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {['Draft', 'Under Review', 'Published', 'Archived', 'Hidden'].map((status) => (
              <label key={status} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${publishSettings.status === status ? 'bg-indigo-500/10 border-indigo-500 text-white' : 'bg-[#0f172a] border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                <input 
                  type="radio" 
                  name="status" 
                  checked={publishSettings.status === status}
                  onChange={() => handleStatusChange(status as PublishSettings['status'])}
                  className="hidden"
                />
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${publishSettings.status === status ? 'border-indigo-500' : 'border-slate-600'}`}>
                  {publishSettings.status === status && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                </div>
                <span className="font-medium text-sm">{status}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Scheduled Publishing</h3>
              <p className="text-xs text-slate-400">Automate visibility over time</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Publish Date & Time</label>
              <input 
                type="datetime-local" 
                value={publishSettings.publishAt || ''}
                onChange={(e) => updateSetting('publishAt', e.target.value || null)}
                className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unpublish Date & Time</label>
              <input 
                type="datetime-local" 
                value={publishSettings.unpublishAt || ''}
                onChange={(e) => updateSetting('unpublishAt', e.target.value || null)}
                className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Access Control & Locking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Student Access</h3>
              <p className="text-xs text-slate-400">Restrict who can view this content</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-xl bg-[#0f172a] border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-2">Premium Required <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500 text-amber-950 font-black uppercase">Pro</span></h4>
                <p className="text-xs text-slate-500 mt-1">Requires active Undergraduate Premium sub</p>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors ${publishSettings.isPremium ? 'bg-amber-500' : 'bg-slate-700'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${publishSettings.isPremium ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
              <input type="checkbox" className="hidden" checked={publishSettings.isPremium} onChange={(e) => updateSetting('isPremium', e.target.checked)} />
            </label>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Visibility Scope</label>
              <select 
                value={publishSettings.visibility}
                onChange={(e) => updateSetting('visibility', e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="Public">Public (Visible to everyone)</option>
                <option value="Undergraduate Only">Undergraduate Students Only</option>
                <option value="Selected Departments">Selected Departments</option>
                <option value="Selected Faculties">Selected Faculties</option>
                <option value="Selected Levels">Selected Levels</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Content Locking</h3>
              <p className="text-xs text-slate-400">Lock specific lessons explicitly</p>
            </div>
          </div>
          
          <label className="flex items-center justify-between p-4 rounded-xl bg-[#0f172a] border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
            <div>
              <h4 className="font-bold text-white text-sm">Lock Lesson</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Students will see the title and description, but content is blocked by a lock screen.</p>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${publishSettings.isLocked ? 'bg-red-500' : 'bg-slate-700'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${publishSettings.isLocked ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
            <input type="checkbox" className="hidden" checked={publishSettings.isLocked} onChange={(e) => updateSetting('isLocked', e.target.checked)} />
          </label>
        </div>

      </div>

      {/* Audit Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
              <History size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Publishing Audit Log</h3>
              <p className="text-xs text-slate-400">Track changes and status updates</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {publishSettings.auditLogs && publishSettings.auditLogs.length > 0 ? (
            <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
              {publishSettings.auditLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-300">{log.action}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{log.by} • {new Date(log.date).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No activity recorded yet.</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
         <button onClick={onSave} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-colors flex items-center gap-2">
           <CheckCircle2 size={20} /> Save Publishing Settings
         </button>
      </div>

    </div>
  );
}
