const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  `<AnnouncementCenter onBack={() => handleNavigate(userProfile?.role === 'Admin' ? 'admin_dashboard' : userProfile?.role === 'Lecturer' ? 'lecturer_dashboard' : 'dashboard')} />`,
  `<AnnouncementCenter onBack={() => handleNavigate(userProfile?.role === 'Admin' ? 'admin_dashboard' : userProfile?.role === 'Lecturer' ? 'lecturer_dashboard' : 'dashboard')} onNavigate={handleNavigate} />`
);
fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx patched.');
