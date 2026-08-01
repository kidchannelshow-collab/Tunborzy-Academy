import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const email = `teststudent${Date.now()}@example.com`;
  const password = `password123`;
  console.log("Signing up...");
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Student Test', role: 'Student' } }
  });
  if (authError) {
    console.error("SignUp error:", authError);
    return;
  }
  
  const userId = authData.user.id;
  console.log("User ID:", userId);
  
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    full_name: 'Student Test',
    email,
    role: 'Student'
  });
  if (profileError) {
    console.error("Profile error:", profileError);
  } else {
    console.log("Profile created successfully!");
  }
}
test();
