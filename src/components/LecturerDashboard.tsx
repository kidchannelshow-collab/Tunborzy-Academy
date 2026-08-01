import CourseChatSystem from './CourseChatSystem';
import { useState } from 'react';
import LecturerDashboardLayout from './lecturer/LecturerDashboardLayout';
import Overview from './lecturer/Overview';
import CourseManagement from './lecturer/CourseManagement';
import UploadCenter from './lecturer/UploadCenter';
import CBTManagement from './lecturer/CBTManagement';
import PastQuestionsManagement from './lecturer/PastQuestionsManagement';
import ResourceLibraryManagement from './lecturer/ResourceLibraryManagement';
import StudentInsights from './lecturer/StudentInsights';
import Announcements from './lecturer/Announcements';
import AssignmentManagement from './lecturer/AssignmentManagement';
import LecturerProfile from './lecturer/LecturerProfile';
import TunborzyAI from './TunborzyAI';

interface LecturerDashboardProps {
  onLogout: () => void;
  onNavigate?: (view: string) => void;
}

export default function LecturerDashboard({ onLogout, onNavigate }: LecturerDashboardProps) {
  const [currentView, setCurrentView] = useState('overview');

  const renderView = () => {
    switch (currentView) {
      case 'overview':
        return <Overview />;
      case 'courses':
        return <CourseManagement />;
      case 'chats':
        return <CourseChatSystem onNavigate={onNavigate} onLogout={onLogout} />;
      case 'upload':
        return <UploadCenter />;
      case 'cbt':
        return <CBTManagement />;
      case 'past-questions':
        return <PastQuestionsManagement />;
      case 'resources':
        return <ResourceLibraryManagement />;
      case 'insights': // Analytics
      case 'students': // Student Management
        return <StudentInsights />;
      case 'announcements':
        return <Announcements />;
      case 'assignments':
        return <AssignmentManagement />;
      case 'ai-tools':
        return <TunborzyAI role="lecturer" />;
      case 'profile':
        return <LecturerProfile />;
      default:
        return <Overview />;
    }
  };

  return (
    <LecturerDashboardLayout 
      currentView={currentView} 
      onNavigate={setCurrentView}
      onLogout={onLogout}
    >
      {renderView()}
    </LecturerDashboardLayout>
  );
}
