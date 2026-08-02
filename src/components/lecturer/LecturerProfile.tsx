import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Mail, Camera, Save, Lock, Shield } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useProfile } from '../../lib/useProfile';

export default function LecturerProfile() {
  const { profile } = useProfile();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
      });
    }
  }, [profile?.id, profile?.role]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !profile) return;
    setIsSaving(true);
    setMessage('');
    try {
      await supabase.from('profiles').update({
        full_name: formData.full_name,
      }).eq('id', profile.id);
      
      if (password) {
        await supabase.auth.updateUser({ password });
        setPassword('');
      }
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-3xl mx-auto"
    >
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Users className="text-emerald-500" size={28} /> My Profile
        </h1>
        <p className="text-sm font-body text-slate-400">Manage your personal information and security.</p>
      </div>

      <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-10">
        <div className="flex flex-col items-center mb-10">
          <div className="relative group cursor-pointer mb-4">
            <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-emerald-500/50 flex items-center justify-center overflow-hidden relative">
              <span className="text-3xl font-display font-bold text-slate-400 group-hover:opacity-0 transition-opacity">
                {formData.full_name.charAt(0) || 'L'}
              </span>
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={24} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-xs font-semibold">
            <Shield size={14} /> Lecturer Account
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-medium text-center ${message.includes('success') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-display font-bold text-white border-b border-slate-800 pb-2">Personal Information</h2>
            
            <div>
              <label className="block text-sm font-poppins font-medium text-slate-400 mb-1.5">Full Name</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full bg-[#020617]/50 border border-slate-700 text-white text-sm rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-poppins font-medium text-slate-400 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full bg-[#020617]/50 border border-slate-800 text-slate-500 text-sm rounded-xl py-3 pl-12 pr-4 cursor-not-allowed"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">Email cannot be changed.</p>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-display font-bold text-white border-b border-slate-800 pb-2">Security</h2>
            
            <div>
              <label className="block text-sm font-poppins font-medium text-slate-400 mb-1.5">New Password (Optional)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full bg-[#020617]/50 border border-slate-700 text-white text-sm rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
