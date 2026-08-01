import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
async function test() {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    headers: { 'Authorization': `Bearer ${supabaseKey}`, 'apikey': supabaseKey }
  });
  const text = await res.text();
  console.log("RPCs:", text);
}
test();
