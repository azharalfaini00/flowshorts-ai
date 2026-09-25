import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.tsx';
import Login from './pages/Login.tsx';
import PendingApproval from './pages/PendingApproval.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Full-screen loading spinner shown while auth state is being resolved
function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#09090b',
      gap: '16px',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #27272a',
        borderTop: '3px solid #f43f5e',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#71717a', fontSize: '13px', margin: 0 }}>Memuat sesi...</p>
    </div>
  );
}

// Protected Route for Main App
const ProtectedAppRoute = () => {
  const { user, status, isLoading } = useAuth();

  // Show spinner while resolving auth — never show blank page
  if (isLoading) return <LoadingScreen />;

  // Not logged in → redirect to login
  if (!user) return <Navigate to="/" replace />;

  // Logged in but not yet approved → pending page
  if (status === 'pending') return <Navigate to="/pending" replace />;

  // Admin goes to admin dashboard via /admin, but can also use /app
  // Approved users & admins both get access
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/pending" element={<PendingApproval />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/app" element={<ProtectedAppRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
