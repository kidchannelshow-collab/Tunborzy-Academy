import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Plus, CheckCircle2, Trash2, Edit2, Users, FileText, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useProfile } from '../../lib/useProfile';

export default function AssignmentManagement() {
  const { profile } = useProfile();
  
  // Data State
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [showModal, setShowModal] = useState(false);
  const [expandedAssignments, setExpandedAssignments] = useState<Record<string, boolean>>({});
  
  // Form State
  const [editingId, setEditingId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [totalMarks, setTotalMarks] = useState(100);
  const [deadline, setDeadline] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    if (profile) fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!supabase || !profile) return;
    setLoading(true);
    try {
      const [coursesRes, assignmentsRes, submissionsRes] = await Promise.all([
        supabase.from('courses').select('id, title, course_code').eq('lecturer_id', profile.id),
        supabase.from('assignments').select('*, courses(title, course_code)').eq('lecturer_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('assignment_submissions').select('*, profiles(full_name, id), assignments!inner(lecturer_id)').eq('assignments.lecturer_id', profile.id)
      ]);
      
      setCourses(coursesRes.data || []);
      if (coursesRes.data && coursesRes.data.length > 0 && !courseId) {
        setCourseId(coursesRes.data[0].id);
      }
      
      setAssignments(assignmentsRes.data || []);
      setSubmissions(submissionsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !profile) return;
    
    const payload = {
      lecturer_id: profile.id,
      course_id: courseId,
      title,
      description,
      total_marks: totalMarks,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      file_url: fileUrl,
      is_published: true
    };

    try {
      if (editingId) {
        await supabase.from('assignments').update(payload).eq('id', editingId);
      } else {
        await supabase.from('assignments').insert(payload);
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTotalMarks(100);
    setDeadline('');
    setFileUrl('');
    setEditingId('');
    if (courses.length > 0) setCourseId(courses[0].id);
  };

  const openEdit = (assignment: any) => {
    setTitle(assignment.title);
    setDescription(assignment.description || '');
    setCourseId(assignment.course_id);
    setTotalMarks(assignment.total_marks || 100);
    
    if (assignment.deadline) {
      // Format for datetime-local input
      const d = new Date(assignment.deadline);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setDeadline(d.toISOString().slice(0, 16));
    } else {
      setDeadline('');
    }
    
    setFileUrl(assignment.file_url || '');
    setEditingId(assignment.id);
    setShowModal(true);
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment and ALL its submissions?')) return;
    if (!supabase) return;
    try {
      await supabase.from('assignments').delete().eq('id', id);
      setAssignments(assignments.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedAssignments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const gradeSubmission = async (subId: string, score: number, feedback: string) => {
    if (!supabase) return;
    try {
      await supabase.from('assignment_submissions').update({ 
        score, 
        feedback, 
        graded_at: new Date().toISOString() 
      }).eq('id', subId);
      
      // Update local state
      setSubmissions(submissions.map(s => s.id === subId ? { ...s, score, feedback, graded_at: new Date().toISOString() } : s));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto pb-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Assignment Management</h1>
          <p className="text-slate-400">Create assignments, set deadlines, and grade student submissions.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-action font-bold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Create Assignment
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading assignments...</div>
      ) : courses.length === 0 ? (
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-12 text-center">
          <p className="text-slate-400">You need to create a course first before assigning work.</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-[#0f172a] border border-slate-800 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
            <Book size={24} className="text-slate-500" />
          </div>
          <h3 className="text-xl font-display font-bold text-white mb-2">No assignments created</h3>
          <p className="text-slate-400 max-w-md">Create your first assignment to evaluate your students.</p>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="mt-6 text-amber-500 font-bold hover:underline">Create Assignment</button>
        </div>
      ) : (
        <div className="space-y-6">
          {assignments.map(assignment => {
            const assignmentSubmissions = submissions.filter(s => s.assignment_id === assignment.id);
            const gradedCount = assignmentSubmissions.filter(s => s.graded_at).length;
            const isExpanded = expandedAssignments[assignment.id];
            const deadlineDate = assignment.deadline ? new Date(assignment.deadline) : null;
            const isPastDeadline = deadlineDate ? deadlineDate < new Date() : false;
            
            return (
              <div key={assignment.id} className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div 
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/50 transition-colors"
                  onClick={() => toggleExpand(assignment.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <button className="text-slate-500 hover:text-white">
                      {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {assignment.courses?.course_code || 'Course'}
                        </span>
                        {isPastDeadline && <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">Closed</span>}
                      </div>
                      <h3 className="text-lg font-bold text-white leading-tight">{assignment.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                        {deadlineDate && (
                          <span className={`flex items-center gap-1 ${isPastDeadline ? 'text-rose-400' : 'text-amber-500'}`}>
                            <Calendar size={14} /> Due: {deadlineDate.toLocaleString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1"><Users size={14} /> {assignmentSubmissions.length} Submissions</span>
                        <span className="flex items-center gap-1"><CheckCircle2 size={14} /> {gradedCount} Graded</span>
                        <span className="flex items-center gap-1 text-slate-500">Max Score: {assignment.total_marks}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pl-12 md:pl-0">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(assignment); }} className="p-2 text-slate-400 hover:text-amber-500 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteAssignment(assignment.id); }} className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-800 bg-slate-900/30"
                    >
                      <div className="p-6">
                        {assignment.description && (
                          <div className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
                            <h4 className="text-sm font-bold text-slate-300 mb-2">Instructions</h4>
                            <p className="text-sm text-slate-400 whitespace-pre-wrap">{assignment.description}</p>
                            {assignment.file_url && (
                              <a href={assignment.file_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-amber-500 hover:underline">
                                <FileText size={16} /> Attached Resource
                              </a>
                            )}
                          </div>
                        )}
                        
                        <h4 className="text-sm font-bold text-slate-300 mb-4">Student Submissions</h4>
                        
                        {assignmentSubmissions.length === 0 ? (
                          <div className="text-center p-8 border-2 border-dashed border-slate-800 rounded-xl">
                            <p className="text-slate-500">No submissions yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {assignmentSubmissions.map(sub => (
                              <SubmissionRow key={sub.id} submission={sub} maxScore={assignment.total_marks} onGrade={(score, feedback) => gradeSubmission(sub.id, score, feedback)} />
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Assignment Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
              <div className="p-6 border-b border-slate-800"><h2 className="text-xl font-bold text-white">{editingId ? 'Edit Assignment' : 'Create Assignment'}</h2></div>
              
              <form onSubmit={saveAssignment} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-sm font-bold text-slate-300">Assignment Title *</label>
                    <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 mt-1 text-white focus:border-amber-500 outline-none" placeholder="e.g. Essay on Quantum Mechanics" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-bold text-slate-300">Course *</label>
                    <select required value={courseId} onChange={e => setCourseId(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 mt-1 text-white focus:border-amber-500 outline-none">
                      {courses.map(c => <option key={c.id} value={c.id}>{c.course_code ? `${c.course_code} - ` : ''}{c.title}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-bold text-slate-300">Total Marks *</label>
                    <input required type="number" min="1" value={totalMarks} onChange={e => setTotalMarks(parseInt(e.target.value) || 100)} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 mt-1 text-white focus:border-amber-500 outline-none" />
                  </div>
                  
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-sm font-bold text-slate-300">Deadline (Optional)</label>
                    <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 mt-1 text-white focus:border-amber-500 outline-none" />
                  </div>
                  
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-sm font-bold text-slate-300">Attachment URL (Optional)</label>
                    <input type="url" value={fileUrl} onChange={e => setFileUrl(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 mt-1 text-white focus:border-amber-500 outline-none" placeholder="Link to PDF, Worksheet, etc." />
                  </div>
                  
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-sm font-bold text-slate-300">Instructions *</label>
                    <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full h-32 bg-[#020617] border border-slate-800 rounded-xl p-4 mt-1 text-white focus:border-amber-500 outline-none resize-none" placeholder="Provide detailed instructions..."></textarea>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-slate-400 hover:text-white font-bold rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="px-8 py-3 bg-amber-500 text-slate-950 rounded-xl font-bold hover:bg-amber-400 transition-colors">Save Assignment</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Sub-component for Grade Form
function SubmissionRow({ submission, maxScore, onGrade }: { submission: any, maxScore: number, onGrade: (score: number, feedback: string) => void }) {
  const [isGrading, setIsGrading] = useState(false);
  const [score, setScore] = useState(submission.score || 0);
  const [feedback, setFeedback] = useState(submission.feedback || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onGrade(score, feedback);
    setIsGrading(false);
  };

  return (
    <div className="bg-[#020617] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold font-display uppercase">
            {submission.profiles?.full_name?.charAt(0) || 'S'}
          </div>
          <div>
            <p className="font-bold text-white text-sm">{submission.profiles?.full_name || 'Unknown Student'}</p>
            <p className="text-xs text-slate-500">{new Date(submission.submitted_at).toLocaleString()}</p>
          </div>
        </div>
        
        {submission.submission_text && (
          <p className="text-sm text-slate-300 mt-2 bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">{submission.submission_text}</p>
        )}
        
        {submission.file_url && (
          <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 hover:underline">
            <FileText size={14} /> View Attached File
          </a>
        )}
      </div>
      
      <div className="w-full md:w-64 shrink-0 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-4">
        {isGrading ? (
          <form onSubmit={handleSave} className="space-y-3">
            <div className="flex items-center gap-2">
              <input type="number" min="0" max={maxScore} value={score} onChange={e => setScore(parseInt(e.target.value) || 0)} className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-center font-mono focus:border-amber-500 outline-none" />
              <span className="text-slate-500 text-sm">/ {maxScore}</span>
            </div>
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Feedback..." className="w-full h-16 bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs resize-none focus:border-amber-500 outline-none"></textarea>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsGrading(false)} className="flex-1 py-1 bg-slate-800 text-slate-400 text-xs font-bold rounded">Cancel</button>
              <button type="submit" className="flex-1 py-1 bg-amber-500 text-slate-950 text-xs font-bold rounded">Save</button>
            </div>
          </form>
        ) : (
          <div className="text-center">
            {submission.graded_at ? (
              <>
                <div className="text-2xl font-bold font-mono text-emerald-500 mb-1">{submission.score} <span className="text-sm text-slate-500">/ {maxScore}</span></div>
                {submission.feedback && <p className="text-xs text-slate-400 italic line-clamp-2 mb-3">"{submission.feedback}"</p>}
                <button onClick={() => setIsGrading(true)} className="text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center gap-1 w-full mx-auto">
                  <Edit2 size={12} /> Edit Grade
                </button>
              </>
            ) : (
              <button onClick={() => setIsGrading(true)} className="w-full py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-bold text-sm rounded-lg border border-emerald-500/20 transition-colors">
                Grade Submission
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
