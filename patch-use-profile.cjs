const fs = require('fs');
let content = fs.readFileSync('src/lib/useProfile.ts', 'utf8');

const target = `    fetchProfileForUser(user);
  } catch (err) {`;
const replacement = `    await fetchProfileForUser(user);
  } catch (err) {`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/lib/useProfile.ts', content);
  console.log('useProfile.ts patched to await fetchProfileForUser.');
} else {
  console.log('Target not found in useProfile.ts');
}
