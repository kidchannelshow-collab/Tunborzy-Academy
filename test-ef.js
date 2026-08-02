import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: fnData, error: fnError } = await supabase.functions.invoke('admin-provision-user', {
    body: { action: 'test' },
  });
  console.log("fnError:", fnError || fnData?.error);
  console.log("fnData:", fnData);
}
test();
