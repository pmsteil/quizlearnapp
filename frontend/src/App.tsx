import { useEffect, useState } from 'react';
import { initializeApp } from './lib/init';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { DatabaseProvider } from '@/lib/context/DatabaseContext';
import { AuthProvider } from '@/lib/contexts/auth.context';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ToastProvider } from '@/lib/contexts/toast.context';
import { LoadingProvider } from '@/lib/contexts/loading.context';
import TopicLearning from '@/components/topic/TopicLearning';
import NewTopicSetup from '@/components/topics/NewTopicSetup';
import PublicHome from '@/components/home/PublicHome';
import AdminPage from '@/components/admin/AdminPage';
import { RoleGuard } from '@/components/auth/RoleGuard';
import Dashboard from '@/components/dashboard/Dashboard';
import ErrorBoundary from '@/components/error/ErrorBoundary';

function App() {
  const [dbError, setDbError] = useState<{title: string; message: string} | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await initializeApp();
        if (mounted) {
          setInitialized(true);
        }
      } catch (error) {
        console.error('App initialization failed:', error);
        if (!mounted) return;

        if (error instanceof Error && 'title' in error) {
          setDbError({
            title: (error as any).title,
            message: error.message
          });
        } else {
          setDbError({
            title: 'Database Configuration Error',
            message: error instanceof Error ? error.message : 'Failed to initialize database'
          });
        }
        setInitialized(true);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Don't render anything until initialization is complete
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading QuizLearn...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <DatabaseProvider>
          <AuthProvider>
            <ToastProvider>
              <LoadingProvider>
                <Routes>
                  <Route path="/" element={<PublicHome dbError={dbError} />} />
                  {!dbError && (
                    <>
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/topic/:id"
                        element={
                          <ProtectedRoute>
                            <TopicLearning />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/new-topic"
                        element={
                          <ProtectedRoute>
                            <NewTopicSetup />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin"
                        element={
                          <RoleGuard allowedRoles={['role_admin']}>
                            <AdminPage />
                          </RoleGuard>
                        }
                      />
                    </>
                  )}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Toaster />
              </LoadingProvider>
            </ToastProvider>
          </AuthProvider>
        </DatabaseProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
