import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
async function test() {
  const res = await fetch(`${supabaseUrl}/functions/v1/does-not-exist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
    body: JSON.stringify({ })
  });
  console.log("STATUS:", res.status);
  const text = await res.text();
  console.log("BODY:", text);
}
test();
