const fs = require('fs');
let content = fs.readFileSync('src/components/admin/Overview.tsx', 'utf8');

content = content.replace(
  `        supabase.from('subjects').select('*', { count: 'exact', head: true }).catch(() => ({count: 0})),
        supabase.from('faculties').select('*', { count: 'exact', head: true }).catch(() => ({count: 0})),
        supabase.from('departments').select('*', { count: 'exact', head: true }).catch(() => ({count: 0}))`,
  `        supabase.from('subjects').select('*', { count: 'exact', head: true }),
        supabase.from('faculties').select('*', { count: 'exact', head: true }),
        supabase.from('departments').select('*', { count: 'exact', head: true })`
);

fs.writeFileSync('src/components/admin/Overview.tsx', content);
