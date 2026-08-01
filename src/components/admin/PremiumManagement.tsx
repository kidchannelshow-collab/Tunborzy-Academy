import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Key, Plus, Search, CheckCircle, Trash2, Clock, AlertCircle } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

const CODES = [
  { code: 'TUN-84JD-9K2L-M4NQ', status: 'Unused', generated: 'Oct 10, 2023', expiry: 'Nov 10, 2023', usedBy: '-' },
  { code: 'TUN-X7P2-R5T9-L1W8', status: 'Used', generated: 'Oct 05, 2023', expiry: 'Nov 05, 2023', usedBy: 'ayo@example.com' },
  { code: 'TUN-B4N6-M2X1-Z9Q7', status: 'Expired', generated: 'Sep 01, 2023', expiry: 'Oct 01, 2023', usedBy: '-' },
  { code: 'TUN-K9L2-P4M8-N6B3', status: 'Unused', generated: 'Oct 12, 2023', expiry: 'Nov 12, 2023', usedBy: '-' },
];

export default function PremiumManagement() {
  const [filterStatus, setFilterStatus] = useState('All');
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
            <Key className="text-amber-400" size={28} /> Premium Management
          </h1>
          <p className="text-sm font-body text-slate-400">Generate and manage premium activation codes.</p>
        </div>
        <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
          <Plus size={16} /> Generate Codes
        </button>
      </div>

      <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by code or user email..."
              className="w-full bg-[#020617] border border-slate-800 text-white text-sm rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
            {['All', 'Unused', 'Used', 'Expired'].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterStatus(filter)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === filter 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : 'bg-[#020617] text-slate-400 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-sm">
                <th className="pb-3 font-semibold">Activation Code</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Generated</th>
                <th className="pb-3 font-semibold">Expiry</th>
                <th className="pb-3 font-semibold">Used By</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {CODES.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors group">
                  <td className="py-4">
                    <span className="font-mono text-white font-medium bg-[#020617] px-3 py-1.5 rounded-lg border border-slate-800">
                      {item.code}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md w-fit ${
                      item.status === 'Unused' ? 'bg-emerald-500/10 text-emerald-400' :
                      item.status === 'Used' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-rose-500/10 text-rose-400'
                    }`}>
                      {item.status === 'Unused' && <CheckCircle size={12} />}
                      {item.status === 'Used' && <CheckCircle size={12} />}
                      {item.status === 'Expired' && <Clock size={12} />}
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-slate-400">{item.generated}</td>
                  <td className="py-4 text-sm text-slate-400">{item.expiry}</td>
                  <td className="py-4 text-sm text-slate-400">{item.usedBy}</td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      {item.status === 'Unused' && (
                        <button 
                          className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-amber-400 transition-colors" 
                          title="Expire Code"
                          onClick={() => handleDangerousAction('Expire Code', `Are you sure you want to manually expire code ${item.code}?`, false)}
                        ><AlertCircle size={16}/></button>
                      )}
                      {item.status !== 'Used' && (
                        <button 
                          className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-rose-400 transition-colors" 
                          title="Delete"
                          onClick={() => handleDangerousAction('Delete Code', `Are you sure you want to permanently delete code ${item.code}?`, true)}
                        ><Trash2 size={16}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
