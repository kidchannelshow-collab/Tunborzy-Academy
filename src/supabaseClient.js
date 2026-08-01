import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Fail loudly in development if env vars are missing, without ever
  // printing the key itself to the console.
  // eslint-disable-next-line no-console
  console.error(
    "Supabase environment variables are not configured. Check your .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
