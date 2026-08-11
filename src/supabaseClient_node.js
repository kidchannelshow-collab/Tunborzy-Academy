/* eslint-disable no-undef */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Fail loudly in development if env vars are missing, without ever
  // printing the key itself to the console.
   
  console.error(
    "Supabase environment variables are not configured. Check your .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
