import { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface DashboardLayoutProps {
  children: ReactNode;
  onLogout: () => void;
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export default function DashboardLayout({ children, onLogout, currentView, onNavigate }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-[#020617] selection:bg-amber-500/30 overflow-x-hidden w-full">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        onLogout={onLogout}
        currentView={currentView}
        onNavigate={onNavigate}
      />
      
      <div className={`lg:ml-72 flex flex-col ${currentView === "chats" ? "h-[100dvh]" : "min-h-[100dvh]"}`}>
        <TopBar onOpenSidebar={() => setIsSidebarOpen(true)} onNavigate={onNavigate} />
        
        {currentView === "chats" ? (
          <main className="flex-1 w-full flex flex-col h-full overflow-hidden">
            {children}
          </main>
        ) : (
          <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full flex flex-col h-full">
            {children}
          </main>
        )}
          </div>
    </div>
  );
}
