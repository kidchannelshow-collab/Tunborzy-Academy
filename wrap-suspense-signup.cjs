const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `{currentView === 'signup' && (
        <SignUp onCancel={() => handleNavigate('landing')} onSuccess={(role) => {
          if (role === 'Admin') handleNavigate('admin_dashboard');
          else if (role === 'Lecturer') handleNavigate('lecturer_dashboard');
          else handleNavigate('dashboard');
        }} />
      )}`;
      
const replacement = `{currentView === 'signup' && (
        <Suspense fallback={<div className="min-h-[100dvh] bg-[#020617] flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>}>
          <SignUp onCancel={() => handleNavigate('landing')} onSuccess={(role) => {
            if (role === 'Admin') handleNavigate('admin_dashboard');
            else if (role === 'Lecturer') handleNavigate('lecturer_dashboard');
            else handleNavigate('dashboard');
          }} />
        </Suspense>
      )}`;

content = content.replace(target, replacement);

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx patched with SignUp Suspense wrapper.');
