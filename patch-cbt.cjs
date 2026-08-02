const fs = require('fs');
let content = fs.readFileSync('src/components/lecturer/CBTManagement.tsx', 'utf8');

const target = `      if (editingId) {
        await supabase.from('cbt_exams').update(payload).eq('id', editingId);
      } else {
        await supabase.from('cbt_exams').insert(payload);
      }`;

const replacement = `      if (editingId) {
        await supabase.from('cbt_exams').update(payload).eq('id', editingId);
      } else {
        await supabase.from('cbt_exams').insert(payload);
        if (payload.course_id) {
           await notificationService.notifyCourseStudents(payload.course_id, \`New CBT Available: \${payload.title}\`, \`A new CBT exam has been scheduled.\`, 'cbt', '/cbt');
        }
      }`;

content = content.replace(target, replacement);

if (!content.includes('import { notificationService }')) {
  content = content.replace("import { supabase } from '../../supabaseClient';", "import { supabase } from '../../supabaseClient';\nimport { notificationService } from '../../lib/notificationService';");
}
fs.writeFileSync('src/components/lecturer/CBTManagement.tsx', content);
console.log('CBTManagement patched.');
