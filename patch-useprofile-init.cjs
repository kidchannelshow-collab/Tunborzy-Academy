const fs = require('fs');
let content = fs.readFileSync('src/lib/useProfile.ts', 'utf8');

if (!content.includes('// Initialize auth state immediately')) {
  content += `\n\n// Initialize auth state immediately on load\nif (supabase && typeof window !== 'undefined') {\n  fetchProfileForUser(null);\n}\n`;
  fs.writeFileSync('src/lib/useProfile.ts', content);
  console.log('useProfile.ts patched with immediate init.');
}
