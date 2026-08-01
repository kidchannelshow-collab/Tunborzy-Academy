const fs = require('fs');
let code = fs.readFileSync('src/components/CourseChatSystem.tsx', 'utf8');

const fetchLogic = `        let customChatsQuery = supabase.from('chats').select('*');
        if (profile.role === 'Student') {
           customChatsQuery = customChatsQuery.contains('student_ids', [profile.id]);
        } else if (profile.role === 'Lecturer') {
           customChatsQuery = customChatsQuery.eq('lecturer_id', profile.id);
        }
        
        const [roomsRes, customChatsRes] = await Promise.all([
           roomsQuery, 
           customChatsQuery.catch(() => ({ data: [] }))
        ]);
        
        const rooms = roomsRes.data || [];
        const customChats = customChatsRes.data || [];
        
        const allMapped = [];
        
        if (rooms.length > 0) {
           const mapped = await Promise.all(rooms.map(async r => {
              let lastMsgText = 'Tap to view chat';
              let lastMsgTime = new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              const { data: lastMsgData } = await supabase
                .from('chat_messages')
                .select('message_text, created_at, file_type')
                .eq('room_id', r.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
                
              if (lastMsgData) {
                 if (lastMsgData.file_type && lastMsgData.file_type !== 'text') {
                    lastMsgText = \`Sent a \${lastMsgData.file_type}\`;
                 } else {
                    lastMsgText = lastMsgData.message_text || lastMsgText;
                 }
                 lastMsgTime = new Date(lastMsgData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }
              return {
                id: r.id,
                name: r.course_title || \`\${r.course_code} Chat\`,
                code: r.course_code,
                semester: r.portal || 'General',
                lastMessage: lastMsgText,
                time: lastMsgTime,
                unread: 0,
                online: false,
                is_custom_chat: false
              };
           }));
           allMapped.push(...mapped);
        }
        
        if (customChats.length > 0) {
           const mappedCustom = customChats.map(c => ({
              id: c.id,
              name: c.name,
              code: c.course_code,
              semester: 'General',
              lastMessage: 'Tap to view chat',
              time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              unread: 0,
              online: false,
              is_custom_chat: true
           }));
           allMapped.push(...mappedCustom);
        }
        
        setDynamicChats(allMapped);
`;

const toReplace = `        const { data: rooms } = await roomsQuery;
        
        if (rooms) {
           const mapped = await Promise.all(rooms.map(async r => {
              let lastMsgText = 'Tap to view chat';
              let lastMsgTime = new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              // Fetch last message
              const { data: lastMsgData } = await supabase
                .from('chat_messages')
                .select('message_text, created_at, file_type')
                .eq('room_id', r.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
                
              if (lastMsgData) {
                 if (lastMsgData.file_type && lastMsgData.file_type !== 'text') {
                    lastMsgText = \`Sent a \${lastMsgData.file_type}\`;
                 } else {
                    lastMsgText = lastMsgData.message_text || lastMsgText;
                 }
                 lastMsgTime = new Date(lastMsgData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }
              return {
                id: r.id,
                name: r.course_title || \`\${r.course_code} Chat\`,
                code: r.course_code,
                semester: r.portal || 'General',
                lastMessage: lastMsgText,
                time: lastMsgTime,
                unread: 0, // Unread counts would require message_reads table sync
                online: false
              };
           }));
           setDynamicChats(mapped);
        } else {
           setDynamicChats([]);
        }
`;

code = code.replace(toReplace.trim(), fetchLogic.trim());
fs.writeFileSync('src/components/CourseChatSystem.tsx', code);
