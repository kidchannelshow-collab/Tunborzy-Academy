import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function test() {
  const { data, error } = await supabase.from('cbt_questions').select('*').limit(1);
  if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    console.log("No data, try insert and rollback to get error");
    const { error: insErr } = await supabase.from('cbt_questions').insert({ id: 'bad' });
    console.log(insErr);
  }
}
test();
