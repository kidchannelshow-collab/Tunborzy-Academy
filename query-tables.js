import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function test() {
  const { data, error } = await supabase.from('courses').select('id').limit(1);
  console.log("courses:", error ? error.message : "OK");
  
  const tables = ['chat_rooms', 'chats', 'chat_messages', 'messages', 'course_chats'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    console.log(t, ":", error ? error.message : "EXISTS");
  }
}
test();
