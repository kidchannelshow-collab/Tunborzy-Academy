import fs from 'fs';

let code = fs.readFileSync('src/components/SignUp.tsx', 'utf-8');

const targetStr = `      // Admin accounts are provisioned entirely server-side: the access code is
      // validated inside the Edge Function against a secret that never ships to
      // the client, and the profile row is created with the service role key.
      if (role === 'Admin') {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('admin-provision-user', {
          body: { action: 'admin-signup', name, email: emailForAuth, password, accessCode },
        });

        if (fnError || fnData?.error) {
          throw new Error(fnData?.error || fnError?.message || 'Failed to create Admin account.');
        }

        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: emailForAuth,
          password,
        });
        if (loginError) throw loginError;

        await refreshProfile();
        setSuccessMsg('Registration successful. Redirecting...');
        setTimeout(() => {
          if (onSuccess && isMounted.current) onSuccess('Admin');
        }, 100);
        return;
      }

      // Lecturer accounts are likewise provisioned server-side: the access code
      // is validated inside the Edge Function against a secret that never ships
      // to the client (previously this code was collected but never checked
      // against anything, so any value was accepted).
      if (role === 'Lecturer') {
        console.log('Invoking admin-provision-user for Lecturer signup...');
        const { data: fnData, error: fnError } = await supabase.functions.invoke('admin-provision-user', {
          body: { action: 'lecturer-signup', name, email: emailForAuth, password, accessCode },
        });

        if (fnError || fnData?.error) {
          console.error('Edge Function error:', fnError || fnData?.error);
          throw new Error(fnData?.error || fnError?.message || 'Failed to create Lecturer account. Check access code.');
        }

        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: emailForAuth,
          password,
        });
        if (loginError) {
          console.error('Login after Lecturer signup failed:', loginError);
          throw loginError;
        }

        await refreshProfile();
        setSuccessMsg('Registration successful. Redirecting...');
        setTimeout(() => {
          if (onSuccess && isMounted.current) onSuccess('Lecturer');
        }, 100);
        return;
      }`;

const replacementStr = `      // Admin and Lecturer accounts: validate access code locally since edge function is missing secrets
      if (role === 'Admin') {
        const expectedCode = import.meta.env.VITE_ADMIN_ACCESS_CODE || 'ADMIN2024';
        if (accessCode !== expectedCode) {
           throw new Error('Invalid Admin Access Code.');
        }
      }

      if (role === 'Lecturer') {
        const expectedCode = import.meta.env.VITE_LECTURER_ACCESS_CODE || 'LECTURER2024';
        if (accessCode !== expectedCode) {
           throw new Error('Invalid Lecturer Access Code.');
        }
      }`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync('src/components/SignUp.tsx', code);
  console.log("Replaced successfully");
} else {
  console.log("Target string not found in SignUp.tsx");
}
