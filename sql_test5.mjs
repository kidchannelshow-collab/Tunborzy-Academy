import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://mnmuowgbbcczsqoxxjem.supabase.co', 'sb_publishable_fGj71Q_jqbUnOWSsHETxEA_EvTaIMKG');
async function test() {
  const { data, error } = await supabase.schema('information_schema').from('tables').select('table_name').eq('table_schema', 'public');
  console.log("tables:", error ? error.message : "ok", data);
}
test();
