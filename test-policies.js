import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function test() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log("Can read:", !!data);
  const { data: qdata, error: qerror } = await supabase.rpc('get_policies', {});
  console.log("qerror:", qerror);
}
test();
