import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { UserCheck, Search, Star, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { supabase } from '../../supabaseClient';

interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
  student_id: string;
  premium_status: string | null;
}

export default function StudentActivation() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<StudentProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [student, setStudent] = useState<StudentProfile | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isIrreversible, setIsIrreversible] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const handleDangerousAction = (title: string, message: string, irreversible: boolean, action: () => Promise<void>) => {
    setActionTitle(title);
    setActionMessage(message);
    setIsIrreversible(irreversible);
    setPendingAction(() => action);
    setIsModalOpen(true);
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if (searchTerm.trim().length <= 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    const timeout = setTimeout(async () => {
      if (!supabase) return;
      const term = searchTerm.trim();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, student_id, premium_status')
        .eq('role', 'Student')
        .or(`full_name.ilike.%${term}%,email.ilike.%${term}%,student_id.ilike.%${term}%`)
        .limit(5);

      if (cancelled) return;
      if (!error && data) setResults(data as StudentProfile[]);
      setIsSearching(false);
    }, 350);

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [searchTerm]);

  const setPremiumStatus = async (target: StudentProfile, status: string) => {
    if (!supabase) throw new Error('Supabase client is not initialized');
    const { error } = await supabase.from('profiles').update({ premium_status: status }).eq('id', target.id);
    if (error) throw error;
    setStudent({ ...target, premium_status: status });
    showNotification(`Premium status updated to "${status}" for ${target.full_name}`, 'success');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-4xl mx-auto relative"
    >
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={async () => {
          if (!pendingAction) return;
          try {
            await pendingAction();
          } catch (err: any) {
            showNotification(err.message || 'Action failed.', 'error');
          }
        }}
        title={actionTitle}
        message={actionMessage}
        isIrreversible={isIrreversible}
      />

      {notification && (
        <div className={`fixed top-4 right-4 z-[110] px-4 py-3 rounded-xl shadow-lg text-sm font-semibold ${notification.type === 'success' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'}`}>
          {notification.msg}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
          <UserCheck className="text-cyan-400" size={28} /> Student Activation
        </h1>
        <p className="text-sm font-body text-slate-400">Directly activate or manage premium status for specific students.</p>
      </div>

      <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 md:p-8">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search student by ID, Email, or Name..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setStudent(null); }}
            className="w-full bg-[#020617] border border-slate-800 text-white rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-cyan-500 transition-colors text-lg"
          />
          {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 animate-spin" />}
        </div>

        {!student && results.length > 0 && (
          <div className="mb-6 border border-slate-800 rounded-xl divide-y divide-slate-800 overflow-hidden">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => setStudent(r)}
                className="w-full text-left px-4 py-3 hover:bg-slate-800/50 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-200">{r.full_name}</p>
                  <p className="text-xs text-slate-500">{r.email} • {r.student_id}</p>
                </div>
                <span className="text-xs text-slate-400">{r.premium_status || 'Free'}</span>
              </button>
            ))}
          </div>
        )}

        {student ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#020617]/50 border border-slate-800 rounded-2xl p-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold uppercase text-2xl">
                  {student.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{student.full_name}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm text-slate-400">
                    <span>{student.email}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="font-mono text-slate-300">{student.student_id}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700 w-fit">
                <div className={`w-2 h-2 rounded-full ${student.premium_status === 'Premium' || student.premium_status === 'Pro' ? 'bg-amber-400' : 'bg-slate-500'}`}></div>
                <span className="text-sm font-semibold text-slate-300">{student.premium_status || 'Free'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-800/50 pt-8">
              <button
                className="flex flex-col items-center justify-center gap-2 p-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition-colors group"
                onClick={() => handleDangerousAction('Activate Premium', `Are you sure you want to activate Premium for ${student.full_name}?`, false, () => setPremiumStatus(student, 'Premium'))}
              >
                <Star className="text-amber-400 group-hover:scale-110 transition-transform" size={24} />
                <span className="text-sm font-bold text-amber-400">Activate Premium</span>
              </button>
              <button
                className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-colors group"
                onClick={() => handleDangerousAction('Extend Duration', `Are you sure you want to extend Premium for ${student.full_name}?`, false, () => setPremiumStatus(student, 'Premium'))}
              >
                <Clock className="text-blue-400 group-hover:scale-110 transition-transform" size={24} />
                <span className="text-sm font-bold text-blue-400">Extend Duration</span>
              </button>
              <button
                className="flex flex-col items-center justify-center gap-2 p-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors group"
                onClick={() => handleDangerousAction('Deactivate Premium', `Are you sure you want to deactivate Premium for ${student.full_name}?`, true, () => setPremiumStatus(student, 'Free'))}
              >
                <ShieldCheck className="text-rose-400 group-hover:scale-110 transition-transform" size={24} />
                <span className="text-sm font-bold text-rose-400">Deactivate Premium</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <UserCheck size={48} className="mx-auto mb-4 opacity-20" />
            <p>Enter a student's ID, email, or name to manage their activation.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
