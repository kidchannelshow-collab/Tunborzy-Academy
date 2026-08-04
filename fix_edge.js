import fs from 'fs';
let code = fs.readFileSync('supabase/functions/admin-provision-user/index.ts', 'utf-8');

code = code.replace(/await adminClient\s*\.from/g, 'await getAdminClient().from');
fs.writeFileSync('supabase/functions/admin-provision-user/index.ts', code);
console.log('Fixed edge function');
