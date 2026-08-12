import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function test() {
  const { data: courses, error: err1 } = await supabase.from('courses').select('id').limit(1);
  console.log("courses:", err1 ? err1.message : "ok");

  const { data: cbt_exams, error: err2 } = await supabase.from('cbt_exams').select('id').limit(1);
  console.log("cbt_exams:", err2 ? err2.message : "ok");
  
  const { data: cbt_questions, error: err3 } = await supabase.from('cbt_questions').select('id').limit(1);
  console.log("cbt_questions:", err3 ? err3.message : "ok");
  
  const { data: cbt_attempts, error: err4 } = await supabase.from('cbt_attempts').select('id').limit(1);
  console.log("cbt_attempts:", err4 ? err4.message : "ok");
}
test();
