import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

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
      accessCode: 'Tunborzyacademy@unilorin'
    }
  });
  console.log("Admin signup response:", data, error);
}
run();
