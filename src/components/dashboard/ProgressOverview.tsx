import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Clock, Target, Flame, TrendingUp } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useProfile } from '../../lib/useProfile';

export default function ProgressOverview() {
  const { profile } = useProfile();
  const [statsData, setStatsData] = useState({
    topicsCount: 0,
    cbtCount: 0,
    cbtAvg: 0,
  });

  useEffect(() => {
    if (!profile) return;
    const fetchStats = async () => {
      try {
        const [cbtRes, enrRes] = await Promise.all([
          supabase
            .from('cbt_attempts')
            .select('score, total_questions')
            .eq('student_id', profile.id)
            .not('score', 'is', null),
          supabase
            .from('course_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', profile.id)
        ]);

        const cbtAttempts = cbtRes.data;
        const enrolledCount = enrRes.count;

        let cbtCount = 0;
        let cbtAvg = 0;

        if (cbtAttempts && cbtAttempts.length > 0) {
          cbtCount = cbtAttempts.length;
          let sum = 0;
          cbtAttempts.forEach(a => {
             if(a.total_questions > 0) {
                 sum += (a.score / a.total_questions) * 100;
             }
          });
          cbtAvg = Math.round(sum / cbtCount);
        }

        setStatsData({
          topicsCount: enrolledCount || 0,
          cbtCount,
          cbtAvg,
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, [profile?.id, profile?.role]);

  const stats = [
    { label: 'Courses Enrolled', value: `${statsData.topicsCount}`, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'CBT Tests Taken', value: `${statsData.cbtCount}`, icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'CBT Score Avg', value: `${statsData.cbtAvg}%`, icon: Target, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="mb-10">
      <h3 className="text-lg font-display font-bold text-white mb-4">
        Today's Progress
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -5 }}
            className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800/50 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-4`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <p className="text-2xl font-display font-bold text-white mb-1">{stat.value}</p>
            <p className="text-xs sm:text-sm font-body text-slate-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
