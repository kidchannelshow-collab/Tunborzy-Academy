const fs = require('fs');
let code = fs.readFileSync('src/components/CourseChatSystem.tsx', 'utf8');

const handleCreateChat = `  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatForm.name || !newChatForm.courseCode) {
      showToast("Please fill in the required fields");
      return;
    }
    
    setIsSubmittingChat(true);
    try {
      const { data, error } = await supabase.from('chats').insert([{
        name: newChatForm.name,
        course_code: newChatForm.courseCode,
        description: newChatForm.description,
        lecturer_id: newChatForm.lecturerId || null,
        student_ids: newChatForm.studentIds,
        created_at: new Date().toISOString()
      }]).select('*').single();

      if (error) throw error;
      
      const newChatObj = {
        id: data.id,
        name: data.name,
        code: data.course_code,
        semester: 'General',
        lastMessage: 'Tap to view chat',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: 0,
        online: false,
        is_custom_chat: true
      };
      
      setDynamicChats(prev => [newChatObj, ...prev]);
      
      showToast("Chat created successfully");
      setShowCreateChatModal(false);
      setNewChatForm({ name: '', courseCode: '', description: '', lecturerId: '', studentIds: [] });
      
    } catch (error: any) {
      console.error("Error creating chat", error);
      showToast(error.message || "Failed to create chat");
    } finally {
      setIsSubmittingChat(false);
    }
  };

  const sidebarNode = (`;

const modalUI = `      <AnimatePresence>
        {showCreateChatModal && (
          <div className="fixed inset-0 z-50 flex justify-center items-center px-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateChatModal(false)}></div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-slate-800 bg-[#1e293b] flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus size={20} className="text-emerald-500" />
                  Create Course Chat
                </h2>
                <button onClick={() => setShowCreateChatModal(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateChat} className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Chat Name *</label>
                  <input
                    type="text"
                    required
                    value={newChatForm.name}
                    onChange={e => setNewChatForm({...newChatForm, name: e.target.value})}
                    className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g., Study Group A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Course *</label>
                  <select
                    required
                    value={newChatForm.courseCode}
                    onChange={e => setNewChatForm({...newChatForm, courseCode: e.target.value})}
                    className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select a course</option>
                    {modalCourses.map(c => (
                      <option key={c.id} value={c.course_code}>{c.course_code} - {c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                  <textarea
                    value={newChatForm.description}
                    onChange={e => setNewChatForm({...newChatForm, description: e.target.value})}
                    className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 min-h-[80px]"
                    placeholder="Chat description..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Lecturer</label>
                  <select
                    value={newChatForm.lecturerId}
                    onChange={e => setNewChatForm({...newChatForm, lecturerId: e.target.value})}
                    className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">None</option>
                    {modalLecturers.map(l => (
                      <option key={l.id} value={l.id}>{l.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Students (Hold Ctrl/Cmd to select multiple)</label>
                  <select
                    multiple
                    value={newChatForm.studentIds}
                    onChange={e => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setNewChatForm({...newChatForm, studentIds: values});
                    }}
                    className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 min-h-[120px]"
                  >
                    {modalStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name} ({s.student_id || 'No ID'})</option>
                    ))}
                  </select>
                </div>
                
                <div className="pt-4 mt-2 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateChatModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingChat}
                    className="px-6 py-2 rounded-xl bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmittingChat ? (
                      <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Create Chat"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSavedMessages && (`;

if (!code.includes("handleCreateChat = async")) {
   code = code.replace("  const sidebarNode = (", handleCreateChat);
}

if (!code.includes("showCreateChatModal && (")) {
   code = code.replace("      <AnimatePresence>\n        {showSavedMessages && (", modalUI);
}

const emptyStateAndPlus = `      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#020617]">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
            <MessageSquare size={48} className="mb-4 text-slate-600" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No chats yet</h3>
            <p className="text-sm">Create your first course chat</p>
          </div>
        ) : (
          filteredChats.map((chat) => (`

if (!code.includes("No chats yet")) {
    code = code.replace('      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#020617]">\n        {filteredChats.map((chat) => (', emptyStateAndPlus);
    code = code.replace('          </button>\n        ))}\n      </div>', '          </button>\n        ))\n        )}\n      </div>\n      {profile?.role === \'Admin\' && (\n        <button\n          onClick={() => setShowCreateChatModal(true)}\n          className="absolute bottom-6 right-6 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-colors z-10"\n        >\n          <Plus size={24} className="text-white" />\n        </button>\n      )}');
}

const nameLine = '                <h3 className="font-semibold text-slate-200 truncate pr-2">{chat.name}</h3>';
const newNameLine = `                <div className="flex items-center gap-2 truncate pr-2">
                  <h3 className="font-semibold text-slate-200 truncate">{chat.name}</h3>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex-shrink-0 border border-emerald-500/20">{chat.code}</span>
                </div>`;

if (code.includes(nameLine)) {
    code = code.replace(nameLine, newNameLine);
}

fs.writeFileSync('src/components/CourseChatSystem.tsx', code);
console.log("Done patches ui");
