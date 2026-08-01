import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bot, Power, MessageSquare, Activity } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

export default function AIManagement() {
  const [aiEnabled, setAiEnabled] = useState(true);
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <Bot className="text-emerald-400" size={28} /> AI Management
          </h1>
          <p className="text-sm font-body text-slate-400">Configure and monitor the AI Study Assistant.</p>
        </div>
        <button 
          onClick={() => {
            if (aiEnabled) {
              handleDangerousAction('Disable AI Assistant', 'Are you sure you want to disable the AI Assistant? Students will no longer be able to use it.', false);
            } else {
              setAiEnabled(true);
            }
          }}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
            aiEnabled ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
          }`}
        >
          <Power size={16} /> {aiEnabled ? 'Disable AI Assistant' : 'Enable AI Assistant'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <MessageSquare className="text-emerald-400" size={20} /> Welcome Message Configuration
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Default Welcome Message</label>
                <textarea 
                  rows={4}
                  defaultValue="Hi there! I'm your TUNBORZY AI Study Assistant. How can I help you with your studies today?"
                  className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-6 py-2 rounded-xl text-sm font-bold transition-colors"
                  onClick={() => handleDangerousAction('Delete AI Configuration', 'Are you sure you want to permanently delete all custom AI configuration and return to defaults?', true)}
                >
                  Reset Defaults
                </button>
                <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2 rounded-xl text-sm font-bold transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Activity className="text-blue-400" size={20} /> Usage Statistics
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                <span className="text-sm text-slate-400">Total Conversations</span>
                <span className="text-xl font-bold text-white">45,210</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                <span className="text-sm text-slate-400">Active Sessions</span>
                <span className="text-xl font-bold text-emerald-400">124</span>
              </div>
              <div className="flex justify-between items-center pb-4">
                <span className="text-sm text-slate-400">Avg. Response Time</span>
                <span className="text-xl font-bold text-white">1.2s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
