const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf-8');

appContent = appContent.replace(
  /const currentProfile = getProfileCache\(\) \|\| userProfile;\n\s*if \(!currentProfile && !isPublicRoute\) {\n\s*view = 'login';\n\s*} else if \(currentProfile && !isAllowed\(currentProfile\.role, view\)\) {\n\s*return; \/\/ Deny\n\s*}/m,
  `const currentProfile = getProfileCache() || userProfile;
    // During login transition, currentProfile might be null temporarily while fetchProfileForUser runs.
    // If we're trying to navigate to a dashboard from login, allow it temporarily; useEffect will correct it if needed.
    if (!currentProfile && !isPublicRoute) {
      if (['dashboard', 'admin_dashboard', 'lecturer_dashboard'].includes(view)) {
         // Allow optimistic navigation
      } else {
         view = 'login';
      }
    } else if (currentProfile && !isAllowed(currentProfile.role, view)) {
      return; // Deny
    }`
);

fs.writeFileSync('src/App.tsx', appContent);
