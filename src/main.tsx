import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.tsx';
import Login from './pages/Login.tsx';
import PendingApproval from './pages/PendingApproval.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import './index.css';

// Protected Route for Main App
const ProtectedAppRoute = () => {
  const { user, status, isLoading } = useAuth();
  
  if (isLoading) return null; // handled in App if needed, or just blank
  if (!user) return <Navigate to="/" replace />;
  if (status === 'pending') return <Navigate to="/pending" replace />;
  
  return <App />;
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
