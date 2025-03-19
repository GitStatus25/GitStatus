import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AuthContext from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
import PrivateRouteComponent from './components/PrivateRoute';
import AdminRouteComponent from './components/AdminRoute';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import CreateReportPage from './pages/CreateReport';
import ViewReportPage from './pages/ViewReport';
import NotFoundPage from './pages/NotFound';
import AdminDashboardComponent from './components/AdminDashboard';
import AnalyticsDashboardPage from './pages/AnalyticsDashboard';
import CreateReportModalComponent from './components/modals/CreateReportModal';
import ViewCommitsModalComponent from './components/modals/ViewCommitsModal';
import AuthCallbackPage from './pages/AuthCallback';
import theme from './styles/theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthContext>
        <ModalProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRouteComponent>
                    <DashboardPage />
                  </PrivateRouteComponent>
                }
              />
              
              <Route 
                path="/reports/:id" 
                element={
                  <PrivateRouteComponent>
                    <ViewReportPage />
                  </PrivateRouteComponent>
                }
              />
              
              <Route 
                path="/create-report" 
                element={
                  <PrivateRouteComponent>
                    <CreateReportPage />
                  </PrivateRouteComponent>
                }
              />
              
              <Route 
                path="/analytics" 
                element={
                  <PrivateRouteComponent>
                    <AnalyticsDashboardPage />
                  </PrivateRouteComponent>
                }
              />
              
              <Route 
                path="/admin" 
                element={
                  <AdminRouteComponent>
                    <AdminDashboardComponent />
                  </AdminRouteComponent>
                }
              />
              
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            
            {/* Global Modals */}
            <CreateReportModalComponent />
            <ViewCommitsModalComponent />
          </Router>
        </ModalProvider>
      </AuthContext>
    </ThemeProvider>
  );
}

export default App;

