import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function test() {
  const { data, error } = await supabase.from('profiles').insert({
    id: '00000000-0000-0000-0000-000000000000',
    full_name: 'test',
    email: 'test@example.com',
    role: 'Admin'
  });
  console.log("INSERT Admin profile error:", error ? error.message : "OK (should not be OK if RLS blocks role=Admin)");
}
test();
