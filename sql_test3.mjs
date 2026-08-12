import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function test() {
  const { data, error } = await supabase.from('information_schema.tables').select('*').limit(10);
  console.log("schema:", error ? error.message : "ok", data);
}
test();
