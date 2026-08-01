import { motion } from 'motion/react';
import { BookOpen, PenTool, Library, Bot, FileText, RefreshCcw, BarChart2, MessageCircle } from 'lucide-react';

interface QuickActionsProps {
  onNavigate?: (view: string) => void;
}

export default function QuickActions({ onNavigate }: QuickActionsProps) {
  const actions = [
    { icon: BookOpen, label: 'Continue Learning', color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20', id: 'courses' },
    { icon: MessageCircle, label: 'Course Chats', color: 'from-green-400 to-emerald-600', shadow: 'shadow-green-500/20', id: 'chats' },
    { icon: PenTool, label: 'Take CBT Practice', color: 'from-amber-400 to-amber-600', shadow: 'shadow-amber-500/20', id: 'cbt' },
    { icon: Library, label: 'Resource Library', color: 'from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-500/20', id: 'resources' },
    { icon: Bot, label: 'AI Study Assistant', color: 'from-purple-500 to-fuchsia-600', shadow: 'shadow-purple-500/20', id: 'ai' },
    { icon: FileText, label: 'Past Questions', color: 'from-rose-400 to-rose-600', shadow: 'shadow-rose-500/20', id: 'past-questions' },
    { icon: RefreshCcw, label: 'Revision Mode', color: 'from-cyan-400 to-cyan-600', shadow: 'shadow-cyan-500/20', id: 'revision' },
    { icon: BarChart2, label: 'Performance Analytics', color: 'from-orange-400 to-orange-600', shadow: 'shadow-orange-500/20', id: 'analytics' },
  ];

  return (
    <div className="mb-10">
      <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-4">
        {actions.map((action, index) => (
          <motion.button
            key={index}
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate && onNavigate(action.id)}
            className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-[#0f172a]/80 backdrop-blur-md border border-slate-800/50 hover:border-slate-700 transition-all group hover:bg-[#1e293b]/50 shadow-lg ${action.shadow}`}
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} p-0.5 shadow-inner`}>
              <div className="w-full h-full bg-[#0f172a]/40 rounded-[10px] flex items-center justify-center backdrop-blur-sm group-hover:bg-transparent transition-all">
                <action.icon size={24} className="text-white" />
              </div>
            </div>
            <span className="text-xs sm:text-sm font-poppins font-medium text-slate-300 group-hover:text-white text-center leading-tight">
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
