import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import SimpleHome from './pages/SimpleHome';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardHome from './pages/DashboardHome';
import Invoices from './pages/Invoices';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Templates from './pages/Templates';
import CreateInvoice from './pages/CreateInvoice';
import FooterDemo from './pages/FooterDemo';
import AlertDemo from './pages/AlertDemo';
// Removed legacy DashboardWithSidebar to use the unified Dashboard with integrated sidebar

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user ? <Navigate to="/dashboard" /> : <>{children}</>;
};

// Protected route without the global Layout (no header/footer), used for dashboard
const ProtectedRouteBare: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hero" element={<SimpleHome />} />
          <Route path="/footer-demo" element={<FooterDemo />} />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedRouteBare>
                <Dashboard />
              </ProtectedRouteBare>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="templates" element={<Templates />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route 
            path="/create-invoice" 
            element={
              <ProtectedRoute>
                <CreateInvoice />
              </ProtectedRoute>
            } 
          />
          <Route path="/alert-demo" element={<AlertDemo />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
