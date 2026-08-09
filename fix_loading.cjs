const fs = require('fs');

// Patch UserManagement
let content = fs.readFileSync('src/components/admin/UserManagement.tsx', 'utf8');
content = content.replace(
  `{[1,2,3,4,5].map(i => <tr key={i}><td colSpan={6} className="py-4 px-2"><div className="h-10 bg-slate-800/50 rounded-xl animate-pulse w-full"></div></td></tr>)}`,
  `[1,2,3,4,5].map(i => <tr key={i}><td colSpan={6} className="py-4 px-2"><div className="h-10 bg-slate-800/50 rounded-xl animate-pulse w-full"></div></td></tr>)`
);
fs.writeFileSync('src/components/admin/UserManagement.tsx', content);

// Patch LecturerManagement
let content2 = fs.readFileSync('src/components/admin/LecturerManagement.tsx', 'utf8');
content2 = content2.replace(
  `{[1,2,3,4,5].map(i => <tr key={i}><td colSpan={6} className="py-4 px-2"><div className="h-10 bg-slate-800/50 rounded-xl animate-pulse w-full"></div></td></tr>)}`,
  `[1,2,3,4,5].map(i => <tr key={i}><td colSpan={6} className="py-4 px-2"><div className="h-10 bg-slate-800/50 rounded-xl animate-pulse w-full"></div></td></tr>)`
);
fs.writeFileSync('src/components/admin/LecturerManagement.tsx', content2);
