import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function test() {
  const { data, error } = await supabase.functions.invoke('admin-provision-user', {
    body: { action: 'admin-signup', name: "Test", email: "test@example.com", password: "password", accessCode: "123" }
  });
  console.log("INVOKE:", error ? error.message : "OK", "DATA:", data);
}
test();
