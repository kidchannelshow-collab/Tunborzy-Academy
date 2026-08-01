import { createServer } from 'vite';
(async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });
  const { supabase } = await server.ssrLoadModule('/src/supabaseClient.js');
  const { data, error } = await supabase.from('courses').select('*').limit(1);
  console.log("courses error:", error);
  const { data: d2, error: e2 } = await supabase.from('chat_groups').select('*').limit(1);
  console.log("chat_groups error:", e2);
  const { data: d3, error: e3 } = await supabase.from('chat_messages').select('*').limit(1);
  console.log("chat_messages error:", e3);
  await server.close();
})();
