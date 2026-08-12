import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://mnmuowgbbcczsqoxxjem.supabase.co', 'sb_publishable_fGj71Q_jqbUnOWSsHETxEA_EvTaIMKG');
async function test() {
  const { data, error } = await supabase.from('profiles').select('id').limit(1);
  console.log("profiles:", error ? error.message : "ok");
}
test();
