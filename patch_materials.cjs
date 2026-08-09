const fs = require('fs');
let content = fs.readFileSync('src/components/materials/MaterialAdminDashboard.tsx', 'utf8');

content = content.replace(
  'No materials found.',
  'No records found.'
);

fs.writeFileSync('src/components/materials/MaterialAdminDashboard.tsx', content);
