import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Globe, Shield, Mail, Database, HardDrive, RefreshCw, AlertTriangle, View } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

export default function SystemSettings() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isIrreversible, setIsIrreversible] = useState(false);

  const handleDangerousAction = (title: string, message: string, irreversible: boolean) => {
    setActionTitle(title);
    setActionMessage(message);
    setIsIrreversible(irreversible);
    setIsModalOpen(true);
  };

  const SETTING_GROUPS = [
    { title: 'General Settings', icon: Globe, items: ['Website Name', 'Website Logo', 'Theme Preferences', 'Maintenance Mode'] },
    { title: 'Security & Access', icon: Shield, items: ['Admin Roles', 'Password Policies', 'Two-Factor Auth', 'Session Timeouts'] },
    { title: 'Email & Notifications', icon: Mail, items: ['SMTP Settings', 'Welcome Emails', 'System Alerts', 'Push Notifications'] },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto relative"
    >
      <ConfirmationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => setIsModalOpen(false)}
        title={actionTitle}
        message={actionMessage}
        isIrreversible={isIrreversible}
      />

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
          <Settings className="text-slate-400" size={28} /> System Settings
        </h1>
        <p className="text-sm font-body text-slate-400">Configure global platform settings, backups, and critical system controls.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SETTING_GROUPS.map((group, idx) => (
          <div key={idx} className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <group.icon className="text-indigo-400" size={20} /> {group.title}
            </h2>
            <div className="space-y-3">
              {group.items.map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => {
                    if (item === 'Maintenance Mode') {
                      handleDangerousAction('Enable Maintenance Mode', 'Are you sure you want to enable maintenance mode? Users will not be able to access the platform.', false);
                    }
                  }}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#020617]/50 border border-slate-800/50 hover:border-indigo-500/30 transition-colors cursor-pointer group"
                >
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{item}</span>
                  <Settings size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Database className="text-emerald-400" size={20} /> Backup & Restore Center
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#020617]/50 border border-emerald-500/20">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <HardDrive size={18} /> Automatic Backups
                </div>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-md font-medium">Active</span>
              </div>
              <p className="text-sm text-slate-400">System automatically creates daily backups at 00:00 UTC.</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                className="w-full py-3 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-xl border border-emerald-500/30 transition-colors flex items-center justify-center gap-2"
                onClick={() => handleDangerousAction(
                  'Manual Backup',
                  'Manual, on-demand backups require a backend job connected to your database provider. This isn\u2019t wired up yet \u2014 automatic daily backups at 00:00 UTC remain active in the meantime.',
                  false
                )}
              >
                <RefreshCw size={18} /> Create Manual Backup Now
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">Recent Backups</h3>
            <div className="space-y-3">
              {[
                { date: 'Oct 24, 2023 - 00:00 UTC', type: 'Auto', size: '1.2 GB' },
                { date: 'Oct 23, 2023 - 00:00 UTC', type: 'Auto', size: '1.2 GB' },
                { date: 'Oct 22, 2023 - 14:30 UTC', type: 'Manual', size: '1.1 GB' },
              ].map((backup, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#020617]/50 border border-slate-800/50 group hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Database size={16} className="text-slate-500" />
                    <div>
                      <div className="text-sm font-medium text-slate-200">{backup.date}</div>
                      <div className="text-xs text-slate-500">{backup.type} Backup • {backup.size}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-800 rounded-lg transition-colors"
                      title="View Backup"
                    >
                      <View size={16} />
                    </button>
                    <button 
                      className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-amber-400 bg-slate-800 rounded-lg transition-colors"
                      onClick={() => handleDangerousAction('Restore Backup', `Are you sure you want to restore the backup from ${backup.date}? Current data will be overwritten.`, true)}
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0f172a]/80 backdrop-blur-md border border-rose-500/20 rounded-3xl p-6">
        <h2 className="text-lg font-bold text-rose-400 mb-6 flex items-center gap-2">
          <AlertTriangle className="text-rose-400" size={20} /> Danger Zone
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1">Reset System Data</h3>
            <p className="text-sm text-slate-400">Wipe all user data, content, and settings. This will return the system to a clean state.</p>
          </div>
          <button 
            className="whitespace-nowrap px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-semibold rounded-xl border border-rose-500/30 transition-colors"
            onClick={() => handleDangerousAction('Reset System', 'Are you sure you want to completely reset the system? All data will be permanently erased.', true)}
          >
            Factory Reset
          </button>
        </div>
      </div>
    </motion.div>
  );
}
