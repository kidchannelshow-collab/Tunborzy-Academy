const fs = require('fs');
let content = fs.readFileSync('src/components/SignUp.tsx', 'utf8');

if (!content.includes('import { refreshProfile }')) {
  content = content.replace("import { supabase } from '../supabaseClient';", "import { supabase } from '../supabaseClient';\nimport { refreshProfile } from '../lib/useProfile';");
}

const target1 = `      setSuccessMsg('Registration successful. Redirecting...');
      setTimeout(() => {
        if (onSuccess && isMounted.current) onSuccess(role);
      }, 1500);`;
const replacement1 = `      await refreshProfile();
      setSuccessMsg('Registration successful. Redirecting...');
      setTimeout(() => {
        if (onSuccess && isMounted.current) onSuccess(role);
      }, 1500);`;
      
const target2 = `        setSuccessMsg('Registration successful. Redirecting...');
        setTimeout(() => {
          if (onSuccess && isMounted.current) onSuccess('Admin');
        }, 1500);`;
const replacement2 = `        await refreshProfile();
        setSuccessMsg('Registration successful. Redirecting...');
        setTimeout(() => {
          if (onSuccess && isMounted.current) onSuccess('Admin');
        }, 1500);`;

const target3 = `        setSuccessMsg('Registration successful. Redirecting...');
        setTimeout(() => {
          if (onSuccess && isMounted.current) onSuccess('Lecturer');
        }, 1500);`;
const replacement3 = `        await refreshProfile();
        setSuccessMsg('Registration successful. Redirecting...');
        setTimeout(() => {
          if (onSuccess && isMounted.current) onSuccess('Lecturer');
        }, 1500);`;

const target4 = `        setSuccessMsg('Logged in successfully. Redirecting...');
        setTimeout(() => {
          const finalRole = profile?.role || role;
          if (onSuccess && isMounted.current) onSuccess(finalRole);
        }, 1500);`;
const replacement4 = `        await refreshProfile();
        setSuccessMsg('Logged in successfully. Redirecting...');
        setTimeout(() => {
          const finalRole = profile?.role || role;
          if (onSuccess && isMounted.current) onSuccess(finalRole);
        }, 1500);`;
        
const target5 = `            setSuccessMsg('Logged in successfully. Redirecting...');
            setTimeout(() => {
              const finalRole = profile?.role || role;
              if (onSuccess && isMounted.current) onSuccess(finalRole);
            }, 1500);`;
const replacement5 = `            await refreshProfile();
            setSuccessMsg('Logged in successfully. Redirecting...');
            setTimeout(() => {
              const finalRole = profile?.role || role;
              if (onSuccess && isMounted.current) onSuccess(finalRole);
            }, 1500);`;

content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);
content = content.replace(target3, replacement3);
content = content.replace(target4, replacement4);
content = content.replace(target5, replacement5);

fs.writeFileSync('src/components/SignUp.tsx', content);
console.log('SignUp.tsx patched with refreshProfile.');
