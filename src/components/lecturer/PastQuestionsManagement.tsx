import { motion } from 'motion/react';
import { Book, Plus, Edit2, Trash2 } from 'lucide-react';

export default function PastQuestionsManagement() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <Book className="text-rose-500" size={28} /> Past Questions
          </h1>
          <p className="text-sm font-body text-slate-400">Upload and manage past question papers.</p>
        </div>
        <button className="bg-rose-500 hover:bg-rose-400 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
          <Plus size={16} /> Upload PDF
        </button>
      </div>

      <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
        <div className="space-y-4">
          {[2023, 2022, 2021].map((year, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[#020617]/50 border border-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 font-bold font-mono">
                  {year}
                </div>
                <div>
                  <h3 className="font-bold text-white">Mathematics Past Questions</h3>
                  <p className="text-xs text-slate-400">UTME • PDF Document</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors" ><Edit2 size={16}/></button>
                <button className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
