import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function test() {
  const { data, error } = await supabase.rpc('execute_sql', { query: "SELECT * FROM pg_policies WHERE tablename = 'profiles';" });
  console.log("data:", JSON.stringify(data, null, 2));
  console.log("error:", error);
}
test();
