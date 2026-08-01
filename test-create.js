import { createClient } from "@supabase/supabase-js";
try {
  createClient("https://example.com", undefined);
} catch (e) {
  console.log("THROWN:", e.message);
}
