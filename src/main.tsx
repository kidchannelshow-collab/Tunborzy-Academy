import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
console.error = (...args) => {
  const msg = args.map(a => (a instanceof Error ? a.message : (typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a)))).join(' ');
  if (msg.includes('Failed to fetch') || msg.includes('fetch failed') || msg.includes('PGRST205')) {
    originalConsoleWarn('Caught background/setup error (suppressed from console.error):', ...args);
    return;
  }
  originalConsoleError(...args);
};

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && (event.reason.message === 'Failed to fetch' || event.reason.message === 'fetch failed' || (typeof event.reason === 'string' && event.reason.includes('fetch')) || (typeof event.reason === 'string' && event.reason.includes('PGRST205')) || (typeof event.reason === 'object' && JSON.stringify(event.reason).includes('PGRST205')))) {
    console.warn('Caught background/setup error:', event.reason);
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('Failed to fetch')) {
    console.warn('Caught background fetch error:', event.message);
    event.preventDefault();
  }
});

const savedTheme = localStorage.getItem('app_theme') || 'dark';
const savedTextSize = localStorage.getItem('app_textSize') || 'medium';
document.documentElement.setAttribute('data-theme', savedTheme);
document.documentElement.setAttribute('data-text-size', savedTextSize);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
