import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://example.com", "key");
console.log(supabase.functions.invoke.toString());
