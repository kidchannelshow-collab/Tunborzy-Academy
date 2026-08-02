const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace standard imports with lazy imports
const importsToReplace = [
  'StudentDashboard', 'Login', 'MyCoursesPage', 'CourseChatSystem',
  'ResourceLibraryPage', 'CBTPracticePage', 'PastQuestionsPage',
  'RevisionModePage', 'PerformanceAnalyticsPage', 'StudentProfilePage',
  'SettingsPage', 'LecturerDashboard', 'AdminDashboard',
  'AnnouncementCenter', 'TunborzyAI', 'HelpSupportPage', 'DashboardLayout'
];

importsToReplace.forEach(component => {
  const regex = new RegExp(`import ${component} from '.[^']+';\\n`, 'g');
  const regexDouble = new RegExp(`import ${component} from ".[^"]+";\\n`, 'g');
  
  let match = content.match(regex);
  if (!match) match = content.match(regexDouble);
  
  if (match) {
    const importPath = match[0].split(/['"]/)[1];
    content = content.replace(match[0], `const ${component} = lazy(() => import('${importPath}'));\n`);
  }
});

if (!content.includes('import { useState, useEffect, lazy, Suspense } from')) {
  content = content.replace("import { useState } from 'react';", "import { useState, lazy, Suspense } from 'react';");
}

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx patched with lazy imports.');
