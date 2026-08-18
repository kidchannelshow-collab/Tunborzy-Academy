import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  GraduationCap, BookOpen, Target, History, TrendingUp, AlertTriangle, 
  CheckCircle2, Flame, Award, BarChart3 
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function AdminUndergraduatePerformance() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeStudents: 0,
    coursesWithActivity: 0,
    totalCourses: 0,
    topicsStudied: 0,
    totalAttempts: 0,
    averagePerformance: 0
  });

  const [courseActivity, setCourseActivity] = useState<any[]>([]);
  const [topicPerformance, setTopicPerformance] = useState<any[]>([]);
  const [failureTopics, setFailureTopics] = useState<any[]>([]);
  const [lowActivityCourses, setLowActivityCourses] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminPerformanceData();
  }, []);

  const fetchAdminPerformanceData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // 1. Fetch profiles (students)
      const { data: studentsRes } = await supabase
        .from('profiles')
        .select('id, role, level')
        .eq('role', 'student');
      
      const students = studentsRes || [];
      const activeStudentsCount = students.length;

      // 2. Fetch courses
      const { data: coursesRes } = await supabase
        .from('courses')
        .select('id, title, course_code');
      
      const courses = coursesRes || [];
      const totalCourses = courses.length;

      // 3. Fetch CBT attempts and questions
      const [attemptsRes, questionsRes] = await Promise.all([
        supabase.from('cbt_attempts').select('*, cbt_exams(id, title, course_code, topic)').eq('status', 'completed'),
        supabase.from('cbt_questions').select('id, course_code, topic')
      ]);

      const attempts = attemptsRes.data || [];
      const questions = questionsRes.data || [];

      // Question metadata map
      const qMap = new Map<string, { course_code?: string, topic?: string }>();
      questions.forEach((q: any) => {
        qMap.set(q.id, { course_code: q.course_code, topic: q.topic });
      });

      // Helper to extract course code and topic for an attempt
      const getMeta = (att: any) => {
        let code = att.cbt_exams?.course_code;
        let topic = att.cbt_exams?.topic;
        if ((!code || !topic) && att.answers?.question_ids) {
          for (const qId of att.answers.question_ids) {
            const qMeta = qMap.get(qId);
            if (qMeta) {
              if (!code && qMeta.course_code) code = qMeta.course_code;
              if (!topic && qMeta.topic) topic = qMeta.topic;
            }
          }
        }
        return {
          courseCode: code || 'General',
          topic: topic || 'General Practice'
        };
      };

      // Aggregations
      let totalScoreSum = 0;
      const totalAttempts = attempts.length;
      if (totalAttempts > 0) {
        attempts.forEach(a => { totalScoreSum += (a.score || 0); });
      }
      const averagePerformance = totalAttempts > 0 ? Math.round(totalScoreSum / totalAttempts) : 0;

      // Course Activity Map
      const courseMap = new Map<string, { title: string, attempts: number, scores: number[] }>();
      courses.forEach(c => {
        const key = c.course_code || c.title;
        courseMap.set(key, { title: c.title, attempts: 0, scores: [] });
      });

      // Topic Performance Map
      const topicMap = new Map<string, { courseCode: string, scores: number[], attempts: number }>();

      const activeCoursesSet = new Set<string>();
      const topicsSet = new Set<string>();

      attempts.forEach(att => {
        const meta = getMeta(att);
        activeCoursesSet.add(meta.courseCode);
        topicsSet.add(meta.topic);

        const score = att.score || 0;

        // Course aggregation
        if (!courseMap.has(meta.courseCode)) {
          courseMap.set(meta.courseCode, { title: meta.courseCode, attempts: 0, scores: [] });
        }
        const cData = courseMap.get(meta.courseCode)!;
        cData.attempts += 1;
        cData.scores.push(score);

        // Topic aggregation
        const tKey = `${meta.courseCode}::${meta.topic}`;
        if (!topicMap.has(tKey)) {
          topicMap.set(tKey, { courseCode: meta.courseCode, scores: [], attempts: 0 });
        }
        const tData = topicMap.get(tKey)!;
        tData.scores.push(score);
        tData.attempts += 1;
      });

      const coursesWithActivityCount = activeCoursesSet.size;
      const topicsStudiedCount = topicsSet.size;

      // Format course activity list (high vs low activity)
      const courseList = Array.from(courseMap.entries()).map(([code, data]) => ({
        courseCode: code,
        title: data.title,
        attempts: data.attempts,
        avgScore: data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0
      })).sort((a, b) => b.attempts - a.attempts);

      const highActivity = courseList.slice(0, 5);
      const lowActivity = [...courseList].reverse().filter(c => c.attempts <= 2).slice(0, 5);

      // Format topic performance & high failure rates
      const topicList = Array.from(topicMap.entries()).map(([key, data]) => {
        const topicName = key.split('::')[1];
        const avg = data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0;
        return {
          topic: topicName,
          courseCode: data.courseCode,
          avgScore: avg,
          attempts: data.attempts,
          failureRate: 100 - avg
        };
      });

      const sortedTopics = [...topicList].sort((a, b) => b.failureRate - a.failureRate);
      const highFailureTopics = sortedTopics.filter(t => t.avgScore < 60);

      setStats({
        activeStudents: activeStudentsCount,
        coursesWithActivity: coursesWithActivityCount,
        totalCourses,
        topicsStudied: topicsStudiedCount,
        totalAttempts,
        averagePerformance
      });

      setCourseActivity(courseList);
      setTopicPerformance(topicList);
      setFailureTopics(highFailureTopics);
      setLowActivityCourses(lowActivity);

    } catch (err) {
      console.error('Error fetching admin performance metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <GraduationCap className="text-indigo-400" size={32} /> Undergraduate Academic Performance Overview
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time administrative analytics across undergraduate courses, CBT attempts, and topic mastery.</p>
        </div>
        <button
          onClick={fetchAdminPerformanceData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 self-start md:self-auto"
        >
          Refresh Analytics
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Students</span>
            <GraduationCap size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-display font-bold text-white">{stats.activeStudents}</div>
          <p className="text-[11px] text-slate-500 mt-1">Registered learners</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Courses Active</span>
            <BookOpen size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-display font-bold text-emerald-400">{stats.coursesWithActivity} <span className="text-xs text-slate-500 font-normal">/ {stats.totalCourses}</span></div>
          <p className="text-[11px] text-slate-500 mt-1">With CBT drills</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Topics Studied</span>
            <Target size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-display font-bold text-amber-400">{stats.topicsStudied}</div>
          <p className="text-[11px] text-slate-500 mt-1">Unique curriculum topics</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">CBT Attempts</span>
            <History size={16} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-display font-bold text-white">{stats.totalAttempts}</div>
          <p className="text-[11px] text-slate-500 mt-1">Completed test sessions</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Performance</span>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-display font-bold text-emerald-400">{stats.averagePerformance}%</div>
          <p className="text-[11px] text-slate-500 mt-1">Platform-wide average</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">At-Risk Topics</span>
            <AlertTriangle size={16} className="text-rose-400" />
          </div>
          <div className="text-2xl font-display font-bold text-rose-400">{failureTopics.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">High failure rate (&lt;60%)</p>
        </div>
      </div>

      {/* Main Grid: High Failure Topics & Course Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Topics with High Failure Rates */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-rose-400" size={20} /> Topics with High Failure Rates (&lt;60% Avg)
          </h3>
          <p className="text-xs text-slate-400">Curriculum topics where students are experiencing academic difficulty.</p>

          {failureTopics.length > 0 ? (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {failureTopics.map(ft => (
                <div key={`${ft.courseCode}-${ft.topic}`} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {ft.courseCode}
                      </span>
                      <span className="text-xs text-slate-400">{ft.attempts} test attempt{ft.attempts !== 1 ? 's' : ''}</span>
                    </div>
                    <h4 className="font-bold text-white text-sm mt-1">{ft.topic}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-rose-400">{ft.avgScore}% avg</div>
                    <div className="text-[11px] text-slate-500">{ft.failureRate}% failure impact</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <CheckCircle2 size={36} className="mx-auto text-emerald-400 mb-2" />
              <p className="text-slate-300 font-medium">No critical failure topics detected!</p>
              <p className="text-xs text-slate-500 mt-1">All studied topics maintain satisfactory average scores.</p>
            </div>
          )}
        </div>

        {/* Courses with High Activity */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="text-amber-400" size={20} /> Courses with High Activity
          </h3>
          <p className="text-xs text-slate-400">Undergraduate courses with the highest student engagement and test attempts.</p>

          {courseActivity.length > 0 ? (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {courseActivity.slice(0, 5).map(ca => (
                <div key={ca.courseCode} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      {ca.courseCode}
                    </span>
                    <h4 className="font-bold text-white text-sm mt-1">{ca.title}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-amber-400">{ca.attempts} attempts</div>
                    <div className="text-xs text-emerald-400">{ca.avgScore}% avg score</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-6 text-center">No course activity recorded yet.</p>
          )}
        </div>
      </div>

      {/* Courses with Low Activity & Complete Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Activity Courses */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-indigo-400" size={20} /> Courses with Low Activity
          </h3>
          <p className="text-xs text-slate-400">Courses requiring promotional engagement or additional CBT drill material.</p>

          {lowActivityCourses.length > 0 ? (
            <div className="space-y-3">
              {lowActivityCourses.map(lac => (
                <div key={lac.courseCode} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {lac.courseCode}
                    </span>
                    <h4 className="font-bold text-white text-sm mt-1">{lac.title}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-400">{lac.attempts} attempt{lac.attempts !== 1 ? 's' : ''}</div>
                    <div className="text-[11px] text-amber-400">Needs Attention</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <p className="text-sm text-slate-400">All active courses have healthy engagement levels.</p>
            </div>
          )}
        </div>

        {/* All Topic Performance Summary */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="text-emerald-400" size={20} /> Platform Topic Mastery Summary
          </h3>
          <p className="text-xs text-slate-400">Aggregated student scores across all studied topics.</p>

          {topicPerformance.length > 0 ? (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {topicPerformance.map(tp => (
                <div key={`${tp.courseCode}-${tp.topic}`} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                        {tp.courseCode}
                      </span>
                      <span className="text-xs text-slate-400">{tp.attempts} attempts</span>
                    </div>
                    <h4 className="font-bold text-white text-sm mt-1">{tp.topic}</h4>
                  </div>
                  <div className="text-right">
                    <div className={`text-base font-bold ${tp.avgScore >= 70 ? 'text-emerald-400' : tp.avgScore >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {tp.avgScore}%
                    </div>
                    <div className="text-[11px] text-slate-500">Average score</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-6 text-center">No topic performance records found.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
