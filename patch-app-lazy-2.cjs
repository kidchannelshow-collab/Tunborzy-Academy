const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace("import SignUp from './components/SignUp';", "const SignUp = lazy(() => import('./components/SignUp'));");

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx patched with SignUp lazy import.');
