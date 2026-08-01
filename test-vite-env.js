const { createServer } = require('vite');
(async () => {
  process.env.VITE_TEST_VAR = "hello_world";
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  const module = await server.ssrLoadModule('/src/supabaseClient.js');
  console.log("Supabase URL in Vite:", module.supabase.supabaseUrl);
  await server.close();
})();
