import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, Award, History, Calendar, Filter, CheckCircle2, 
  XCircle, Target, BookOpen, Clock, FileText, Sparkles, BarChart3, ChevronRight 
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface CBTPerformanceAnalyticsProps {
  onReviewAttempt: (attemptId: string) => void;
  onStartNewDrill: () => void;
}

export default function CBTPerformanceAnalytics({ onReviewAttempt, onStartNewDrill }: CBTPerformanceAnalyticsProps) {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [questionsMap, setQuestionsMap] = useState<Map<string, { course_code?: string, topic?: string }>>(new Map());
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | '7days' | '30days'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [attemptsRes, qRes] = await Promise.all([
        supabase
          .from('cbt_attempts')
          .select('*, cbt_exams(title, course_code, topic)')
          .eq('user_id', user.id)
          .order('end_time', { ascending: false }),
        supabase
          .from('cbt_questions')
          .select('id, course_code, topic')
      ]);

      if (attemptsRes.data) {
        setAttempts(attemptsRes.data);
      }

      if (qRes.data) {
        const qMap = new Map<string, { course_code?: string, topic?: string }>();
        qRes.data.forEach((q: any) => {
          qMap.set(q.id, { course_code: q.course_code, topic: q.topic });
        });
        setQuestionsMap(qMap);
      }
    } catch (err) {
      console.error('Error fetching CBT analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract course code and topic for an attempt
  const getAttemptMetadata = (attempt: any) => {
    let courseCode = attempt.cbt_exams?.course_code;
    let topic = attempt.cbt_exams?.topic;

    if ((!courseCode || !topic) && attempt.answers && attempt.answers.question_ids) {
      const qIds = attempt.answers.question_ids;
      for (const qId of qIds) {
        const qMeta = questionsMap.get(qId);
        if (qMeta) {
          if (!courseCode && qMeta.course_code) courseCode = qMeta.course_code;
          if (!topic && qMeta.topic) topic = qMeta.topic;
        }
      }
    }
    return {
      courseCode: courseCode || 'General',
      topic: topic || 'General Practice'
    };
  };

  // Filter attempts
  const filteredAttempts = attempts.filter(att => {
    if (att.status !== 'completed') return false;
    const meta = getAttemptMetadata(att);

    // Course filter
    if (selectedCourse !== 'all' && meta.courseCode !== selectedCourse) {
      return false;
    }

    // Topic filter
    if (selectedTopic !== 'all' && meta.topic !== selectedTopic) {
      return false;
    }

    // Date filter
    if (dateRange !== 'all') {
      const attDate = new Date(att.end_time || att.start_time);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - attDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (dateRange === '7days' && diffDays > 7) return false;
      if (dateRange === '30days' && diffDays > 30) return false;
    }

    return true;
  });

  // Calculate metrics
  const completedAttempts = filteredAttempts;
  const totalAttempts = completedAttempts.length;
  
  const scores = completedAttempts.map(a => a.score ?? 0);
  const averageScore = totalAttempts > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / totalAttempts) : 0;
  const bestScore = totalAttempts > 0 ? Math.max(...scores) : 0;
  const recentScore = totalAttempts > 0 ? (completedAttempts[0]?.score ?? 0) : 0;

  let totalQuestionsAttempted = 0;
  let totalCorrectAnswers = 0;
  let totalWrongAnswers = 0;

  completedAttempts.forEach(att => {
    const correct = att.total_correct || 0;
    const wrong = att.total_wrong || 0;
    totalCorrectAnswers += correct;
    totalWrongAnswers += wrong;
    totalQuestionsAttempted += (correct + wrong);
  });

  // Course performance breakdown
  const courseMap = new Map<string, { attempts: number, totalScore: number, bestScore: number }>();
  // Topic performance breakdown
  const topicMap = new Map<string, { courseCode: string, attempts: number, totalScore: number, bestScore: number }>();

  attempts.filter(a => a.status === 'completed').forEach(att => {
    const meta = getAttemptMetadata(att);
    const score = att.score || 0;

    // Course aggregation
    const cData = courseMap.get(meta.courseCode) || { attempts: 0, totalScore: 0, bestScore: 0 };
    cData.attempts += 1;
    cData.totalScore += score;
    cData.bestScore = Math.max(cData.bestScore, score);
    courseMap.set(meta.courseCode, cData);

    // Topic aggregation
    const tKey = `${meta.courseCode}::${meta.topic}`;
    const tData = topicMap.get(tKey) || { courseCode: meta.courseCode, attempts: 0, totalScore: 0, bestScore: 0 };
    tData.attempts += 1;
    tData.totalScore += score;
    tData.bestScore = Math.max(tData.bestScore, score);
    topicMap.set(tKey, tData);
  });

  const coursePerformance = Array.from(courseMap.entries()).map(([code, data]) => ({
    courseCode: code,
    attempts: data.attempts,
    avgScore: Math.round(data.totalScore / data.attempts),
    bestScore: data.bestScore
  }));

  const topicPerformance = Array.from(topicMap.entries()).map(([key, data]) => {
    const topicName = key.split('::')[1];
    const avg = Math.round(data.totalScore / data.attempts);
    let status: 'Needs Review' | 'Practice Recommended' | 'Good' = 'Good';
    if (avg < 50) status = 'Needs Review';
    else if (avg < 75) status = 'Practice Recommended';
    return {
      topic: topicName,
      courseCode: data.courseCode,
      attempts: data.attempts,
      avgScore: avg,
      bestScore: data.bestScore,
      status
    };
  });

  // Extract unique courses and topics for filters
  const uniqueCourses = Array.from(new Set(attempts.map(a => getAttemptMetadata(a).courseCode))).filter(Boolean);
  const uniqueTopics = Array.from(new Set(attempts.map(a => getAttemptMetadata(a).topic))).filter(Boolean);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <BarChart3 className="text-indigo-400" size={28} /> CBT Performance Analytics & History
          </h2>
          <p className="text-slate-400 text-sm mt-1">Review your undergraduate assessment history, score trajectories, and topic proficiency.</p>
        </div>
        <button
          onClick={onStartNewDrill}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
        >
          <Sparkles size={18} /> Take New Practice Drill
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold">
          <Filter size={16} /> Filters:
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Course:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Courses</option>
            {uniqueCourses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Topic:</label>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Topics</option>
            {uniqueTopics.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Date Range:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Time</option>
            <option value="7days">Past 7 Days</option>
            <option value="30days">Past 30 Days</option>
          </select>
        </div>

        {(selectedCourse !== 'all' || selectedTopic !== 'all' || dateRange !== 'all') && (
          <button
            onClick={() => { setSelectedCourse('all'); setSelectedTopic('all'); setDateRange('all'); }}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold ml-auto underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Attempts</span>
            <History size={18} className="text-blue-400" />
          </div>
          <div className="text-3xl font-display font-bold text-white">{totalAttempts}</div>
          <p className="text-xs text-slate-500 mt-1">Completed CBT sessions</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average Score</span>
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-display font-bold text-emerald-400">{averageScore}%</div>
          <p className="text-xs text-slate-500 mt-1">Across filtered drills</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Best Score</span>
            <Award size={18} className="text-amber-400" />
          </div>
          <div className="text-3xl font-display font-bold text-amber-400">{bestScore}%</div>
          <p className="text-xs text-slate-500 mt-1">Personal highest score</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Recent Score</span>
            <Target size={18} className="text-indigo-400" />
          </div>
          <div className="text-3xl font-display font-bold text-indigo-400">{recentScore}%</div>
          <p className="text-xs text-slate-500 mt-1">Latest session score</p>
        </div>
      </div>

      {/* Answer Accuracy Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Questions Attempted</div>
            <div className="text-2xl font-bold text-white">{totalQuestionsAttempted}</div>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Correct Answers</div>
            <div className="text-2xl font-bold text-emerald-400">{totalCorrectAnswers}</div>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <XCircle size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Wrong Answers</div>
            <div className="text-2xl font-bold text-rose-400">{totalWrongAnswers}</div>
          </div>
        </div>
      </div>

      {/* Performance Breakdowns (Course & Topic) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Course Performance */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="text-indigo-400" size={20} /> Course Performance
          </h3>
          {coursePerformance.length > 0 ? (
            <div className="space-y-3">
              {coursePerformance.map(cp => (
                <div key={cp.courseCode} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white">{cp.courseCode}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{cp.attempts} attempt{cp.attempts !== 1 ? 's' : ''} completed</p>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-indigo-400">{cp.avgScore}% avg</div>
                    <div className="text-xs text-emerald-400">Best: {cp.bestScore}%</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-6 text-center">No course performance data available yet.</p>
          )}
        </div>

        {/* Topic Performance */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Target className="text-indigo-400" size={20} /> Topic Performance
          </h3>
          {topicPerformance.length > 0 ? (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {topicPerformance.map(tp => (
                <div key={`${tp.courseCode}-${tp.topic}`} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">{tp.courseCode}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        tp.status === 'Needs Review' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        tp.status === 'Practice Recommended' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {tp.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm mt-1">{tp.topic}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-white">{tp.avgScore}%</div>
                    <div className="text-xs text-slate-400">{tp.attempts} test{tp.attempts !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-6 text-center">No topic performance data available yet.</p>
          )}
        </div>
      </div>

      {/* Attempt History Table / List */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <History className="text-indigo-400" size={20} /> Attempt History Records
        </h3>

        {filteredAttempts.length > 0 ? (
          <div className="divide-y divide-slate-800 overflow-x-auto">
            {filteredAttempts.map(att => {
              const meta = getAttemptMetadata(att);
              const dateStr = new Date(att.end_time || att.start_time).toLocaleString();
              return (
                <div key={att.id} className="py-4 flex items-center justify-between gap-4 hover:bg-slate-900/50 px-3 rounded-xl transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      (att.score || 0) >= 70 ? 'bg-emerald-500/10 text-emerald-400' :
                      (att.score || 0) >= 50 ? 'bg-amber-500/10 text-amber-400' :
                      'bg-rose-500/10 text-rose-400'
                    }`}>
                      {att.score ?? 0}%
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm md:text-base">
                        {att.cbt_exams?.title || `${meta.courseCode} Practice Drill`}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        <span className="text-indigo-400 font-semibold">{meta.courseCode}</span> • {meta.topic} • {dateStr}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-slate-400">Correct / Wrong</div>
                      <div className="text-sm font-bold text-slate-200">
                        <span className="text-emerald-400">{att.total_correct || 0}</span> / <span className="text-rose-400">{att.total_wrong || 0}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onReviewAttempt(att.id)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      Review <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <History size={40} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400 font-medium">No matching CBT attempt records found.</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or take a new practice drill.</p>
          </div>
        )}
      </div>
    </div>
  );
}
