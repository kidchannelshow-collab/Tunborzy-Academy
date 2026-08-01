const assert = require('assert');

let currentView = 'landing';
function setCurrentView(view) { currentView = view; }

let history = { replaceState: () => {} };
let window = { location: { hash: '#settings' }, history };

const userProfile = { role: 'Student' };
const isPublicRoute = false;
function isAllowed(role, view) { return true; }

const hash = window.location.hash.replace('#', '');
let nextRoute = hash || 'landing';

if (userProfile) {
  if (nextRoute === 'login' || nextRoute === 'signup') {
    const defaultDash = 'dashboard';
    setCurrentView(defaultDash);
  } else if (!isPublicRoute && !isAllowed(userProfile.role, nextRoute)) {
    const defaultDash = 'dashboard';
    setCurrentView(defaultDash);
  } else {
    setCurrentView(nextRoute);
  }
}
console.log(currentView);
