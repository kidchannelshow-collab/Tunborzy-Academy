const fs = require('fs');

let loginContent = fs.readFileSync('src/components/Login.tsx', 'utf-8');
loginContent = loginContent.replace(
  `const handleLogin = async (e: React.FormEvent) => {`,
  `const handleLogin = async (e: React.FormEvent) => {\n    const t0 = performance.now();\n    const logTime = (label) => console.log(\`[\${(performance.now() - t0).toFixed(0)}ms] \${label}\`);\n    logTime('Start handleLogin');`
);
loginContent = loginContent.replace(
  `const { data: authData, error: authError } = await supabase.auth.signInWithPassword({`,
  `logTime('Before signInWithPassword');\n      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({`
);
loginContent = loginContent.replace(
  `if (authError) throw authError;`,
  `logTime('After signInWithPassword');\n      if (authError) throw authError;`
);
loginContent = loginContent.replace(
  `let { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();`,
  `logTime('Before profile fetch');\n         let { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();\n         logTime('After profile fetch');`
);
loginContent = loginContent.replace(
  `if (onSuccess && isMounted.current) {`,
  `logTime('Before onSuccess');\n        if (onSuccess && isMounted.current) {`
);
fs.writeFileSync('src/components/Login.tsx', loginContent);
