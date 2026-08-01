import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2, Circle, ChevronDown, Search, Building, BookOpen, Shield, Key } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface SignUpProps {
  onCancel: () => void;
  onSuccess?: (role: string) => void;
}

import React from 'react';
export default function SignUp({ onCancel, onSuccess }: SignUpProps) {
  const isMounted = React.useRef(true);
  React.useEffect(() => { return () => { isMounted.current = false; }; }, []);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [portal, setPortal] = useState('');
  const [accountType, setAccountType] = useState('');
  const [accessCode, setAccessCode] = useState('');
  
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [agreed, setAgreed] = useState(false);

  // Validation
  const cleanEmail = email.trim().toLowerCase();
  
  // HTML5 standard email regex
  const isEmailValid = cleanEmail.length === 0 ? false : /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(cleanEmail);
  
  const isStep1Valid = name.trim().length > 0 && isEmailValid;

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  
  const isStep2Valid = hasMinLength && hasNumber && hasUpper && hasLower && hasSpecial && passwordsMatch;

  const isStep3Valid = 
    accountType !== '' && agreed &&
    ((accountType === 'Student' && portal !== '' && university.trim() !== '' && course.trim() !== '') || 
     (accountType === 'Lecturer' && accessCode.trim().length > 0) || 
     (accountType === 'Admin' && accessCode.trim().length > 0));

  const nextStep = () => {
    setDirection(1);
    setStep(s => Math.min(s + 1, 3));
  };
  
  const prevStep = () => {
    setDirection(-1);
    setStep(s => Math.max(s - 1, 1));
  };

  const generateStudentId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'TBZ-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };



  const handleCreateAccount = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (!supabase) throw new Error('Supabase client is not initialized');

      const studentId = generateStudentId();
      const role = accountType || 'Student';
      const emailForAuth = cleanEmail;

      // Admin accounts are provisioned entirely server-side: the access code is
      // validated inside the Edge Function against a secret that never ships to
      // the client, and the profile row is created with the service role key.
      if (role === 'Admin') {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('admin-provision-user', {
          body: { action: 'admin-signup', name, email: emailForAuth, password, accessCode },
        });

        if (fnError || fnData?.error) {
          throw new Error(fnData?.error || fnError?.message || 'Failed to create Admin account.');
        }

        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: emailForAuth,
          password,
        });
        if (loginError) throw loginError;

        setSuccessMsg('Registration successful. Redirecting...');
        setTimeout(() => {
          if (onSuccess && isMounted.current) onSuccess('Admin');
        }, 1500);
        return;
      }

      // Lecturer accounts are likewise provisioned server-side: the access code
      // is validated inside the Edge Function against a secret that never ships
      // to the client (previously this code was collected but never checked
      // against anything, so any value was accepted).
      if (role === 'Lecturer') {
        let userId;

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: emailForAuth,
          password,
          options: {
            data: {
              full_name: name,
              role: 'Lecturer',
              student_id: studentId
            }
          }
        });

        if (authError) {
          if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
              email: emailForAuth,
              password
            });
            if (loginError) {
              throw new Error('User exists but login failed: ' + loginError.message);
            }
            userId = loginData.user.id;
          } else {
            throw authError;
          }
        } else {
          userId = authData?.user?.id;
        }

        if (!userId) {
          throw new Error('Failed to create or retrieve user ID.');
        }

        const { data: fnData, error: fnError } = await supabase.functions.invoke('admin-provision-user', {
          body: { email: emailForAuth, userId: userId, role: 'Lecturer', accessCode: accessCode },
        });

        if (fnError || fnData?.error) {
          throw new Error(fnData?.error || fnError?.message || 'Invalid or expired access code.');
        }

        const { error: profileError } = await supabase.from('profiles').upsert({
          id: userId,
          full_name: name,
          email: emailForAuth,
          role: 'Lecturer',
          student_id: studentId,
          created_at: new Date().toISOString()
        }, { onConflict: 'id' });

        if (profileError) throw profileError;
        
        await supabase.auth.signInWithPassword({
          email: emailForAuth,
          password
        });

        setSuccessMsg('Registration successful. Redirecting...');
        setTimeout(() => {
          if (onSuccess && isMounted.current) onSuccess('Lecturer');
        }, 1500);
        return;
      }

      const { data: existingProfiles, error: selectError } = await supabase.from('profiles').select('email').eq('email', emailForAuth);
      
      const isExistingUser = existingProfiles && existingProfiles.length > 0;

      if (isExistingUser) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: emailForAuth,
          password
        });
        
        if (loginError) {
          throw loginError;
        }
        
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', loginData.user.id).single();
        if (!profile) {
           const { error: profileError } = await supabase.from('profiles').upsert({
            id: loginData.user.id,
            full_name: name,
            email: emailForAuth,
            role: role,
            portal: role === 'Student' ? portal : null,
            university: role === 'Student' ? university : null,
            course: role === 'Student' ? course : null,
            student_id: studentId,
            created_at: new Date().toISOString()
          }, { onConflict: 'id' });
          if (profileError) throw profileError;
        }
        
        setSuccessMsg('Logged in successfully. Redirecting...');
        setTimeout(() => {
          const finalRole = profile?.role || role;
          if (onSuccess && isMounted.current) onSuccess(finalRole);
        }, 1500);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailForAuth,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
            portal: role === 'Student' ? portal : null,
            university: role === 'Student' ? university : null,
            course: role === 'Student' ? course : null,
            registration_date: new Date().toISOString(),
            premium_status: 'Free',
            student_id: studentId
          }
        }
      });

      if (authError) {
         if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
              email: emailForAuth,
              password
            });
            if (loginError) throw loginError;
            
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', loginData.user.id).single();
            if (!profile) {
              await supabase.from('profiles').upsert({
                id: loginData.user.id,
                full_name: name,
                email: emailForAuth,
                role: role,
                portal: role === 'Student' ? portal : null,
                university: role === 'Student' ? university : null,
                course: role === 'Student' ? course : null,
                student_id: studentId,
                created_at: new Date().toISOString()
              }, { onConflict: 'id' });
            }
            setSuccessMsg('Logged in successfully. Redirecting...');
            setTimeout(() => {
              const finalRole = profile?.role || role;
              if (onSuccess && isMounted.current) onSuccess(finalRole);
            }, 1500);
            return;
         }
         throw authError;
      }

      let sessionToUse = authData.session;
      
      if (!sessionToUse && authData.user) {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: emailForAuth,
            password
          });
          
          if (!loginError && loginData.session) {
             sessionToUse = loginData.session;
          }
      }

      if (!sessionToUse) {
        setSuccessMsg('Setting up your profile...');
        
        sessionToUse = await new Promise((resolve) => {
          let sub: any;
          const timeout = setTimeout(() => {
             sub?.unsubscribe();
             resolve(null);
          }, 30000);
           const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
              clearTimeout(timeout);
              subscription.unsubscribe();
              resolve(session);
            }
          });
          sub = subscription;
        });
      }

      const userId = sessionToUse?.user?.id || authData?.user?.id;
      
      if (userId) {
        
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: userId,
          full_name: name,
          email: emailForAuth,
          role: role,
          portal: role === 'Student' ? portal : null,
          university: role === 'Student' ? university : null,
          course: role === 'Student' ? course : null,
          student_id: studentId,
          created_at: new Date().toISOString()
        }, { onConflict: 'id' });

        if (profileError) {
          throw new Error('Database Error: ' + profileError.message);
        }

        setSuccessMsg('Registration successful. Redirecting...');
        setTimeout(() => {
          if (onSuccess && isMounted.current) onSuccess(role);
        }, 1500);
      } else {
        throw new Error('Failed to create user session.');
      }
    } catch (error: any) {
      let msg = error.message || 'Failed to create account.';
      
      if (msg.includes('Invalid login credentials')) {
        msg = 'An account with this email already exists, but the password was incorrect. Please try again.';
      } else if (msg.toLowerCase().includes('password')) {
        msg = 'Weak password. Please use a stronger password.';
      } else if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many requests')) {
        msg = 'Too many attempts detected. Please wait a few minutes before trying again.';
      } else if (msg.toLowerCase().includes('invalid email')) {
        msg = 'Invalid email format.';
      }
      
      setErrorMsg(msg);
      setIsLoading(false);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  return (
    <div className="min-h-[100dvh] bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden hero-gradient">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#0f172a]/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800 p-6 sm:p-8 relative z-10 overflow-hidden"
      >
        <div className="mb-8">
          <p className="text-sm font-poppins font-medium text-amber-500 mb-2 uppercase tracking-widest text-center">
            Step <span className="font-space font-bold">{step}</span> of <span className="font-space font-bold">3</span>
          </p>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-amber-500 rounded-full"
              initial={{ width: `${((step - 1) / 3) * 100}%` }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            ></motion.div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-body rounded-lg text-center">
            {errorMsg}
          </div>
        )}
        
        {successMsg && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-body rounded-lg text-center">
            {successMsg}
          </div>
        )}

        <div className="relative h-[600px] sm:h-[540px] w-full flex flex-col">
          <AnimatePresence mode="popLayout" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute w-full top-0 left-0"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-display font-extrabold text-white mb-2">
                    Personal Information
                  </h2>
                  <p className="text-sm font-body font-normal text-slate-400">
                    Let's get started with your account details.
                  </p>
                </div>

                <div className="space-y-5 mb-8">
                  <div>
                    <label className="block text-sm font-poppins font-medium text-slate-400 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full pl-11 pr-4 py-3.5 border border-slate-700 rounded-xl leading-5 bg-[#020617]/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-all font-body font-normal"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-poppins font-medium text-slate-400 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailTouched && /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(e.target.value.trim().toLowerCase())) {
                            setEmailTouched(false); // Clear error aggressively when valid
                          }
                        }}
                        onBlur={() => setEmailTouched(true)}
                        className={`block w-full pl-11 pr-4 py-3.5 border ${emailTouched && cleanEmail.length > 0 && !isEmailValid ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-700 focus:ring-amber-500 focus:border-amber-500'} rounded-xl leading-5 bg-[#020617]/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 sm:text-sm transition-all font-body font-normal`}
                        placeholder="you@example.com"
                      />
                    </div>
                    {emailTouched && cleanEmail.length > 0 && !isEmailValid && (
                      <p className="mt-1.5 text-xs text-red-400 font-body">Invalid email format.</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 mt-10">
                  <button
                    onClick={onCancel}
                    className="flex-1 py-3.5 px-4 border border-slate-700 rounded-xl text-sm font-action font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!isStep1Valid}
                    onClick={nextStep}
                    className="flex-1 py-3.5 px-4 rounded-xl text-sm font-action font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20 disabled:shadow-none"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute w-full top-0 left-0"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-display font-extrabold text-white mb-2">
                    Security
                  </h2>
                  <p className="text-sm font-body font-normal text-slate-400">
                    Keep your account secure with a strong password.
                  </p>
                </div>

                <div className="space-y-5 mb-6">
                  <div>
                    <label className="block text-sm font-poppins font-medium text-slate-400 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-11 pr-12 py-3.5 border border-slate-700 rounded-xl leading-5 bg-[#020617]/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-all font-body font-normal"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-poppins font-medium text-slate-400 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full pl-11 pr-12 py-3.5 border border-slate-700 rounded-xl leading-5 bg-[#020617]/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-all font-body font-normal"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 mb-8 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    {hasMinLength ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Circle className="w-4 h-4 text-slate-600 shrink-0" />}
                    <span className={`text-xs ${hasMinLength ? 'text-emerald-500' : 'text-slate-400'} font-body font-normal`}>Minimum 8 characters</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasNumber ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Circle className="w-4 h-4 text-slate-600 shrink-0" />}
                    <span className={`text-xs ${hasNumber ? 'text-emerald-500' : 'text-slate-400'} font-body font-normal`}>At least one number</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasUpper ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Circle className="w-4 h-4 text-slate-600 shrink-0" />}
                    <span className={`text-xs ${hasUpper ? 'text-emerald-500' : 'text-slate-400'} font-body font-normal`}>At least one uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasLower ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Circle className="w-4 h-4 text-slate-600 shrink-0" />}
                    <span className={`text-xs ${hasLower ? 'text-emerald-500' : 'text-slate-400'} font-body font-normal`}>At least one lowercase letter</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasSpecial ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Circle className="w-4 h-4 text-slate-600 shrink-0" />}
                    <span className={`text-xs ${hasSpecial ? 'text-emerald-500' : 'text-slate-400'} font-body font-normal`}>At least one special character</span>
                  </div>
                  <div className="flex items-center gap-3 pt-2 mt-1 border-t border-slate-800">
                    {passwordsMatch ? <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" /> : <Circle className="w-4 h-4 text-slate-600 shrink-0" />}
                    <span className={`text-xs ${passwordsMatch ? 'text-amber-500 font-bold' : 'text-slate-400'} font-body font-normal`}>Passwords match</span>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={prevStep}
                    className="flex-1 py-3.5 px-4 border border-slate-700 rounded-xl text-sm font-action font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    disabled={!isStep2Valid}
                    onClick={nextStep}
                    className="flex-1 py-3.5 px-4 rounded-xl text-sm font-action font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20 disabled:shadow-none"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute w-full h-full top-0 left-0 overflow-y-auto custom-scrollbar pb-6 pr-2"
              >
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-display font-extrabold text-white mb-2">
                    Final Step
                  </h2>
                  <p className="text-sm font-body font-normal text-slate-400">
                    Select your role to complete registration.
                  </p>
                </div>

                <div className="space-y-5 mb-8">
                  <div>
                    <label className="block text-sm font-poppins font-medium text-slate-400 mb-1.5">
                      Account Type
                    </label>
                    <div className="relative">
                      <select
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value)}
                        className="block w-full pl-4 pr-10 py-3.5 border border-slate-700 rounded-xl leading-5 bg-[#020617]/50 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-all appearance-none font-body font-normal"
                      >
                        <option value="" disabled>Select Account Type</option>
                        <option value="Student">Student</option>
                        <option value="Lecturer">Lecturer</option>
                        <option value="Admin">Admin</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <ChevronDown className="h-5 w-5 text-slate-500" />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {accountType === 'Student' && (
                      <motion.div
                        key="student-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-5 overflow-hidden"
                      >
                        <div>
                          <label className="block text-sm font-poppins font-medium text-slate-400 mb-1.5">
                            Academic Portal
                          </label>
                          <div className="relative">
                            <select
                              value={portal}
                              onChange={(e) => setPortal(e.target.value)}
                              className="block w-full pl-4 pr-10 py-3.5 border border-slate-700 rounded-xl leading-5 bg-[#020617]/50 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-all appearance-none font-body font-normal"
                            >
                              <option value="" disabled>Select Academic Portal</option>
                              <option value="UTME">UTME</option>
                              <option value="Post-UTME">Post-UTME</option>
                              <option value="Undergraduate">Undergraduate</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                              <ChevronDown className="h-5 w-5 text-slate-500" />
                            </div>
                          </div>
                        </div>

                        {(portal === 'UTME' || portal === 'Post-UTME' || portal === 'Undergraduate') && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-5"
                          >
                            <div>
                              <label className="block text-sm font-poppins font-medium text-slate-400 mb-1.5">
                                {portal === 'Undergraduate' ? 'Current University' : 'University of Choice'}
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <Building className="h-5 w-5 text-slate-500" />
                                </div>
                                <select
                                  value={university}
                                  onChange={(e) => setUniversity(e.target.value)}
                                  className="block w-full pl-11 pr-10 py-3.5 border border-slate-700 rounded-xl leading-5 bg-[#020617]/50 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-all appearance-none font-body font-normal"
                                >
                                  <option value="" disabled>Select University</option>
                                  <option value="Unilorin">University of Ilorin (Unilorin)</option>
                                  <option value="Unilag">University of Lagos (Unilag)</option>
                                  <option value="OAU">Obafemi Awolowo University (OAU)</option>
                                  <option value="UI">University of Ibadan (UI)</option>
                                  <option value="Other">Other</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                  <ChevronDown className="h-5 w-5 text-slate-500" />
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-poppins font-medium text-slate-400 mb-1.5">
                                {portal === 'Undergraduate' ? 'Current Course of Study' : 'Intended Course of Study'}
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <BookOpen className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                  type="text"
                                  value={course}
                                  onChange={(e) => setCourse(e.target.value)}
                                  className="block w-full pl-11 pr-4 py-3.5 border border-slate-700 rounded-xl leading-5 bg-[#020617]/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-all font-body font-normal"
                                  placeholder="e.g. Computer Science"
                                />
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                  <Search className="h-4 w-4 text-slate-500" />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {(accountType === 'Lecturer' || accountType === 'Admin') && (
                      <motion.div
                        key="staff-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <label className="block text-sm font-poppins font-medium text-slate-400 mb-1.5 pt-2">
                          {accountType === 'Lecturer' ? 'Lecturer Access Code' : 'Admin Access Code'}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            {accountType === 'Lecturer' ? <Shield className="h-5 w-5 text-slate-500" /> : <Key className="h-5 w-5 text-slate-500" />}
                          </div>
                          <input
                            type="password"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            className="block w-full pl-11 pr-4 py-3.5 border border-slate-700 rounded-xl leading-5 bg-[#020617]/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-all font-body font-normal"
                            placeholder="••••••••"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="pt-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center shrink-0">
                        <input
                          type="checkbox"
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border ${agreed ? 'bg-amber-500 border-amber-500' : 'border-slate-600 group-hover:border-slate-500'} transition-colors flex items-center justify-center`}>
                          {agreed && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />}
                        </div>
                      </div>
                      <span className="text-sm font-body font-normal text-slate-400 group-hover:text-slate-300 transition-colors">
                        I agree to the <a href="#" className="text-amber-500 hover:underline">Terms of Service</a> and <a href="#" className="text-amber-500 hover:underline">Privacy Policy</a>.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={prevStep}
                    className="flex-1 py-3.5 px-4 border border-slate-700 rounded-xl text-sm font-action font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    disabled={!isStep3Valid || isLoading}
                    onClick={handleCreateAccount}
                    className="flex-1 py-3.5 px-4 rounded-xl text-sm font-action font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20 disabled:shadow-none flex items-center justify-center"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

