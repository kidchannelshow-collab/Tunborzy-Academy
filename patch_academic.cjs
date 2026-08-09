const fs = require('fs');
let content = fs.readFileSync('src/components/admin/AcademicManagement.tsx', 'utf8');

content = content.replace(
  'No courses found. Add a course to get started.',
  'No records found.'
);

fs.writeFileSync('src/components/admin/AcademicManagement.tsx', content);
