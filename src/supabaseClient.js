/* eslint-disable no-undef */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Fail loudly in development if env vars are missing, without ever
  // printing the key itself to the console.
   
  console.error(
    "Supabase environment variables are not configured. Check your .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Diagnostics
console.log('Supabase URL:', supabaseUrl);
try {
  const urlObj = new URL(supabaseUrl);
  console.log('Supabase Project Reference:', urlObj.hostname.split('.')[0]);
} catch (e) {
  console.log('Supabase Project Reference: Invalid URL');
}
console.log('Supabase client initialized successfully:', !!supabase);

(async () => {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  console.log('Diagnostics - Count:', count);
  console.log('Diagnostics - Error:', error);
})();
