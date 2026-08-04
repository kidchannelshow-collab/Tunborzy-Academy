import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const accessCode = 'Tunborzyacademy@unilorin';
  const expectedHash = '174ab8da921f61e62ba74d379129aa498b400721deed1fd9991be938bede02e7';
  const actualHash = crypto.createHash('sha256').update(accessCode).digest('hex');
  
  console.log(`Access Code: ${accessCode}`);
  console.log(`Expected Hash: ${expectedHash}`);
  console.log(`Actual Hash: ${actualHash}`);
  
  if (expectedHash === actualHash) {
      console.log('✓ SHA-256 Hash matches correctly.');
  } else {
      console.log('✗ Hash mismatch!');
  }

  console.log('\nInvoking remote edge function (may return 500 if not deployed)...');
  const { data, error } = await supabase.functions.invoke('admin-provision-user', {
    body: {
      action: 'admin-signup',
      name: 'Test Admin',
      email: `test_admin_verify_${Date.now()}@example.com`,
      password: 'testPassword123!',
      accessCode: accessCode
    }
  });

  if (error) {
    console.log(`Remote execution failed as expected (needs deployment): ${error.message}`);
  } else {
    console.log(`Remote execution succeeded:`, data);
  }
}
run();
