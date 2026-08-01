import { PenTool, Megaphone, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useProfile } from '../../lib/useProfile';

interface ActivityAndAnnouncementsProps {
  onNavigate?: (view: string) => void;
}

export default function ActivityAndAnnouncements({ onNavigate }: ActivityAndAnnouncementsProps) {
  const { profile } = useProfile();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('target_role', profile.role)
          .order('created_at', { ascending: false })
          .limit(3);
        if (data) setAnnouncements(data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from('cbt_attempts')
          .select('*, cbt_exams(title)')
          .eq('student_id', profile.id)
          .order('started_at', { ascending: false })
          .limit(3);
          
        if (data) {
          const formatted = data.map(attempt => ({
             type: 'cbt',
             title: `Attempted CBT: ${attempt.cbt_exams?.title || 'Unknown Exam'}`,
             time: new Date(attempt.started_at).toLocaleDateString(),
             icon: PenTool,
             color: 'text-amber-500',
             bg: 'bg-amber-500/10'
          }));
          setActivities(formatted);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchAnnouncements();
    fetchActivities();
  }, [profile]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
      {/* Recent Activity */}
      <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800/50 rounded-2xl p-6 shadow-xl shadow-black/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
            Recent Activity
          </h3>
        </div>
        
        <div className="space-y-4">
          {activities.length > 0 ? activities.map((activity, index) => (
            <motion.div 
              key={index}
              whileHover={{ x: 4 }}
              onClick={() => {
                if (activity.type === 'chat') onNavigate && onNavigate('chats');
                if (activity.type === 'cbt') onNavigate && onNavigate('cbt');
              }}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer group"
            >
              <div className={`w-10 h-10 rounded-xl ${activity.bg} flex items-center justify-center shrink-0`}>
                <activity.icon size={18} className={activity.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                  {activity.title}
                </p>
                <p className="text-xs font-poppins text-slate-500 mt-0.5">
                  {activity.time}
                </p>
              </div>
            </motion.div>
          )) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No recent activity found.</p>
              <button 
                onClick={() => onNavigate && onNavigate('courses')}
                className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Start learning
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800/50 rounded-2xl p-6 shadow-xl shadow-black/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <Megaphone size={20} className="text-amber-500" />
            Announcements
          </h3>
          <button onClick={() => onNavigate && onNavigate('announcements')} className="text-sm font-poppins font-medium text-amber-500 hover:text-amber-400 transition-colors">
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {announcements.length > 0 ? announcements.map((announcement, index) => (
            <motion.div 
              key={index}
              whileHover={{ x: 4 }}
              onClick={() => onNavigate && onNavigate('announcements')}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/80 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {announcement.created_by || 'Admin'}
                </span>
                <span className="text-xs font-poppins text-slate-500">
                  {new Date(announcement.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm font-body font-medium text-slate-200">
                {announcement.title}
              </p>
            </motion.div>
          )) : (
            <div className="text-center py-8">
              <Megaphone className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No new announcements</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
