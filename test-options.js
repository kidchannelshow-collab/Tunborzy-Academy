import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
async function test() {
  const res = await fetch(`${supabaseUrl}/functions/v1/admin-provision-user`, {
    method: 'OPTIONS',
    headers: { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type, authorization, x-client-info, apikey' }
  });
  console.log("OPTIONS STATUS:", res.status);
  const text = await res.text();
  console.log("OPTIONS BODY:", text);
}
test();
