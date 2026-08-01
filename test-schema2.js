import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function test() {
  const { data, error } = await supabase.from('chat_messages').insert({ room_id: '00000000-0000-0000-0000-000000000000', sender_id: '00000000-0000-0000-0000-000000000000', message_text: 'test' });
  console.log("CHAT_MESSAGES:", error);
}
test();
