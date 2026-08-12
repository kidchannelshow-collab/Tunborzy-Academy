import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function test() {
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: 'SELECT 1' });
  console.log("exec_sql:", error ? error.message : "ok");
}
test();
