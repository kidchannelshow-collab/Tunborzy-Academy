const fs = require('fs');

let content = fs.readFileSync('src/components/AnnouncementCenter.tsx', 'utf8');

const target = `    await supabase.from('announcements').insert({
      title: formTitle,
      content: formDesc,
      target_role: targetRole,
      created_by: profile.id
    });`;

const replacement = `    await supabase.from('announcements').insert({
      title: formTitle,
      content: formDesc,
      target_role: targetRole,
      created_by: profile.id
    });
    
    // Also broadcast a notification
    if (targetRole === 'Everyone') {
      await notificationService.notifyRole('Student', formTitle, formDesc, 'announcement', '/announcements');
      await notificationService.notifyRole('Lecturer', formTitle, formDesc, 'announcement', '/announcements');
    } else {
      await notificationService.notifyRole(targetRole, formTitle, formDesc, 'announcement', '/announcements');
    }`;

content = content.replace(target, replacement);

if (!content.includes("import { notificationService }")) {
  content = content.replace("import { supabase } from '../supabaseClient';", "import { supabase } from '../supabaseClient';\nimport { notificationService } from '../lib/notificationService';");
}

fs.writeFileSync('src/components/AnnouncementCenter.tsx', content);
console.log('AnnouncementCenter patched with notification hook.');
