const fs = require('fs');

let content = fs.readFileSync('src/components/AnnouncementCenter.tsx', 'utf8');

// First, fix the fetch to use user_id instead of target_role for notifications
content = content.replace(
  `const { data: notifData } = await supabase.from('notifications')
          .select('*')
          .eq('target_role', profile.role)
          .order('created_at', { ascending: false });`,
  `const { data: notifData } = await supabase.from('notifications')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });`
);

// We should also add realtime subscription for notifications in AnnouncementCenter
const targetEffect = `    fetchAll();
  }, [profile?.id, profile?.role]);`;
  
const replacementEffect = `    fetchAll();
    
    const channel = supabase.channel('announcement_notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: \`user_id=eq.\${profile.id}\`
      }, (payload) => {
        fetchAll();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.role]);`;

content = content.replace(targetEffect, replacementEffect);

fs.writeFileSync('src/components/AnnouncementCenter.tsx', content);
console.log('AnnouncementCenter patched with correct notifications fetch and realtime.');
