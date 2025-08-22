import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
// Route-based code-splitting
const Home = lazy(() => import('./pages/Home'));
const SimpleHome = lazy(() => import('./pages/SimpleHome'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DashboardHome = lazy(() => import('./pages/DashboardHome'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Templates = lazy(() => import('./pages/Templates'));
const CreateInvoice = lazy(() => import('./pages/CreateInvoice'));
const FooterDemo = lazy(() => import('./pages/FooterDemo'));
const AlertDemo = lazy(() => import('./pages/AlertDemo'));
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
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>}>
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
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
