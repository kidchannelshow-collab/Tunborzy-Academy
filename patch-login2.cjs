const fs = require('fs');
let content = fs.readFileSync('src/components/Login.tsx', 'utf8');

const target = `        if (onSuccess && isMounted.current) {
          const role = profile.role || 'student';`;
const replacement = `        await refreshProfile();
        if (onSuccess && isMounted.current) {
          const role = profile.role || 'student';`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/Login.tsx', content);
console.log('Login.tsx patched properly.');
