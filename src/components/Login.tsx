import React from 'react';
import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface LoginProps {
  onCancel: () => void;
  onSuccess?: (view: string) => void;
}

// A Postgrest/network failure (blocked request, offline, adblocker, transient
// outage) surfaces here as a raw "Failed to fetch" TypeError rather than a
// structured Postgrest error. Centralizing the check keeps every profile
// step below reacting to it the same way instead of only the first select.
function isFetchFailure(err: any) {
  return !!(err && (err.message?.includes('fetch') || err.message?.includes('Fetch')));
}

export default function Login({ onCancel, onSuccess }: LoginProps) {
  const isMounted = React.useRef(true);
  React.useEffect(() => { return () => { isMounted.current = false; }; }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    
    
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      if (!supabase) throw new Error('Supabase client is not initialized');

       
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

       
      if (authError) throw authError;

      if (authData.user) {
        let { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();

        // If fetch fails due to network/adblocker (Failed to fetch) blocking the 'profiles' path,
        // we can fallback to the user's metadata to allow them to login.
        if (profileError && isFetchFailure(profileError)) {
          const meta = authData.user.user_metadata || {};
          profile = {
            id: authData.user.id,
            full_name: meta.full_name || 'User',
            email: authData.user.email,
            role: meta.role || 'Student',
            portal: meta.portal || 'UTME',
            university: meta.university || null,
            course: meta.course || null,
            student_id: meta.student_id || null,
          };
          profileError = null;
        }

        if (profileError && profileError.code === 'PGRST116') {
          const metadata = authData.user.user_metadata || {};
          if (metadata.full_name) {
            const newProfile = {
              id: authData.user.id,
              full_name: metadata.full_name,
              email: authData.user.email,
              role: metadata.role || 'Student',
              portal: metadata.portal || 'UTME',
              university: metadata.university || null,
              course: metadata.course || null,
              student_id: metadata.student_id || null,
              created_at: metadata.registration_date || new Date().toISOString()
            };
            
            const { error: upsertError } = await supabase.from('profiles').upsert(newProfile, { onConflict: 'id' });
            if (upsertError && !isFetchFailure(upsertError)) {
              console.error("Login: Auto-create profile error", upsertError);
              throw new Error('Database Error: ' + upsertError.message);
            }
            if (!upsertError) {
              const { data: newProfileData, error: checkError } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
              if (checkError && !isFetchFailure(checkError)) {
                 throw new Error('Database Error: Profile was not created successfully.');
              }
              profile = newProfileData || newProfile;
            } else {
              // Row-write likely succeeded server-side (or will be retried) but the
              // client couldn't confirm it over the network. We already have the
              // complete profile shape in memory, so use it rather than blocking login.
              profile = newProfile;
            }
          } else {
             throw new Error('Database Error: Profile not found and insufficient metadata.');
          }
        } else if (profileError) {
           throw new Error('Database Error: ' + profileError.message);
        }

        if (!profile) {
           throw new Error('Database Error: Profile does not exist.');
        }

        if (onSuccess && isMounted.current) {
          const role = profile.role || 'student';
          if (role.toLowerCase() === 'lecturer') {
            onSuccess('lecturer_dashboard');
          } else if (role.toLowerCase() === 'admin' || role.toLowerCase() === 'super admin') {
            onSuccess('admin_dashboard');
          } else {
            onSuccess('dashboard');
          }
        }
      }
    } catch (error: any) {
      let msg = error.message || 'Failed to sign in.';
      if (msg.includes('Invalid login credentials')) {
        msg = 'Invalid email or wrong password.';
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#020617] pt-24 px-4 sm:px-6 lg:px-8 relative flex items-center justify-center">
      <button 
        onClick={onCancel}
        className="absolute top-8 left-4 sm:left-8 flex items-center gap-2 text-sm font-action font-semibold text-slate-400 hover:text-white transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-sm font-body text-slate-400">Sign in to your account</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-body rounded-lg text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-poppins font-medium text-slate-300 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-[#020617]/50 border border-slate-700 text-white text-sm rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-poppins font-medium text-slate-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-[#020617]/50 border border-slate-700 text-white text-sm rounded-xl py-3 pl-12 pr-12 focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-action font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20 disabled:shadow-none flex items-center justify-center"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing In...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
