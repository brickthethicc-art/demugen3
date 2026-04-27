import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { backgroundMusic } from './audio/backgroundMusic.js';
import './index.css';

// Global error handler to catch any unhandled errors
window.addEventListener('error', (event) => {
  // Error logging removed for performance
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  // Error logging removed for performance
});

const root = document.getElementById('root');
if (!root) {
  document.body.innerHTML = '<div style="color: white; padding: 20px; background: red;">ERROR: Root element not found</div>';
} else {
  try {
    createRoot(root).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
    backgroundMusic.init();
  } catch (error) {
    document.body.innerHTML = '<div style="color: white; padding: 20px; background: red;">ERROR: Failed to render React app</div>';
  }
}
