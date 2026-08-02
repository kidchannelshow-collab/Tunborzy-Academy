import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const email = `testlecturer${Date.now()}@example.com`;
  const password = `password123`;
  console.log("Signing up Lecturer...");
  const { data: fnData, error: fnError } = await supabase.functions.invoke('admin-provision-user', {
    body: { action: 'lecturer-signup', name: 'Test Lecturer', email, password, accessCode: 'TUNBORZY2025' },
  });
  if (fnError || fnData?.error) {
    console.error("Function error:", fnError || fnData?.error);
    return;
  }
  
  console.log("Lecturer provisioned:", fnData);
}
test();
