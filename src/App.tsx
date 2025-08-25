import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './hooks/useAuth';
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
const Themes = lazy(() => import('./pages/Themes'));
const TemplateDetail = lazy(() => import('./pages/TemplateDetail'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));
const EditInvoice = lazy(() => import('./pages/EditInvoice'));
const CreateInvoice = lazy(() => import('./pages/CreateInvoice'));
const Wallet = lazy(() => import('./pages/Wallet'));
const MockCheckout = lazy(() => import('./pages/MockCheckout'));
const FooterDemo = lazy(() => import('./pages/FooterDemo'));
const AlertDemo = lazy(() => import('./pages/AlertDemo'));
const ResendConfirmation = lazy(() => import('./pages/ResendConfirmation'));
const Logout = lazy(() => import('./pages/Logout'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const PublicInvoice = lazy(() => import('./pages/PublicInvoice'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
// Removed legacy DashboardWithSidebar to use the unified Dashboard with integrated sidebar

 

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
      <ThemeProvider>
        <AuthProvider>
          <Router>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>}>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/p/:id" element={<PublicInvoice />} />
            <Route path="/hero" element={<SimpleHome />} />
            <Route path="/footer-demo" element={<FooterDemo />} />
            <Route path="/resend-confirmation" element={<ResendConfirmation />} />
            <Route 
              path="/forgot-password" 
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              } 
            />
            <Route 
              path="/reset-password" 
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              } 
            />
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
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            <Route path="templates" element={<Templates />} />
            <Route path="themes" element={<Themes />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="create-invoice" element={<CreateInvoice />} />
            <Route path="invoices/:id/edit" element={<EditInvoice />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route 
            path="/mock/checkout/:id" 
            element={
              <ProtectedRouteBare>
                <MockCheckout />
              </ProtectedRouteBare>
            } 
          />
          <Route 
            path="/templates/:id" 
            element={
              <ProtectedRouteBare>
                <TemplateDetail />
              </ProtectedRouteBare>
            } 
          />
          <Route 
            path="/create-invoice" 
            element={<Navigate to="/dashboard/create-invoice" replace />} 
          />
          <Route 
            path="/invoices" 
            element={<Navigate to="/dashboard/invoices" replace />} 
          />
          <Route 
            path="/invoices/:id/edit" 
            element={<Navigate to="/dashboard/invoices/:id/edit" replace />} 
          />
          <Route path="/logout" element={<Logout />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/alert-demo" element={<AlertDemo />} />
          <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
