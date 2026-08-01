import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function test() {
  const res = await fetch(`${supabaseUrl}/functions/v1/admin-provision-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
    body: JSON.stringify({ action: 'admin-signup', name: "Test", email: "test@test.com", password: "password", accessCode: "Tunborzyacademy2026@unilorin" })
  });
  console.log("STATUS:", res.status);
  const text = await res.text();
  console.log("BODY:", text);
}
test();
