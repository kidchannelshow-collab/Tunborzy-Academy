import { useState, useEffect } from 'react';
import DashboardLayout from './dashboard/DashboardLayout';
import { useProfile } from '../lib/useProfile';
import CBTUndergraduateDrilling from './cbt/CBTUndergraduateDrilling';
import CBTPerformanceAnalytics from './cbt/CBTPerformanceAnalytics';
import CBTManagement from './lecturer/CBTManagement';
import CBTExamTaker from './cbt/CBTExamTaker';
import CBTResultView from './cbt/CBTResultView';
import CBTReviewView from './cbt/CBTReviewView';
import CBTCustomBuilder from './cbt/CBTCustomBuilder';
import { supabase } from '../supabaseClient';

export default function CBTPracticePage({ onLogout, onNavigate }: { onLogout: () => void, onNavigate?: (view: string) => void }) {
  const { profile, loading } = useProfile();
  
  const [view, setView] = useState<'dashboard' | 'analytics' | 'admin' | 'exam' | 'result' | 'review' | 'custom'>('dashboard');
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [customConfig, setCustomConfig] = useState<any>(null);

  useEffect(() => {
    if (!loading && profile) {
      if (profile.role === 'Admin' || profile.role === 'Lecturer') {
        setView('admin');
      } else {
        setView('dashboard');
      }
    }
  }, [loading, profile]);

  
  const handleStartCustom = (config: any) => {
    setCustomConfig({ ...config, backendDrill: true });
    setActiveExamId('custom-exam-id');
    setActiveAttemptId('custom-attempt-id');
    setView('exam');
  };

  const handleStartExam = async (examId: string) => {
    setActiveExamId(examId);
    
    // Create attempt
    try {
      const { data: attempt, error } = await supabase
        .from('cbt_attempts')
        .insert([{
          exam_id: examId,
          user_id: profile?.id,
          status: 'in_progress'
        }])
        .select()
        .single();
        
      if (error) throw error;
      setActiveAttemptId(attempt.id);
      setView('exam');
    } catch (err: any) {
      console.error("Error creating attempt", err);
      alert("Error starting exam: " + (err.message || "Unknown error"));
    }
  };

  const handleFinishExam = (attemptId: string) => {
    setActiveAttemptId(attemptId);
    setView('result');
  };

  const handleReviewExam = (attemptId: string) => {
    setActiveAttemptId(attemptId);
    setView('review');
  };

  if (loading) {
    return (
      <DashboardLayout onLogout={onLogout} currentView="cbt" onNavigate={onNavigate}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onLogout={onLogout} currentView="cbt" onNavigate={onNavigate}>
      
      {view === 'dashboard' && (
        <CBTUndergraduateDrilling 
          onStartDrill={handleStartCustom} 
          onBack={() => setView('dashboard')} 
          onViewAnalytics={() => setView('analytics')}
        />
      )}
      {view === 'analytics' && (
        <div className="max-w-6xl mx-auto py-8 px-4">
          <div className="mb-6">
            <button
              onClick={() => setView('dashboard')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors"
            >
              ← Back to Practice Drills
            </button>
          </div>
          <CBTPerformanceAnalytics 
            onReviewAttempt={handleReviewExam}
            onStartNewDrill={() => setView('dashboard')}
          />
        </div>
      )}
      {view === 'admin' && (
        <CBTManagement />
      )}
      {view === 'exam' && activeExamId && activeAttemptId && (
        <CBTExamTaker 
          examId={activeExamId} 
          attemptId={activeAttemptId} 
          customConfig={customConfig}
          onFinish={handleFinishExam} 
          onCancel={() => setView('dashboard')} 
        />
      )}
      {view === 'result' && activeAttemptId && (
        <CBTResultView 
          attemptId={activeAttemptId} 
          onReview={() => handleReviewExam(activeAttemptId)}
          onBackToDashboard={() => setView('dashboard')}
        />
      )}
      {view === 'review' && activeAttemptId && (
        <CBTReviewView 
          attemptId={activeAttemptId}
          onBack={() => setView('dashboard')}
        />
      )}
    </DashboardLayout>
  );
}
