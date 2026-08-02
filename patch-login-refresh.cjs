const fs = require('fs');
let content = fs.readFileSync('src/components/Login.tsx', 'utf8');

if (!content.includes('import { refreshProfile }')) {
  content = content.replace("import { supabase } from '../supabaseClient';", "import { supabase } from '../supabaseClient';\nimport { refreshProfile } from '../lib/useProfile';");
}

const target1 = `      setSuccessMsg('Login successful. Redirecting...');
      setTimeout(() => {
        if (onSuccess && isMounted.current) {
          const finalRole = profile?.role || 'Student';
          onSuccess(finalRole);
        }
      }, 1500);`;
const replacement1 = `      await refreshProfile();
      setSuccessMsg('Login successful. Redirecting...');
      setTimeout(() => {
        if (onSuccess && isMounted.current) {
          const finalRole = profile?.role || 'Student';
          onSuccess(finalRole);
        }
      }, 1500);`;

content = content.replace(target1, replacement1);
fs.writeFileSync('src/components/Login.tsx', content);
console.log('Login.tsx patched with refreshProfile.');
