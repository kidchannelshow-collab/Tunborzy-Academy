const fs = require('fs');
let content = fs.readFileSync('src/components/admin/LecturerManagement.tsx', 'utf8');

content = content.replace(
  'No lecturers found matching your criteria.',
  'No records found.'
);

fs.writeFileSync('src/components/admin/LecturerManagement.tsx', content);
