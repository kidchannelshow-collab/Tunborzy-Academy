let currentView = 'landing';
function setCurrentView(view) { currentView = view; }

let history = { replaceState: () => {} };
let window = { location: { hash: '#settings' }, history };

const userProfile = { role: 'Student' };
const isPublicRoute = false;
function isAllowed(role, view) { return true; }

const hash = window.location.hash.replace('#', '');
let nextRoute = hash || 'landing';
const landingSections = ['landing', 'home', 'about', 'contact', 'features', 'portals', ''];
const isLandingSection = landingSections.includes(nextRoute);

if (userProfile) {
  if (nextRoute === 'login' || nextRoute === 'signup') {
    const defaultDash = 'dashboard';
    setCurrentView(defaultDash);
  } else if (!isPublicRoute && !isAllowed(userProfile.role, nextRoute)) {
    const defaultDash = 'dashboard';
    setCurrentView(defaultDash);
  }
} else {
  if (!isPublicRoute) {
    if (['dashboard', 'admin_dashboard', 'lecturer_dashboard'].includes(nextRoute)) {
    } else {
      nextRoute = 'login';
    }
  }
}

// In App.tsx, the assignment is outside the if block!
if (isLandingSection) {
  setCurrentView('landing');
} else {
  setCurrentView(nextRoute);
}

console.log(currentView);
