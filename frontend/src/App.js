import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AuthContext from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
import PrivateRouteComponent from './components/PrivateRoute';
import AdminRouteComponent from './components/AdminRoute';
import LoginComponent from './components/Login';
import DashboardComponent from './components/Dashboard';
import CreateReportComponent from './components/CreateReport';
import ViewReportComponent from './components/ViewReport';
import NotFoundComponent from './components/NotFound';
import AdminDashboardComponent from './components/AdminDashboard';
import AnalyticsDashboardComponent from './components/AnalyticsDashboard';
import CreateReportModalComponent from './components/Modals/CreateReport';
import ViewCommitsModalComponent from './components/Modals/ViewCommits';
import AuthCallbackComponent from './components/AuthCallback';
import theme from './styles/theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthContext>
        <ModalProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginComponent />} />
              <Route path="/auth/callback" element={<AuthCallbackComponent />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRouteComponent>
                    <DashboardComponent />
                  </PrivateRouteComponent>
                }
              />
              
              <Route 
                path="/reports/:id" 
                element={
                  <PrivateRouteComponent>
                    <ViewReportComponent />
                  </PrivateRouteComponent>
                }
              />
              
              <Route 
                path="/create-report" 
                element={
                  <PrivateRouteComponent>
                    <CreateReportComponent />
                  </PrivateRouteComponent>
                }
              />
              
              <Route 
                path="/analytics" 
                element={
                  <PrivateRouteComponent>
                    <AnalyticsDashboardComponent />
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
              
              <Route path="*" element={<NotFoundComponent />} />
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

