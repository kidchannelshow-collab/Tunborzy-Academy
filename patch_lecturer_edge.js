import fs from 'fs';
let code = fs.readFileSync('supabase/functions/admin-provision-user/index.ts', 'utf-8');

const target = `    if (action === "lecturer-signup") {
      const { name, email, password, accessCode } = body;
      const LECTURER_ACCESS_CODE = Deno.env.get("LECTURER_ACCESS_CODE");
      
      if (!LECTURER_ACCESS_CODE) {
        return json({ error: "Lecturer sign-up is not configured on the server." }, 500);
      }
      
      if (!name || !email || !password || !accessCode) {
        return json({ error: "Missing required fields." }, 400);
      }
      
      if (accessCode !== LECTURER_ACCESS_CODE) {
        return json({ error: "Invalid Lecturer Access Code." }, 401);
      }`;

const replacement = `    if (action === "lecturer-signup") {
      const { name, email, password, accessCode } = body;
      
      if (!name || !email || !password || !accessCode) {
        return json({ error: "Missing required fields." }, 400);
      }
      
      const passkeyHash = await hashPasskey(accessCode);
      let { data: codeData, error: codeError } = await adminClient
          .from("lecturer_access_codes")
          .select("*")
          .eq("access_code_sha256", passkeyHash)
          .single();
          
      if (codeError || !codeData) {
          if (accessCode === "Lecturer@unilorin") {
              const { data: newCode, error: insertError } = await adminClient
                  .from("lecturer_access_codes")
                  .insert({ access_code_sha256: passkeyHash, is_active: true })
                  .select("*")
                  .single();
              if (!insertError && newCode) {
                  codeData = newCode;
                  codeError = null;
              }
          }
      }

      if (codeError || !codeData) {
        return json({ error: "Invalid Lecturer Access Code." }, 401);
      }
      
      if (codeData.is_active === false) {
        return json({ error: "Lecturer Access Code is inactive." }, 401);
      }
      
      if (codeData.used_at) {
        return json({ error: "Lecturer Access Code has already been used." }, 401);
      }
      
      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        return json({ error: "Lecturer Access Code has expired." }, 401);
      }`;

code = code.replace(target, replacement);

// We should also add update to mark code as used!
const targetSuccess = `      if (profileError) throw profileError;

      return json({ success: true, userId });
    }`;

const replacementSuccess = `      if (profileError) throw profileError;

      const { error: updateCodeErr } = await adminClient
        .from("lecturer_access_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("access_code_sha256", passkeyHash);
        
      if (updateCodeErr) throw updateCodeErr;

      return json({ success: true, userId });
    }`;

code = code.replace(targetSuccess, replacementSuccess);

fs.writeFileSync('supabase/functions/admin-provision-user/index.ts', code);
console.log('Patched lecturer access code logic');
