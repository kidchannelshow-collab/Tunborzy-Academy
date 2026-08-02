const fs = require('fs');

let content = fs.readFileSync('src/components/cbt/CBTExamTaker.tsx', 'utf8');
content = content.replace(
  `userId: profile.id,`,
  `userId: profile?.id,`
);

// We should also check for truthiness
content = content.replace(
  `await notificationService.notifyUser({`,
  `if (profile) await notificationService.notifyUser({`
);

fs.writeFileSync('src/components/cbt/CBTExamTaker.tsx', content);
console.log('Patched profile null check.');
