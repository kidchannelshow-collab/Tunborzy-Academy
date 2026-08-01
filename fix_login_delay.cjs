const fs = require('fs');
let content = fs.readFileSync('src/components/Login.tsx', 'utf-8');

content = content.replace(
  /logTime\('Before profile fetch'\);\n\s*let \{ data: profile, error: profileError \} = await supabase.from\('profiles'\).select\('\*'\).eq\('id', authData.user.id\).single\(\);\n\s*logTime\('After profile fetch'\);[\s\S]*?logTime\('Before onSuccess'\);/m,
  `// Profile fetch and auto-create is handled by useProfile.ts listener
        logTime('Before onSuccess');`
);

content = content.replace(
  /const role = profile\.role \|\| 'student';/,
  `const role = (authData.user.user_metadata && authData.user.user_metadata.role) || 'student';`
);

fs.writeFileSync('src/components/Login.tsx', content);
