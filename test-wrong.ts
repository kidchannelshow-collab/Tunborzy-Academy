import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
  const { data, error } = await supabase.functions.invoke('admin-provision-user', {
    body: {
      action: 'admin-signup',
      name: 'Test Admin',
      email: `test_admin_${Date.now()}@example.com`,
      password: 'testPassword123!',
      accessCode: 'WRONG_CODE_123'
    }
  });
  console.log("Wrong code response:", data, error);
}
run();
