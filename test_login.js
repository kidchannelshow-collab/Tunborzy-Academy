import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const t0 = performance.now();
  const logTime = (label) => console.log(`[${(performance.now() - t0).toFixed(0)}ms] ${label}`);
  
  logTime('Before signIn');
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: 'admin@tunborzy.com', // or whatever valid email, we just want to see how long a failure or success takes.
    password: 'password123'
  });
  logTime('After signIn');
  console.log(error ? error.message : 'Success');
}
test();
