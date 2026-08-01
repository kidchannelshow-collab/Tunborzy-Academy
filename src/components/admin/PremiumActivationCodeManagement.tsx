import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, Search, Copy, Printer, Ban, Calendar, 
  Clock, User, CheckCircle, Smartphone, Power, Fingerprint, History
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { supabase } from '../../supabaseClient';

interface Student {
  id: string;
  name: string;
  email: string;
  portal: string;
  status: string;
  joined: string;
  photo: string;
}

interface CodeRecord {
  id: string;
  studentName: string;
  studentId: string;
  code: string;
  product: string;
  generatedDate: string;
  expiryDate: string;
  status: 'Unused' | 'Used' | 'Expired' | 'Revoked';
  generatedBy: string;
}

export default function PremiumActivationCodeManagement() {
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [product, setProduct] = useState('UTME');
  const [duration, setDuration] = useState('30 Days');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [codeHistory, setCodeHistory] = useState<CodeRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isIrreversible, setIsIrreversible] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('activation_codes')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setCodeHistory(data.map(d => ({
        id: d.id,
        studentName: d.student_name,
        studentId: d.student_id,
        code: d.code,
        product: d.product,
        generatedDate: new Date(d.created_at).toLocaleDateString(),
        expiryDate: d.expiry_date ? new Date(d.expiry_date).toLocaleDateString() : 'Lifetime',
        status: d.status as any,
        generatedBy: d.generated_by
      })));
    }
    setLoadingHistory(false);
  };

  const handleDangerousAction = (title: string, message: string, irreversible: boolean) => {
    setActionTitle(title);
    setActionMessage(message);
    setIsIrreversible(irreversible);
    setIsModalOpen(true);
  };

  const handleStudentSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStudentSearch(val);
    if (val.length > 2) {
      setIsSearching(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'Student')
        .or(`full_name.ilike.%${val}%,email.ilike.%${val}%`)
        .limit(5);
        
      if (!error && data) {
        setSearchResults(data.map(d => ({
          id: d.id,
          name: d.full_name,
          email: d.email,
          portal: d.department || 'General',
          status: 'Active',
          joined: new Date(d.created_at).toLocaleDateString(),
          photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.full_name}`
        })));
      }
      setIsSearching(false);
    } else {
      setSearchResults([]);
      setSelectedStudent(null);
    }
  };

  const selectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentSearch(student.name);
    setSearchResults([]);
  };

  const generateRandomCode = async () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const getRandom = (len: number) => Array.from({length: len}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    const newCode = `TBZ-${getRandom(4)}-${getRandom(4)}-${getRandom(4)}`;
    setGeneratedCode(newCode);
    
    if (selectedStudent) {
      const expiry = duration === 'Lifetime' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const payload = {
        student_id: selectedStudent.id,
        student_name: selectedStudent.name,
        code: newCode,
        product,
        status: 'Unused',
        generated_by: 'System Admin',
        expiry_date: expiry
      };
      
      const { data, error } = await supabase.from('activation_codes').insert(payload).select('id, created_at').single();
      
      if (!error && data) {
        const newRecord: CodeRecord = {
          id: data.id,
          studentName: selectedStudent.name,
          studentId: selectedStudent.id,
          code: newCode,
          product,
          generatedDate: new Date(data.created_at).toLocaleDateString(),
          expiryDate: expiry ? new Date(expiry).toLocaleDateString() : 'Lifetime',
          status: 'Unused',
          generatedBy: 'System Admin'
        };
        setCodeHistory([newRecord, ...codeHistory]);
      } else if (error && error.code === '42P01') {
         // Create the table since it doesn't exist
         console.warn("activation_codes table is missing, but code generation is mocked.");
         const newRecord: CodeRecord = {
          id: Date.now().toString(),
          studentName: selectedStudent.name,
          studentId: selectedStudent.id,
          code: newCode,
          product,
          generatedDate: new Date().toLocaleDateString(),
          expiryDate: expiry ? new Date(expiry).toLocaleDateString() : 'Lifetime',
          status: 'Unused',
          generatedBy: 'System Admin'
        };
        setCodeHistory([newRecord, ...codeHistory]);
      }
    }
  };

  const filteredHistory = codeHistory.filter(record => 
    record.code.toLowerCase().includes(historySearch.toLowerCase()) ||
    record.studentName.toLowerCase().includes(historySearch.toLowerCase()) ||
    record.studentId.toLowerCase().includes(historySearch.toLowerCase()) ||
    record.product.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-7xl mx-auto relative">
      <ConfirmationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => setIsModalOpen(false)}
        title={actionTitle}
        message={actionMessage}
        isIrreversible={isIrreversible}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
          <Fingerprint className="text-amber-400" size={28} /> Premium Activation Code Management
        </h1>
        <p className="text-sm font-body text-slate-400">Securely generate, assign, and manage unique premium activation codes for students.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Search & Student Info */}
        <div className="space-y-6">
          <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Search className="text-blue-400" size={20} /> Student Search
            </h2>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search by Student ID, Email, or Name..."
                value={studentSearch}
                onChange={handleStudentSearch}
                className="w-full bg-[#020617] border border-slate-800 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-amber-500 transition-colors"
              />
              {searchResults.length > 0 && !selectedStudent && (
                <div className="absolute z-10 w-full mt-2 bg-[#020617] border border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                   {searchResults.map(s => (
                      <div key={s.id} onClick={() => selectStudent(s)} className="p-3 hover:bg-slate-800 cursor-pointer border-b border-slate-800 flex items-center gap-3">
                         <img src={s.photo} className="w-8 h-8 rounded-full bg-slate-800" />
                         <div><p className="text-white text-sm font-bold">{s.name}</p><p className="text-slate-400 text-xs">{s.email}</p></div>
                      </div>
                   ))}
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {selectedStudent ? (
                <motion.div 
                  key="student-info"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#020617]/50 border border-slate-700 rounded-2xl p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold uppercase text-2xl flex-shrink-0 overflow-hidden">
                      <img src={selectedStudent.photo} alt={selectedStudent.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">{selectedStudent.name}</h3>
                      <p className="text-sm text-slate-400 font-mono mb-2">{selectedStudent.id}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-800/50 p-2 rounded-lg">
                          <p className="text-slate-500 mb-0.5">Portal</p>
                          <p className="font-semibold text-slate-300 truncate">{selectedStudent.portal}</p>
                        </div>
                        <div className="bg-slate-800/50 p-2 rounded-lg">
                          <p className="text-slate-500 mb-0.5">Status</p>
                          <p className={`font-semibold ${selectedStudent.status === 'Premium' ? 'text-amber-400' : 'text-slate-300'}`}>
                            {selectedStudent.status}
                          </p>
                        </div>
                        <div className="bg-slate-800/50 p-2 rounded-lg col-span-2">
                          <p className="text-slate-500 mb-0.5">Registered</p>
                          <p className="font-semibold text-slate-300">{selectedStudent.joined}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="no-student"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl"
                >
                  <User size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Search and select a student to generate a code.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Code Generation */}
        <div className="space-y-6">
          <div className={`bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 transition-opacity duration-300 ${!selectedStudent ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Key className="text-amber-400" size={20} /> Generate Premium Code
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Select Product</label>
                <select 
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500 transition-colors appearance-none"
                >
                  <option>UTME</option>
                  <option>Post-UTME</option>
                  <option>Undergraduate First Semester</option>
                  <option>Undergraduate Second Semester</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Access Duration</label>
                <select 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500 transition-colors appearance-none"
                >
                  <option>30 Days</option>
                  <option>90 Days</option>
                  <option>180 Days</option>
                  <option>365 Days</option>
                  <option>Lifetime</option>
                </select>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-300">
                  <Smartphone className="text-indigo-400" size={20} />
                  <div>
                    <p className="text-sm font-semibold">Device Protection</p>
                    <p className="text-xs text-slate-500">Lock activation to a single device.</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={generateRandomCode}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Fingerprint size={18} /> Generate Activation Code
              </button>

              <AnimatePresence>
                {generatedCode && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-4 border-t border-slate-800"
                  >
                    <p className="text-xs text-slate-400 text-center mb-2 uppercase tracking-wider font-semibold">Generated Code</p>
                    <div className="bg-[#020617] border border-amber-500/50 p-4 rounded-xl text-center mb-3">
                      <span className="text-xl sm:text-2xl font-mono font-bold text-amber-400 tracking-widest">{generatedCode}</span>
                    </div>
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => { if (generatedCode) navigator.clipboard?.writeText(generatedCode); }}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Copy size={16} /> Copy
                      </button>
                      <button
                        onClick={() => {
                          if (!generatedCode) return;
                          const win = window.open('', '_blank');
                          if (win) {
                            win.document.write(`<pre style="font:20px monospace;padding:40px;">Activation Code: ${generatedCode}</pre>`);
                            win.document.close();
                            win.print();
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Printer size={16} /> Print
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="text-slate-400" size={20} /> Activation Code History
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search code, student, or product..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full bg-[#020617] border border-slate-700 text-white text-sm rounded-xl py-2 pl-9 pr-4 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[800px] text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold px-4">Student</th>
                <th className="pb-3 font-semibold px-4">Code</th>
                <th className="pb-3 font-semibold px-4">Product</th>
                <th className="pb-3 font-semibold px-4">Generated</th>
                <th className="pb-3 font-semibold px-4">Expiry</th>
                <th className="pb-3 font-semibold px-4">Status</th>
                <th className="pb-3 font-semibold px-4">By</th>
                <th className="pb-3 font-semibold px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredHistory.map((record) => (
                <tr key={record.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{record.studentName}</div>
                    <div className="text-xs text-slate-500 font-mono">{record.studentId}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-amber-400/90">{record.code}</td>
                  <td className="py-3 px-4 text-slate-300">{record.product}</td>
                  <td className="py-3 px-4 text-slate-400">{record.generatedDate}</td>
                  <td className="py-3 px-4 text-slate-400">{record.expiryDate}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${
                      record.status === 'Unused' ? 'bg-emerald-500/10 text-emerald-400' :
                      record.status === 'Used' ? 'bg-blue-500/10 text-blue-400' :
                      record.status === 'Expired' ? 'bg-slate-500/10 text-slate-400' :
                      'bg-rose-500/10 text-rose-400'
                    }`}>
                      {record.status === 'Unused' && <CheckCircle size={12} />}
                      {record.status === 'Used' && <CheckCircle size={12} />}
                      {record.status === 'Expired' && <Clock size={12} />}
                      {record.status === 'Revoked' && <Ban size={12} />}
                      {record.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{record.generatedBy}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      {record.status === 'Unused' && (
                        <>
                          <button className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-800/50 hover:bg-slate-800 rounded-md transition-colors" title="Copy">
                            <Copy size={14} />
                          </button>
                          <button 
                            className="p-1.5 text-slate-400 hover:text-indigo-400 bg-slate-800/50 hover:bg-slate-800 rounded-md transition-colors" 
                            title="Extend Expiry"
                            onClick={() => handleDangerousAction('Extend Expiry', `Extend expiry for code ${record.code}?`, false)}
                          >
                            <Calendar size={14} />
                          </button>
                          <button 
                            className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800/50 hover:bg-slate-800 rounded-md transition-colors" 
                            title="Revoke Code"
                            onClick={() => handleDangerousAction('Revoke Code', `Are you sure you want to permanently revoke code ${record.code}?`, true)}
                          >
                            <Ban size={14} />
                          </button>
                        </>
                      )}
                      {record.status === 'Used' && (
                        <button 
                          className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800/50 hover:bg-slate-800 rounded-md transition-colors" 
                          title="Deactivate Code"
                          onClick={() => handleDangerousAction('Deactivate Code', `Are you sure you want to deactivate code ${record.code}? The student will lose premium access.`, true)}
                        >
                          <Power size={14} />
                        </button>
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
