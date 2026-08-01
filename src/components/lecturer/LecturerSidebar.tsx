import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, BookOpen, UploadCloud, FileText, BarChart2, Bell, LogOut, X, Users, Bot, MessageSquare, ClipboardList
} from 'lucide-react';

interface LecturerSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onLogout: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

export default function LecturerSidebar({ isOpen, setIsOpen, onLogout, currentView, onNavigate }: LecturerSidebarProps) {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', id: 'overview' },
    { icon: BookOpen, label: 'Course Settings', id: 'courses' },
    
    { icon: MessageSquare, label: 'Course Chats', id: 'chats' },
    { icon: UploadCloud, label: 'Material Center', id: 'upload' },
    { icon: ClipboardList, label: 'Assignments', id: 'assignments' },
    { icon: FileText, label: 'CBT Manager', id: 'cbt' },
    { icon: Users, label: 'My Students', id: 'students' },
    { icon: BarChart2, label: 'Analytics', id: 'insights' },
    { icon: Bell, label: 'Announcements', id: 'announcements' },
    { icon: Bot, label: 'AI Tools', id: 'ai-tools' },
  ];

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setIsOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
          TUNBORZY
        </h1>
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden text-slate-400 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      <div className="px-6 mb-6">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider mb-1">Portal</p>
          <p className="text-sm font-bold text-white">Lecturer Access</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${
              currentView === item.id 
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <item.icon size={18} className={currentView === item.id ? 'text-slate-950' : 'text-slate-400'} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors font-semibold text-sm"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : -280 }}
        className={`fixed top-0 left-0 bottom-0 w-[280px] bg-[#0f172a] border-r border-slate-800 z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </motion.aside>
    </>
  );
}
