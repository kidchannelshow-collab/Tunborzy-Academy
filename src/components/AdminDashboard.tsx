import React, { useState } from 'react';
import AdminDashboardLayout from './admin/AdminDashboardLayout';
import Overview from './admin/Overview';
import UserManagement from './admin/UserManagement';
import LecturerManagement from './admin/LecturerManagement';
import AcademicManagement from './admin/AcademicManagement';
import ContentManagement from './admin/ContentManagement';
import PremiumManagement from './admin/PremiumManagement';
import PremiumActivationCodeManagement from './admin/PremiumActivationCodeManagement';
import StudentActivation from './admin/StudentActivation';
import WebsiteManagement from './admin/WebsiteManagement';
import AIManagement from './admin/AIManagement';
import Analytics from './admin/Analytics';
import SystemSettings from './admin/SystemSettings';
import AuditLog from './admin/AuditLog';

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigate?: (view: string) => void;
}

export default function AdminDashboard({ onLogout, onNavigate }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState('overview');

  const renderView = () => {
    switch (currentView) {
      case 'overview':
        return <Overview />;
      case 'users':
        return <UserManagement />;
      case 'lecturers':
        return <LecturerManagement />;
      case 'academic':
        return <AcademicManagement />;
      case 'content':
        return <ContentManagement />;
      case 'premium':
        return <PremiumManagement />;
      case 'premium-activation':
        return <PremiumActivationCodeManagement />;
      case 'activation':
        return <StudentActivation />;
      case 'website':
        return <WebsiteManagement />;
      case 'ai':
        return <AIManagement />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <SystemSettings />;
      case 'audit':
        return <AuditLog />;
      default:
        return <Overview />;
    }
  };

  return (
    <AdminDashboardLayout 
      onLogout={onLogout} 
      currentView={currentView} 
      onNavigate={setCurrentView}
    >
      {renderView()}
    </AdminDashboardLayout>
  );
}
