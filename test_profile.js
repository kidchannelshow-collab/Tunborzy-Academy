import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const t0 = performance.now();
  console.log('SignIn...');
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: 'admin@tunborzy.com',
    password: 'password123'
  });
  console.log('SignIn done:', performance.now() - t0);
  if (authData.user) {
    const t1 = performance.now();
    console.log('Fetch profile...');
    const { data, error } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
    console.log('Fetch profile done:', performance.now() - t1);
    console.log(data ? 'Profile found' : 'No profile');
  }
}
test();
