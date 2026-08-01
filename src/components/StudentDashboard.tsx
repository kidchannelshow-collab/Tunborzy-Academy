import DashboardLayout from './dashboard/DashboardLayout';
import ProgressOverview from './dashboard/ProgressOverview';
import QuickActions from './dashboard/QuickActions';
import MyCourses from './dashboard/MyCourses';
import PremiumFeatures from './dashboard/PremiumFeatures';
import ActivityAndAnnouncements from './dashboard/ActivityAndAnnouncements';
import { useProfile } from '../lib/useProfile';

interface StudentDashboardProps {
  onLogout: () => void;
  onNavigate?: (view: string) => void;
}

export default function StudentDashboard({ onLogout, onNavigate }: StudentDashboardProps) {
  const { profile, loading } = useProfile();
  if (loading) {
    return (
      <DashboardLayout onLogout={onLogout} currentView="dashboard" onNavigate={onNavigate}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-8 w-8 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-slate-400 font-medium">Loading dashboard...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleNavigate = (view: string) => {
    onNavigate?.(view);
  };

  return (
    <DashboardLayout onLogout={onLogout} currentView="dashboard" onNavigate={handleNavigate}>
      <ProgressOverview />
      <QuickActions onNavigate={handleNavigate} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <MyCourses onNavigate={handleNavigate} />
          <PremiumFeatures onNavigate={handleNavigate} />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <ActivityAndAnnouncements onNavigate={handleNavigate} />
        </div>
      </div>
    </DashboardLayout>
  );
}
