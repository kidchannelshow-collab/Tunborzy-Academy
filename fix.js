const fs = require('fs');
const content = fs.readFileSync('supabase/functions/admin-provision-user/index.ts', 'utf8');

const target = `// Service-role client: bypasses RLS, used for all writes in this function.
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});`;

const replacement = `// Service-role client: bypasses RLS, used for all writes in this function.
// We lazily initialize it so the isolate doesn't crash on startup if the secret is missing.
let adminClient: ReturnType<typeof createClient>;
function getAdminClient() {
  if (!adminClient) {
    if (!SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in Edge Function secrets.");
    }
    adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}`;

let newContent = content.replace(target, replacement);

// Also replace adminClient. calls to getAdminClient().
newContent = newContent.replace(/adminClient\./g, 'getAdminClient().');

fs.writeFileSync('supabase/functions/admin-provision-user/index.ts', newContent);
console.log("File patched.");
