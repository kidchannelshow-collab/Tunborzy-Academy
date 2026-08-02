const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/TopBar.tsx', 'utf8');

content = content.replace(
  `.eq('target_role', profile.role)`,
  `.eq('user_id', profile.id)`
);

// Add realtime subscription for topbar
const target = `    fetchUnread();
  }, [profile?.id, profile?.role]);`;

const replacement = `    fetchUnread();
    
    // Subscribe to realtime updates for notifications
    const channel = supabase.channel('topbar_notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: \`user_id=eq.\${profile.id}\`
      }, (payload) => {
        // Re-fetch unread count on any change
        fetchUnread();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.role]);`;

if (!content.includes('supabase.channel')) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/dashboard/TopBar.tsx', content);
  console.log('TopBar patched with realtime notifications.');
}
