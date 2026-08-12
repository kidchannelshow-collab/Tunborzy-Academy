import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function test() {
  const { data: exams, error: err1 } = await supabase.from('cbt_exams').select('*').limit(1);
  if (exams) {
     console.log("Exams Columns:", Object.keys(exams[0] || {}));
  } else {
     console.log("No exams", err1);
  }
}
test();
