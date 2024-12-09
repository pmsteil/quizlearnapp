import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { DatabaseProvider } from '@/lib/context/DatabaseContext';
import { AuthProvider } from '@/lib/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Dashboard from '@/components/dashboard/Dashboard';
import TopicLearning from '@/components/topic/TopicLearning';
import NewTopicSetup from '@/components/topics/NewTopicSetup';
import PublicHome from '@/components/home/PublicHome';
import AdminPage from '@/components/admin/AdminPage';

function App() {
  return (
    <DatabaseProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicHome />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/topic/:id" element={
              <ProtectedRoute>
                <TopicLearning />
              </ProtectedRoute>
            } />
            <Route path="/new-topic" element={
              <ProtectedRoute>
                <NewTopicSetup />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </DatabaseProvider>
  );
}

export default App;
