const fs = require('fs');
let content = fs.readFileSync('src/lib/useProfile.ts', 'utf8');

const target = `      if (error && error.code === 'PGRST116') {
        const metadata = user.user_metadata || {};
        if (metadata.full_name) {
           const newProfile = {
             id: user.id,
             full_name: metadata.full_name,
             email: user.email,
             role: metadata.role || 'Student',
             portal: metadata.portal || 'UTME',
             university: metadata.university || null,
             course: metadata.course || null,
             created_at: metadata.registration_date || new Date().toISOString(),
             student_id: metadata.student_id || null
           };
           
           const { error: insertError } = await supabase.from('profiles').upsert(newProfile, { onConflict: 'id' });
           if (!insertError || isFetchFailure(insertError)) {
             data = newProfile;
           }
        }
      }`;

const replacement = `      if (error && error.code === 'PGRST116') {
        console.warn("Profile not found in useProfile.ts. It should have been created during signup.");
        error = null;
      }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/lib/useProfile.ts', content);
  console.log('useProfile.ts patched.');
} else {
  console.log('Target not found in useProfile.ts');
}
