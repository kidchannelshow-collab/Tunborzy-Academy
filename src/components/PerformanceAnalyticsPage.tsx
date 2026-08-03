import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart2, Clock, Target, TrendingUp, TrendingDown,
  Award, FileText, MessageCircle, AlertTriangle, Zap, BrainCircuit, Activity, CheckSquare, XCircle, HelpCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import DashboardLayout from './dashboard/DashboardLayout';
import { supabase } from '../supabaseClient';
import { useProfile } from '../lib/useProfile';

interface PerformanceAnalyticsPageProps {
  onLogout: () => void;
  onNavigate?: (view: string) => void;
}

export default function PerformanceAnalyticsPage({ onLogout, onNavigate }: PerformanceAnalyticsPageProps) {
  const { profile } = useProfile();
  
  // Real data state
  const [cbtHistory, setCbtHistory] = useState<any[]>([]);
  const [studyTime, setStudyTime] = useState<any[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we would fetch from 'cbt_results', 'study_sessions', etc.
    // For now, we simulate fetching and getting empty results because the tables don't exist yet
    // or the user has no data.
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const { data: attempts } = await supabase
          .from('cbt_attempts')
          .select('*, cbt_exams(title)')
          .eq('student_id', profile.id)
          .not('score', 'is', null)
          .order('end_time', { ascending: true });

        if (attempts && attempts.length > 0) {
          const formattedHistory = attempts.map(a => ({
            name: a.cbt_exams?.title || 'Unknown Exam',
            score: a.total_questions > 0 ? Math.round((a.score / a.total_questions) * 100) : 0,
            date: new Date(a.end_time).toLocaleDateString()
          }));
          setCbtHistory(formattedHistory);
        } else {
          setCbtHistory([]);
        }
        setStudyTime([]);
        setSubjectPerformance([]);
        setAchievements([]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (profile) {
      fetchAnalytics();
    }
  }, [profile]);

  if (loading) {
    return (
      <DashboardLayout currentView="analytics" onNavigate={onNavigate} onLogout={onLogout}>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            <span className="text-slate-400 font-medium">Loading analytics...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const hasData = cbtHistory.length > 0 || studyTime.length > 0 || subjectPerformance.length > 0;

  return (
    <DashboardLayout currentView="analytics" onNavigate={onNavigate} onLogout={onLogout}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                <BarChart2 className="text-indigo-400" size={24} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Performance Analytics</h1>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">
              Track your academic progress, CBT scores, and AI-driven insights based on your actual activity.
            </p>
          </div>
        </div>

        {!hasData ? (
          <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
              <Activity className="text-indigo-500" size={40} />
            </div>
            <h2 className="text-xl font-display font-bold text-white mb-2">No Analytics Data Yet</h2>
            <p className="text-slate-400 max-w-md mx-auto mb-8">
              Complete courses, take CBT mock exams, and interact with the AI assistant to generate performance insights.
            </p>
            <button 
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div>
             {/* Data rendering goes here when data exists */}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
