import { Bell, Menu, Settings, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useProfile } from '../../lib/useProfile';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface TopBarProps {
  onOpenSidebar: () => void;
  studentName?: string;
  onNavigate?: (view: string) => void;
}

export default function TopBar({ onOpenSidebar, studentName, onNavigate }: TopBarProps) {
  const { profile } = useProfile();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const fetchUnread = async () => {
      try {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('is_read', false);
        setUnreadCount(count || 0);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUnread();
    
    // Subscribe to realtime updates for notifications
    const channel = supabase.channel('topbar_notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${profile.id}`
      }, (payload) => {
        // Re-fetch unread count on any change
        fetchUnread();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.role]);
  
  const displayName = profile?.full_name || "";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  const getEmoji = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '☀️';
    if (hour >= 12 && hour < 17) return '🌤️';
    if (hour >= 17 && hour < 21) return '🌇';
    return '🌙';
  };

  return (
    <header className="sticky top-0 z-30 bg-[#020617]/80 backdrop-blur-xl border-b border-slate-800/50 px-4 sm:px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
        >
          <Menu size={24} />
        </button>
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2">
            {getGreeting()}, {displayName} {getEmoji()}
          </h2>
          <p className="text-sm font-body text-slate-400 mt-1 hidden sm:block flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">{profile?.role || 'Student'}</span>
            <span>Ready to continue your learning journey today?</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <motion.button 
          onClick={() => onNavigate && onNavigate('announcements')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2.5 text-slate-400 hover:text-white bg-slate-900/50 border border-slate-800 rounded-xl transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] flex items-center justify-center bg-rose-500 rounded-full ring-2 ring-[#020617] text-[9px] font-bold text-white px-1">{unreadCount}</span>}
        </motion.button>

        <motion.button 
          onClick={() => onNavigate && onNavigate('settings')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="hidden sm:flex p-2.5 text-slate-400 hover:text-white bg-slate-900/50 border border-slate-800 rounded-xl transition-colors"
        >
          <Settings size={20} />
        </motion.button>

        <motion.button
          onClick={() => onNavigate && onNavigate('profile')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 rounded-xl overflow-hidden border-2 border-amber-500/50 relative bg-slate-800 flex items-center justify-center"
        >
          {profile?.avatar_url ? (
            <img loading="lazy" 
              src={profile.avatar_url} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={20} className="text-slate-400" />
          )}
        </motion.button>
      </div>
    </header>
  );
}
