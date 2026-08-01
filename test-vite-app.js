import { createClient } from "@supabase/supabase-js";
try {
  createClient(undefined, undefined);
} catch (e) {
  console.log(e.message);
}
