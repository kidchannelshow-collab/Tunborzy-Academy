import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://mnmuowgbbcczsqoxxjem.supabase.co';
const supabaseKey = 'sb_publishable_fGj71Q_jqbUnOWSsHETxEA_EvTaIMKG';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: courses, error: err1 } = await supabase.from('courses').select('id').limit(1);
  console.log("courses:", err1 ? err1.message : "ok");

  const { data: cbt_exams, error: err2 } = await supabase.from('cbt_exams').select('id').limit(1);
  console.log("cbt_exams:", err2 ? err2.message : "ok");
}
test();
