import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const code = 'Tunborzyacademy@unilorin';
  const hash = crypto.createHash('sha256').update(code).digest('hex');
  const { data, error } = await supabase.from('admin_access_codes').insert({
    access_code_sha256: hash,
    is_active: true
  }).select();
  console.log('Insert:', data, error);
}
run();
