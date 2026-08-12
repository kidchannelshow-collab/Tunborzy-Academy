import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, LayoutTemplate, Plus } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface CourseTemplatesModalProps {
  onClose: () => void;
  onSuccess: () => void;
  // If a course object is passed, we are saving it as a template
  // If null, we are instantiating a new course from an existing template
  courseToSave?: any; 
}

export default function CourseTemplatesModal({ onClose, onSuccess, courseToSave }: CourseTemplatesModalProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Save mode state
  const [templateName, setTemplateName] = useState('');
  
  // Instantiate mode state
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [newCourseForm, setNewCourseForm] = useState({ course_code: '', title: '', portal: 'Undergraduate', semester: 'First Semester', level: '100 Level' });

  useEffect(() => {
    if (!courseToSave) {
      fetchTemplates();
    } else {
      setTemplateName(courseToSave.title + ' Template');
      setIsLoading(false);
    }
  }, [courseToSave]);

  const fetchTemplates = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('course_templates').select('*').order('created_at', { ascending: false });
      if (data) setTemplates(data);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !courseToSave) return;
    setIsSaving(true);
    try {
      // Fetch all materials for this course
      const { data: mats } = await supabase.from('materials').select('*').eq('course_code', courseToSave.course_code);
      
      const structure = {
        course: { ...courseToSave, id: undefined, created_at: undefined, updated_at: undefined, lecturer_id: undefined },
        materials: (mats || []).map(m => {
          let desc = m.description;
          try {
             let parsed = JSON.parse(desc || '{}');
             if (parsed.publishSettings) {
                parsed.publishSettings.auditLogs = [];
                parsed.publishSettings.status = 'Draft';
             }
             desc = JSON.stringify(parsed);
          } catch(err) {}
          
          return {
            ...m,
            id: undefined,
            created_at: undefined,
            updated_at: undefined,
            course_code: undefined,
            lecturer_id: undefined,
            lecturer_name: undefined,
            is_published: false,
            description: desc
          };
        })
      };

      await supabase.from('course_templates').insert([{
        title: templateName,
        structure: JSON.stringify(structure)
      }]);
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Failed to save template');
    }
    setIsSaving(false);
  };

  const handleInstantiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !selectedTemplate) return;
    setIsSaving(true);
    try {
      const struct = typeof selectedTemplate.structure === 'string' ? JSON.parse(selectedTemplate.structure) : selectedTemplate.structure;
      
      const newCourseCode = newCourseForm.course_code.trim();
      
      // 1. Create Course
      const newCourse = {
        ...struct.course,
        course_code: newCourseCode,
        title: newCourseForm.title,
        portal: newCourseForm.portal,
        semester: newCourseForm.semester,
        level: newCourseForm.level,
        status: 'Draft',
        visibility: 'Private'
      };
      await supabase.from('courses').insert([newCourse]);

      // 2. Create Materials
      if (struct.materials && struct.materials.length > 0) {
        const newMats = struct.materials.map((m: any) => ({
          ...m,
          course_code: newCourseCode
        }));
        await supabase.from('materials').insert(newMats);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Failed to instantiate template');
    }
    setIsSaving(false);
  };

  const isSaveMode = !!courseToSave;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <LayoutTemplate size={20} />
            </div>
            <h3 className="text-xl font-bold text-white">
              {isSaveMode ? 'Save as Template' : 'Create from Template'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
          {isLoading ? (
            <div className="text-center py-10 text-slate-400">Loading templates...</div>
          ) : isSaveMode ? (
            <form id="template-form" onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-sm font-poppins text-slate-400 mb-2">Template Name</label>
                <input type="text" required value={templateName} onChange={e => setTemplateName(e.target.value)} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-indigo-500 outline-none" />
              </div>
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <p className="text-sm text-indigo-300">
                  This will save the current structure of <strong>{courseToSave.course_code}</strong> including all topics and {courseToSave.title} lessons. Student progress, analytics, and publication status will not be saved.
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {!selectedTemplate ? (
                <>
                  {templates.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 border border-slate-800 border-dashed rounded-xl bg-[#020617]/50">
                      No templates available. You can save an existing course as a template first.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {templates.map(t => (
                        <div key={t.id} onClick={() => setSelectedTemplate(t)} className="p-4 bg-[#020617] border border-slate-700 hover:border-indigo-500 rounded-xl cursor-pointer transition-colors group">
                          <h4 className="text-white font-bold mb-1 group-hover:text-indigo-400 transition-colors">{t.title}</h4>
                          <p className="text-xs text-slate-400">Created: {new Date(t.created_at).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <form id="template-form" onSubmit={handleInstantiate} className="space-y-4">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Selected Template</p>
                      <h4 className="text-indigo-400 font-bold">{selectedTemplate.title}</h4>
                    </div>
                    <button type="button" onClick={() => setSelectedTemplate(null)} className="text-sm text-slate-400 hover:text-white underline">Change</button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-poppins text-slate-400 mb-2">New Course Code *</label>
                      <input type="text" required value={newCourseForm.course_code} onChange={e => setNewCourseForm({...newCourseForm, course_code: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-indigo-500 outline-none" placeholder="e.g. PHY101" />
                    </div>
                    <div>
                      <label className="block text-sm font-poppins text-slate-400 mb-2">New Course Title *</label>
                      <input type="text" required value={newCourseForm.title} onChange={e => setNewCourseForm({...newCourseForm, title: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-indigo-500 outline-none" placeholder="e.g. Basic Physics" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-poppins text-slate-400 mb-2">Portal</label>
                      <select value={newCourseForm.portal} onChange={e => setNewCourseForm({...newCourseForm, portal: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-3 outline-none">
                        <option>Undergraduate</option>
                        <option>UTME</option>
                        <option>Post-UTME</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-poppins text-slate-400 mb-2">Semester</label>
                      <select value={newCourseForm.semester} onChange={e => setNewCourseForm({...newCourseForm, semester: e.target.value})} className="w-full bg-[#020617] border border-slate-700 text-white rounded-xl px-4 py-3 outline-none">
                        <option>First Semester</option>
                        <option>Second Semester</option>
                      </select>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="pt-6 shrink-0 flex gap-3 border-t border-slate-800 mt-4">
          <button type="button" onClick={onClose} disabled={isSaving} className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
          {isSaveMode || selectedTemplate ? (
            <button form="template-form" type="submit" disabled={isSaving} className="flex-1 py-3 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-colors flex items-center justify-center gap-2">
              {isSaving ? 'Processing...' : isSaveMode ? 'Save Template' : 'Create Course'}
            </button>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
