import React, { useState, ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';
import { Menu } from 'lucide-react';

interface AdminDashboardLayoutProps {
  children: ReactNode;
  onLogout: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

export default function AdminDashboardLayout({ children, onLogout, currentView, onNavigate }: AdminDashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-[#020617] flex">
      <AdminSidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        onLogout={onLogout} 
        currentView={currentView}
        onNavigate={onNavigate}
      />
      
      <div className="flex-1 min-w-0 lg:pl-72 flex flex-col min-h-[100dvh]">
        <header className="sticky top-0 z-30 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800/50 px-4 py-3 lg:hidden flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg bg-slate-800/50 text-slate-300 hover:text-white transition-colors"
            >
              <Menu size={24} />
            </button>
            <span className="font-display font-bold text-white uppercase tracking-wider">Control Center</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
