const fs = require('fs');
let content = fs.readFileSync('src/components/cbt/CBTExamTaker.tsx', 'utf8');

const target = `    try {
      if (attemptId !== 'custom-attempt-id') {`;
      
const replacement = `    try {
      if (attemptId !== 'custom-attempt-id') {
        await notificationService.notifyUser({
          userId: profile.id,
          title: \`CBT Completed\`,
          message: \`You have completed the assessment. Score: \${score}%\`,
          type: 'result',
          link: '/cbt'
        });`;

content = content.replace(target, replacement);

if (!content.includes('import { notificationService }')) {
  content = content.replace("import { supabase } from '../../supabaseClient';", "import { supabase } from '../../supabaseClient';\nimport { notificationService } from '../../lib/notificationService';");
}
fs.writeFileSync('src/components/cbt/CBTExamTaker.tsx', content);
console.log('CBTExamTaker patched.');
