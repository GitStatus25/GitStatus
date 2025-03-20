import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import PrivateRouteComponent from './routes/PrivateRoute';
import AdminRouteComponent from './routes/AdminRoute';
import LoginComponent from './views/Login';
import DashboardComponent from './views/Dashboard';
import CreateReportComponent from './views/CreateReport';
import ViewReportComponent from './views/ViewReport';
import NotFoundComponent from './views/NotFound';
import AdminDashboardComponent from './views/AdminDashboard';
import AnalyticsDashboardComponent from './views/AnalyticsDashboard';
import CreateReportModal from './components/Modals/CreateReport';
import ViewCommitsModal from './components/Modals/ViewCommits';
import AuthCallbackComponent from './views/AuthCallback';
import theme from './styles/theme';
import useAuthStore from './store/authStore';
import { useShallow } from 'zustand/react/shallow';
function App() {
  // Initialize auth store on app startup
  const { initialize } = useAuthStore(useShallow(state => ({initialize: state.initialize})));
  initialize();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
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
          <CreateReportModal />
          <ViewCommitsModal />
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;

