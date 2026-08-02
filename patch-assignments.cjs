const fs = require('fs');
let content = fs.readFileSync('src/components/lecturer/AssignmentManagement.tsx', 'utf8');

const target = `      if (editingId) {
        await supabase.from('assignments').update(payload).eq('id', editingId);
      } else {
        await supabase.from('assignments').insert(payload);
      }`;

const replacement = `      if (editingId) {
        await supabase.from('assignments').update(payload).eq('id', editingId);
      } else {
        await supabase.from('assignments').insert(payload);
        if (payload.course_id) {
           await notificationService.notifyCourseStudents(payload.course_id, \`New Assignment: \${payload.title}\`, \`A new assignment has been posted.\`, 'assignment', '/courses');
        }
      }`;

content = content.replace(target, replacement);

if (!content.includes('import { notificationService }')) {
  content = content.replace("import { supabase } from '../../supabaseClient';", "import { supabase } from '../../supabaseClient';\nimport { notificationService } from '../../lib/notificationService';");
}
fs.writeFileSync('src/components/lecturer/AssignmentManagement.tsx', content);
console.log('AssignmentManagement patched.');
