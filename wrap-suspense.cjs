const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the return block to wrap private routes in Suspense
const target = `    <div className="min-h-[100dvh] bg-[#020617] font-sans selection:bg-blue-500/30">
      {currentView === 'landing' && (
        <>
          <Navbar onSignUp={() => handleNavigate('signup')} onLogin={() => handleNavigate('login')} />
          <main>
            <Hero onSignUp={() => handleNavigate('signup')} onLogin={() => handleNavigate('login')} />
            <Portals />
            <Features />
            <Testimonials />
          </main>
          <Footer />
        </>
      )}
      {currentView === 'signup' && (
        <SignUp onCancel={() => handleNavigate('landing')} onSuccess={(role) => {
          if (role === 'Admin') handleNavigate('admin_dashboard');
          else if (role === 'Lecturer') handleNavigate('lecturer_dashboard');
          else handleNavigate('dashboard');
        }} />
      )}
      {currentView === 'login' && (
        <Login onCancel={() => handleNavigate('landing')} onSuccess={(view) => handleNavigate(view)} />
      )}`;

const replacement = `    <div className="min-h-[100dvh] bg-[#020617] font-sans selection:bg-blue-500/30">
      {currentView === 'landing' && (
        <>
          <Navbar onSignUp={() => handleNavigate('signup')} onLogin={() => handleNavigate('login')} />
          <main>
            <Hero onSignUp={() => handleNavigate('signup')} onLogin={() => handleNavigate('login')} />
            <Portals />
            <Features />
            <Testimonials />
          </main>
          <Footer />
        </>
      )}
      {currentView === 'signup' && (
        <SignUp onCancel={() => handleNavigate('landing')} onSuccess={(role) => {
          if (role === 'Admin') handleNavigate('admin_dashboard');
          else if (role === 'Lecturer') handleNavigate('lecturer_dashboard');
          else handleNavigate('dashboard');
        }} />
      )}
      {currentView === 'login' && (
        <Suspense fallback={<div className="min-h-[100dvh] bg-[#020617] flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>}>
          <Login onCancel={() => handleNavigate('landing')} onSuccess={(view) => handleNavigate(view)} />
        </Suspense>
      )}`;

content = content.replace(target, replacement);

const suspenseStartTarget = `      {currentView === 'dashboard' && (`;
const suspenseStartReplacement = `      <Suspense fallback={<div className="min-h-[100dvh] bg-[#020617] flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      {currentView === 'dashboard' && (`;

content = content.replace(suspenseStartTarget, suspenseStartReplacement);

const suspenseEndTarget = `      {/* Floating Notification Button */}
      {currentView !== 'announcements' && currentView !== 'landing' && currentView !== 'login' && currentView !== 'signup' && (
        <FloatingNotificationButton onClick={() => handleNavigate('announcements')} />
      )}
    </div>`;
const suspenseEndReplacement = `      {/* Floating Notification Button */}
      {currentView !== 'announcements' && currentView !== 'landing' && currentView !== 'login' && currentView !== 'signup' && (
        <FloatingNotificationButton onClick={() => handleNavigate('announcements')} />
      )}
      </Suspense>
    </div>`;

content = content.replace(suspenseEndTarget, suspenseEndReplacement);

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx patched with Suspense wrapper.');
