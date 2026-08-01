const fs = require('fs');
let code = fs.readFileSync('src/components/CourseChatSystem.tsx', 'utf8');

const handleCreateChat = `
  const handleCreateChat = async (e: React.FormEvent) => {
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
        online: false
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
`;

code = code.replace("const sidebarNode = (", handleCreateChat + "\n\n  const sidebarNode = (");

fs.writeFileSync('src/components/CourseChatSystem.tsx', code);
