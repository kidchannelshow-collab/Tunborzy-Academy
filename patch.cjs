const fs = require('fs');
let content = fs.readFileSync('src/components/Login.tsx', 'utf8');

const target = `        if (profileError && profileError.code === 'PGRST116') {
          const metadata = authData.user.user_metadata || {};
          if (metadata.full_name) {
            const newProfile = {
              id: authData.user.id,
              full_name: metadata.full_name,
              email: authData.user.email,
              role: metadata.role || 'Student',
              portal: metadata.portal || 'UTME',
              university: metadata.university || null,
              course: metadata.course || null,
              student_id: metadata.student_id || null,
              created_at: metadata.registration_date || new Date().toISOString()
            };
            
            const { error: upsertError } = await supabase.from('profiles').upsert(newProfile, { onConflict: 'id' });
            if (upsertError && !isFetchFailure(upsertError)) {
              console.error("Login: Auto-create profile error", upsertError);
              throw new Error('Database Error: ' + upsertError.message);
            }
            if (!upsertError) {
              const { data: newProfileData, error: checkError } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
              if (checkError && !isFetchFailure(checkError)) {
                 throw new Error('Database Error: Profile was not created successfully.');
              }
              profile = newProfileData || newProfile;
            } else {
              // Row-write likely succeeded server-side (or will be retried) but the
              // client couldn't confirm it over the network. We already have the
              // complete profile shape in memory, so use it rather than blocking login.
              profile = newProfile;
            }
          } else {
             throw new Error('Database Error: Profile not found and insufficient metadata.');
          }
        } else if (profileError) {
           throw new Error('Database Error: ' + profileError.message);
        }`;

const replacement = `        if (profileError && profileError.code === 'PGRST116') {
          throw new Error('Database Error: Profile does not exist. Please create an account first.');
        } else if (profileError) {
           throw new Error('Database Error: ' + profileError.message);
        }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/Login.tsx', content);
  console.log('Login.tsx patched.');
} else {
  console.log('Target not found in Login.tsx');
}
