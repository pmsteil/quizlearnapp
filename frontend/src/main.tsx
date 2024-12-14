import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { InitializationWrapper } from './components/app/InitializationWrapper';
import { RootErrorBoundary } from './components/app/RootErrorBoundary';
import { ToastProvider } from './lib/contexts/toast.context';
import { ThemeProvider } from '@/components/theme-provider';

// Add global error handler
window.onerror = (message, source, lineno, colno, error) => {
  console.error('[Global Error Handler]:', { message, source, lineno, colno, error });
};

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]:', event.reason);
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element');
}

try {
  console.log('[main] Starting application render');
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <ThemeProvider defaultTheme="system">
        <RootErrorBoundary>
          <ToastProvider>
            <InitializationWrapper>
              <App />
            </InitializationWrapper>
          </ToastProvider>
        </RootErrorBoundary>
      </ThemeProvider>
    </React.StrictMode>
  );
} catch (error) {
  console.error('[main] Failed to render application:', error);
  // Fallback render directly to body if root render fails
  document.body.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #1a1a1a; color: #fff; padding: 1rem;">
      <div style="max-width: 28rem;">
        <h1 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem;">Critical Error</h1>
        <p>The application failed to start. Please check the console for details.</p>
      </div>
    </div>
  `;
}
