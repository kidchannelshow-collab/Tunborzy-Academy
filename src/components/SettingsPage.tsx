import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings as SettingsIcon, User, Image as ImageIcon, 
  Moon, Sun, Monitor, Bell, 
  Shield, Check, Smartphone, AlertTriangle, Info, Save,
  LogOut, Trash2, Eye, EyeOff, Hash, Calendar, GraduationCap, 
  Globe, ArrowRight, Laptop, Trash
} from 'lucide-react';
import DashboardLayout from './dashboard/DashboardLayout';
import { useProfile, refreshProfile } from '../lib/useProfile';
import { supabase } from '../supabaseClient';

interface SettingsPageProps {
  onLogout: () => void;
  onNavigate?: (view: string) => void;
}

export default function SettingsPage({ onLogout, onNavigate }: SettingsPageProps) {
  const { profile, loading } = useProfile();
  if (loading) {
    return (
      <DashboardLayout onLogout={onLogout} currentView="settings" onNavigate={onNavigate}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-8 w-8 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-slate-400 font-medium">Loading...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  
  const studentId = profile?.student_id || 'N/A';
  const fullName = profile?.full_name || "";
  const email = profile?.email || '';

  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(() => (localStorage.getItem('app_theme') as any) || 'dark');
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>(() => (localStorage.getItem('app_textSize') as any) || 'medium');
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('app_notifications');
    return saved ? JSON.parse(saved) : {
    announcements: true,
    cbt: true,
    premium: false,
    courseUpdates: true,
    email: false,
    push: true
    };
  });
  
  const [language, setLanguage] = useState(() => localStorage.getItem('app_language') || 'english');
  const [nameInput, setNameInput] = useState(fullName);
  const [emailInput, setEmailInput] = useState(email);
  const [phoneInput, setPhoneInput] = useState(profile?.phone_number || '');
  const [bioInput, setBioInput] = useState(profile?.bio || '');
  const [universityInput, setUniversityInput] = useState(profile?.university || '');
  const [courseInput, setCourseInput] = useState(profile?.course || '');
  const [levelInput, setLevelInput] = useState(profile?.level || '');
  const [departmentInput, setDepartmentInput] = useState(profile?.department || '');
  const [facultyInput, setFacultyInput] = useState(profile?.faculty || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
    // sync when profile loads
  useEffect(() => {
    if (profile) {
      setNameInput(profile.full_name || '');
      setEmailInput(profile.email || '');
      setPhoneInput(profile.phone_number || '');
      setBioInput(profile.bio || '');
      setUniversityInput(profile.university || '');
      setCourseInput(profile.course || '');
      setLevelInput(profile.level || '');
      setDepartmentInput(profile.department || '');
      setFacultyInput(profile.faculty || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile?.id, profile?.role]);

  
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  
  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);


  useEffect(() => {
    localStorage.setItem('app_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app_textSize', textSize);
    document.documentElement.setAttribute('data-text-size', textSize);
  }, [textSize]);

  
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE' || isDeletingAccount) return;
    setIsDeletingAccount(true);
    setDeleteError('');
    try {
      if (!supabase) throw new Error('Supabase client is not initialized');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your session has expired. Please log in again.');

      const { data: fnData, error: fnError } = await supabase.functions.invoke('admin-provision-user', {
        body: { action: 'delete-own-account' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError || fnData?.error) {
        throw new Error(fnData?.error || fnError?.message || 'Failed to delete account.');
      }

      setShowDeleteDialog(false);
      await supabase.auth.signOut();
      onLogout();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account.');
    } finally {
      setIsDeletingAccount(false);
    }
  };
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const [errorMsg, setErrorMsg] = useState('');
  const handleSave = async () => {
    if (!nameInput.trim()) {
      setErrorMsg("Full Name is required");
      return;
    }
    setErrorMsg('');
    if (!profile) return;
    setIsSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;
      
      if (avatarUrl && avatarUrl.startsWith('data:image')) {
        const fileName = `${profile.id}-${Date.now()}.jpg`;
        const arr = avatarUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, { upsert: true, contentType: mime });
          
        if (!uploadError) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
          finalAvatarUrl = data.publicUrl;
          setAvatarUrl(finalAvatarUrl);
        } else {
           throw new Error("Failed to upload avatar image. The storage bucket might not be configured.");
        }
      }

      // 1. Update profiles table (only columns that actually exist in the DB schema to avoid PGRST204)
      const { error } = await supabase.from('profiles').update({
        full_name: nameInput,
        university: universityInput || null,
        course: courseInput || null
      }).eq('id', profile.id);
      
      if (error) {
         console.warn("Error updating profiles table, falling back to auth metadata:", error);
      }
      
      // 2. ALWAYS update user metadata as a robust fallback to guarantee persistence
      if (emailInput !== profile.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: emailInput });
        if (emailError) throw new Error("Failed to update email: " + emailError.message);
        
        await supabase.from('profiles').update({ email: emailInput }).eq('id', profile.id);
      }

      await supabase.auth.updateUser({
        data: {
          full_name: nameInput,
          phone_number: phoneInput,
          bio: bioInput,
          university: universityInput,
          course: courseInput,
          level: levelInput,
          department: departmentInput,
          faculty: facultyInput,
          avatar_url: finalAvatarUrl
        }
      });
      
      await refreshProfile();
      setShowSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordError("Current and new passwords are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordError('');
    setIsUpdatingPassword(true);
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: currentPassword,
      });
      if (signInError) throw new Error("Incorrect current password.");

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordSuccess("Password updated successfully");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    
    const img = document.createElement('img');
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    
    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 256;
      const MAX_HEIGHT = 256;
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, width, height);
      
      const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
      setAvatarUrl(resizedBase64);
      setHasChanges(true);
    };
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    setHasChanges(true);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(studentId);
    // We could show a toast here but for now just basic
  };

  return (
    <DashboardLayout onLogout={onLogout} currentView="settings" onNavigate={onNavigate}>
      <div className="w-full pb-24 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 w-full max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
              <SettingsIcon className="text-indigo-500" size={28} /> Settings
            </h1>
            <p className="text-sm font-body text-slate-400">Manage your account, preferences, and security.</p>
          </div>

          <div className="space-y-6">
            
            {/* Profile */}
            <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <User size={20} className="text-indigo-400" />
                </div>
                <h3 className="text-xl font-display font-bold text-white">Profile</h3>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 mb-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-4 border-[#020617] overflow-hidden relative group cursor-pointer" onClick={() => document.getElementById('avatarUpload')?.click()}>
                    {avatarUrl ? <img loading="lazy" src={avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" /> : <User size={40} className="text-slate-400 group-hover:opacity-50 transition-opacity" />}
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon size={20} className="text-white" />
                    </div>
                  </div>
                  <input type="file" id="avatarUpload" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} />
                  <button type="button" onClick={() => document.getElementById('avatarUpload')?.click()} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                    Change Picture
                  </button>
                  {avatarUrl && (
                    <button type="button" onClick={handleRemoveAvatar} className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors">
                      Remove Picture
                    </button>
                  )}
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 relative">
                      <label className="text-xs font-semibold text-slate-500 ml-1">Full Name</label>
                      {errorMsg && <p className="absolute -top-5 left-1 text-xs text-rose-500 font-medium">{errorMsg}</p>}
                      <input type="text" value={nameInput} onChange={(e) => { setNameInput(e.target.value); setHasChanges(true); }} className="w-full bg-[#020617] border border-slate-700 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-3 outline-none transition-colors" />
                    </div>
                    <div className="space-y-1.5 relative">
                      <label className="text-xs font-semibold text-slate-500 ml-1">Email Address</label>
                      <input type="email" value={emailInput} onChange={(e) => { setEmailInput(e.target.value); setHasChanges(true); }} className="w-full bg-[#020617] border border-slate-700 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-3 outline-none transition-colors" />
                    </div>
                    <div className="space-y-1.5 relative">
                      <label className="text-xs font-semibold text-slate-500 ml-1">Phone Number</label>
                      <input type="tel" value={phoneInput} onChange={(e) => { setPhoneInput(e.target.value); setHasChanges(true); }} placeholder="+234 800 000 0000" className="w-full bg-[#020617] border border-slate-700 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-3 outline-none transition-colors" />
                    </div>
                  </div>
                  <div className="space-y-1.5 relative mt-4">
                    <label className="text-xs font-semibold text-slate-500 ml-1">Bio</label>
                    <textarea value={bioInput} onChange={(e) => { setBioInput(e.target.value); setHasChanges(true); }} placeholder="Write a short bio..." className="w-full bg-[#020617] border border-slate-700 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-3 outline-none transition-colors resize-none" rows={3}></textarea>
                  </div>
                  {profile?.role === 'Lecturer' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1.5 relative">
                      <label className="text-xs font-semibold text-slate-500 ml-1">Department</label>
                      <input type="text" value={departmentInput} onChange={(e) => { setDepartmentInput(e.target.value); setHasChanges(true); }} placeholder="Department" className="w-full bg-[#020617] border border-slate-700 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-3 outline-none transition-colors" />
                    </div>
                    <div className="space-y-1.5 relative">
                      <label className="text-xs font-semibold text-slate-500 ml-1">Faculty</label>
                      <input type="text" value={facultyInput} onChange={(e) => { setFacultyInput(e.target.value); setHasChanges(true); }} placeholder="Faculty" className="w-full bg-[#020617] border border-slate-700 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-3 outline-none transition-colors" />
                    </div>
                  </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800/50">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#020617]/50 border border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <Hash size={16} className="text-slate-400" />
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Student ID</p>
                      <p className="text-sm text-slate-300 font-mono">{studentId}</p>
                    </div>
                  </div>
                  <button onClick={handleCopyId} className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                    Copy
                  </button>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#020617]/50 border border-slate-800/50">
                  <Calendar size={16} className="text-slate-400" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Registration Date</p>
                    <p className="text-sm text-slate-300">
                      {profile?.registration_date ? new Date(profile.registration_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#020617]/50 border border-slate-800/50">
                  <Globe size={16} className="text-slate-400" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Academic Portal</p>
                    <p className="text-sm text-slate-300">Undergraduate</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#020617]/50 border border-slate-800/50">
                  <User size={16} className="text-slate-400" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Role</p>
                    <p className="text-sm text-slate-300">{profile?.role || 'Student'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#020617]/50 border border-slate-800/50">
                  <GraduationCap size={16} className="text-slate-400" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">University / Course</p>
                    <div className="flex gap-2 mt-1">
                      <input type="text" value={universityInput} onChange={(e) => { setUniversityInput(e.target.value); setHasChanges(true); }} placeholder="University" className="w-full bg-[#020617] border border-slate-700 focus:border-indigo-500 text-slate-200 rounded px-2 py-1 outline-none transition-colors text-xs" />
                      <input type="text" value={courseInput} onChange={(e) => { setCourseInput(e.target.value); setHasChanges(true); }} placeholder="Course" className="w-full bg-[#020617] border border-slate-700 focus:border-indigo-500 text-slate-200 rounded px-2 py-1 outline-none transition-colors text-xs" />
                      <input type="text" value={levelInput} onChange={(e) => { setLevelInput(e.target.value); setHasChanges(true); }} placeholder="Level (e.g. 100L)" className="w-full bg-[#020617] border border-slate-700 focus:border-indigo-500 text-slate-200 rounded px-2 py-1 outline-none transition-colors text-xs" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                  <Shield size={20} className="text-rose-400" />
                </div>
                <h3 className="text-xl font-display font-bold text-white">Security</h3>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-semibold text-slate-500 ml-1">Current Password</label>
                  <div className="relative">
                    <input type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="w-full bg-[#020617] border border-slate-700 focus:border-rose-500 text-slate-200 rounded-xl px-4 py-3 outline-none transition-colors" />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-semibold text-slate-500 ml-1">New Password</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="w-full bg-[#020617] border border-slate-700 focus:border-rose-500 text-slate-200 rounded-xl px-4 py-3 outline-none transition-colors" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-semibold text-slate-500 ml-1">Confirm Password</label>
                    <div className="relative">
                      <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full bg-[#020617] border border-slate-700 focus:border-rose-500 text-slate-200 rounded-xl px-4 py-3 outline-none transition-colors" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {passwordError && (
                  <p className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5 text-center">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-center">{passwordSuccess}</p>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleUpdatePassword}
                    disabled={!newPassword || isUpdatingPassword}
                    className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-rose-500/20"
                  >
                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800/50">
                  <div className="flex flex-col gap-1 p-4 rounded-xl bg-[#020617]/50 border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Last Login</p>
                    <p className="text-sm text-slate-200 font-medium">Today, 10:45 AM</p>
                    <p className="text-xs text-slate-400">Lagos, Nigeria (IP: 197.210.xxx.xx)</p>
                  </div>
                  <div className="flex flex-col justify-center p-4 rounded-xl bg-[#020617]/50 border border-slate-800/50">
                    <button className="flex items-center justify-between w-full text-left group">
                      <div>
                        <p className="text-sm font-semibold text-slate-200 group-hover:text-rose-400 transition-colors">Login History</p>
                        <p className="text-xs text-slate-500">View all recent sign-ins</p>
                      </div>
                      <ArrowRight size={16} className="text-slate-600 group-hover:text-rose-400 transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Bell size={20} className="text-amber-400" />
                </div>
                <h3 className="text-xl font-display font-bold text-white">Notifications</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'announcements', label: 'Announcements', desc: 'Important platform news' },
                  { id: 'cbt', label: 'CBT Notifications', desc: 'Test reminders and results' },
                  { id: 'premium', label: 'Premium Notifications', desc: 'Offers and subscription updates' },
                  { id: 'courseUpdates', label: 'Course Updates', desc: 'New materials and resources' },
                  { id: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                  { id: 'push', label: 'Push Notifications', desc: 'Receive updates in browser' }
                ].map((notif) => (
                  <div key={notif.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#020617]/50 border border-slate-800/50">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{notif.label}</p>
                      <p className="text-[10px] text-slate-500">{notif.desc}</p>
                    </div>
                    <button 
                      onClick={() => handleToggleNotification(notif.id as any)}
                      className={`relative w-10 h-6 rounded-full transition-colors ${notifications[notif.id as keyof typeof notifications] ? 'bg-amber-500' : 'bg-slate-700'}`}
                    >
                      <motion.div 
                        animate={{ x: notifications[notif.id as keyof typeof notifications] ? 16 : 2 }}
                        className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-sm"
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Appearance & Language */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Appearance */}
              <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Moon size={20} className="text-purple-400" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-white">Appearance</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-3 ml-1 uppercase tracking-wider">Theme</p>
                    <div className="flex gap-2">
                      {[
                        { id: 'dark', icon: Moon, label: 'Dark' },
                        { id: 'light', icon: Sun, label: 'Light' },
                        { id: 'system', icon: Monitor, label: 'System' }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => { setTheme(t.id as any); setHasChanges(true); }}
                          className={`flex-1 py-3 px-2 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                            theme === t.id 
                              ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' 
                              : 'bg-[#020617]/50 border-slate-800/50 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <t.icon size={16} />
                          <span className="text-xs font-semibold">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-3 ml-1 uppercase tracking-wider">Font Size</p>
                    <div className="flex gap-2">
                      {[
                        { id: 'small', label: 'Small', size: 14 },
                        { id: 'medium', label: 'Medium', size: 16 },
                        { id: 'large', label: 'Large', size: 18 }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => { setTextSize(t.id as any); setHasChanges(true); }}
                          className={`flex-1 py-3 px-2 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                            textSize === t.id 
                              ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' 
                              : 'bg-[#020617]/50 border-slate-800/50 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className="font-semibold" style={{ fontSize: t.size }}>Aa</span>
                          <span className="text-[10px] font-semibold">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-3 ml-1 uppercase tracking-wider">Accent Color</p>
                    <div className="flex gap-3">
                      {[
                        { id: 'indigo', color: 'bg-indigo-500', label: 'Indigo' },
                        { id: 'rose', color: 'bg-rose-500', label: 'Rose' },
                        { id: 'emerald', color: 'bg-emerald-500', label: 'Emerald' },
                        { id: 'amber', color: 'bg-amber-500', label: 'Amber' },
                        { id: 'blue', color: 'bg-blue-500', label: 'Blue' }
                      ].map(c => (
                        <button
                          key={c.id}
                          onClick={() => setHasChanges(true)}
                          title={c.label}
                          className={`w-10 h-10 rounded-full ${c.color} flex items-center justify-center transition-transform hover:scale-110 ${c.id === 'indigo' ? 'ring-2 ring-offset-2 ring-offset-[#0f172a] ring-indigo-500' : ''}`}
                        >
                          {c.id === 'indigo' && <Check size={16} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Language */}
              <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <Globe size={20} className="text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-white">Language</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    { id: 'english', label: 'English', code: 'EN' },
                    { id: 'french', label: 'French', code: 'FR' },
                    { id: 'spanish', label: 'Spanish', code: 'ES' }
                  ].map(l => (
                    <button
                      key={l.id}
                      onClick={() => { setLanguage(l.id); setHasChanges(true); }}
                      className={`w-full p-4 rounded-xl flex items-center justify-between transition-colors ${
                        language === l.id 
                          ? 'bg-[#020617]/50 border border-cyan-500/30' 
                          : 'bg-[#020617]/30 border border-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">{l.code}</div>
                        <span className="font-semibold text-slate-200">{l.label}</span>
                      </div>
                      {language === l.id && <Check size={16} className="text-cyan-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Devices & s */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Devices */}
              <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
                    <Laptop size={20} className="text-teal-400" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-white">Devices</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#020617]/50 border border-teal-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Laptop size={20} className="text-slate-300" />
                      <div>
                        <p className="text-sm font-semibold text-slate-200">MacBook Pro</p>
                        <p className="text-[10px] text-teal-400">Active Now • Chrome</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-[#020617]/50 border border-slate-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone size={20} className="text-slate-400" />
                      <div>
                        <p className="text-sm font-semibold text-slate-300">iPhone 14 Pro</p>
                        <p className="text-[10px] text-slate-500">Last active: Yesterday • Safari</p>
                      </div>
                    </div>
                    <button className="text-xs text-rose-400 hover:text-rose-300 transition-colors">Sign out</button>
                  </div>
                </div>
              </div>

              {/* s */}
              <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    
                  </div>
                  <h3 className="text-xl font-display font-bold text-white">s</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#020617]/50 border border-slate-800/50">
                      <p className="text-2xl font-bold text-white mb-1">12</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Chats</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#020617]/50 border border-slate-800/50">
                      <p className="text-2xl font-bold text-white mb-1">45</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Notes</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#020617]/50 border border-slate-800/50">
                      <p className="text-2xl font-bold text-white mb-1">8</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Past Q's</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#020617]/50 border border-slate-800/50">
                      <p className="text-2xl font-bold text-white mb-1">24</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">CBT Results</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                      Manage
                    </button>
                    <button className="flex-1 py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                      <Trash2 size={16} /> Clear All
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy & About */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Privacy */}
              <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Shield size={20} className="text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-white">Privacy</h3>
                </div>
                
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-4 rounded-xl bg-[#020617]/50 border border-slate-800/50 hover:border-emerald-500/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      
                    </div>
                    <ArrowRight size={16} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </button>
                  
                  <button 
                    onClick={() => setShowDeleteDialog(true)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-[#020617]/50 border border-slate-800/50 hover:border-rose-500/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Trash size={18} className="text-slate-400 group-hover:text-rose-400 transition-colors" />
                      <span className="text-sm font-semibold text-slate-200 group-hover:text-rose-400 transition-colors">Delete Account</span>
                    </div>
                    <ArrowRight size={16} className="text-slate-600 group-hover:text-rose-400 transition-colors" />
                  </button>
                </div>
              </div>

              {/* About */}
              <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center shrink-0">
                    <Info size={20} className="text-slate-400" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-white">About</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#020617]/50 border border-slate-800/50">
                    <span className="text-sm font-semibold text-slate-300">TUNBORZY ACADEMY Version</span>
                    <span className="text-sm font-mono text-slate-400">v3.0.0 (Web)</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#020617]/50 border border-slate-800/50">
                    <span className="text-sm font-semibold text-slate-300">Developer</span>
                    <span className="text-sm font-semibold text-indigo-400 text-right leading-tight">Emmyweb Design Agency | 08169996178</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 py-3 px-2 rounded-xl bg-[#020617]/50 border border-slate-800/50 hover:border-slate-700 text-slate-400 text-[11px] font-semibold transition-colors">
                      Privacy Policy
                    </button>
                    <button className="flex-1 py-3 px-2 rounded-xl bg-[#020617]/50 border border-slate-800/50 hover:border-slate-700 text-slate-400 text-[11px] font-semibold transition-colors">
                      Terms & Conditions
                    </button>
                    <button className="flex-1 py-3 px-2 rounded-xl bg-[#020617]/50 border border-slate-800/50 hover:border-slate-700 text-slate-400 text-[11px] font-semibold transition-colors">
                      Contact Support
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Logout Section */}
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-display font-bold text-rose-400 mb-1">Sign Out</h3>
                <p className="text-sm text-slate-400">End your current session safely.</p>
              </div>
              <button 
                onClick={() => setShowLogoutDialog(true)}
                className="w-full sm:w-auto px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
              >
                <LogOut size={18} /> Log Out
              </button>
            </div>

          </div>
        </motion.div>

        {/* Floating Save Button */}
        <AnimatePresence>
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#0f172a]/95 backdrop-blur-xl border border-indigo-500/30 p-3 pr-4 rounded-full shadow-[0_10px_40px_-10px_rgba(99,102,241,0.3)]"
            >
              <div className="pl-3 text-sm font-semibold text-white">Unsaved changes</div>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-2 rounded-full font-bold transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                {isSaving ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <SettingsIcon size={16} />
                  </motion.div>
                ) : (
                  <>
                    <Save size={16} /> Save Changes
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Toast */}
        <AnimatePresence>
          {showSaveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-emerald-500/90 backdrop-blur-xl border border-emerald-400 text-white px-6 py-3 rounded-full shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)]"
            >
              <Check size={18} />
              <span className="text-sm font-bold">Settings saved successfully</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logout Dialog */}
        <AnimatePresence>
          {showLogoutDialog && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"
                onClick={() => setShowLogoutDialog(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                className="relative w-full max-w-sm bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-2xl"
              >
                <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 mx-auto">
                  <LogOut size={24} className="text-rose-500" />
                </div>
                <h3 className="text-xl font-display font-bold text-white text-center mb-2">Log Out?</h3>
                <p className="text-slate-400 text-center text-sm mb-8">Are you sure you want to log out of your account?</p>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowLogoutDialog(false)}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={onLogout}
                    className="flex-1 py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold transition-colors shadow-lg shadow-rose-500/20"
                  >
                    Log Out
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Dialog */}
        <AnimatePresence>
          {showDeleteDialog && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"
                onClick={() => setShowDeleteDialog(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                className="relative w-full max-w-sm bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-2xl"
              >
                <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 mx-auto border border-rose-500/20">
                  <AlertTriangle size={24} className="text-rose-500" />
                </div>
                <h3 className="text-xl font-display font-bold text-white text-center mb-2">Delete Account?</h3>
                <p className="text-slate-400 text-center text-sm mb-6">This action is permanent and cannot be undone. All your data, progress, and history will be lost.</p>

                {deleteError && (
                  <p className="text-rose-400 text-xs text-center mb-4 bg-rose-500/10 border border-rose-500/20 rounded-lg py-2 px-3">{deleteError}</p>
                )}

                <div className="bg-[#020617]/50 border border-slate-800 rounded-xl p-3 mb-6">
                  <label className="text-xs font-semibold text-slate-500 ml-1 mb-1 block">Type "DELETE" to confirm</label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full bg-transparent border-none text-white focus:outline-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(''); setDeleteError(''); }}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors shadow-lg ${
                      deleteConfirmText === 'DELETE' && !isDeletingAccount
                        ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20 cursor-pointer'
                        : 'bg-rose-500/50 text-white/50 cursor-not-allowed shadow-none'
                    }`}
                  >
                    {isDeletingAccount ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

              </div>
    </DashboardLayout>
  );
}
