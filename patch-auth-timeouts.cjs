const fs = require('fs');

function patchTimeouts(filename) {
  let content = fs.readFileSync(filename, 'utf8');
  content = content.replaceAll('}, 1500);', '}, 100);');
  content = content.replaceAll('}, 2000);', '}, 100);');
  content = content.replaceAll('}, 1000);', '}, 100);');
  fs.writeFileSync(filename, content);
  console.log(filename + ' timeouts patched.');
}

patchTimeouts('src/components/Login.tsx');
patchTimeouts('src/components/SignUp.tsx');

